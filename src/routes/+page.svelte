<script lang="ts">
	import { onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';

	import { marked } from 'marked';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import {
		voiceReading,
		activeReading,
		loading,
		messages as messagesStore,
		sendMessage,
		stopMessage,
		regenerateMessage
	} from '$lib/chatLogic';
	import { sessionId } from '$lib/stores/session/sessionId';

	let message = $state('');
	let messages = $state<{ isUser: boolean; text: string }[]>([]);
	let workspaceStatus: 'checking' | 'online' | 'offline' = $state('checking');
	let chatContainer: HTMLDivElement;

	$effect(() => {
		if (messagesStore) {
			messages = $messagesStore;
		}
	});
	$effect(() => {
		if (messages) {
			setTimeout(scrollToBottom, 100);
		}
	});
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function renderMarkdown(text: string) {
		return marked(text);
	}
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTo({
				top: chatContainer.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	async function checkWorkspaceStatus() {
		toast.info('Hizmet durumu kontrol ediliyor');
		try {
			const response = await fetch('https://dini-bilgiler.pages.dev/api/chat');
			const data = await response.json();
			workspaceStatus = data.status;
			if (workspaceStatus === 'offline') {
				toast.error('Hizmete erişilemiyor');
			}
		} catch (error) {
			workspaceStatus = 'offline';
			toast.error('Hizmete erişilemiyor');
		}
	}
	async function getChatHistory() {
		try {
			const response = await fetch(`https://dini-bilgiler.pages.dev/api/history?sessionId=${$sessionId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch chat history');
			}
			const data = await response.json();
			messages = data;
			scrollToBottom();
		} catch (error) {
			toast.error('Geçmiş mesajlar yüklenemedi');
		}
	}
	async function handleSubmit() {
		await sendMessage(message);
		message = '';
	}
	onMount(async () => {
		await Promise.all([getChatHistory(), checkWorkspaceStatus()]);
	});
</script>

<div class="grid h-dvh place-items-center">
	<Card.Root class="mx-auto flex h-dvh max-h-[800px] w-full max-w-6xl flex-col overflow-auto glassy">
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>Dini Bilgiler</Card.Title>
					<Card.Description>Diyanet İşleri meali baz alınmıştır</Card.Description>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						onclick={() => {
							$sessionId = uuidv4();
							messages = [];
							toast.success('Yeni sohbet başlatıldı');
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="15"
							height="15"
							viewBox="0 0 24 24"
							class="mr-2"
						>
							<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
						</svg>
						Yeni Sohbet
					</Button>
					{#if workspaceStatus === 'checking'}
						<span class="h-3 w-3 rounded-full bg-yellow-400"></span>
					{:else if workspaceStatus === 'online'}
						<span class="h-3 w-3 rounded-full bg-green-500"></span>
					{:else}
						<span class="h-3 w-3 rounded-full bg-red-500"></span>
					{/if}
				</div>
			</div>
		</Card.Header>
		<Card.Content class="flex-grow overflow-auto">
			<div bind:this={chatContainer} class="h-full overflow-y-auto">
				{#each messages as msg}
					<div class={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
						<Avatar.Root class={`${msg.isUser ? 'order-1' : ''}`}>
							<Avatar.Image
								src={`${msg.isUser ? 'https://github.com/shadcn.png' : 'https://cdn-icons-png.flaticon.com/512/7040/7040956.png'}`}
								alt="@shadcn"
							/>
							<Avatar.Fallback>Ai</Avatar.Fallback>
						</Avatar.Root>
						<div
							class={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm  ${msg.isUser ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}
						>
							{#if msg.isUser}
								{msg.text}
							{:else}
								<div class="markdown-content">
									{@html renderMarkdown(msg.text)}
								</div>
							{/if}
						</div>
					</div>
					<div class={`${msg.isUser ? ' justify-end' : ''} mx-11 flex`}>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="outline"
										class="h-auto p-1 leading-none"
										onclick={() => navigator.clipboard.writeText(msg.text)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="15"
											height="15"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"
											/>
										</svg>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Panoya kopyala</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger class="ml-2">
									<Button
										variant="outline"
										class="h-auto p-1 leading-none"
										onclick={() => voiceReading(msg.text)}
										disabled={$activeReading}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="15"
											height="15"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M14 20.725v-2.05q2.25-.325 3.625-2.075T19 12q0-2.925-1.375-4.675T14 5.325v-2.05q3.05.4 4.525 2.7T20 12q0 3.625-1.475 5.925T14 20.725M3 15v-6h4l5-5v16l-5-5zm7-4V7.85L7.85 10H5v4h2.85L10 16.15zm4.5 2v-6q1.05.525 1.525 1.462T16.5 12q0 1.1-.475 2.037T14.5 15.5"
											/>
										</svg>
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Sesli Oku</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				{/each}
			</div>
		</Card.Content>
		<Card.Footer>
			<form
				onsubmit={(e) => {
					e.preventDefault;
					handleSubmit();
				}}
				class="flex w-full"
			>
				<Textarea
					placeholder="soru sor"
					autofocus
					bind:value={message}
					readonly={$loading}
					onkeypress={(e) => {
						if (e.key === 'Enter') handleSubmit();
					}}
				/>
				<div class="ml-2 grid items-start">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button type="submit" variant="outline" size="icon" disabled={$loading}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="25"
										height="25"
										viewBox="0 0 24 24"
									>
										<path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z" />
									</svg>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Gönder</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									class={`${$loading || 'hidden'}`}
									type="button"
									onclick={stopMessage}
									variant="outline"
									size="icon"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="25"
										height="25"
										viewBox="0 0 12 12"
									>
										<path
											fill="currentColor"
											d="M5 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm6 2A5 5 0 1 1 1 6a5 5 0 0 1 10 0m-1 0a4 4 0 1 0-8 0a4 4 0 0 0 8 0"
										/>
									</svg></Button
								>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Durdur</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									type="button"
									class={`${(!$loading && messages.length > 0) || 'hidden'}`}
									variant="outline"
									size="icon"
									onclick={() => {
										regenerateMessage();
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="25"
										height="25"
										viewBox="0 0 24 24"
									>
										<path
											fill="currentColor"
											d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
										/>
									</svg>
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Tekrar Cevapla</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			</form>
		</Card.Footer>
	</Card.Root>
</div>
