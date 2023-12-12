// scene.ts;

import * as THREE from "three";

export interface ARScene {
  makeObjectTree(): THREE.Object3D;
  animate(sec: number): void;

  name(): string;
}

export class TestScene implements ARScene {
  cube?: THREE.Object3D;
  // dome?: THREE.Object3D;
  isLaunch?: boolean;
  passedTime?: number;

  name() {
    return "test";
  }
  makeObjectTree(): THREE.Object3D {
    this.isLaunch = false;
    this.passedTime = 0;
    // log.info("make object tree", this.name())
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(0, 0.05, 0);

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff * Math.random(),
    });
    const cube = new THREE.Mesh(geometry, material);
    this.cube = cube;

    return cube;
  }

  launch() {
    this.isLaunch = true;
  }

  animate(sec: number): void {
    if (!this.cube) return;
    if (this.isLaunch) {
      this.cube.position.y += this.passedTime ** 2;
      this.passedTime += 0.001;
    }

    // 立方体を回転させるアニメーション
    //this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 1 * sec;
  }
}

export class TestScene2 implements ARScene {
  cube?: THREE.Object3D;

  name() {
    return "test2";
  }

  makeObjectTree(): THREE.Object3D {
    // 立方体のジオメトリを作成
    const geometry = new THREE.ConeGeometry(0.1, 0.1).translate(0, 0.05, 0);

    // 材質を作成（色を指定）
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

    // 立方体のメッシュを作成
    this.cube = new THREE.Mesh(geometry, material);

    return this.cube;
  }

  animate(sec: number): void {
    if (!this.cube) return;

    // 立方体を回転させるアニメーション
    //this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
  }
}
