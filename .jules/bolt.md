
## 2024-08-16 - Prevent GC Pressure in Three.js Animation Loops
**Learning:** Instantiating math objects like `THREE.Vector3` inside animation loops creates significant garbage collection pressure, leading to frame drops in the 3D rendering engine.
**Action:** Always instantiate reusable math objects at the class scope and mutate them rather than creating new ones per frame.
