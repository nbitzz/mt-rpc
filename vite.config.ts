import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
    plugins: [
        webExtension({
            browser: "firefox"
        }),
        viteStaticCopy({
          targets: [
            {
              src: "icons",
              dest: "."
            }
          ]
        })
    ],
    esbuild: {
      supported: {
        'top-level-await': true
      },
    }
})