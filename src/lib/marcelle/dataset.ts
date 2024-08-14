import '@marcellejs/core/dist/marcelle.css';
import {
  dataset,
  dataStore,
  textInput,
  imageUpload,
  type Instance,
  select,
  imageDisplay,
  Stream,
  text,
} from '@marcellejs/core';
import { datasetExplorer } from './components';
import { huggingfaceModel } from './components';

const store = dataStore('localStorage');

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string;
  subset?: string; // optional subset identifier
}

const HFmodel = huggingfaceModel({
  task: 'image-to-text',
  apiToken: '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', //input your huggingface token here
  inference: 'api',
});

export const caption = text('');
export const input = imageUpload();
export const label = textInput();

input.$images.subscribe(async (img) => {
  if (typeof img !== 'undefined') {
    let res = await HFmodel.predict(img);
    if (res && res.length > 0 && res[0].generated_text) {
      caption.$value.set(res[0].generated_text);
    } else {
      caption.$value.set('No caption generated');
    }
  }
});

export let trainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let datasetExplorerComponent = datasetExplorer(trainingSet);

export const selectClass = select(['all', 'chef', 'police'], 'all');

selectClass.$value.subscribe((label) => {
  const newQuery = label === 'all' ? {} : { y: label };
  if (JSON.stringify(newQuery) === JSON.stringify(trainingSet.query)) return;
  trainingSet.sift(newQuery);
});

export function handleCapture() {
  const labelValue = label.$value.get();
  const imageData = input.$images.get();
  const thumbnailData = input.$thumbnails.get();

  if (imageData && labelValue) {
    const instance = {
      x: imageData,
      y: labelValue,
      thumbnail: thumbnailData,
    };
    console.log('New instance:', instance);
    trainingSet.create(instance);
  } else {
    console.error('No image or label available');
  }
}

// Image display logic
const $selectedImage = datasetExplorerComponent.$selected
  .filter((selection) => selection.length === 1)
  .map(async ([id]) => {
    if (id) {
      return await trainingSet.get(id, ['x']);
    } else {
      throw new Error('No valid ID provided for instance retrieval');
    }
  })
  .awaitPromises()
  .map((instance) => instance?.x);

const $uploadedImage = input.$images;

const $imageStream = new Stream<ImageData>();

$selectedImage.subscribe((image) => {
  $imageStream.set(image);
});

$uploadedImage.subscribe((image) => {
  $imageStream.set(image);
});

export const ImageDisplay = imageDisplay($imageStream); 