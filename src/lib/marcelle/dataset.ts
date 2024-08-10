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
  button
} from '@marcellejs/core';
import { datasetExplorer } from './components';
// import { HuggingfaceModel } from './components';

const store = dataStore('localStorage');

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string;
}

// export const model = huggingfaceModel({task: 'image-to-text', inference: 'api', apiToken: ''});

// input.$images.subscribe(async (img) => {
//   if(typeof img !== 'undefined'){
//       let res = await model.predict(img);
//       caption.$value.set(JSON.stringify(res));
//   }
// });

export const caption = text('caption provided by the model');
export const input = imageUpload();
export const label = textInput();
// export const addToSubset = button('Upload to Subset');
// export const compare = button('Add to Comparing Tool');

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
