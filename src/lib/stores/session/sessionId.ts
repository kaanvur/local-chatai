import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { v4 as uuidv4 } from 'uuid';

const initialValue = browser ? localStorage.getItem('chatSessionId') || uuidv4() : '';

export const sessionId = writable<string>(initialValue);

if (browser) {
	sessionId.subscribe((value) => {
		localStorage.setItem('chatSessionId', value);
	});
}
