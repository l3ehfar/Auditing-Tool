import '@marcellejs/core/dist/marcelle.css';
import {
  select,
  button,
  dataset,
  dataStore,
  textInput,
  webcam,
  type Instance,
} from '@marcellejs/core';
import { datasetExplorer } from './components';

export const input = webcam();

export const label = textInput();
label.title = 'Instance label';
export const capture = button('Hold to record instances');
capture.title = 'Capture instances to the training set';

const store = dataStore('localStorage');

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string; 
}


export let trainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let datasetExplorerComponent = datasetExplorer(trainingSet);


export const selectClass = select(['all', 'chef', 'police'], 'all');

selectClass.$value.subscribe((label) => {
  const newQuery = label === 'all' ? { } : { y: label }; 
  if (JSON.stringify(newQuery) === JSON.stringify(trainingSet.query)) return;
  trainingSet.sift(newQuery);
});

input.$images
  .filter(() => capture.$pressed.value)
  .map((x) => ({ x, y: label.$value.value, thumbnail: input.$thumbnails.value }))
  .subscribe((instance) => {
    console.log('New instance:', instance);
    trainingSet.create(instance);
  });
