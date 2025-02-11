import { writable, derived } from 'svelte/store';

const TIMER_KEY = 'user_timer';
const TIMER_DURATION = 180; 

export const timeLeft = writable(getStoredTimeLeft());
export const isTimerRunning = writable(false);

let interval: NodeJS.Timeout | null = null;

function getStoredTimeLeft() {
  if (typeof localStorage !== 'undefined') {
    const savedTime = localStorage.getItem(TIMER_KEY);
    return savedTime ? Math.max(0, parseInt(savedTime, 10)) : TIMER_DURATION;
  }
  return TIMER_DURATION;
}

function updateLocalStorage(time: number) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TIMER_KEY, time.toString());
  }
}

export function startTimer() {
  if (interval) return;

  isTimerRunning.set(true);

  interval = setInterval(() => {
    timeLeft.update((t) => {
      if (t > 0) {
        updateLocalStorage(t - 1);
        return t - 1;
      } else {
        stopTimer();
        return 0;
      }
    });
  }, 1000);
}

export function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  isTimerRunning.set(false);
}

export function resetTimer() {
  stopTimer();
  timeLeft.set(TIMER_DURATION);
  updateLocalStorage(TIMER_DURATION);
}

export function loadTimer() {
  timeLeft.set(getStoredTimeLeft());
}

export const isTimerFinished = derived(timeLeft, ($timeLeft) => $timeLeft <= 0);

export const formattedTime = derived(timeLeft, ($timeLeft) => {
  const minutes = Math.floor($timeLeft / 60);
  const seconds = $timeLeft % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

export const timeProgress = derived(timeLeft, ($timeLeft) => {
  return (($timeLeft / TIMER_DURATION) * 100).toFixed(2);
});
