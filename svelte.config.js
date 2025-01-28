import adapterCf from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapter = process.env.ADAPTER === 'static' 
  ? adapterStatic({
	fallback: 'index.html',
	pages: 'build',
	assets: 'build',
	precompress: false,
	strict: true
  })
  : adapterCf();

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter
  },
  preprocess: vitePreprocess()
};

export default config;
