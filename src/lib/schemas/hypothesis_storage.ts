import { store } from '$lib/marcelle';
import { type ObjectId } from '@marcellejs/core';
import { get, writable, derived } from 'svelte/store';
import { logEvent } from '$lib/marcelle/log';

export interface Hypothesis {
  id: ObjectId;
  index: number;
  description: string;
  evidence: any[];
  isTutorial?: boolean;
  missingFields?: {
    description: boolean;
    evidence: boolean;
  };
  questionnaire: {
    question1: string;
    question2: string;
    question3: string;
    comments?: string;
  };
}


export const cards = writable<Hypothesis[]>([]);
const service = store.service<Hypothesis>('hypotheses');

export async function fetchHypotheses(isTutorial: boolean = false) {
  const allHypotheses = await service.items().query({ $sort: { index: 1 } }).toArray();

  const filteredHypotheses = isTutorial
    ? allHypotheses
    : allHypotheses.filter((hypothesis) => !hypothesis.isTutorial);

  const updatedHypotheses = filteredHypotheses.map((hypothesis) => ({
    ...hypothesis,
    evidence: hypothesis.evidence ?? [],
    questionnaire: {
      question1: hypothesis.questionnaire?.question1 ?? '',
      question2: hypothesis.questionnaire?.question2 ?? '',
      question3: hypothesis.questionnaire?.question3 ?? '',
      comments: hypothesis.questionnaire?.comments ?? '',
    },
  }));

  if (isTutorial) {
    cards.set(updatedHypotheses);
    return;
  }

  const storedMissingFields = JSON.parse(localStorage.getItem('missingFields') || '{}');

  const hypothesesWithMissingFields = updatedHypotheses.map((hypothesis) => ({
    ...hypothesis,
    missingFields: storedMissingFields[hypothesis.id] || {
      description: !hypothesis.description.trim(),
      evidence: hypothesis.evidence.length === 0,
    },
  }));

  cards.set(hypothesesWithMissingFields);
}



export async function createHypothesis(isTutorial: boolean = false) {
  const maxIndex = await service
    .items()
    .query({ $sort: { index: -1 } })
    .select(['index'])
    .take(1)
    .toArray();

  const index = maxIndex.length ? maxIndex[0].index + 1 : 1;


  const hp = await service.create({
    index,
    description: '',
    evidence: [],
    questionnaire: { question1: '', question2: '', question3: '', comments: '' },
    isTutorial
  });

  console.log('created hp', hp);

  const newCard: Hypothesis = {
    ...hp,
    isTutorial,
    missingFields: isTutorial ? undefined : {
      description: true,
      evidence: true,
    },
  };

  cards.set([...get(cards), newCard]);
  if (!isTutorial) {
    const missingFieldsMap = Object.fromEntries(
      get(cards).map((card) => [card.id, card.missingFields])
    );
    localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));
  }

  logEvent('create-audit-card', { hypothesisId: hp.id });
  return hp;

}

export async function updateHypothesis(id: Hypothesis['id'], changes: Partial<Hypothesis>) {
  try {
    const newHp = await service.patch(id, changes);
    console.log('Updated hypothesis:', newHp);

    if (!newHp) {
      throw new Error(`updateHypothesis failed: No valid response for ID ${id}`);
    }

    cards.update((currentCards) =>
      currentCards.map((c) =>
        c.id === id
          ? {
            ...c,
            ...newHp,
            missingFields: c.isTutorial ? undefined : {
              description: !newHp.description.trim(),
              evidence: newHp.evidence.length === 0,
            },
          }
          : c
      )
    );

    if (!get(cards).some((card) => card.isTutorial)) {
      const missingFieldsMap = Object.fromEntries(
        get(cards).map((card) => [card.id, card.missingFields])
      );
      localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));
    }

    if (changes.description !== undefined) {
      logEvent('edit-description', { hypothesisId: id, newDescription: changes.description });
    }

    console.log(`Returning updated hypothesis for ID ${id}:`, newHp);
    return newHp;

  } catch (error) {
    console.error(`An error occurred while updating hypothesis ${id}:`, error);
    return null;
  }
}


