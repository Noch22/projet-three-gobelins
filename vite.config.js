import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import path from 'path';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    plugins: [glsl(), mkcert()],
    resolve: {
        alias: [{ find: '@', replacement: path.resolve(import.meta.dirname, './src') }],
    },
    build: {
        cssMinify: false,
    },
    server: {
        https: true,
        host: true,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:8080',
                ws: true,
            },
        },
    },
    // server: {
    //     host: '127.0.0.1',
    // },
});
