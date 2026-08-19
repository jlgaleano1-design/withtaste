import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Solo afecta a `npm run dev` (nunca al build de producción, que
    // resuelve /api/* con la función serverless real de Vercel). Así se
    // puede probar en local con `npm run dev` nomás, sin vercel dev/CLI.
    proxy: {
      "/api": {
        target: "https://withtaste.vercel.app",
        changeOrigin: true,
      },
    },
  },
});
