import { type ObjectId } from '@marcellejs/core';
import { store } from './store';
import { Questionnaire } from './questionnaire';

export interface PreQAnswers {
  accuracy: string;
  understanding: string;
  intuitive: string;
  effort: string;
  // common fields
  submitted: boolean;
  id: ObjectId;
}

export const preQ = new Questionnaire<PreQAnswers>(store, 'pre-questionnaire');
