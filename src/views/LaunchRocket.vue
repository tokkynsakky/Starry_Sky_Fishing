<!-- LaunchRocket.vue -->
<template>
  <div class="viewTitle">
    <button style="z-index: 10" @click="startar">ロケットを設置する🚀</button>
    <button style="z-index: 10" @click="launch">ロケットを打ち上げる🚀</button>
    <div id="overlay"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
// import * as THREE from "three";
// import * as Cannon from "cannon";
import { useWebAR } from "../WebAR";
import { TestScene } from "../scene";
// import { overlay } from "three/examples/jsm/nodes/Nodes.js";

const overlay_dom = "overlay";

export default defineComponent({
  setup() {
    const webar = useWebAR();
    let scene: TestScene;

    onMounted(() => {
      webar.start(overlay_dom);
    });

    const startar = () => {
      webar.placeScene((scene = new TestScene()));
    };

    const launch = () => {
      scene.launch();
    };

    return {
      startar,
      launch,
    };
  },
});
</script>

<!-- <style src="../assets/main.css" scoped /> -->
