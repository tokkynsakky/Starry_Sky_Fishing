// src/main.ts

import { createApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import TitleScreen from "./views/TitleScreen.vue";
import MainScreen from "./views/MainScreen.vue";
import CaptchaRocket from "./views/CaptchaRocket.vue";
import GenerateRocket from "./views/GenerateRocket.vue";
import LaunchRocket from "./views/LaunchRocket.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "title",
      component: TitleScreen,
    },
    {
      path: "/main",
      name: "main",
      component: MainScreen,
    },
    {
      path: "/main/captchaRocket",
      name: "captchaRocket",
      component: CaptchaRocket,
    },
    {
      path: "/main/generateRocket",
      name: "generateRocket",
      component: GenerateRocket,
    },
    {
      path: "/main/launchRocket",
      name: "launchRocket",
      component: LaunchRocket,
    },
  ],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
