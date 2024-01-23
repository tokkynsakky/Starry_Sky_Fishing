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
  constellationMap?: Map<string, THREE.Object3D>;
  text3DMaterialMap?: Map<string, THREE.Mesh>;

  // 座標について
  tenbin?: THREE.Object3D;
  orion?: THREE.Object3D;
  andro?: THREE.Object3D;

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
    // this.text3DMaterialMap = new Map([["tenbin", new THREE.Mesh()]]);
  }

  constellationSetter() {
    this.constellationList = ["tenbin", "orion", "andro"];
    const x_arr: Array<number> = [0, 2, -1];
    const z_arr: Array<number> = [0, 2, -1];
    const y = 5;
    // for (const constellation of this.constellationList) {
    for (let i = 0; i < this.constellationList.length; ++i) {
      // this.addConstellation(constellation, x, y, z);
      this.addConstellation(this.constellationList[i], x_arr[i], y, z_arr[i]);
    }
  }

  addConstellation(glbName: string, x: number, y: number, z: number) {
    const loader = new GLTFLoader();
    loader.load(
      "/" + glbName + ".glb",
      (gltf) => {
        if (glbName === "tenbin") {
          // this.constellationMap?.get(glbName);
          this.tenbin = gltf.scene;
          // alert(typeof this.tenbin);
          this.tenbin.scale.set(0.03, 0.03, 0.03);
          // this.tenbin.scale.set(0.05, 0.05, 0.05);
          this.tenbin.position.x = x;
          this.tenbin.position.y = y;
          this.tenbin.position.z = z;
          this.scene.add(this.tenbin);
        }

        if (glbName === "orion") {
          // this.constellationMap?.get(glbName);
          this.orion = gltf.scene;
          // alert(typeof this.tenbin);
          this.orion.scale.set(0.03, 0.03, 0.03);
          // this.tenbin.scale.set(0.05, 0.05, 0.05);
          this.orion.position.x = x;
          this.orion.position.y = y;
          this.orion.position.z = z;
          this.scene.add(this.orion);
        }

        if (glbName === "andro") {
          // this.constellationMap?.get(glbName);
          this.andro = gltf.scene;
          // alert(typeof this.tenbin);
          this.andro.scale.set(0.03, 0.03, 0.03);
          // this.tenbin.scale.set(0.05, 0.05, 0.05);
          this.andro.position.x = x;
          this.andro.position.y = y;
          this.andro.position.z = z;
          this.scene.add(this.andro);
        }
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
        console.log("ロケットとテンビンが衝突しました！");
        this.handleCollision();
      }
    }
  }

  handleCollision() {
    console.log("ロケットとテンビンが衝突しました！");

    // 1. ロケットとテンビンを非表示にする
    if (this.rocket) {
      this.rocket.visible = false;
      this.scene.remove(this.rocket);
    }
    if (this.tenbin) {
      //this.tenbin.visible = false;
      //this.scene.remove(this.tenbin);
    }

    // 2. 新しいテンビンを同じ位置に再表示する
    // this.addNewTenbin();

    // 3. 新しいテンビンに自由落下アニメーションを適用する
    if (this.tenbin) {
      this.tenbin.position.y = 5; // 初期位置
      this.tenbin.visible = true;
      this.animateNewTenbin();
    }
  }

  // 新しいテンビンに自由落下アニメーションを適用する
  animateNewTenbin() {
    const clock = new THREE.Clock();

    const update = () => {
      const delta = clock.getDelta();

      if (!this.tenbin) {
        console.error("tenbin2オブジェクトが定義されていません");
        return;
      }

      const gravity = new THREE.Vector3(0, -0.01, 0);
      const acceleration = gravity.clone();

      const tenbinVelocity =
        this.tenbin.userData.velocity || new THREE.Vector3();
      tenbinVelocity.addScaledVector(acceleration, delta);
      this.tenbin.userData.velocity = tenbinVelocity;

      // 速度に応じて位置を直接更新
      this.tenbin.position.y += tenbinVelocity.y * delta;

      if (this.tenbin.position.y <= 0) {
        this.tenbin.position.y = 0;

        // アニメーションの終了処理を追加
        this.scene.remove(this.tenbin);
        this.tenbin = undefined; // 重要: tenbin2 を undefined に設定

        // 新しいtenbinを作成してシーンに追加
        this.addNewTenbinAtGround();

        return;
      }

      requestAnimationFrame(update);
    };

    update();
  }

  // 新しいtenbinを作成してシーンに追加するメソッド
  addNewTenbinAtGround() {
    const loader = new GLTFLoader();
    loader.load(
      "/ph2.glb",
      (gltf) => {
        this.tenbin = gltf.scene;
        this.tenbin.scale.set(0.04, 0.04, 0.04);
        this.tenbin.position.z = -3;
        this.tenbin.position.y = 0; // 地面の高さに設定
        this.tenbin.rotation.x = Math.PI / 2; // 90度回転
        this.scene.add(this.tenbin);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
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

  // addConstellation() {
  //   // 一応呼ばれていそう
  //   const loader = new GLTFLoader();
  //   loader.load(
  //     "/ph2.glb",
  //     (gltf) => {
  //       this.tenbin = gltf.scene;
  //       this.tenbin.scale.set(0.05, 0.05, 0.05);
  //       this.tenbin.position.y = 5;
  //       this.tenbin.rotation.x = Math.PI; // 180度回転
  //       this.scene.add(this.tenbin);
  //     },
  //     undefined,
  //     (error) => {
  //       alert(error);
  //     }
  //   );
  // }

  // addNewTenbin() {
  //   const loader = new GLTFLoader();
  //   loader.load("/tenbin.glb", (gltf) => {
  //     this.tenbin2 = gltf.scene;
  //     this.tenbin2.scale.set(0.05, 0.05, 0.05);

  //     // ここで初期位置をコピー
  //     this.tenbin2.position.copy(new THREE.Vector3(0, 5, 0));

  //     // const beforTenbinPos = this.tenbin?.position
  //     // if(beforTenbinPos === undefined) throw new Error('tenbinPos is undefined')
  //     // this.tenbin2.position.copy(beforTenbinPos);

  //     this.scene.add(this.tenbin2);
  //   }, undefined, (error) => {
  //     console.error(error);
  //   });
  //}

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

    if (!nodes) {
      // this.rocket が undefined の場合は何もせずに終了
      return;
    }

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
    this.scene.add(light);

    /* Camera */
    const camera = new THREE.PerspectiveCamera( //ダミーカメラ。webxrが制御するため使われない
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // スタート時に追加したいならここでscene.addをする
    // this.makeDome(); domeは一度不要なのでコメントアウトしておく
    // this.addConstellation("tenbin", 0.05, 0.05, 0.05);
    this.constellationSetter();
    this.addRocket();
    // await this.add3DTextMaterial("てんぷテキスト"); // ここで3Dな文字を追加している

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
      // this.animate3DTextMaterial(); //ここで3Dな文字のrender
    };

    // フレームごとに実行されるアニメーション
    renderer.setAnimationLoop(render);
  }
}
