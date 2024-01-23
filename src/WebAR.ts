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
  type TrackballControlsEventMap,
  ThreeMFLoader,
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
  textMesh?: THREE.Mesh;

  renderer?: THREE.WebGLRenderer;
  renderer2?: CSS3DRenderer;
  controls?: TrackballControls;
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

  constellationList?: Array<string> = ["tenbin"];
  constellationMap?: Map<string, THREE.Mesh>;
  text3DMaterialMap?: Map<string, THREE.Mesh>;

  //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
  private static instance: WebAR | null = null;
  public static getSingleton(): WebAR {
    if (!WebAR.instance) {
      WebAR.instance = new WebAR();
    }
    return WebAR.instance;
  }

  private constructor() {
    this.constellationMap = new Map([["tenbin", new THREE.Mesh()]]);
    this.text3DMaterialMap = new Map([["tenbin", new THREE.Mesh()]]);
  }

  constellationSetter() {
    this.constellationList = ["tenbin"];
    for (const constellation of this.constellationList) {
    }
  }

  addConstellation(glbName: string, x: number, y: number, z: number) {
    const loader = new GLTFLoader();
    loader.load(
      "/" + glbName + ".glb",
      (gltf) => {
        this.tenbin = gltf.scene;
        this.tenbin.scale.set(x, y, z);
        // this.tenbin.scale.set(0.05, 0.05, 0.05);
        this.tenbin.position.y = 5;
        this.scene.add(this.tenbin);
      },
      undefined,
      (error) => {
        alert(error);
      }
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

  // addConstellation() {
  //   const loader = new GLTFLoader();
  //   loader.load(
  //     "/tenbin.glb",
  //     (gltf) => {
  //       this.tenbin = gltf.scene;
  //       this.tenbin.scale.set(0.05, 0.05, 0.05);
  //       this.tenbin.position.y = 5;
  //       this.scene.add(this.tenbin);
  //     },
  //     undefined,
  //     (error) => {
  //       alert(error);
  //     }
  //   );
  // }

  async add3DTextMaterial(text3d: string) {
    const fontLoader = new FontLoader();
    const fontPath = "/jpFonts/Rounded Mplus 1c Medium_Regular.json";
    // const font = await fontLoader.load(fontPath);
    const font = await fontLoader.loadAsync(fontPath);
    const textGeometry = new TextGeometry(text3d, {
      font: font,
      size: 0.2,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 3,
    });

    // textGeometry.center();
    const textMaterial = new THREE.MeshStandardMaterial();
    this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
    this.textMesh.castShadow = true;
    this.textMesh.position.z = -10;
    this.scene.add(this.textMesh);
  }

  // animate3DTextMaterial(pos: THREE.Vector3) {
  animate3DTextMaterial() {
    if (this.textMesh?.position === undefined)
      throw new Error("textMesh is undefined");
    if (
      this.rocket?.position.x === undefined ||
      this.rocket.position.y === undefined ||
      this.rocket.position.z === undefined
    )
      throw new Error("rocket position is undefined");
    this.textMesh.position.x = this.rocket?.position.x;
    this.textMesh.position.y = this.rocket?.position.y;
    this.textMesh.position.z = this.rocket?.position.z;
    // this.textMesh.position.x = pos.x;
    // this.textMesh.position.y = pos.y;
    // this.textMesh.position.z = pos.z;
  }

  // 使ってないのですが、サンプルとして残しておきたいです。
  addCss3dObject(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.scene2 = new THREE.Scene();

    const element = document.createElement("div");
    element.style.width = "100px";
    element.style.height = "100px";
    element.style.opacity = "0.5";
    element.style.background = new THREE.Color(
      Math.random() * 0xffffff
    ).getStyle();

    const textElement = document.createElement("div");
    textElement.textContent = "hello world";
    textElement.style.color = "#ccc";
    element.appendChild(textElement);

    const object = new CSS3DObject(element);
    object.position.x = 0;
    object.position.y = -30;
    object.position.z = -100;
    object.rotation.x = 0;
    object.rotation.y = 0;
    object.rotation.z = 0;
    object.scale.x = 0.1;
    object.scale.y = 0.1;
    this.scene2.add(object);

    const material = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      wireframe: true,
      wireframeLinewidth: 10,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(100, 100);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(object.position);
    mesh.rotation.copy(object.rotation);
    mesh.scale.copy(object.scale);
    scene.add(mesh);

    this.renderer2 = new CSS3DRenderer();
    this.renderer2.setSize(window.innerWidth, window.innerHeight);
    this.renderer2.domElement.style.position = "absolute";
    this.renderer2.domElement.style.top = "0";
    // document.body.appendChild(this.renderer2.domElement);
    document
      .getElementById("css3dobject")
      ?.appendChild(this.renderer2.domElement);

    // this.controls = new TrackballControls(camera, this.renderer2.domElement);
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

  // animate() {}

  async start(overlay_dom: string) {
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
    const camera = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // スタート時に追加したいならここでscene.addをする
    // this.makeDome(); domeは一度不要なのでコメントアウトしておく
    this.addConstellation("tenbin", 0.05, 0.05, 0.05);
    this.addRocket();
    await this.add3DTextMaterial("てんぷテキスト");

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

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer2?.setSize(window.innerWidth, window.innerHeight);
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
      // createSmoke(this.rocket);

      this.delegate?.onRender?.(renderer);
      renderer.render(scene, camera);

      this.controls?.update();

      if (this.rocket?.position === undefined) {
        alert("rocket.position is undefined");
        throw new Error("a");
      }
      // this.animate3DTextMaterial(this.rocket?.position);
      this.animate3DTextMaterial();
    };

    // フレームごとに実行されるアニメーション
    renderer.setAnimationLoop(render);
  }
}
