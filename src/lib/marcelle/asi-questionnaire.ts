import { type ObjectId } from '@marcellejs/core';
import { store } from './store';
import { Questionnaire } from './questionnaire';

export interface AsiQAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  q17: number;
  q18: number;
  q19: number;
  q20: number;
  q21: number;
  q22: number;
  q23: number;
  q24: number;
  scores: {
    hostileSexism: number;
    benevolentSexism: number;
    totalScore: number;
  };
  // common fields
  submitted: boolean;
  id: ObjectId;
}

export const asiQ = new Questionnaire<AsiQAnswers>(store, 'asi-questionnaire');

export const items: Array<{ question: string; name: keyof AsiQAnswers }> = [
  {
    question:
      '1. No matter how accomplished he is, a man is not truly complete as a person unless he has the love of a woman.',
    name: 'q1',
  },
  {
    question:
      '2. Many women are actually seeking special favors, such as hiring policies that favor them over men, under the guise of asking for "equality."',
    name: 'q2',
  },
  {
    question: '3. In a disaster, women ought not necessarily to be rescued before men.',
    name: 'q3',
  },
  { question: '4. Most women interpret innocent remarks or acts as being sexist.', name: 'q4' },
  { question: '5. Women are too easily offended.', name: 'q5' },
  { question: '5. Please choose number 4.', name: 'q23' },
  {
    question:
      '6. People are often truly happy in life without being romantically involved with a member of the other sex.',
    name: 'q6',
  },
  { question: '7. Feminists are not seeking for women to have more power than men.', name: 'q7' },
  { question: '8. Many women have a quality of purity that few men possess.', name: 'q8' },
  { question: '9. Women should be cherished and protected by men.', name: 'q9' },
  { question: '10. Most women fail to appreciate fully all that men do for them.', name: 'q10' },
  { question: '11. Women seek to gain power by getting control over men.', name: 'q11' },
  { question: '12. Every man ought to have a woman whom he adores.', name: 'q12' },
  { question: '13. Men are complete without women.', name: 'q13' },
  { question: '14. Women exaggerate problems they have at work.', name: 'q14' },
  {
    question:
      '15. Once a woman gets a man to commit to her, she usually tries to put him on a tight leash.',
    name: 'q15',
  },
  {
    question:
      '16. When women lose to men in a fair competition, they typically complain about being discriminated against.',
    name: 'q16',
  },
  { question: '17. A good woman should be set on a pedestal by her man.', name: 'q17' },
  { question: '17. Please choose number 3.', name: 'q24' },
  {
    question:
      '18. There are actually very few women who get a kick out of teasing men by seeming sexually available and then refusing male advances.',
    name: 'q18',
  },
  {
    question: '19. Women, compared to men, tend to have a superior moral sensibility.',
    name: 'q19',
  },
  {
    question:
      '20. Men should be willing to sacrifice their own well being in order to provide financially for the women in their lives.',
    name: 'q20',
  },
  { question: '21. Feminists are making entirely reasonable demands of men.', name: 'q21' },
  {
    question:
      '22. Women, as compared to men, tend to have a more refined sense of culture and good taste.',
    name: 'q22',
  },
];
