import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://finopsautopilot.com",
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
