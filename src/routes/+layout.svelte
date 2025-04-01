<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { createMobileDetector } from '$lib/hooks/is-mobile';

	const mobile = createMobileDetector();
</script>

<ModeWatcher />
<Toaster position={$mobile ? 'top-center' : 'bottom-right'} />
{@render children()}
