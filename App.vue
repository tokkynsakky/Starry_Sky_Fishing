<!-- App.vue -->

<template>
  <div id="app">
    <!-- <TitleScreen /> -->
    <router-view />
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent, type DefineComponent } from "vue";
import TitleScreen from "./src/views/TitleScreen.vue";
import MainScreen from "./src/views/MainScreen.vue";
import CaptchaRocket from "./src/views/CaptchaRocket.vue";
import GenerateRocket from "./src/views/GenerateRocket.vue";
import LaunchRocket from "./src/views/launchrocket.vue";

export default defineComponent({
  components: {
    TitleScreen,
  },
});

const routes: Record<string, any> = {
  "/": TitleScreen,
  "/main": MainScreen,
  "/main/captchaRocket": CaptchaRocket,
  "/main/generateRocket": GenerateRocket,
  "/main/launchRocket": LaunchRocket,
};

const currentPath = ref(window.location.hash);

window.addEventListener("hashchange", () => {
  currentPath.value = window.location.hash;
});

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || "/"];
});
</script>

<style>
/* グローバルなスタイルが必要であればここに追加 */
</style>
