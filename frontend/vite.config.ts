import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const apiBaseUrl = 'http://localhost:5001/'

export default defineConfig({
  base: '/Forum_Project/',
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
