<template>
  <div class="viewTitle">
    <button v-if="showPlaceButton" @click="launchRocket">
      ロケットを打ち上げる🚀
    </button>
    <div id="3dScene"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import * as THREE from "three";
import * as Cannon from "cannon";

export default defineComponent({
  setup() {
    const showPlaceButton = ref(true);
    const world = ref(null);
    const renderer = new THREE.WebGL1Renderer();

    onMounted(() => {
      const sceneContainer = document.getElementById("3dScene");
      if (sceneContainer) {
        sceneContainer.appendChild(renderer.domElement);
      } else {
        console.error("Element with id '3dScene' not found.");
      }
    });

    const launchRocket = async () => {
      // Three.js シーンの初期化
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Cannon.js ワールドの初期化
      world.value = new Cannon.World();
      world.value.gravity.set(0, 0, -9.82);

      // 地面の作成
      const groundShape = new Cannon.Plane();
      const groundBody = new Cannon.Body({ mass: 0 });
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromAxisAngle(
        new Cannon.Vec3(1, 0, 0),
        -Math.PI / 2
      );
      world.value.addBody(groundBody);

      // Three.js の地面の作成
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
      }); // 灰色
      const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.receiveShadow = true;
      scene.add(groundMesh);

      // ロケットの作成
      const rocketShape = new Cannon.Cylinder(0.1, 0.1, 1, 16);
      const rocketBody = new Cannon.Body({ mass: 1 });
      rocketBody.addShape(rocketShape);
      rocketBody.position.set(0, 0, 1);
      rocketBody.velocity.set(0, 0, 1); // ロケットの初速度を設定（例: (0, 0, 1)）
      world.value.addBody(rocketBody);

      // Three.js のロケットの作成
      const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const rocketMesh = new THREE.Mesh(geometry, material);
      rocketMesh.castShadow = true;
      scene.add(rocketMesh);

      // カメラの設定
      camera.position.set(5, 5, 5);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      // カメラの追従対象をロケットに設定
      const rocketFollow = new THREE.Object3D();
      scene.add(rocketFollow);
      rocketFollow.add(camera);

      // ライトの追加
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // アニメーションループ
      const animate = () => {
        requestAnimationFrame(animate);

        // Cannon.js の更新
        world.value.step(1 / 60);

        // Three.js のロケットの位置更新
        rocketMesh.position.copy(rocketBody.position);
        rocketMesh.quaternion.copy(rocketBody.quaternion);

        // カメラの位置をロケットに追従
        const relativeCameraOffset = new THREE.Vector3(0, 2, 5); // カメラの相対的な位置
        const rocketGlobalPos = new THREE.Vector3();
        rocketBody.position.copy(rocketGlobalPos);
        const cameraOffset = relativeCameraOffset.applyMatrix4(
          rocketMesh.matrixWorld
        );
        camera.position.copy(cameraOffset);
        camera.lookAt(rocketGlobalPos);

        // Three.js のレンダリング
        renderer.render(scene, camera);
      };

      animate();
    };

    return {
      showPlaceButton,
      launchRocket,
      world,
    };
  },
});
</script>

<style src="../assets/main.css" scoped />
