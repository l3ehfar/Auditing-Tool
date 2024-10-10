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

// const store = dataStore('localStorage');
const store = dataStore('http://localhost:3030');

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string;
  caption?: string;
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
export async function generateCaption(image: ImageData): Promise<string> {
  try {
    const res = await HFmodel.predict(image);
    if (res && res.length > 0 && res[0].generated_text) {
      const generatedCaption = res[0].generated_text;
      caption.$value.set(generatedCaption);
      console.log('Caption generated:', generatedCaption); // Log the caption
      return generatedCaption; // Return the generated caption
    } else {
      const noCaption = 'No caption generated';
      caption.$value.set(noCaption);
      console.warn('Failed to generate a caption');
      return noCaption;
    }
  } catch (error) {
    const errorCaption = 'Error generating caption';
    caption.$value.set(errorCaption);
    console.error('Error with model:', error);
    return errorCaption;
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
export async function handleCapture() {
  const labelValue = label.$value.get();
  const imageData = input.$images.get();
  const thumbnailData = input.$thumbnails.get();

  if (imageData && labelValue) {
    // Ensure that a caption is generated
    let instanceCaption = caption.$value.get(); // Use existing caption if available

    if (!instanceCaption || instanceCaption === 'No caption generated') {
      // Generate a new caption if none exists
      instanceCaption = await generateCaption(imageData);
    }

    // Ensure that a valid caption is produced
    if (!instanceCaption || instanceCaption === 'No caption generated') {
      notification({
        title: 'Caption Generation Failed',
        message: 'No valid caption was generated for the uploaded image.',
        duration: 5000,
      });
      return; 
    }

    // Proceed to create the instance with the generated caption
    const instance: ImageInstance = {
      x: imageData,
      y: labelValue,
      thumbnail: thumbnailData,
      caption: instanceCaption, 
    };

    // Save the instance to the dataset 
    const createdInstance = await trainingSet.create(instance);
    if (createdInstance && createdInstance._id) {
      notification({
        title: 'Upload Successful',
        message: `The item was successfully uploaded with the caption: "${instanceCaption}"`,
        duration: 5000,
      });
    } else {
      console.error('Instance creation failed or no _id assigned.');
    }
  } else {
    notification({
      title: 'Upload Failed',
      message: 'Please provide an image and label.',
      duration: 3000,
    });
  }
}

let selectedImageInstance: ImageInstance | null = null;

const $selectedImage = datasetExplorerComponent.$selected
  .filter((selection) => selection.length === 1)
  .map(async ([id]) => {
    if (id) {
      return await trainingSet.get(id, ['_id', 'x', 'thumbnail', 'y', 'caption']);
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
export const $imageStream = new Stream<ImageData>();

// Subscribe to the selected image and display its caption without trying to update it
$selectedImage.subscribe((instance) => {
  if (instance) {
    $imageStream.set(instance.x); // Set the image stream to the selected image
    if (instance.caption && instance.caption.length > 0) {
      // If the image has an existing caption, display it and notify that it was fetched from the dataset
      caption.$value.set(instance.caption);
      // notification({
      //   title: 'Caption Fetched',
      //   message: `This caption was retrieved from the dataset: "${instance.caption}"`,
      //   duration: 5000,
      // });
    } else {
      caption.$value.set('No caption found for this image');
      notification({
        title: 'No Caption Found',
        message: 'This image does not have a caption in the dataset.',
        duration: 5000,
      });
    }
  }
});

// Subscribe to uploaded images
input.$images.subscribe((image) => {
  if (image) {
    $imageStream.set(image); // Set the image stream to the uploaded image
    generateCaption(image).then((generatedCaption) => {
      // Update caption value after generation and notify user
      caption.$value.set(generatedCaption);
      notification({
        title: 'Caption Generated',
        message: `The following caption was generated: "${generatedCaption}"`,
        duration: 5000,
      });
    });
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

export function bindButtonEvents(addToComparisonButton: HTMLButtonElement, comparisonToolComponent) {
  addToComparisonButton.addEventListener('click', () => {
    addSelectedToComparison(comparisonToolComponent);
  });

  return () => {
    addToComparisonButton.removeEventListener('click', () => addSelectedToComparison(comparisonToolComponent));
  };
}
