import { toast } from 'svelte-sonner';
import { writable, get } from 'svelte/store';
import { sessionId } from '$lib/stores/session/sessionId';
export const activeReading = writable(false);
export const loading = writable(false);
export const messages = writable<Array<{ text: string; isUser: boolean; responded?: boolean }>>([]);
export const controller = writable<AbortController | null>(null);

export async function voiceReading(text: string) {
	activeReading.set(true);
	try {
		const response = await fetch(`${process.env.PUBLIC_API_URL}/read`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text })
		});

		if (!response.ok) {
			throw new Error('Failed to get audio');
		}

		const blob = await response.blob();
		const audio = new Audio(URL.createObjectURL(blob));
		audio.onended = () => activeReading.set(false);
		audio.play();
	} catch {
		toast.error('Ses oynatılırken bir hata oluştu');
		activeReading.set(false);
	}
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
		const response = await fetch(`${process.env.PUBLIC_API_URL}/chat`, {
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
