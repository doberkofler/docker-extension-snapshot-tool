import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	base: './',
	build: {
		outDir: 'build',
		chunkSizeWarningLimit: 1 * 1024 * 1024,
	},
	server: {
		port: 3000,
		strictPort: true,
	},
});
