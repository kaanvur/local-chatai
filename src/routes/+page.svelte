<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
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
		Copy,
		Plus,
		Volume2,
		SendHorizontal,
		RotateCcw,
		CircleStop,
		Mic,
		MicOff
	} from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		voiceReading,
		activeReading,
		loading,
		messages as messagesStore,
		sendMessage,
		stopMessage,
		regenerateMessage,
		VoiceWriting,
		ActiveWritin,
		TranscriptText
	} from '$lib/chatLogic';
	import { sessionId } from '$lib/stores/session/sessionId';

	let message = $state('');
	let messages = $state<{ isUser: boolean; text: string }[]>([]);
	let workspaceStatus: 'checking' | 'online' | 'offline' = $state('checking');
	let chatContainer: HTMLDivElement;
	import * as Drawer from '$lib/components/ui/drawer/index.js';

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
	$effect(() => {
		if (TranscriptText) {
			message = $TranscriptText;
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
		const statusPromise = new Promise(async (resolve, reject) => {
			try {
				const response = await fetch(`${PUBLIC_API_URL}/chat`);
				const data = await response.json();
				workspaceStatus = data.status;
				if (workspaceStatus === 'offline') {
					reject('offline');
				} else {
					resolve(data);
				}
			} catch (error) {
				workspaceStatus = 'offline';
				reject(error);
			}
		});

		toast.promise(statusPromise, {
			loading: 'Hizmet durumu kontrol ediliyor',
			success: () => 'Hizmet aktif',
			error: 'Hizmete erişilemiyor'
		});
	}

	async function getChatHistory() {
		try {
			const response = await fetch(`${PUBLIC_API_URL}/history?sessionId=${$sessionId}`);
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

	let isPWA = false;
	let drawerOpen = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const hasSeenDrawer = localStorage.getItem('hasSeenDrawer');
			isPWA =
				window.matchMedia('(display-mode: window-controls-overlay)').matches ||
				window.matchMedia('(display-mode: standalone)').matches;
			if (!hasSeenDrawer && !isPWA) {
				drawerOpen = true;
				localStorage.setItem('hasSeenDrawer', 'true');
				setTimeout(() => {
					drawerOpen = false;
				}, 5000);
			}
		}
	});

	onMount(async () => {
		await Promise.all([getChatHistory(), checkWorkspaceStatus()]);
	});
</script>

<div class="grid h-dvh place-items-center">
	<Card.Root
		class="glassy mx-auto flex h-dvh max-h-[800px] w-full max-w-6xl flex-col overflow-auto"
	>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>AI Chatbot</Card.Title>
					<Card.Description
						>Chat with a model who answers your questions rationally</Card.Description
					>
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
						<Plus />
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
							<Tooltip.Root delayDuration={0}>
								<Tooltip.Trigger
									class={`${buttonVariants({ variant: 'outline' })} h-auto px-1 py-1`}
									onclick={() => navigator.clipboard.writeText(msg.text)}
								>
									<Copy />
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Panoya kopyala</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						<Tooltip.Provider>
							<Tooltip.Root delayDuration={0}>
								<Tooltip.Trigger
									class={`${buttonVariants({ variant: 'outline' })} ml-2 h-auto px-1 py-1`}
									onclick={() => voiceReading(msg.text)}
									disabled={$activeReading}
								>
									<Volume2 />
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
					bind:value={message}
					readonly={$loading}
					onkeypress={(e) => {
						if (e.key === 'Enter') handleSubmit();
					}}
				/>
				<div class="ml-2 grid items-start">
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								disabled={$loading}
								class={`${buttonVariants({ variant: 'outline', size: 'icon' })} ${(!$loading && messages.length < 1) || 'hidden'}`}
								onclick={handleSubmit}
							>
								<SendHorizontal />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Gönder</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>

					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={`${buttonVariants({ variant: 'outline', size: 'icon' })} ${$loading || 'hidden'}`}
								onclick={stopMessage}
							>
								<CircleStop />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Durdur</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={`${buttonVariants({ variant: 'outline', size: 'icon' })} ${(!$loading && messages.length > 0) || 'hidden'}`}
								onclick={() => {
									regenerateMessage();
								}}
							>
								<RotateCcw />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Tekrar Cevapla</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								disabled={$loading || $ActiveWritin}
								class={buttonVariants({ variant: 'outline', size: 'icon' })}
								onclick={() => VoiceWriting(message)}
							>
								{#if $ActiveWritin}
									<MicOff />
								{:else}
									<Mic />
								{/if}
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Sesle Gİriş</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			</form>
		</Card.Footer>
	</Card.Root>
</div>

<Drawer.Root open={drawerOpen}>
	<Drawer.Content class="container">
		<Drawer.Header>
			<Drawer.Title>Uygulama olarak eklemek ister misiniz?</Drawer.Title>
			<Drawer.Description>Telefonunuzdan ya da bilgisayarınız kolay erişim sağla</Drawer.Description
			>
		</Drawer.Header>
		<Drawer.Footer>
			<Drawer.Close class={buttonVariants({ variant: 'default' })}>Kapat</Drawer.Close>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
