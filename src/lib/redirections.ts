import { goto } from '$app/navigation';
import { base } from '$app/paths';
import type { User } from './marcelle';
import { type Page, PAGES } from './marcelle/progress';
import { getProgress } from './marcelle/logging';

export async function checkAndRedirect(user: User | null, currentPage: Page) {
  const userId = user?._id;
  console.log('userId', userId);
  if (!userId) {
    console.warn('No user ID found. Redirecting to Homepage');
    return goto(`${base}/`);
  }

  const status = await getProgress();
  if (status.step !== undefined && status.step > PAGES.indexOf(currentPage)) {
    goto(`${base}/${status.page}`);
  }
}
