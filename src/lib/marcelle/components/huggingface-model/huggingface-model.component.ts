import type { Instance, StoredModel } from '@marcellejs/core';
import { Component, Stream, logger } from '@marcellejs/core';
import { pipeline, env} from '@xenova/transformers';
import type { TaskType } from '@xenova/transformers';
import View from './huggingface-model.view.svelte';

type InferenceBackend = 'api' | 'local';

// Interfaces for model options and instances.
export interface HuggingfaceModelOptions {
  task?: TaskType;
  model?: string; //pass here link of api model or local converted model
  apiToken?: string;
  inference?: InferenceBackend;
}

export interface HuggingfaceModelInstance extends Instance {
  x: string[];
  y: number[];
}

/**
 * Class representing a Hugging Face machine learning model.
 * It allows loading and using models for various tasks.
 */
export class HuggingfaceModel extends Component {
  title: string;
  options: HuggingfaceModelOptions;
  $loading = new Stream(true, true);
  $model: any;
  task: string;
  modelUsed: string;
  apiPath: string;

  /**
   * Constructor for the HuggingfaceModel class.
   * @param options {HuggingfaceModelOptions} - Options for the model, including the task and specific model.
   */
  constructor({ task, model, inference, apiToken }: HuggingfaceModelOptions) {
    super();
    this.title = `Huggingface Model (${task})`;
    this.options = { ...{ inference: 'local' }, task, model, inference, apiToken };
    if (!['api', 'local'].includes(this.options.inference)) {
      logger.warning("inference parameter's value was not valid, assigned to 'local' by default");
      this.options.inference = 'local';
    }
    this.setup();
  }

  /**
   * Configuration and initial model loading.
   * @returns {Promise<HuggingfaceModel>} - The instance of the class after configuration.
   */
  async setup(): Promise<HuggingfaceModel> {
    if (this.options.inference === 'local') {
      try {
        this.$model = await this.loadModel(this.options.task, this.options.model);
        logger.info(`Model ${this.options.task} loaded`);
        this.$loading.set(false);
        this.start();
      } catch (error) {
        logger.error(
          'An error occurred. Model not loaded. The model you are trying to use is not available online; you have to save it locally before using it...',
        );
        console.log(error);
      }
    } else if (this.options.inference === 'api') {
      if (this.options.model === undefined) {
        this.options.model = 'Salesforce/blip-image-captioning-large';
      }
      this.apiPath = 'https://api-inference.huggingface.co/models/' + this.options.model;
      this.$loading.set(false);
      //Here should send a first query to the model in order to check if it is well working
    }
    return this;
  }

  /**
   * Load a Hugging Face model for a given task.
   * @param task {string} - The task for which the model is loaded.
   * @param model {string} - The specific model to load.
   * @returns {Promise<any>} - The loaded model.
   */
  async loadModel(task: TaskType, model?: string) {
    (env as any).allowRemoteModels = true;
    return pipeline(task, model);
  }

  /**
   * Convert image data to a URL for prediction.
   * @param imageData {ImageData} - Image data to convert.
   * @returns {Promise<any>} - The URL of the image.
   */
  async imageDataToURL(imageData: ImageData): Promise<any> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  /**
   * Predict results from data.
   * @param data {any} - Data for prediction.
   * @param addons {any} - Additional parameters for prediction.
   * @returns {Promise<any>} - The prediction results.
   */
  async predict(data: any, addons?: any): Promise<any> {
    let results;
    if (this.options.inference === 'local') {
      if (data instanceof ImageData) {
        const dataURL = await this.imageDataToURL(data);
        results = await this.$model(dataURL, addons);
      } else {
        results = await this.$model(data, addons);
      }
    } else if (this.options.inference === 'api') {
      const blob = await this.imageDataToBlob(data);
      const modelResponse = await fetch(this.apiPath, {
        headers: { Authorization: `Bearer ${this.options.apiToken}` },
        method: 'POST',
        body: blob,
      });
      if (modelResponse.status === 200) {
        logger.debug(modelResponse.status + ' -> YES');
      } else {
        logger.error(
          'Bad Request from local to api, check the displayed text for further informations',
        );
        console.log('modelResponse', modelResponse);
      }
      results = await modelResponse.json();
    }
    return results;
  }

  async imageDataToBlob(imageData: ImageData): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx?.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  }

  // Function to mount the component in the DOM.
  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.$$.app = new View({
      target: t,
      props: {
        title: this.title,
        loading: this.$loading,
        task: this.options.task,
        modelUsed: this.options.model,
      },
    });
  }

  train(): void {
    throw new Error('Method not needed.');
  }
  save(): Promise<string> {
    throw new Error('Method not needed.');
  }
  load(): Promise<StoredModel> {
    throw new Error('Method not needed.');
  }
  download(): Promise<void> {
    throw new Error('Method not needed.');
  }
  upload(): Promise<StoredModel> {
    throw new Error('Method not needed.');
  }
}