import adapter from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
	  adapter: adapterStatic({
		fallback: 'index.html', // Enable SPA fallback
		pages: 'build',
		assets: 'build',
		precompress: false,
		strict: true
	  })
	},
	preprocess: vitePreprocess()
};

export default config;
