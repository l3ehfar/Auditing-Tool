import '@marcellejs/core/dist/marcelle.css';
import {
  dataset,
  dataStore,
  textInput,
  imageUpload,
  button,
  type Instance,
  select,
  imageDisplay,
  Stream
} from '@marcellejs/core';
import { datasetExplorer } from './components';

const store = dataStore('localStorage');

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string;
}

export const input = imageUpload();
export const label = textInput();
export const capture = button('Upload to Dataset');
export const addToSubset = button('Upload to Subset');
export const compare = button('Add to Comparing Tool');

export let trainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let datasetExplorerComponent = datasetExplorer(trainingSet);

export const selectClass = select(['all', 'chef', 'police'], 'all');

selectClass.$value.subscribe((label) => {
  const newQuery = label === 'all' ? {} : { y: label };
  if (JSON.stringify(newQuery) === JSON.stringify(trainingSet.query)) return;
  trainingSet.sift(newQuery);
});

// Handle image upload and capture button click
const $instances = capture.$click
  .sample(input.$images.zip((thumbnail, data) => ({ thumbnail, data }), input.$thumbnails))
  .map(async ({ thumbnail, data }) => ({
    x: data,
    y: label.$value.get(),
    thumbnail,
  }))
  .awaitPromises();

$instances.subscribe((instance) => {
  console.log('New instance:', instance);
  trainingSet.create(instance);
});

// display selected images
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
