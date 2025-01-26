import { writable } from 'svelte/store';

export const zoomLevelStore = writable(1);
export const selectedSubset = writable<string | null>(null);
export const droppedItems = writable([]);

export const highlightedInstances = writable<string[]>([]);
export const filteredInstances = writable([]);
export const exportedHypotheses = writable([]);