export async function removeHypothesis(id: Hypothesis['id']) {
  try {
    const removed = await service.remove(id);
    console.log('removed hypothesis:', removed);

    logEvent('remove-audit-card', { hypothesisId: id });

    cards.update((currentCards) => {
      const updatedCards = currentCards.filter((c) => c.id !== id);

      const missingFieldsMap = Object.fromEntries(
        updatedCards.map((card) => [card.id, card.missingFields])
      );
      localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));

      return updatedCards;
    });

  } catch (error) {
    console.log('An error occurred while removing hypothesis', id);
  }
}

export async function addEvidence(id: Hypothesis['id'], thumbnail: string, caption: string) {
  const current = await service.get(id);
  if (!current) {
    throw new Error(`Hypothesis ${id} does not exist.`);
  }

  const evidenceId = crypto.randomUUID();
  const newEvidence = [...current.evidence, { id: evidenceId, thumbnail, caption }];
  // console.log("Updated evidence before patch:", newEvidence);

  return updateHypothesis(id, { evidence: newEvidence }).then((updatedCard) => {
    if (!updatedCard) {
      console.error(`Failed to update hypothesis ${id}.`);
      return;
    }

    // console.log("Evidence successfully added. Updated evidence list:", updatedCard.evidence.map(e => e.id));

    cards.update((currentCards) =>
      currentCards.map((c) => (c.id === id ? { ...c, evidence: updatedCard.evidence } : c))
    );

    logEvent('add-evidence', { hypothesisId: id, evidenceId, thumbnail, caption });

    return updatedCard;
  }).catch((error) => {
    console.error(`Error in addEvidence when updating hypothesis ${id}:`, error);
  });
}

export async function removeEvidence(hypothesis: Hypothesis, evidenceId: string) {
  try {
    const evidence = hypothesis.evidence.filter((x) => x.id !== evidenceId);
    const updatedCard = await updateHypothesis(hypothesis.id, { evidence });

    if (!updatedCard) {
      console.error('Failed to update hypothesis after removing evidence');
      return;
    }

    cards.update((currentCards) =>
      currentCards.map((c) =>
        c.id === hypothesis.id
          ? {
            ...c,
            missingFields: {
              ...c.missingFields,
              evidence: updatedCard.evidence.length === 0,
            },
          }
          : c
      )
    );

    logEvent('remove-evidence', { hypothesisId: hypothesis.id, evidenceId });

    const missingFieldsMap = Object.fromEntries(
      get(cards).map((card) => [card.id, card.missingFields])
    );
    localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));

  } catch (error) {
    console.log('An error occurred while trying to remove evidence with id:', evidenceId, error);
  }
}


export async function enableQuestionnaireForAll() {
  const allHypotheses = get(cards);

  await Promise.all(
    allHypotheses.map((hypothesis) =>
      updateHypothesis(hypothesis.id, {
        questionnaire: { question1: '', question2: '', question3: '', comments: '' }
      })
    )
  );

}

export async function saveCompleteHypotheses() {
  const allHypotheses = get(cards);

  const validHypotheses = allHypotheses.filter(
    (hypothesis) => hypothesis.description.trim() !== '' && hypothesis.evidence.length > 0
  );

  await Promise.all(
    validHypotheses.map((hypothesis) =>
      updateHypothesis(hypothesis.id, {
        description: hypothesis.description,
        evidence: hypothesis.evidence,
        questionnaire: hypothesis.questionnaire
      })
    )
  );

  const incompleteHypotheses = allHypotheses.filter(
    (hypothesis) => hypothesis.description.trim() === '' || hypothesis.evidence.length === 0
  );

  await Promise.all(
    incompleteHypotheses.map((hypothesis) => service.remove(hypothesis.id))
  );

  cards.set(validHypotheses);

  console.log('Final stored hypotheses:', validHypotheses);
}

export async function fetchCompletedHypotheses() {
  const hp = await service.items().query({ $sort: { index: 1 } }).toArray();

  const completedHypotheses = hp.filter(
    (hypothesis) => hypothesis.description.trim() !== '' && hypothesis.evidence.length > 0
  );

  cards.set(completedHypotheses);
}
