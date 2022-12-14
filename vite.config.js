import { sveltekit } from '@sveltejs/kit/vite';
import * as dotenv from 'dotenv';
dotenv.config();

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	server: {
		port: process.env.CLIENT_PORT
	}
};

export default config;
