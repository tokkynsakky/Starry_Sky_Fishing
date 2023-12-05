<template>
  <div class="viewTitle">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>

    <!-- ARを開始するボタン -->
    <!-- <button @click="startAR">Start AR</button> -->

    <!-- ロケットの作成をはじめるボタン -->
    <button @click="startCaptcha">ロケットの作成をはじめる</button>

    <!-- カメラの映像表示 -->
    <video v-if="showCamera" ref="videoElement" autoplay></video>

    <!-- ARオブジェクト表示 -->
    <div v-if="showAR" class="ar-object" ref="arObject"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
// import * as THREE from "three";

export default defineComponent({
  data() {
    return {
      title: "旅立ちの準備",
      description: "まずはロケットをつくろう🚀",
      showCamera: false,
      showAR: false,
      cameraStream: null,
    };
  },
  methods: {
    startCaptcha(event: MouseEvent) {
      console.log(this.$router);
      this.$router.push("/main/captchaRocket");
    },
  },
});
</script>

<style src="../assets/main.css" scoped />
