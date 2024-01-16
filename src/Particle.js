// export class Particle {
//   constructor() {
//     this.isFlying = false;

//     var scale = 20 + Math.random() * 20;
//     var nLines = 3 + Math.floor(Math.random() * 5);
//     var nRows = 3 + Math.floor(Math.random() * 5);
//     this.geometry = new THREE.SphereGeometry(scale, nLines, nRows);

//     this.material = new THREE.MeshLambertMaterial({
//       color: 0xe3e3e3,
//       shading: THREE.FlatShading,
//       transparent: true,
//     });

//     this.mesh = new THREE.Mesh(this.geometry, this.material);
//     recycleParticle(this);
//   }
// }

// function recycleParticle(p) {
//   p.mesh.position.x = 0;
//   p.mesh.position.y = 0;
//   p.mesh.position.z = 0;
//   p.mesh.rotation.x = Math.random() * Math.PI * 2;
//   p.mesh.rotation.y = Math.random() * Math.PI * 2;
//   p.mesh.rotation.z = Math.random() * Math.PI * 2;
//   p.mesh.scale.set(0.1, 0.1, 0.1);
//   p.mesh.material.opacity = 0;
//   p.color = 0xe3e3e3;
//   p.mesh.material.color.set(p.color);
//   p.material.needUpdate = true;
//   scene.add(p.mesh);
//   particleArray.push(p);
// }
// function flyParticle(p) {
//   var targetPosX, targetPosY, targetSpeed, targetColor;
//   p.mesh.material.opacity = 1;
//   p.mesh.position.x = -1000 + Math.random() * 2000;
//   p.mesh.position.y = 100 + Math.random() * 2000;
//   p.mesh.position.z = -1000 + Math.random() * 1500;

//   var s = Math.random() * 0.2;
//   p.mesh.scale.set(s, s, s);

//   targetPosX = 0;
//   targetPosY = -p.mesh.position.y - 2500;
//   targetSpeed = 1 + Math.random() * 2;
//   targetColor = 0xe3e3e3;

//   TweenMax.to(p.mesh.position, targetSpeed * slowMoFactor, {
//     x: targetPosX,
//     y: targetPosY,
//     ease: Linear.easeNone,
//     onComplete: recycleParticle,
//     onCompleteParams: [p],
//   });
// }
