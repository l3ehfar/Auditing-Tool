import { Component, Stream } from '@marcellejs/core';
import View from './comparison-tool.view.svelte';

export interface ComparisonToolOptions {
  initialItems?: Array<{ thumbnail: string; label: string; caption: string }>;
}

export class ComparisonTool extends Component {
  title = 'Comparison Tool';
  comparisonItems: Stream<Array<{ thumbnail: string; label: string; caption: string }>>;

  constructor(options: ComparisonToolOptions = {}) {
    super();
    this.comparisonItems = new Stream(options.initialItems || []);
  }

  addToComparison(item: { thumbnail: string; label: string; caption: string }): void {
    const currentItems = this.comparisonItems.get();
    this.comparisonItems.set([...currentItems, item]);
  }

  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.$$.app = new View({
      target: t,
      props: {
        title: this.title,
        comparisonItems: this.comparisonItems,
      },
    });
  }
}