import { toast } from 'svelte-sonner';
import { writable, get } from 'svelte/store';
import { sessionId } from '$lib/stores/session/sessionId';
export const activeReading = writable(false);
export const ActiveWritin = writable(false);
export const loading = writable(false);
export const messages = writable<Array<{ text: string; isUser: boolean; responded?: boolean }>>([]);
export const controller = writable<AbortController | null>(null);
import { PUBLIC_API_URL } from '$env/static/public';
export const TranscriptText = writable<string>('');

export async function voiceReading(text: string) {
	activeReading.set(true);
	let utterance: SpeechSynthesisUtterance | null = null;
	if (typeof window !== 'undefined') {
		utterance = new SpeechSynthesisUtterance();
	}
	if (!utterance) {
		return;
	}
	utterance.lang = 'tr-TR';
	utterance.pitch = 0;
	utterance.rate = 0.9;
	utterance.text = text;
	speechSynthesis.speak(utterance);
	utterance.onend = () => {
		activeReading.set(false);
	};
}

export async function sendMessage(message: string) {
	const currentSessionId = get(sessionId);
	if (!message.trim()) return;
	loading.set(true);
	messages.update((msgs) => [
		...msgs,
		{ text: message, isUser: true },
		{ text: '...', isUser: false, responded: false }
	]);

	let aiResponse = '';
	const newController = new AbortController();
	controller.set(newController);

	try {
		const response = await fetch(`${PUBLIC_API_URL}/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message,
				sessionId: currentSessionId
			}),
			signal: newController.signal
		});

		if (!response.ok) {
			loading.set(false);
			messages.update((msgs) => [
				...msgs.slice(0, -1),
				{ text: 'Hata: servise bağlanılamadı', isUser: false, responded: true }
			]);
			return;
		}

		const reader = response.body?.getReader();
		if (response.ok && reader) {
			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = new TextDecoder().decode(value);
				buffer += text;

				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim().startsWith('data: ')) {
						try {
							const jsonStr = line.slice(6).trim();
							const data = JSON.parse(jsonStr);

							if (data.error) {
								throw new Error(data.error);
							}

							aiResponse += data.textResponse || '';
							messages.update((msgs) => [
								...msgs.slice(0, -1),
								{ text: aiResponse, isUser: false, responded: true }
							]);
						} catch {
							toast.error('Mesaj işlenirken bir hata oluştu');
						}
					}
				}
			}
		}
	} catch (e) {
		console.error('Stream reading error:', e);
	} finally {
		loading.set(false);
		controller.set(null);
	}
}

export function stopMessage() {
	const currentController = get(controller);
	if (currentController) {
		currentController.abort();
		controller.set(null);
		messages.update((msgs) => [
			...msgs.slice(0, -1),
			{ text: 'Cevap durduruldu', isUser: false, responded: true }
		]);
		loading.set(false);
	}
}

export async function regenerateMessage() {
	try {
		loading.set(true);
		const msgs = get(messages);
		console.log(msgs);
		const lastUserMessage = msgs.filter((msg) => msg.isUser).pop();

		if (!lastUserMessage) {
			toast.error('Tekrar oluşturmak için önce bir mesaj gönderin');
			return;
		}

		messages.update((msgs) => msgs.slice(0, -2));

		await sendMessage(lastUserMessage.text);
	} catch (error) {
		console.error('Hata oluştu:', error);
		toast.error('Mesaj tekrar oluşturulamadı');
	} finally {
		loading.set(false);
	}
}
let currentRecognition: SpeechRecognition | null = null;

export async function VoiceWriting(message: string) {
	if (typeof window === 'undefined') return;

	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
		toast.error('Tarayıcınız ses tanıma özelliğini desteklemiyor');
		return;
	}

	// Stop any existing recognition session
	if (currentRecognition) {
		currentRecognition.stop();
		currentRecognition = null;
		ActiveWritin.set(false);
		return;
	}

	try {
		const recognition = new SpeechRecognition();
		currentRecognition = recognition;

		recognition.interimResults = true;
		recognition.continuous = false;
		recognition.lang = 'tr-TR';
		recognition.maxAlternatives = 1;

		recognition.onstart = () => {
			ActiveWritin.set(true);
		};

		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map(result => result[0].transcript)
				.join('');

			TranscriptText.set(
				`${message}${message ? ' ' : ''}${transcript}`
			);
		};

		recognition.onerror = () => {
			ActiveWritin.set(false);
			currentRecognition = null;
		};

		recognition.onend = () => {
			ActiveWritin.set(false);
			currentRecognition = null;
		};

		recognition.start();
	} catch (error) {
		console.error('Speech recognition initialization error:', error);
		toast.error('Ses tanıma başlatılamadı');
		ActiveWritin.set(false);
		currentRecognition = null;
	}
}
