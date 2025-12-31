import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'Big Sibling Helper',
                short_name: 'SiblingHelper',
                theme_color: '#0ea5e9',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'src/assets/icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            }
                        }
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'style' ||
                            request.destination === 'script' ||
                            request.destination === 'worker',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-resources',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 7
                            }
                        }
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@state': path.resolve(__dirname, './src/state'),
            '@data': path.resolve(__dirname, './src/data'),
            '@services': path.resolve(__dirname, './src/services'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@sibling-helper/shared': path.resolve(__dirname, '../shared')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules'))
                        return;
                    if (id.includes('react'))
                        return 'react';
                    if (id.includes('framer-motion'))
                        return 'motion';
                    if (id.includes('dexie'))
                        return 'dexie';
                    return 'vendor';
                }
            }
        }
    }
});
