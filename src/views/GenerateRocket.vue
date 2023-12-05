<template>
  <div class="viewTitle">
    <h1>ロケットを生成🚀</h1>
    <!-- <ChangeScene></ChangeScene> -->

    <!-- 生成するボタン -->
    <button @click="startAR">生成する</button>

    <!-- ARの映像表示 -->
    <div v-if="showAR" class="ar-object" ref="arObject"></div>
    <!-- <div v-if="showAR" ref="arObject"></div> -->

    <!-- 設置するボタン -->
    <button v-if="showPlaceButton" @click="placeRocket">設置する</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import * as THREE from "three";
// import ChangeScene from "./ChangeScene.vue";

export default defineComponent({
  data() {
    return {
      showPlaceButton: false,
      showAR: false,
    };
  },
  methods: {
    // ARを開始するメソッド
    startAR() {
      this.showAR = true;
      const arObject = this.$refs.arObject as HTMLElement;
      // Three.jsを使用してARオブジェクトを作成
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      arObject.appendChild(renderer.domElement);
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial();
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      camera.position.z = 5;
      // 以下は消してもいいかも
      cube.position.x -= 1;
      const animate = () => {
        requestAnimationFrame(animate);
        // ARオブジェクトのアニメーション
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;
        // 色を虹色に変化させる
        const time = performance.now() * 0.001;
        material.color.setHSL(time % 1, 1, 0.5);
        cube.position.x += Math.sin(cube.rotation.y) * 0.01;
        cube.position.y += Math.cos(cube.rotation.x) * 0.01;
        cube.position.z += Math.cos(cube.rotation.x) * 0.01;
        renderer.render(scene, camera);
      };
      animate();
      this.showPlaceButton = true;
    },
    // ロケットを設置するメソッド
    placeRocket() {
      // ここにロケットの設置ロジックを追加
      console.log(this.$router);
      this.$router.push("/main/launchRocket");
    },
  },
  // components: { ChangeSceneVue },
});
</script>

<style src="../assets/main.css" scoped />
