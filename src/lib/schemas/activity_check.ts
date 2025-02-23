import { notification } from '@marcellejs/core';
import { store } from '$lib/marcelle';
import { writable } from 'svelte/store';

const INACTIVITY_THRESHOLD = 180000; // 3 minutes
const INACTIVITY_KEY = 'inactivityCounter';

let inactivityCount = parseInt(localStorage.getItem(INACTIVITY_KEY) || '0', 10);
let lastActivityTimestamp = Date.now();
let inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;

export const inactivityStore = writable(inactivityCount);

const inactivityService = store.service<{ count: number, timestamp: string }>('inactivity_logs');

function resetInactivityTimer() {
  lastActivityTimestamp = Date.now();
}

async function checkInactivity() {
  const now = Date.now();
  if (now - lastActivityTimestamp >= INACTIVITY_THRESHOLD) {
    inactivityCount++;
    localStorage.setItem(INACTIVITY_KEY, inactivityCount.toString());
    inactivityStore.set(inactivityCount); 

    await logInactivity();

    notification({
      title: 'You’ve been inactive!',
      message: `It seems you’ve been inactive for over 3 minutes. (${inactivityCount} times)`,
      duration: 5000,
      type: 'danger',
    });

    lastActivityTimestamp = now;
  }
}

async function logInactivity() {
  try {
    await inactivityService.create({
      count: inactivityCount,
      timestamp: new Date().toISOString(),
    });
    console.log('Inactivity logged:', inactivityCount);
  } catch (error) {
    console.error('Failed to log inactivity:', error);
  }
}

function startInactivityCheck() {
  if (!inactivityCheckInterval) {
    inactivityCheckInterval = setInterval(checkInactivity, 1000); // Check every second
  }
}

function stopInactivityCheck() {
  if (inactivityCheckInterval) {
    clearInterval(inactivityCheckInterval);
    inactivityCheckInterval = null;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    lastActivityTimestamp = Date.now();
  }
}

export function startActivityTracking() {
  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  startInactivityCheck();
}

export function stopActivityTracking() {
  stopInactivityCheck();
  document.removeEventListener('mousemove', resetInactivityTimer);
  document.removeEventListener('keydown', resetInactivityTimer);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}
