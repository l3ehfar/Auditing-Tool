import { writable } from 'svelte/store';
import { startTimer, loadTimer } from './timer';

export const PHASES = [
  { title: 'introduction', pages: ['introduction'], timeBased: false },
  {
    title: 'pre-questionnaires',
    pages: ['pre-questionnaire', 'asi-questionnaire'],
    timeBased: false,
  },
  { title: 'training', pages: ['video-tutorial', 'tutorial'], timeBased: false },
  { title: 'auditing', pages: ['main'], timeBased: true },
  { title: 'post-questionnaires', pages: ['hypotheses-questionnaire', 'post-questionnaire'], timeBased: false },
  {title: 'end', pages: ['debrief'], timeBased: false },
];
export const PAGES = PHASES.flatMap(({ pages }) => pages);
export const STEPS = PAGES.length;

export type Page = (typeof PAGES)[number];
export interface Status {
  step: number;
  steps: number;
  page: Page;
}

export const pageProgress = writable(0);

export function getPhase(page: string) {
  let i = 0;
  for (const phase of PHASES) {
    if (phase.pages.includes(page)) {
      return PHASES[i];
    }
    i++;
  }
  return {} as (typeof PHASES)[0];
}

export function startTimerIfNeeded(page: Page) {
  if (getPhase(page).timeBased) {
    loadTimer(); 
    startTimer();
  }
}