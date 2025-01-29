import { store } from './store';

export const PAGES = [
  'pre-questionnaire',
  'asi-questionnaire',
  'training',
  'main',
  'post-questionnaire',
] as const;
export const STEPS = PAGES.length;

export type Page = (typeof PAGES)[number];
export interface Status {
  step: number;
  steps: number;
  page: Page;
}

const progress = store.service<Status>('progress');

export function setProgress(page: Page) {
  return progress.create({ page, step: PAGES.indexOf(page), steps: STEPS });
}

export async function getProgress(): Promise<Partial<Status>> {
  const latest = await progress
    .items()
    .query({ $sort: { updatedAt: -1 } })
    .take(1)
    .toArray();
  if (latest.length) {
    return latest[0];
  }
  return {};
}
