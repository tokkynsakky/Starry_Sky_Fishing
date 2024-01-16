// WebAR.ts
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import type { ARScene } from "./scene";
import {
  CSS3DRenderer,
  CSS3DObject,
  GLTFLoader,
  XRButton,
} from "three/examples/jsm/Addons.js";

export interface WebARDelegate {
  onRender?(renderer: THREE.Renderer): void;
  onPlaneFound?(pose: THREE.Matrix4): void;
  onARButton?(): void;
}

export const useWebAR = (): WebAR => {
  return WebAR.getSingleton();
};

export class WebAR {
  scene = new THREE.Scene();
  rocket?: THREE.Object3D;
  tenbin?: THREE.Object3D;
  passedTime?: number;
  isLaunch?: boolean;

  // // renderer?: THREE.WebGLRenderer;
  cursorNode = new THREE.Object3D();
  baseNode?: THREE.Object3D;
  dome?: THREE.Object3D;
  delegate?: WebARDelegate;
  findPlane: boolean = true;
  prevTime: DOMHighResTimeStamp = -1;
  arScene?: ARScene;

  // 当たり判定など
  rocketBoundingBox?: THREE.Box3;
  tenbinBoundingBox?: THREE.Box3;

  //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
  private static instance: WebAR | null = null;
  public static getSingleton(): WebAR {
    if (!WebAR.instance) {
      WebAR.instance = new WebAR();
    }
    return WebAR.instance;
  }

  private constructor() {}

