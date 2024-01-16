// scene.ts;

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export interface ARScene {
  makeObjectTree(): THREE.Object3D;
  animate(sec: number): void;

  name(): string;
}

//   // GLTFLoaderを使用してrocket.gltfを読み込む
//   const loader = new GLTFLoader();
//   loader.load(
//     'path/to/rocket.gltf',
//     (gltf) => {
//       this.rocket = gltf.scene;
//       // ここでロケットの位置やサイズを設定することができます
//       this.rocket.scale.set(0.1, 0.1, 0.1);
//     },
//     undefined,
//     (error) => {
//       console.error('Error loading rocket model', error);
//     }
//   );

//   return new THREE.Object3D(); // 空のObject3Dを返すか、ロケットの3Dモデルが読み込まれるまで待つ処理が必要です
// }

export class TestScene implements ARScene {
  cube?: THREE.Object3D;
  rocket?: THREE.Object3D;
  isLaunch?: boolean;
  passedTime?: number;

  name() {
    return "test";
  }
  makeObjectTree(): THREE.Object3D {
    this.isLaunch = false;
    this.passedTime = 0;
    const loader = new GLTFLoader();
    loader.load("/rocket.gltf", (gltf) => {
      this.rocket = gltf.scene;
      this.rocket.position.y = 0;
      // this.scene.add(rocket);
    });

    // log.info("make object tree", this.name())
    // const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(0, 0.05, 0);
    // const material = new THREE.MeshPhongMaterial({
    // color: 0xffffff * Math.random(),
    // });
    // const cube = new THREE.Mesh(geometry, material);
    this.cube = this.rocket;

    if (this.rocket === undefined) {
      alert("rocket is undefined");
      throw new Error("rocket is undefined");
    }
    return this.rocket;
  }

  launch() {
    this.isLaunch = true;
  }

  animate(sec: number): void {
    if (!this.cube) alert("rocket cant animete");
    if (!this.cube) return;

    if (this.isLaunch && this.passedTime !== undefined) {
      this.cube.position.y += this.passedTime ** 2;
      this.passedTime += 0.001;
    }

    // 立方体を回転させるアニメーション
    //this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 1 * sec;
  }
}
