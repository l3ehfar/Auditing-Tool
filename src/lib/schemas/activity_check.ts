import { notification } from '@marcellejs/core';
import { store } from '$lib/marcelle';
import { writable } from 'svelte/store';
import { isTimerRunning } from '$lib/marcelle/timer';
import { goto } from '$app/navigation';
import { base } from '$app/paths';

const INACTIVITY_THRESHOLD = 180000; 


export const inactivityStore = writable<{ [key: string]: number }>({});


const inactivityService = store.service<{ userID: string; count: number; timestamp: string }>('inactivity_logs');


let lastActivityTimestamp: { [key: string]: number } = {};
let inactivityCheckInterval: { [key: string]: ReturnType<typeof setInterval> | null } = {};


function getUserInactivity(userID: string) {
  return parseInt(sessionStorage.getItem(`inactivityCounter_${userID}`) || '0', 10);
}


function setUserInactivity(userID: string, count: number) {
  sessionStorage.setItem(`inactivityCounter_${userID}`, count.toString());
  inactivityStore.update((store) => ({ ...store, [userID]: count }));
}


function resetInactivityTimer(userID: string) {
  lastActivityTimestamp[userID] = Date.now();
}


async function checkInactivity(userID: string) {
  if (!userID) return;

  const now = Date.now();
  if (!lastActivityTimestamp[userID]) lastActivityTimestamp[userID] = now;

  if (now - lastActivityTimestamp[userID] >= INACTIVITY_THRESHOLD) {
    let inactivityCount = getUserInactivity(userID) + 1;
    setUserInactivity(userID, inactivityCount);

    await logInactivity(userID, inactivityCount);

    notification({
      title: 'You’ve been inactive!',
      message: `You’ve been inactive for over 3 minutes. (${inactivityCount} times)`,
      duration: 5000,
      type: 'danger',
    });

    lastActivityTimestamp[userID] = now;
    if (inactivityCount >= 3) {
      goto(`${base}/returnSubmission`);
    }
  }
}


async function logInactivity(userID: string, count: number) {
  try {
    await inactivityService.create({
      userID,
      count,
      timestamp: new Date().toISOString(),
    });
    console.log(`Inactivity logged for ${userID}:`, count);
  } catch (error) {
    console.error('Failed to log inactivity:', error);
  }
}


export function startActivityTracking(userID: string) {
  if (!userID || inactivityCheckInterval[userID]) return;

  lastActivityTimestamp[userID] = Date.now();

  document.addEventListener('mousemove', () => resetInactivityTimer(userID));
  document.addEventListener('keydown', () => resetInactivityTimer(userID));
  document.addEventListener('visibilitychange', () => handleVisibilityChange(userID));

  inactivityCheckInterval[userID] = setInterval(() => checkInactivity(userID), 1000);
}


export function stopActivityTracking(userID: string) {
  if (!userID || !inactivityCheckInterval[userID]) return;

  clearInterval(inactivityCheckInterval[userID]);
  inactivityCheckInterval[userID] = null;

  document.removeEventListener('mousemove', () => resetInactivityTimer(userID));
  document.removeEventListener('keydown', () => resetInactivityTimer(userID));
  document.removeEventListener('visibilitychange', () => handleVisibilityChange(userID));
}


function handleVisibilityChange(userID: string) {
  if (document.visibilityState === 'visible') {
    resetInactivityTimer(userID);
  }
}


isTimerRunning.subscribe(($isTimerRunning) => {
  const userID = sessionStorage.getItem('userID'); 
  if (!userID) return;

  if (!$isTimerRunning) {
    stopActivityTracking(userID);
  } else {
    startActivityTracking(userID);
  }
});
