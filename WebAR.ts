// WebAR.ts
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import type { ARScene } from "./scene";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export interface WebARDelegate {
  onRender?(renderer: THREE.Renderer): void;
  onPlaneFound?(pose: THREE.Matrix4): void;
  onARButton?(): void;
}

export const useWebAR = (): WebAR => {
  return WebAR.getSingleton();
};

// const path = "./assets/starrySky3.jpg";
export class WebAR {
  scene = new THREE.Scene();
  rocket?: THREE.Object3D;
  passedTime?: number;
  isLaunch?: boolean;
  tween: any;

  // // renderer?: THREE.WebGLRenderer;
  cursorNode = new THREE.Object3D();
  baseNode?: THREE.Object3D;
  dome?: THREE.Object3D;
  delegate?: WebARDelegate;

  findPlane: boolean = true;
  prevTime: DOMHighResTimeStamp = -1;

  arScene?: ARScene;

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
    const domeRadius = 20; // ドームの半径
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

  addConstellation() {
    // 一応呼ばれていそう
    const loader = new GLTFLoader();
    loader.load(
      "/tenbin.glb",
      (gltf) => {
        const tenbin = gltf.scene;
        tenbin.scale.set(0.05, 0.05, 0.05);
        tenbin.position.y = 5;
        this.scene.add(tenbin);
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
    this.rocket.position.y += this.passedTime ** 2;
    this.passedTime += 0.001;
    this.rocket.rotation.y += 0.01;
    // this.cube.position.y += this.passedTime ** 2;
    // this.passedTime += 0.001;
  }

  getParticle(): void {
    let p;
    if (particleArray.length > 0) {
      p = particleArray.pop();
    } else {
      p = new Particle();
    }
    return p;
  }

  createSmoke(rocket): void {
    let p = this.getParticle();
    dropParticle(p, rocket);
  }

  createFlyingParticles(): void {
    let p = this.getParticle();
    flyParticle(p);
  }

  placeScene(ar_scene: ARScene) {
    // const nodes = ar_scene.makeObjectTree();
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
    // this.baseNode?.add(ar_scene.makeObjectTree());
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
      // createSmoke(this.rocket);

      this.delegate?.onRender?.(renderer);
      renderer.render(scene, camera);
    };
    // フレームごとに実行されるアニメーション
    renderer.setAnimationLoop(render);
  }
}

class Particle {
  private isFlying;
  private geometry;
  private material;
  private mesh;

  constructor() {
    this.isFlying = false;

    var scale = 20 + Math.random() * 20;
    var nLines = 3 + Math.floor(Math.random() * 5);
    var nRows = 3 + Math.floor(Math.random() * 5);
    this.geometry = new THREE.SphereGeometry(scale, nLines, nRows);

    this.material = new THREE.MeshLambertMaterial({
      color: 0xe3e3e3,
      // shading: THREE.FlatShading,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    recycleParticle(this);
  }
}

let particleArray = [],
  slowMoFactor = 1;

let cloudTargetPosX,
  cloudTargetPosY,
  cloudTargetSpeed,
  cloudTargetColor,
  cloudSlowMoFactor = 0.65;

const dropParticle = (p, rocket) => {
  p.mesh.material.opacity = 1;
  p.mesh.position.x = 0;
  p.mesh.position.y = rocket.mesh.position.y - 80;
  p.mesh.position.z = 0;
  var s = Math.random(0.2) + 0.35;
  p.mesh.scale.set(0.4 * s, 0.4 * s, 0.4 * s);
  cloudTargetPosX = 0;
  cloudTargetPosY = rocket.mesh.position.y - 500;
  cloudTargetSpeed = 0.8 + Math.random() * 0.6;
  cloudTargetColor = 0xa3a3a3;

  TweenMax.to(p.mesh.position, 1.3 * cloudTargetSpeed * cloudSlowMoFactor, {
    x: cloudTargetPosX,
    y: cloudTargetPosY,
    ease: Linear.easeNone,
    onComplete: recycleParticle,
    onCompleteParams: [p],
  });

  TweenMax.to(p.mesh.scale, cloudTargetSpeed * cloudSlowMoFactor, {
    x: s * 1.8,
    y: s * 1.8,
    z: s * 1.8,
    ease: Linear.ease,
  });
};

const getParticle = () => {
  let p;
  if (particleArray.length > 0) {
    p = particleArray.pop();
  } else {
    p = new Particle();
  }
  return p;
};

const createSmoke = (rocket) => {
  let p = getParticle();
  dropParticle(p, rocket);
};

const createFlyingParticles = () => {
  let p = getParticle();
  flyParticle(p);
};

function recycleParticle(p) {
  p.mesh.position.x = 0;
  p.mesh.position.y = 0;
  p.mesh.position.z = 0;
  p.mesh.rotation.x = Math.random() * Math.PI * 2;
  p.mesh.rotation.y = Math.random() * Math.PI * 2;
  p.mesh.rotation.z = Math.random() * Math.PI * 2;
  p.mesh.scale.set(0.1, 0.1, 0.1);
  p.mesh.material.opacity = 0;
  p.color = 0xe3e3e3;
  p.mesh.material.color.set(p.color);
  p.material.needUpdate = true;
  scene.add(p.mesh);
  particleArray.push(p);
}
function flyParticle(p) {
  var targetPosX, targetPosY, targetSpeed, targetColor;
  p.mesh.material.opacity = 1;
  p.mesh.position.x = -1000 + Math.random() * 2000;
  p.mesh.position.y = 100 + Math.random() * 2000;
  p.mesh.position.z = -1000 + Math.random() * 1500;

  var s = Math.random() * 0.2;
  p.mesh.scale.set(s, s, s);

  targetPosX = 0;
  targetPosY = -p.mesh.position.y - 2500;
  targetSpeed = 1 + Math.random() * 2;
  targetColor = 0xe3e3e3;

  TweenMax.to(p.mesh.position, targetSpeed * slowMoFactor, {
    x: targetPosX,
    y: targetPosY,
    ease: Linear.easeNone,
    onComplete: recycleParticle,
    onCompleteParams: [p],
  });
}
