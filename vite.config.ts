import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    // https: {
    // key: fs.readFileSync("key.pem"),
    // cert: fs.readFileSync("cert.pem"),
    // passphrase: "0000",
    // },
  },
  base: "/",
  build: {
    assetsDir: "assets",
    // sourcemap: true
  },
});

// import { fileURLToPath, URL } from 'node:url'

// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     vue(),
//   ],
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url))
//     }
//   }
// })

// scp -P 1322 -r dist/* e215711@shell.ie.u-ryukyu.ac.jp:~/public_html/Starry-Sky-Fishing
