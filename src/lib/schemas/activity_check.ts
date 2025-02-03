import { notification } from '@marcellejs/core';

const INACTIVITY_THRESHOLD = 180000; //3 minutes in milliseconds
const INACTIVITY_KEY = 'inactivityCounter';
let inactivityCount = parseInt(localStorage.getItem(INACTIVITY_KEY) || '0', 10);

let lastActivityTimestamp = Date.now();
let inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;

function resetInactivityTimer() {
  lastActivityTimestamp = Date.now();
}

function checkInactivity() {
  const now = Date.now();
  if (now - lastActivityTimestamp >= INACTIVITY_THRESHOLD) {
    inactivityCount++;
    localStorage.setItem(INACTIVITY_KEY, inactivityCount.toString());

    notification({
      title: 'You’ve been inactive!',
      message: 'It seems you’ve been inactive for over 3 minutes.',
      duration: 5000,
      type: 'danger',
    });

    lastActivityTimestamp = now;
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
