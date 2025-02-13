import { store } from '$lib/marcelle';
import { type ObjectId } from '@marcellejs/core';
import { get, writable } from 'svelte/store';
import { timeLeft } from '$lib/marcelle/timer';

export interface Hypothesis {
  id: ObjectId;
  index: number;
  description: string;
  evidence: any[];
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

export async function fetchHypotheses() {
  const hp = await service.items().query({ $sort: { index: 1 } }).toArray();

  const updatedHypotheses = hp.map((hypothesis) => ({
    ...hypothesis,
    evidence: hypothesis.evidence ?? [],
    questionnaire: {
      question1: hypothesis.questionnaire?.question1 ?? '',
      question2: hypothesis.questionnaire?.question2 ?? '',
      question3: hypothesis.questionnaire?.question3 ?? '',
      comments: hypothesis.questionnaire?.comments ?? '',
    },
  }));

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

export async function createHypothesis() {
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
    questionnaire: { question1: '', question2: '', question3: '', comments: '' }
  });

  console.log('created hp', hp);

  const newCard = {
    ...hp,
    missingFields: {
      description: true,
      evidence: true,
    },
  };

  cards.set([...get(cards), newCard]);

  const missingFieldsMap = Object.fromEntries(
    get(cards).map((card) => [card.id, card.missingFields])
  );
  localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));
}

export async function updateHypothesis(id: Hypothesis['id'], changes: Partial<Hypothesis>) {
  try {
    const newHp = await service.patch(id, changes);
    console.log('updated hypothesis:', newHp);

    cards.update((currentCards) => {
      return currentCards.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...newHp,
            missingFields: {
              description: !newHp.description.trim(),
              evidence: newHp.evidence.length === 0,
            },
          };
        }
        return c;
      });
    });

    const missingFieldsMap = Object.fromEntries(
      get(cards).map((card) => [card.id, card.missingFields])
    );
    localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));

  } catch (error) {
    console.log('An error occurred while updating hypothesis', id);
  }
}



export async function removeHypothesis(id: Hypothesis['id']) {
  try {
    const removed = await service.remove(id);
    console.log('removed hypothesis:', removed);
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

export async function addEvidence(id: Hypothesis['id'], src: string, caption: string) {
  const current = await service.get(id);
  if (!current) {
    throw new Error(`Hypothesis ${id} does not exist.`);
  }
  let exists = false;
  const evidence = current.evidence.map((x) => {
    if (x.src === src) {
      exists = true;
      return { ...x, caption };
    }
    return x;
  });
  if (!exists) {
    evidence.push({ id: crypto.randomUUID(), src, caption });
  }
  console.log('evidence', evidence);
  return updateHypothesis(id, { evidence }).then((updatedCard) => {
    if (!updatedCard) return;

    const $timeLeft = get(timeLeft);
    console.log("Time Left during addEvidence:", $timeLeft);

    cards.update((currentCards) =>
      currentCards.map((c) =>
        c.id === id
          ? {
              ...c,
              missingFields: $timeLeft <= 60
                ? {
                    ...c.missingFields,
                    evidence: updatedCard.evidence.length === 0,
                  }
                : c.missingFields,
            }
          : c
      )
    );

    const missingFieldsMap = Object.fromEntries(
      get(cards).map((card) => [card.id, card.missingFields])
    );
    localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));
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
