import adapterCf from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
	  adapter: adapterCf(),
	},
	preprocess: vitePreprocess()
};

export default config;
