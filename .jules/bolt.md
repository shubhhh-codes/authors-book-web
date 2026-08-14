
## 2023-10-27 - [Three.js render loop optimization]
**Learning:** Frequent instantiations of math objects like `THREE.Vector3` in Three.js render loops (e.g. `animate()` or `updateCameras()`) cause substantial memory pressure and garbage collection overhead, bottlenecking performance.
**Action:** Always declare a class-level variable (e.g., `private tempWorldPosition = new THREE.Vector3();`) and reuse it across frames within high-frequency rendering methods to prevent frame drops due to GC spikes.
