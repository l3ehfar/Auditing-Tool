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
  notification,
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
  apiToken: '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', // Input your Hugging Face API token here
  inference: 'api',
});

export const caption = text('model generated caption:'); 
export const input = imageUpload(); 
export const label = textInput(); 

// Function to generate caption using Hugging Face model
async function generateCaption(image: ImageData) {
  try {
    const res = await HFmodel.predict(image);
    if (res && res.length > 0 && res[0].generated_text) {
      caption.$value.set(res[0].generated_text); 
    } else {
      caption.$value.set('No caption generated');
    }
  } catch (error) {
    caption.$value.set('Error generating caption');
    console.error('Error with model:', error);
  }
}

// Subscribe to uploaded image and generate a caption for it
input.$images.subscribe((img) => {
  if (img) {
    generateCaption(img); 
  }
});

export let trainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let datasetExplorerComponent = datasetExplorer(trainingSet);

// For filtering dataset based on class
export const selectClass = select(['all', 'chef', 'police'], 'all');

selectClass.$value.subscribe((label) => {
  const newQuery = label === 'all' ? {} : { y: label };
  if (JSON.stringify(newQuery) === JSON.stringify(trainingSet.query)) return;
  trainingSet.sift(newQuery);
});

// Capture logic for adding images to the dataset
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
    notification({
      title: 'Upload Successful',
      message: 'The item was successfully uploaded to the dataset.',
      duration: 3000,
    });
  } else {
    console.error('No image or label available');
    notification({
      title: 'Upload Failed',
      message: 'Please provide an image and label.',
      duration: 3000,
    });
  }
}

// Logic for handling selected images in the dataset explorer
let selectedImageInstance: ImageInstance | null = null;

const $selectedImage = datasetExplorerComponent.$selected
  .filter((selection) => selection.length === 1)
  .map(async ([id]) => {
    if (id) {
      return await trainingSet.get(id, ['x', 'thumbnail', 'y']); // Get the selected image along with its thumbnail and label
    } else {
      throw new Error('No valid ID provided for instance retrieval');
    }
  })
  .awaitPromises()
  .map((instance) => {
    selectedImageInstance = instance;
    return instance;
  });

// Stream to handle both uploaded and selected images
const $imageStream = new Stream<ImageData>();

// Subscribe to the selected image and generate a caption
$selectedImage.subscribe((instance) => {
  if (instance) {
    $imageStream.set(instance.x); // Set the image stream to the selected image
    generateCaption(instance.x); 
  }
});

// Subscribe to uploaded images 
input.$images.subscribe((image) => {
  if (image) {
    $imageStream.set(image); // Set the image stream to the uploaded image
    generateCaption(image); 
  }
});

export const ImageDisplay = imageDisplay($imageStream);

// Function to add the selected instance to the comparison tool
export function addSelectedToComparison(comparisonToolComponent) {
  if (selectedImageInstance) {
    const comparisonItem = {
      thumbnail: selectedImageInstance.thumbnail,
      caption: caption.$value.get(),
    };
    comparisonToolComponent.addToComparison(comparisonItem); // Add the selected item to the comparison tool
    notification({
      title: 'Item Added',
      message: 'Selected item added to comparison tool',
      duration: 3000,
    });
  } else {
    notification({
      title: 'No Item Selected',
      message: 'Please select an item to add to the comparison tool.',
      duration: 3000,
    });
  }
}

// Bind comparison button to the respective actions
export function bindButtonEvents(addToComparisonButton: HTMLButtonElement, comparisonToolComponent) {

  addToComparisonButton.addEventListener('click', () => {
    addSelectedToComparison(comparisonToolComponent);
  });

  return () => {
    addToComparisonButton.removeEventListener('click', () => addSelectedToComparison(comparisonToolComponent));
  };
}
