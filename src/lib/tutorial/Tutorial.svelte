<script lang="ts">
  import Shepherd from 'shepherd.js';
  import { get } from 'svelte/store';
  import 'shepherd.js/dist/css/shepherd.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { cards, removeHypothesis } from '$lib/schemas/hypothesis_storage';

  let tour;

  function clearTutorialCards() {
    cards.update((currentCards) => {
      const tutorialCards = currentCards.filter((c) => c.isTutorial);

      tutorialCards.forEach((card) => removeHypothesis(card.id));

      return currentCards.filter((c) => !c.isTutorial);
    });

    localStorage.setItem(
      'missingFields',
      JSON.stringify(Object.fromEntries(get(cards).map((card) => [card.id, card.missingFields]))),
    );
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
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted === 'true') {
      goto(`${base}/main`);
      return;
    }

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
      text: 'Now we will do a step by step tutorial to get familiar with the interface.',
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
      text: 'The image and its caption is displayed here.',
      attachTo: { element: '.instax-style', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
      id: 'new-bias',
      text: 'Click here to document a new bias.',
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
      text: 'You can drag an image and its caption from here.',
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
      text: 'And drop it in this area.',
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
      text: 'Repeat the process for all images. Drop at least 5 items here.',
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
      text: 'Write a description in the text area.',
      attachTo: { element: 'textarea', on: 'bottom' },
      buttons: [{ text: 'Next', action: tour.next }],
    });

    tour.addStep({
      id: 'finish',
      text: 'You have completed the tutorial!',
      buttons: [
        {
          action: restartTutorial,
          classes: 'shepherd-button-primary',
          text: 'Restart Tutorial',
        },
        {
          action: () => {
            finishTutorial();
            localStorage.setItem('tutorialCompleted', 'true');
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
