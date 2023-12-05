<script setup lang="ts">
import { useWebAR } from "../WebAR";
import { TestScene, TestScene2 } from "../scene";

const webar = useWebAR(); //シングルトンを取得

const scene_a = () => {
  webar.placeScene(new TestScene());
};

const scene_b = () => {
  webar.changeScene(new TestScene2());
};
</script>

<template>
  <button @click="scene_a">Place Scene</button>
  <button @click="scene_b">Change Scene</button>
</template>
