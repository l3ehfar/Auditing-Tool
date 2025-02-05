import { type ObjectId } from '@marcellejs/core';
import { store } from './store';
import { Questionnaire } from './questionnaire';

export interface Consent {
  consent: boolean;
  // common fields
  submitted: boolean;
  id: ObjectId;
}

export const consent = new Questionnaire<Consent>(store, 'consent');