  makeDome() {
    // domeの画像関連のやつ
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("/starrySky3.jpg");

    // 必要なパラメータ
    const domeRadius = 100; // ドームの半径
    const domeSegments = 32; // ドームの分割数

    // 材質
    const material_ = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      map: texture,
      side: THREE.DoubleSide,
    });

    // ドームのジオメトリ
    const domeGeometry = new THREE.SphereGeometry(
      domeRadius,
      domeSegments,
      domeSegments,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    this.dome = new THREE.Mesh(domeGeometry, material_);

    this.scene.add(this.dome);
  }

  checkCollision() {
    if (this.rocketBoundingBox && this.tenbinBoundingBox) {
      if (this.rocketBoundingBox.intersectsBox(this.tenbinBoundingBox)) {
        // 衝突した場合の処理
        alert("Rocket and Tenbin collided!");

        // 画面遷移などの処理を実行
        // this.delegate?.onCollisionDetected?.(); // 適切なデリゲートを呼び出すなど

        // 画面遷移の例 (Vue Router を使用する場合)
        // router.push("/main/collisionPage");
      }
    }
  }

  updateBoundingBoxes() {
    if (this.rocket && this.tenbin) {
      // ロケットのBoundingBoxを更新
      const rocketBox = new THREE.Box3().setFromObject(this.rocket);
      this.rocketBoundingBox = rocketBox;

      // てんびんのBoundingBoxを更新
      const tenbinBox = new THREE.Box3().setFromObject(this.tenbin);
      this.tenbinBoundingBox = tenbinBox;
    }
  }

  addConstellation() {
    // 一応呼ばれていそう
    const loader = new GLTFLoader();
    loader.load(
      "/tenbin.glb",
      (gltf) => {
        this.tenbin = gltf.scene;
        this.tenbin.scale.set(0.05, 0.05, 0.05);
        this.tenbin.position.y = 5;
        this.scene.add(this.tenbin);
      },
      undefined,
      (error) => {
        alert(error);
      }
    );
  }

  addRocket() {
    const loader = new GLTFLoader();
    loader.load("/rocket.gltf", (gltf) => {
      this.rocket = gltf.scene;
      this.rocket.position.y = 0;
      // this.scene.add(rocket);
    });
    this.isLaunch = false;
  }

  launch() {
    this.isLaunch = true;
  }

  rocketAnimate(sec: number): void {
    if (!this.isLaunch) return;
    if (this.passedTime === undefined) {
      this.passedTime = 0;
    }

    if (this.rocket === undefined) throw new Error("rocketがundefinedです〜");
    this.rocket.position.y += this.passedTime ** 2;
    this.passedTime += 0.001;
    this.rocket.rotation.y += 0.01;

    this.checkCollision();
    this.updateBoundingBoxes();
  }

  placeScene(ar_scene: ARScene) {
    const nodes = this.rocket;

    if (this.baseNode) {
      this.scene.remove(this.baseNode);
    }
    this.baseNode = new THREE.Object3D();
    this.cursorNode.matrix.decompose(
      this.baseNode.position,
      this.baseNode.quaternion,
      this.baseNode.scale
    );
    this.baseNode.add(nodes);
    this.scene.add(this.baseNode!);

    this.arScene = ar_scene;
  }

  changeScene(ar_scene: ARScene) {
    this.baseNode?.clear();
    this.baseNode?.add();
    this.arScene = ar_scene;
  }

  start(overlay_dom: string) {
    /* Container */
    const container = document.getElementById("threejs");
    if (!container) {
      console.log("sorry cannot get three-container");
      return;
    }

    /* Scene */
    const scene = this.scene; //new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    /* Light */
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // スタート時に追加したいならここでscene.addをする
    // this.scene.add(this.dome);
    this.makeDome();
    this.addConstellation();
    this.addRocket();
    // this.tenbinBoundingBox = new THREE.Box3().setFromObject(this.tenbin);
    // this.rocketBoundingBox = new THREE.Box3().setFromObject(this.rocket);

    /* RENDERER */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const overray_element = document.getElementById(overlay_dom);

    /* ARButton */
    const arbutton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      domOverlay: { root: overray_element! },
    });
    arbutton.addEventListener("click", () => {
      scene.background = null;
      this.delegate?.onARButton?.();
    });
    document.body.appendChild(arbutton);

    /* Geometry */
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    this.cursorNode = reticle;

    // this.baseNode.add(new THREE.Mesh(geometry, material));

    /* Camera */
    const camera = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    /* ウィンドウリサイズ対応 */
    window.addEventListener("resize", onWindowResize);

    let hitTestSource: XRHitTestSource | null = null;
    let hitTestSourceRequested = false;

    const render = (timestamp: number, frame: XRFrame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
          console.log("sorry cannot get renderer referenceSpace");
          return;
        }

        const session = renderer.xr.getSession();
        if (!session) {
          console.log("sorry cannot get renderer session");
          return;
        }

        if (this.findPlane) {
          if (hitTestSourceRequested === false) {
            session.requestReferenceSpace("viewer").then((referenceSpace) => {
              session.requestHitTestSource!({ space: referenceSpace })!.then(
                (source) => {
                  hitTestSource = source;
                }
              );
            });

            session.addEventListener("end", () => {
              hitTestSourceRequested = false;
              hitTestSource = null;
            });

            hitTestSourceRequested = true;
          }

          if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
              const hit = hitTestResults[0];

              reticle.visible = true;
              const pose_matrix_array =
                hit.getPose(referenceSpace)!.transform.matrix;
              const pose_matrix = new THREE.Matrix4();
              pose_matrix.fromArray(pose_matrix_array);
              reticle.matrix = pose_matrix;
              // this.baseNode.matrix = pose_matrix;

              this.delegate?.onPlaneFound?.(pose_matrix);
            } else {
              reticle.visible = false;
            }
          }
        }
      }
      let duration: DOMHighResTimeStamp = 1;
      if (this.prevTime > 0) {
        duration = timestamp - this.prevTime;
      }
      this.prevTime = timestamp;

      // this.arScene?.animate(Number(duration) / 1000);
      this.rocketAnimate(Number(duration) / 1000);

      this.delegate?.onRender?.(renderer);
      renderer.render(scene, camera);
    };
    // フレームごとに実行されるアニメーション
    renderer.setAnimationLoop(render);
  }
}
