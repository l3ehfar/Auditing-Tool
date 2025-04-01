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
  openEndedResponse?: string; 
  submitted: boolean;
  id: ObjectId;
}

export const postQ = new Questionnaire<PostQAnswers>(store, 'post-questionnaire');

export const items: Array<{ question: string; name: keyof PostQAnswers }> = [
  {
    question:
      '1. It was easy to identify gender biases.',
    name: 'q1',
  },
  {
    question:
      '2. It was easy to find examples that demonstrated a bias I had identified. "',
    name: 'q2',
  },
  {
    question: '3. It was easy to test whether the bias occurred under different conditions (e.g., clothing, environment, objects).',
    name: 'q3',
  },
  { question: '4. It was easy to determine if my hypotheses were true.', name: 'q4' },
  { question: '5. I think I could find more biases with more time.', name: 'q5' },
  { question: '6. I discovered potential biases in the system that I hadn’t anticipated.', name: 'q6' },
  { question: 'Do you have any additional comments about the task or the study?', name: 'openEndedResponse' }, 
];
