import { writable } from 'svelte/store';

export const zoomLevelStore = writable(1);
export const selectedSubset = writable<string | null>(null);
