<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { setProgress } from '$lib/marcelle/logging';
  import { type Consent, consent } from '$lib/marcelle/consent';
  import type { User } from '$lib/marcelle';
  import { base } from '$app/paths';
  import { checkAndRedirect } from '$lib/redirections';
  import { pageProgress } from '$lib/marcelle/progress';

  export let data: { user: User | null };
  let answers: Partial<Consent> = {};

  const keys = ['consent'];

  $: pageProgress.set(
    (Object.keys(answers).filter((k) => keys.includes(k)).length * 100) / keys.length,
  );
  $: canSubmit = $pageProgress === 100;
  $: disableInputs = answers.submitted === true;

  onMount(async () => {
    await checkAndRedirect(data.user, 'introduction');
    setProgress('introduction');
    answers = await consent.retrieve();
  });

  function record(key: keyof typeof answers, e: any) {
    answers[key] = e.target.value;
    consent.record(answers);
  }

  function submit() {
    consent.submit().then(() => {
      goto(`${base}/task-description`);
    });
  }

</script>

<div class="mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-3xl font-bold text-center">Information Sheet and Consent Form</h1>
    <p class="text-lg text-center">Please read this information document carefully.</p>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Research Ethics Approval</h2>
      <p>
        This research project has been approved by the Research Ethics Committee of Université
        Paris-Saclay.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Goal of the Research Project</h2>
      <p>
        Machine learning (ML) technologies are widely used to build artificial intelligence systems
        but can sometimes show harmful biases, like gender stereotypes, which can have real-world
        impacts. To address this, <strong>Algorithm Auditing</strong> is developed to test these systems
        for biased and harmful behaviors. While experts often lead these audits, many end-users have
        spotted and highlighted harmful algorithm behaviors in their regular interactions with ML systems.
        This shows that involving users in audits can be valuable.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">What we expect from you</h2>
      <p>
        If you agree to participate, you will participate in a study to audit an <strong
          >Image Captioning Model</strong
        >, which generates textual descriptions of images. The goal is to identify whether the
        captions display <strong>Gender Bias</strong> when describing people in medical jobs. <br /> This audit is important because image
        captioning models have applications such as enhancing accessibility for visually impaired
        individuals, improving assistive technologies for people with disabilities, and providing
        context for images on social media to enrich communication and storytelling. However, the
        presence of gender biases in these models can lead to harmful consequences, such as
        perpetuating gender stereotypes. <br />The study lasts one hour, and it will consist of the
        following steps:
      </p>
      <ul class="list-disc list-inside mt-4">
        <li>Introduction to the study and task (5 minutes)</li>
        <li>Pre-study questionnaires (10 minutes)</li>
        <li>Presentation of the interface and training (10 minutes)</li>
        <li>Main task: auditing gender bias (30 minutes)</li>
        <li>Post-study survey (5 minutes)</li>
      </ul>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Your rights to withdraw from the research at any time</h2>
      <p>
        Your contribution to this research is voluntary. You may withdraw or cease your
        participation at any time by contacting the correspondent whose contact information is
        available on the first page of this document. Your decision to stop participating will have
        no effect on your future relations with the LISN laboratory, CNRS or Université
        Paris-Saclay. However, payments is conditioned to the completion of the study.
      </p>
    </section>

    <section class="mt-6">
        <h2 class="text-xl font-semibold">Screening-Out Criteria</h2>
        <p>
            Participants may be screened out from the study in the following cases:
        </p>
        <ul class="list-disc list-inside mt-4">
            <li><strong>Not agreeing to the consent form</strong></li>
            <li><strong>Voluntarily leaving the study at any point</strong></li>
            <li><strong>Not finishing the study for any reason</strong> – If you do not complete all the required steps, you will be screened out.</li>
            <li><strong>Failing two attention checks</strong></li>
            <li><strong>Inactivity tracking</strong> – Your activity during the task is tracked, and if you remain inactive for 3 minutes, you will receive a notification. Receiving three notifications will result in exclusion.</li>
            <li><strong>The task was not completed according to the given instructions.</strong></li>
            <li><strong>Technical issues</strong> – If a technical issue prevents you from completing the study, we will compensate you accordingly.</li>
        </ul>
        <p>However, for all screening-out cases, you will be required to return the submission and will not be paid. <strong>This is not considered a rejection.</strong></p>
      </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Your rights to confidentiality and privacy</h2>
      <p>
        In this study we will collect data about you (age, gender, education, knowledge of machine
        learning, use of new technologies in your daily life). Your interactions with the system
        (images, descriptions, assessments, reports) will also be collected. The information
        collected will be confidential and will only be used for the purpose of this scientific
        research. At the time of your inclusion in the study, you will be given a unique and
        non-nominative identifier to ensure pseudonymization of all the data collected. The
        information processed during the analysis will appear in the reports so that no
        identification is possible. The information collected will be archived for a period of five
        years after the end of the study. You may at any time exercise your right to withdraw or
        modify the authorizations concerning the conservation of your personal data, at the
        following address: <a href="mailto:jules.francoise@lisn.fr" class="text-blue-600 underline"
          >jules.francoise@lisn.fr</a
        >.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Benefits of the study</h2>
      <p>
        Participation in the study will be compensated at a rate of 9£ for the whole study.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Potential risks of the study</h2>
      <p>
        Overall, this research does not involve any risks or discomforts other than those of daily
        life.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Dissemination</h2>
      <p>
        The results of the study will be presented in scientific conferences or journals and will be
        shared with you if you request it.
      </p>
    </section>

    <section class="mt-6">
      <h2 class="text-xl font-semibold">Your right to ask questions</h2>
      <p>
        You can ask questions about the research at any time (before, during, and after your
        participation) by contacting the researchers by email.
      </p>
    </section>

    <section class="mt-6">
      <p>
        By clicking on the “I agree” button below, you certify that you have read and understood the
        above information, and that you are free to withdraw your consent or withdraw from the
        research at any time.
      </p>
    </section>

    <div class="text-center my-6">
        <label class="inline-flex items-center">
          <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600" on:change={(e) => record('consent', e)} disabled={disableInputs}>
          <span class="ml-2">I Agree</span>
        </label>
        <button class="btn btn-primary mt-4" on:click={submit} disabled={!canSubmit}>Submit</button>
      </div>

  </div>
</div>

<style>
  ul {
    margin-bottom: 12px;
  }
</style>
