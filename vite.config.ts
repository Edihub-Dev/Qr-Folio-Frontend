import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // if (mode === "analyze") {
  //   plugins.push(
  //     visualizer({
  //       filename: "dist/bundle-report.html",
  //       template: "treemap",
  //       gzipSize: true,
  //       brotliSize: true,
  //       open: false,
  //     })
  //   );
  // }

  return {
    plugins,

    optimizeDeps: {
      exclude: ["lucide-react"],
    },

    build: {
      chunkSizeWarningLimit: 800,
    },
  };
});
