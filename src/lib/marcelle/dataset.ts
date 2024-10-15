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

const store = dataStore('http://localhost:3030');


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

export async function generateCaption(image: ImageData): Promise<string> {
  try {
    const res = await HFmodel.predict(image);
    if (res && res.length > 0 && res[0].generated_text) {
      const generatedCaption = res[0].generated_text;
      caption.$value.set(generatedCaption);
      console.log('Caption generated:', generatedCaption); 
      return generatedCaption; 
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

input.$images.subscribe((img) => {
  if (img) {
    generateCaption(img);
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

export async function handleCapture() {
  const labelValue = label.$value.get();
  const imageData = input.$images.get();
  const thumbnailData = input.$thumbnails.get();

  if (imageData && labelValue) {
    let instanceCaption = caption.$value.get();

    if (!instanceCaption || instanceCaption === 'No caption generated') {
      instanceCaption = await generateCaption(imageData);
    }

    if (!instanceCaption || instanceCaption === 'No caption generated') {
      notification({
        title: 'Caption Generation Failed',
        message: 'No valid caption was generated for the uploaded image.',
        duration: 5000,
      });
      return;
    }

    const instance: ImageInstance = {
      x: imageData,
      y: labelValue,
      thumbnail: thumbnailData,
      caption: instanceCaption,
    };


    const createdInstance = await trainingSet.create(instance);

    // Check for both `id` and `_id`
    if (createdInstance && (createdInstance._id || createdInstance.id)) {
      notification({
        title: 'Upload Successful',
        message: `The item was successfully uploaded with the caption: "${instanceCaption}"`,
        duration: 5000,
      });
    } else {
      console.error('Instance creation failed or no `_id` or `id` assigned.');
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

input.$images.subscribe((image) => {
  if (image) {
    $imageStream.set(image);
    generateCaption(image).then((generatedCaption) => {
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
