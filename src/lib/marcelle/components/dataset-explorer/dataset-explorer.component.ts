import { Component } from '@marcellejs/core';
import type { Dataset, Instance } from '@marcellejs/core';
import type { ObjectId } from '@marcellejs/core/types';
import { Stream } from '@marcellejs/core';
import View from './dataset-explorer.view.svelte';
import { zoomLevelStore } from '$lib/store';

export interface DEInstance extends Instance {
  y: string;
}

interface DatasetBrowserOptions {
  batchSize: number;
}

export class DatasetExplorer extends Component {
  title = 'dataset explorer';

  #dataset: Dataset<DEInstance>;
  $selected: Stream<ObjectId[]> = new Stream([], true);
  zoomLevel: number = 1;
  batchSize: number;

  #viewInstance: any;

  constructor(dataset: Dataset<DEInstance>, { batchSize = 0 }: Partial<DatasetBrowserOptions> = {},) {
    super();
    this.#dataset = dataset;
    this.batchSize = batchSize;
    this.start();

    zoomLevelStore.subscribe((newZoomLevel) => {
      this.zoomLevel = newZoomLevel;
      if (this.#viewInstance) {
        this.#viewInstance.$set({ zoomLevel: this.zoomLevel });
      }
    });
  }

  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.#viewInstance  = new View({
      target: t,
      props: {
        title: this.title,
        zoomLevel: this.zoomLevel,
        batchSize: this.batchSize,
        count: this.#dataset.$count,
        dataset: this.#dataset,
        selected: this.$selected,
      },
    });
  }
}
