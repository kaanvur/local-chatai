import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export function isMobile(): boolean {
  if (!browser) return false;
  return window.innerWidth < 768;
}

export function createMobileDetector() {
  const mobile = writable(isMobile());

  if (browser) {
    window.addEventListener('resize', () => {
      mobile.set(isMobile());
    });
  }

  return mobile;
}
