import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        server: {
            proxy: {
                "/api": {
                    target: `http://localhost:${env.VITE_API_PORT || 4000}`,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
