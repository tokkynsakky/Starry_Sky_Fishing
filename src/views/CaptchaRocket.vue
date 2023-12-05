<template>
  <div class="viewTitle">
    <h1>ロケットを選ぼう🚀</h1>
    <button @click="startCamera">撮影を開始する</button>
    <video v-if="showCamera" ref="videoElement" autoplay></video>
    <button v-if="showCaptureButton" @click="captureImage">撮影</button>
    <button v-if="showCreateRocketButton" @click="createRocket">
      ロケット作成へ
    </button>
  </div>
</template>

<script lang="ts">
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default {
  data() {
    return {
      showCamera: false,
      showCaptureButton: false,
      showCreateRocketButton: false,
      cameraStream: null,
    };
  },
  methods: {
    async startCamera() {
      this.showCamera = true;

      // $nextTickメソッドを使用してDOMが更新された後に処理を行う
      this.$nextTick(async () => {
        const videoElement = this.$refs.videoElement as HTMLVideoElement;

        try {
          // カメラのストリームを取得
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoElement.srcObject = stream;
          videoElement.play(); // 手動で再生を開始
          this.showCaptureButton = true;
        } catch (error) {
          console.error("Error accessing camera:", error);
        }
      });
    },

    async captureImage() {
      const videoElement = this.$refs.videoElement as HTMLVideoElement;
      // ここでpredictionsを使用して3Dモデルを生成するロジックを追加

      this.showCaptureButton = false;
      this.showCreateRocketButton = true;
    },

    createRocket() {
      this.$router.push("/main/generaterocket");
    },
  },
};
</script>

<style src="../assets/main.css" scoped />
