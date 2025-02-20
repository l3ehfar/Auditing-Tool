<script lang="ts">
  import Shepherd from 'shepherd.js';
  import { get } from 'svelte/store';
  import 'shepherd.js/dist/css/shepherd.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { cards, removeHypothesis } from '$lib/schemas/hypothesis_storage';

  export let userCondition: string | undefined;

  let tour;

  function clearTutorialCards() {
    cards.update((currentCards) => {
      const tutorialCards = currentCards.filter((c) => c.isTutorial);

      tutorialCards.forEach((card) => removeHypothesis(card.id));

      return currentCards.filter((c) => !c.isTutorial);
    });

  }

  function restartTutorial() {
    clearTutorialCards();
    tour.cancel();
    tour.start();
  }

  function finishTutorial() {
    clearTutorialCards();
    tour.cancel();
    goto(`${base}/main`);
  }

  onMount(() => {
    // const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    // if (tutorialCompleted === 'true') {
    //   goto(`${base}/main`);
    //   return;
    // }

    setTimeout(() => {
      document.querySelector('.shepherd-modal-overlay-container')?.remove();
    }, 100);
    tour = new Shepherd.Tour({
      useModalOverlay: false,
      defaultStepOptions: {
        cancelIcon: { enabled: false },
        classes: 'shepherd-theme-custom',
        scrollTo: false,
      },
    });

    tour.addStep({
      id: 'start-tutorial',
      text: 'Welcome to the tutorial! We will guide you through each part of the interface. Click "Next" to begin.',
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
      id: 'select-dataset',
      text: 'This is the dataset explorer. Click on any image to continue.',
      attachTo: { element: '.dataset-tutorial', on: 'bottom' },
      buttons: [],
      when: {
        show: () => {
          const images = document.querySelectorAll('.dataset-tutorial img');

          const handlers = [];

          images.forEach((img) => {
            const clickHandler = () => {
              tour.next();

              img.removeEventListener('click', clickHandler);
            };

            img.addEventListener('click', clickHandler, { once: true });

            handlers.push({ img, clickHandler });
          });

          tour.currentStep.options.handlers = handlers;
        },
        hide: () => {
          const handlers = tour.currentStep.options.handlers || [];
          handlers.forEach(({ img, clickHandler }) => {
            img.removeEventListener('click', clickHandler);
          });

          tour.currentStep.options.handlers = [];
        },
      },
    });

    tour.addStep({
      id: 'view-caption',
      text: 'Here, you can view the selected image along with its caption.',
      attachTo: { element: '.instax-style', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    if (userCondition === 'conditionThree') {
      tour.addStep({
        id: 'filtering-interface',
        text: 'Add "woman" keyword here, and filter the dataset.',
        attachTo: { element: '.word-selection', on: 'left' },
        buttons: [],
        when: {
          show: () => {
            document.querySelector('.word-selection button')?.addEventListener(
              'click',
              () => {
                tour.next();
              },
              { once: true },
            );
          },
        },
      });

      tour.addStep({
      id: 'filtered dataset',
      text: 'Scroll to see all the images that their captions contains the word "woman".',
      attachTo: { element: '.dataset-tutorial', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
        id: 'filtering-interface-two',
        text: 'Add another keyword: "kitchen", and filter the dataset.',
        attachTo: { element: '.word-selection', on: 'left' },
        buttons: [],
        when: {
          show: () => {
            document.querySelector('.word-selection button')?.addEventListener(
              'click',
              () => {
                tour.next();
              },
              { once: true },
            );
          },
        },
      });

      tour.addStep({
      id: 'filtered-dataset-2',
      text: 'Scroll to see all the images that their captions contains the word "woman" and "kitchen".',
      attachTo: { element: '.dataset-tutorial', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
        id: 'remove-filter',
        text: 'you can remove keywords by clicking on [X] button and re-expand the dataset.',
        attachTo: { element: '.badge-container', on: 'left' },
        buttons: [],
        when: {
          show: () => {
            document.querySelector('.badge-remove-btn')?.addEventListener(
              'click',
              () => {
                tour.next();
              },
              { once: true },
            );
          },
        },
      });


    }

    if (userCondition === 'conditionTwo') {
      tour.addStep({
        id: 'drawing-interface',
        text: 'To mask parts of the image, click on this button.',
        attachTo: { element: '.drawing-tutorial', on: 'left' },
        buttons: [],
        when: {
          show: () => {
            document.querySelector('.drawing-tutorial')?.addEventListener(
              'click',
              () => {
                tour.next();
              },
              { once: true },
            );
          },
        },
      });
      tour.addStep({
        id: 'brush-setting',
        text: 'choose your brush size, and the color.',
        attachTo: { element: '.brush-settings', on: 'top' },
        buttons: [{ text: 'Next', action: tour.next }],
      });
      tour.addStep({
        id: 'draw-regenerate-caption',
        text: 'Mask a part of the image and release the mouse to regenerate caption.',
        attachTo: { element: '.instax-style', on: 'left' },
        buttons: [{ text: 'Next', action: tour.next }],
      });
    }

    tour.addStep({
      id: 'new-bias',
      text: 'To document a new bias, click this button. It will allow you to provide details about the observed bias.',
      attachTo: { element: '.document-bias', on: 'left' },
      buttons: [],
      when: {
        show: () => {
          document.querySelector('.document-bias')?.addEventListener(
            'click',
            () => {
              tour.next();
            },
            { once: true },
          );
        },
      },
    });

    tour.addStep({
      id: 'drag-item',
      text: 'Drag an image and its caption from here and drop it in the bias card.',
      attachTo: { element: '.instax-style', on: 'bottom' },
      buttons: [],
      when: {
        show: () => {
          document.querySelector('.instax-style')?.addEventListener(
            'dragstart',
            () => {
              tour.next();
            },
            { once: true },
          );
        },
      },
    });

    tour.addStep({
      id: 'drop-item',
      text: 'Drop it in this area.',
      attachTo: { element: '.evidence-area', on: 'bottom' },
      buttons: [],
      when: {
        show: () => {
          document.querySelector('.evidence-area')?.addEventListener(
            'drop',
            () => {
              tour.next();
            },
            { once: true },
          );
        },
      },
    });

    tour.addStep({
      id: 'repeat-step',
      text: 'Drag and Drop all images in this area to continue the tutorial.',
      attachTo: { element: '.evidence-area', on: 'bottom' },
      buttons: [],
      when: {
        show: () => {
          let dropCounter = 0;

          const evidenceArea = document.querySelector('.evidence-area');
          if (!evidenceArea) return;

          const dropHandler = (event) => {
            dropCounter++;
            console.log('Items dropped:', dropCounter);
            if (dropCounter >= 4) {
              tour.next();

              evidenceArea.removeEventListener('drop', dropHandler);
            }
          };

          evidenceArea.addEventListener('drop', dropHandler);

          tour.currentStep.options.dropHandler = dropHandler;
        },
        hide: () => {
          const evidenceArea = document.querySelector('.evidence-area');
          if (evidenceArea && tour.currentStep.options.dropHandler) {
            evidenceArea.removeEventListener('drop', tour.currentStep.options.dropHandler);
            tour.currentStep.options.dropHandler = null;
          }
        },
      },
    });

    tour.addStep({
      id: 'write-description',
      text: 'Write a description in the text area. This helps in documenting your observation comprehensively.',
      attachTo: { element: '.description-tutorial', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
      id: 'finish',
      text: 'You have completed the tutorial! You can restart the tutorial or proceed to the main task.',
      buttons: [
        {
          action: restartTutorial,
          classes: 'shepherd-button-primary',
          text: 'Restart Tutorial',
        },
        {
          action: () => {
            finishTutorial();
            // localStorage.setItem('tutorialCompleted', 'true');
          },
          text: 'Finish',
        },
      ],
    });

    tour.start();
  });
</script>

<style>
  :global(.shepherd-element.shepherd-theme-custom .shepherd-content) {
    background-color: #e0f8ff !important;
  }

  :global(.shepherd-element.shepherd-theme-custom .shepherd-arrow::before) {
    background-color: red !important;
  }
</style>
