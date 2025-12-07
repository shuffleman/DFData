import { defineConfig } from "vite";

export default defineConfig({
    server: {
        allowedHosts: [
            "example.com",
            "localhost",
            "f61ef805-a5ce-46c1-a1db-23665a76b034-00-2stxqhl2sxfgh.picard.replit.dev",
        ],
        proxy: {
            '/api': {
                target: 'http://localhost:5155',
                changeOrigin: true,
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                // 添加时间戳到文件名，强制刷新缓存
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        }
    }
});
