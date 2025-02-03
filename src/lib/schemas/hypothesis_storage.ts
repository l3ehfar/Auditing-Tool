import { store } from '$lib/marcelle';
import { type ObjectId } from '@marcellejs/core';
import { get, writable } from 'svelte/store';

export interface Hypothesis {
  id: ObjectId;
  index: number;
  description: string;
  evidence: any[];
}

export const cards = writable<Hypothesis[]>([]);
const service = store.service<Hypothesis>('hypotheses');

export async function fetchHypotheses() {
  const hp = await service
    .items()
    .query({ $sort: { index: 1 } })
    .toArray();
  console.log('hp', hp);
  cards.set(hp);
}

export async function createHypothesis() {
  const maxIndex = await service
    .items()
    .query({ $sort: { index: -1 } })
    .select(['index'])
    .take(1)
    .toArray();
  console.log('maxIndex', maxIndex);
  const index = maxIndex.length ? maxIndex[0].index + 1 : 1;
  const hp = await service.create({ index, description: '', evidence: [] });
  console.log('created hp', hp);
  cards.set([...get(cards), hp]);
}

export async function updateHypothesis(id: Hypothesis['id'], changes: Partial<Hypothesis>) {
  try {
    const newHp = await service.patch(id, changes);
    console.log('updated hypothesis:', newHp);
    cards.update((currentCards) => currentCards.map((c) => (c.id === id ? newHp : c)));
    return newHp;
  } catch (error) {
    console.log('An error occurred while updating hypothesis', id);
  }
}

export async function removeHypothesis(id: Hypothesis['id']) {
  try {
    const removed = await service.remove(id);
    console.log('removed hypothesis:', removed);
    cards.update((currentCards) => currentCards.filter((c) => c.id !== id));
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
    // TODO: improve this with "evidence" service?
    evidence.push({ id: crypto.randomUUID(), src, caption });
  }
  console.log('evidence', evidence);
  return updateHypothesis(id, { evidence });
}

export async function removeEvidence(hypothesis: Hypothesis, evidenceId: string) {
  try {
    const evidence = hypothesis.evidence.filter((x) => x.id !== evidenceId);
    return updateHypothesis(hypothesis.id, { evidence });
  } catch (error) {
    console.log('An error occurred whil trying to remove evidence with id:', evidenceId);
  }
}
