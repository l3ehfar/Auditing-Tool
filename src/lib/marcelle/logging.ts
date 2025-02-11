import { writable } from 'svelte/store';
import { store } from './store';
import { PAGES, STEPS, type Page, type Status, startTimerIfNeeded  } from './progress';

const progress = store.service<Status>('progress');
export const status = writable({ step: -1, steps: 1, page: 'loading' });

export function setProgress(page: Page) {
  const s = { page, step: PAGES.indexOf(page), steps: STEPS };
  status.set(s);
  startTimerIfNeeded(page); 
  return progress.create(s);
}

export async function getProgress(): Promise<Partial<Status>> {
  const latest = await progress
    .items()
    .query({ $sort: { updatedAt: -1 } })
    .take(1)
    .toArray();
  if (latest.length) {
    status.set(latest[0]);
    startTimerIfNeeded(latest[0].page); 
    return latest[0];
  }
  return {};
}