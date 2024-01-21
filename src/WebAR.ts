// WebAR.ts
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import type { ARScene } from "./scene";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import {
  CSS3DRenderer,
  CSS3DObject,
  GLTFLoader,
  XRButton,
  TextGeometry,
  TrackballControls,
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
  scene2 = new THREE.Scene();
  rocket?: THREE.Object3D;
  tenbin?: THREE.Object3D;
  passedTime?: number;
  isLaunch?: boolean;
  tween: any;

  renderer?: THREE.WebGLRenderer;
  renderer2?: THREE.WebGLRenderer;
  cursorNode = new THREE.Object3D();
  baseNode?: THREE.Object3D;
  dome?: THREE.Object3D;
  delegate?: WebARDelegate;
  findPlane: boolean = true;
  prevTime: DOMHighResTimeStamp = -1;
  arScene?: ARScene;
  camera? = new THREE.PerspectiveCamera(); //ダミーカメラ。webxrが制御するため使われない
  // camera? = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
  //   70,
  //   window.innerWidth / window.innerHeight,
  //   0.01,
  //   20
  // );

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

  private constructor() {
    this.camera = new THREE.PerspectiveCamera(
      //ダミーカメラ。webxrが制御するため使われない
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
  }

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
        alert("Rocket and Tenbin collided!");
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

  addCss3dObject(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const scene2 = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      wireframeLinewidth: 1,
      side: THREE.DoubleSide,
    });

    const element = document.createElement("div");
    element.style.width = "100px";
    element.style.height = "100px";
    element.style.opacity = "0.5";
    element.style.background = new THREE.Color(
      Math.random() * 0xffffff
    ).getStyle();

    const object = new CSS3DObject(element);
    object.position.x = 0;
    object.position.y = 0;
    object.position.z = 0;
    object.rotation.x = 0;
    object.rotation.y = 0;
    object.rotation.z = 0;
    object.scale.x = 1;
    object.scale.y = 1;
    scene2.add(object);

    const geometry = new THREE.PlaneGeometry(100, 100);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(object.position);
    mesh.rotation.copy(object.rotation);
    mesh.scale.copy(object.scale);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const renderer2 = new CSS3DRenderer();
    renderer2.setSize(window.innerWidth, window.innerHeight);
    renderer2.domElement.style.position = "absolute";
    renderer2.domElement.style.top = "0";
    document.body.appendChild(renderer2.domElement);

    const controls = new TrackballControls(camera, renderer2.domElement);

    window.addEventListener("resize", this.onWindowResize);
  }

  onWindowResize() {
    if (this.camera === undefined) {
      alert("camera is undefined");
      throw new Error("camera is undefined");
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    if (this.renderer === undefined || this.renderer2 === undefined) {
      const text = "renderer is undefined";
      alert(text);
      throw new Error(text);
    }

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer2.setSize(window.innerWidth, window.innerHeight);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer2.setSize(window.innerWidth, window.innerHeight);
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
    if (nodes === undefined) throw new Error("nodes is undefined");
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

    /* Camera */
    // const camera = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
    // this.camera = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
    //   70,
    //   window.innerWidth / window.innerHeight,
    //   0.01,
    //   20
    // );

    // スタート時に追加したいならここでscene.addをする
    // this.makeDome(); domeは一度不要なのでコメントアウトしておく
    this.addConstellation();
    this.addRocket();

    /* RENDERER */
    // const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    container.appendChild(this.renderer.domElement);

    // ===== ===== ===== ===== ===== css3dobjectについて

    // const element = document.createElement("div");
    // element.className = "element";
    // element.style.backgroundColor =
    //   "rgba(0,127,127," + (Math.random() * 0.5 + 0.25) + ")";

    // const text = document.createElement("div");
    // text.textContent = "hello world";
    // text.style.color = "white";
    // element.appendChild(text);
    // document.getElementById("css3dobject")?.appendChild(element);

    // const objectCSS = new CSS3DObject(element);
    // objectCSS.position.x = 0;
    // objectCSS.position.y = 0;
    // objectCSS.position.z = 0;
    // // this.scene2.add(objectCSS);
    // this.scene2.add(objectCSS);

    // const css3drenderer = new CSS3DRenderer();
    // css3drenderer.setSize(window.innerWidth, window.innerHeight);
    // // element.appendChild(css3drenderer.domElement);
    // const elem = document.getElementById("css3dobject");
    // if (elem === undefined) alert("elem is undefined");
    // elem?.appendChild(css3drenderer.domElement);

    // ===== ===== ===== ===== =====

    const overray_element = document.getElementById(overlay_dom);

    /* ARButton */
    const arbutton = ARButton.createButton(this.renderer, {
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

    // const onWindowResize = () => {
    //   camera.aspect = window.innerWidth / window.innerHeight;
    //   camera.updateProjectionMatrix();

    //   renderer.setSize(window.innerWidth, window.innerHeight);
    // };
    /* ウィンドウリサイズ対応 */
    window.addEventListener("resize", this.onWindowResize);

    let hitTestSource: XRHitTestSource | null = null;
    let hitTestSourceRequested = false;

    const render = (timestamp: number, frame: XRFrame) => {
      if (frame) {
        if (this.renderer === undefined)
          throw new Error("renderer is undefined 2");
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
          console.log("sorry cannot get renderer referenceSpace");
          return;
        }

        const session = this.renderer.xr.getSession();
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
      // createSmoke(this.rocket);

      if (this.renderer === undefined)
        throw new Error("renderer is undefined 3");
      if (this.camera === undefined) throw new Error("camera is undefined 3");
      this.delegate?.onRender?.(this.renderer);
      this.renderer.render(scene, this.camera);
      // ===== ===== ===== ===== ===== css3dobjectについて
      // css3drenderer.render(this.scene2, camera);
      // ===== ===== ===== ===== =====
    };

    // フレームごとに実行されるアニメーション
    this.renderer.setAnimationLoop(render);
  }
}
