import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target:
          "https://9nnnmm885j.execute-api.ca-central-1.amazonaws.com/prod",
        changeOrigin: true,
      },
    },
  },
});
