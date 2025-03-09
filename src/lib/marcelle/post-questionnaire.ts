import { type ObjectId } from '@marcellejs/core';
import { store } from './store';
import { Questionnaire } from './questionnaire';

export interface PostQAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  openEndedResponse?: string; 
  // common fields
  submitted: boolean;
  id: ObjectId;
}

export const postQ = new Questionnaire<PostQAnswers>(store, 'post-questionnaire');

export const items: Array<{ question: string; name: keyof PostQAnswers }> = [
  {
    question:
      '1. I discovered potential biases in the system I hadn’t anticipated.',
    name: 'q1',
  },
  {
    question:
      '2. The interface helped me identify gender biases in the captions."',
    name: 'q2',
  },
  {
    question: '3. The interface helped me explore when and how a bias occurs.',
    name: 'q3',
  },
  { question: '4. The interface made it easy and efficient to collect examples of the bias.', name: 'q4' },
  { question: '5. It was difficult to determine if my hypotheses were true.', name: 'q5' },
  { question: '6. Overall, I found this interface helpful in conducting the auditing task.', name: 'q6' },
  {
    question:
      '7. In my opinion, the image captioning model is biased against women.',
    name: 'q7'
  },
  { question: 'Do you have any additional comments about the task or the study?', name: 'openEndedResponse' }, 
];
