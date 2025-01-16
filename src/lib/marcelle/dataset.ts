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
import { writable } from 'svelte/store';

export const store = dataStore('http://localhost:3030');

export let dynamicClassLabel = writable('all');

// export let aggregatedPersonFrequency: { [key: string]: number } = { male: 0, female: 0, classLabel: 0 };
// export let coOccurrences: { [key: string]: { [word: string]: number } } = { male: {}, female: {}, classLabel: {} };
// export let captionInstances: { [key: string]: { [word: string]: any[] } } = { male: {}, female: {}, classLabel: {} };
export let captionInstances: { [word: string]: any[] } = {}; 

export const genderedWords = {
  male: ['man', 'he', 'him', 'his', 'boy', 'male', 'men'],
  female: ['woman', 'she', 'her', 'hers', 'girl', 'female', 'women'],
  classLabel: [], 
};

export interface ImageInstance extends Instance {
  x: ImageData;
  y: string;
  thumbnail: string;
  caption?: string;
  subset?: string;
}

const HFmodel = huggingfaceModel({
  task: 'image-to-text',
  apiToken: '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', 
  inference: 'api',
});

export const caption = text('model generated caption:');
export const input = imageUpload();
export const label = textInput();

// List of words to remove from captions
const unwantedWords = [
  'araffe', 'arafed', 'arafian', 'arafe', 
  'arraffe', 'arrafe', 'arrafed', 'araffed', 'arraffed'
];

// Function to clean captions and replace unwanted words with "a "
function cleanCaption(caption: string): string {
  const regex = new RegExp(`\\b(${unwantedWords.join('|')})\\b`, 'gi');
  const cleanedCaption = caption.replace(regex, 'a ').replace(/\s+/g, ' ').trim();
  
  return cleanedCaption;
}

async function cropAndResizeImage(image: ImageData): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Convert ImageData to an HTMLImageElement
  const imageBitmap = await createImageBitmap(image);

  // Get original dimensions
  const originalWidth = imageBitmap.width;
  const originalHeight = imageBitmap.height;

  // Determine the size of the largest square
  const squareSize = Math.min(originalWidth, originalHeight);

  // Calculate cropping start points to center the square
  const cropX = (originalWidth - squareSize) / 2;
  const cropY = (originalHeight - squareSize) / 2;

  // Set canvas dimensions to 200x200
  canvas.width = 200;
  canvas.height = 200;

  // Draw the cropped and resized image onto the canvas
  ctx.drawImage(
    imageBitmap,
    cropX,
    cropY,
    squareSize,
    squareSize, // Crop area
    0,
    0,
    200,
    200 // Resize to 200x200
  );

  // Return ImageData directly
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}


export async function generateCaption(image: ImageData): Promise<string> {
  try {
    const res = await HFmodel.predict(image);
    if (res && res.length > 0 && res[0].generated_text) {
      let generatedCaption = res[0].generated_text;

      // Clean the generated caption
      generatedCaption = cleanCaption(generatedCaption);

      caption.$value.set(generatedCaption);
      return generatedCaption; 
    } else {
      const noCaption = 'No caption generated';
      caption.$value.set(noCaption);
      return noCaption;
    }
  } catch (error) {
    const errorCaption = 'Error generating caption';
    caption.$value.set(errorCaption);
    return errorCaption;
  }
}

export async function handleCapture() {
  const labelValue = label.$value.get();
  const imageData = input.$images.get();
  const thumbnailData = input.$thumbnails.get();

  if (imageData && labelValue) {
    try {
      // Crop and resize the uploaded image
      const processedImage = await cropAndResizeImage(imageData);

      // Generate a caption for the processed image
      let instanceCaption = caption.$value.get();

      if (!instanceCaption || instanceCaption === 'No caption generated') {
        instanceCaption = await generateCaption(processedImage);
      }

      if (!instanceCaption || instanceCaption === 'No caption generated') {
        notification({
          title: 'Caption Generation Failed',
          message: 'No valid caption was generated for the uploaded image.',
          duration: 5000,
        });
        return;
      }

      // Clean the instance caption before storing
      instanceCaption = cleanCaption(instanceCaption);

      const instance: ImageInstance = {
        x: processedImage, // Use the processed (cropped and resized) image
        y: labelValue,
        thumbnail: thumbnailData,
        caption: instanceCaption,
      };

      const createdInstance = await trainingSet.create(instance);

      if (createdInstance && (createdInstance._id || createdInstance.id)) {
        notification({
          title: 'Upload Successful',
          message: `The item was successfully uploaded with the caption: "${instanceCaption}"`,
          duration: 5000,
        });
      } else {
        console.error('Instance creation failed or no `_id` or `id` assigned.');
      }
    } catch (error) {
      console.error('Error during image processing or dataset creation:', error);
      notification({
        title: 'Error',
        message: 'Failed to process and save the image. Please try again.',
        duration: 5000,
      });
    }
  } else {
    notification({
      title: 'Upload Failed',
      message: 'Please provide an image and label.',
      duration: 3000,
    });
  }
}


input.$images.subscribe(async (image) => {
  if (image) {
    try {
      // Crop and resize the uploaded image
      const processedImage = await cropAndResizeImage(image);

      // Generate caption for the processed image
      const generatedCaption = await generateCaption(processedImage);
      caption.$value.set(generatedCaption);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }
});

export let trainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let fullTrainingSet = dataset<ImageInstance>('training-set-dashboard', store);
export let datasetExplorerComponent = datasetExplorer(trainingSet);

export const $currentClasses = new Stream<string[]>([], true);
fullTrainingSet.$changes
  .filter((x) => x.length > 0)
  .map(() => trainingSet.distinct('y'))
  .awaitPromises()
  .subscribe((x) => {
    $currentClasses.set(x);
  });

export const selectClass = select(['all']);
$currentClasses.subscribe((c) => selectClass.$options.set(['all', ...c]));

selectClass.title = 'Choose a Class:';
selectClass.$value.subscribe((label: string) => {
  const newQuery = label === 'all' ? {} : { y: label };  

  if (JSON.stringify(newQuery) === JSON.stringify(trainingSet.query)) return;

  if (label === 'all') {
      dynamicClassLabel.set('all');  
  } else {
      dynamicClassLabel.set(label);  
  }

  // aggregatedPersonFrequency.classLabel = 0;  
  // coOccurrences.classLabel = {};  
  // captionInstances.classLabel = {};  

  trainingSet.sift(newQuery);  
});


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

export const $imageStream = new Stream<ImageData>();

$selectedImage.subscribe((instance) => {
  if (instance) {
    $imageStream.set(instance.x);
    if (instance.caption && instance.caption.length > 0) {
      caption.$value.set(instance.caption);
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

input.$images.subscribe(async (image) => {
  if (image) {
    try {
      // Crop and resize the uploaded image
      const processedImage = await cropAndResizeImage(image);

      // Update the image stream with the processed image
      $imageStream.set(processedImage);

      // Generate caption for the processed image
      const generatedCaption = await generateCaption(processedImage);
      caption.$value.set(generatedCaption);

      notification({
        title: 'Caption Generated',
        message: `The following caption was generated: "${generatedCaption}"`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      notification({
        title: 'Image Processing Error',
        message: 'Failed to process the uploaded image. Please try again.',
        duration: 5000,
      });
    }
  }
});


export const ImageDisplay = imageDisplay($imageStream);
