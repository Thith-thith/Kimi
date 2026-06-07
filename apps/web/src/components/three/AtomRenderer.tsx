"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Element } from "@kimi/data";

interface AtomRendererProps {
  element: Element;
  animationPaused?: boolean;
  animationSpeed?: number; // default 0.6
  showLayers?: boolean;
  hoveredSubshell?: string | null;
  selectedSubshell?: string | null;
  subshells?: string[];
  onHoverSubshell?: (sub: string | null) => void;
  onSelectSubshell?: (sub: string | null) => void;
}

function getSubshellColor(subshell: string): number {
  const name = subshell.toLowerCase();
  if (name.includes("s")) return 0xef4444; // Crimson / Red
  if (name.includes("p")) return 0x3b82f6; // Blue
  if (name.includes("d")) return 0xf59e0b; // Gold / Yellow
  if (name.includes("f")) return 0x8b5cf6; // Purple
  return 0xaaaaaa; // Grey fallback
}

export default function AtomRenderer({
  element,
  animationPaused = false,
  animationSpeed = 0.6,
  showLayers = false,
  hoveredSubshell = null,
  selectedSubshell = null,
  subshells = [],
  onHoverSubshell,
  onSelectSubshell,
}: AtomRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Refs to dynamic values to control animation toggles/speeds in-place without rebuilding the WebGL context
  const isPausedRef = useRef(animationPaused);
  const speedRef = useRef(animationSpeed);

  // Refs to THREE meshes to perform instant 60fps hover material updates in a secondary effect
  const orbitMeshesRef = useRef<THREE.Mesh[]>([]);
  const electronMeshesRef = useRef<THREE.Mesh[]>([]);

  // Callback refs — always up-to-date without rebuilding the WebGL context
  const onHoverSubshellRef = useRef(onHoverSubshell);
  const onSelectSubshellRef = useRef(onSelectSubshell);
  const selectedSubshellRef = useRef(selectedSubshell);

  useEffect(() => {
    isPausedRef.current = animationPaused;
  }, [animationPaused]);

  useEffect(() => {
    speedRef.current = animationSpeed;
  }, [animationSpeed]);

  useEffect(() => {
    onHoverSubshellRef.current = onHoverSubshell;
  }, [onHoverSubshell]);

  useEffect(() => {
    onSelectSubshellRef.current = onSelectSubshell;
  }, [onSelectSubshell]);

  useEffect(() => {
    selectedSubshellRef.current = selectedSubshell;
  }, [selectedSubshell]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Allocate scene variables
    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 16;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "default",
      });
    } catch (e) {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
      });
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient and Directional lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const atomGroup = new THREE.Group();
    atomGroup.rotation.x = 0.55; // Tilted X axis to view 3D orbital planes
    atomGroup.rotation.y = 0.4;  // Tilted Y axis for more dynamic 3D depth
    scene.add(atomGroup);

    // References for nucleus particles and electrons
    const nucleusGroup = new THREE.Group();
    atomGroup.add(nucleusGroup);

    const wobbleGroup = new THREE.Group();
    atomGroup.add(wobbleGroup);

    // Vector pools
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();
    const _v3 = new THREE.Vector3();

    // Material Caches
    const sharedMaterials = {
      protonMat: new THREE.MeshStandardMaterial({
        color: 0xff2222,
        roughness: 0.25,
        metalness: 0.4,
        emissive: 0xff0000,
        emissiveIntensity: 1.2,
      }),
      neutronMat: new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.15,
        metalness: 0.5,
        emissive: 0x222222,
        emissiveIntensity: 0.5,
      }),
      electronMat: new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1.0,
      }),
    };

    const particleRadius = 0.55;
    const protonGeo = new THREE.SphereGeometry(particleRadius, 14, 14);
    const neutronGeo = new THREE.SphereGeometry(particleRadius, 14, 14);

    const atomicNumber = element.id;
    // Neutron count approximation
    const neutronCount = atomicNumber === 1 ? 0 : Math.round(element.id * 1.2);

    // Build and shuffle nucleus particles list
    interface Particle {
      type: "proton" | "neutron";
      pos: THREE.Vector3;
    }
    const particles: Particle[] = [];
    for (let i = 0; i < atomicNumber; i++) particles.push({ type: "proton", pos: new THREE.Vector3() });
    for (let i = 0; i < neutronCount; i++) particles.push({ type: "neutron", pos: new THREE.Vector3() });

    // Fibonacci sphere distribution for nucleon positions
    const phi = Math.PI * (3 - Math.sqrt(5));
    const n = particles.length;
    const clusterScale = Math.pow(n, 1 / 3) * particleRadius * 0.8;

    for (let i = 0; i < n; i++) {
      const k = i + 0.5;
      const y = 1 - (k / n) * 2;
      const theta = phi * k;
      const rr = Math.sqrt(1 - y * y);
      particles[i].pos.set(
        Math.cos(theta) * rr * clusterScale + (Math.random() - 0.5) * 0.1,
        y * clusterScale + (Math.random() - 0.5) * 0.1,
        Math.sin(theta) * rr * clusterScale + (Math.random() - 0.5) * 0.1
      );
    }

    // Settle particles using mini relaxation loop (RREF culling)
    const repDist = particleRadius * 1.5;
    if (n === 1) {
      particles[0].pos.set(0, 0, 0);
    } else if (n === 2) {
      particles[0].pos.set(-0.35, 0, 0);
      particles[1].pos.set(0.35, 0, 0);
    } else if (n > 2) {
      for (let iter = 0; iter < 3; iter++) {
        for (let a = 0; a < n; a++) {
          const p1 = particles[a];
          _v1.set(0, 0, 0);
          _v3.copy(p1.pos).multiplyScalar(-0.08); // pull to center
          _v1.add(_v3);

          for (let b = 0; b < n; b++) {
            if (a === b) continue;
            _v2.subVectors(p1.pos, particles[b].pos);
            const d = _v2.length();
            if (d < repDist && d > 0.01) {
              _v2.normalize().multiplyScalar((repDist - d) * 0.22);
              _v1.add(_v2);
            }
          }
          p1.pos.add(_v1);
        }
      }
    }

    // Interior Culling: skip rendering particles buried in core
    const CULL_THRESHOLD = 22;
    let visibleParticles = particles;
    if (n > CULL_THRESHOLD) {
      let maxDist = 0;
      for (let i = 0; i < n; i++) {
        const d = particles[i].pos.length();
        if (d > maxDist) maxDist = d;
      }
      const cutoff = maxDist - particleRadius * 2.5;
      visibleParticles = particles.filter((p) => p.pos.length() >= cutoff);
    }

    // Create nucleon meshes
    visibleParticles.forEach((p) => {
      const mesh = new THREE.Mesh(
        p.type === "proton" ? protonGeo : neutronGeo,
        p.type === "proton" ? sharedMaterials.protonMat : sharedMaterials.neutronMat
      );
      mesh.position.copy(p.pos);
      nucleusGroup.add(mesh);
    });

    if (atomicNumber > 1) {
      nucleusGroup.add(new THREE.PointLight(0xff0000, 1.5, 10));
    }

    // Build electron shells (Bohr representation or Subshell segmented toruses)
    const hasSubshellsProp = Array.isArray(subshells) && subshells.length > 0;
    
    const orbitMeshes: THREE.Mesh[] = [];
    const electronMeshes: THREE.Mesh[] = [];
    const electrons: THREE.Mesh[] = [];
    const elGeo = new THREE.SphereGeometry(0.28, 12, 12);

    let activeShellCount = 0;

    if (showLayers && hasSubshellsProp) {
      // 1. Orbital Subshell Segmented Toruses Mode!
      // Group the subshells by principal quantum shell number
      const normalNumMap: Record<string, number> = {
        "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9, "⁰": 0,
        "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "0": 0
      };

      interface ParsedSubshell {
        subshell: string;
        shellNum: number;
        block: "s" | "p" | "d" | "f";
        electronsCount: number;
      }

      const parsedSubshells: ParsedSubshell[] = [];
      const shellSubshellsMap: Record<number, ParsedSubshell[]> = {};

      subshells.forEach((sub) => {
        const cleanSub = sub.replace(/\[[^\]]+\]/g, "").trim();
        if (!cleanSub) return;

        const shellNum = parseInt(cleanSub[0]) || 1;
        const blockChar = (cleanSub[1] || "s") as "s" | "p" | "d" | "f";
        const match = cleanSub.match(/([a-zA-Z]+)([⁰¹²³⁴⁵⁶⁷⁸⁹⁰\d]+)/);
        let count = 0;
        if (match) {
          const sup = match[2];
          for (const char of sup) {
            count = count * 10 + (normalNumMap[char] ?? parseInt(char) ?? 0);
          }
        } else {
          count = parseInt(cleanSub.slice(2)) || 0;
        }

        const ps: ParsedSubshell = {
          subshell: cleanSub,
          shellNum,
          block: blockChar,
          electronsCount: count
        };
        
        parsedSubshells.push(ps);
        if (!shellSubshellsMap[shellNum]) {
          shellSubshellsMap[shellNum] = [];
        }
        shellSubshellsMap[shellNum].push(ps);
      });

      const activeShells = Object.keys(shellSubshellsMap).map(Number).sort((a, b) => a - b);
      activeShellCount = activeShells.length;

      activeShells.forEach((shellNum, sIndex) => {
        const subs = shellSubshellsMap[shellNum];
        const shellElectrons = subs.reduce((sum, sub) => sum + sub.electronsCount, 0);
        if (shellElectrons <= 0) return;

        const radius = 4.2 + sIndex * 2.2;

        // Render thin underlaid orbital track rail in layers mode
        const trackGeo = new THREE.TorusGeometry(radius, 0.02, 8, 64);
        const trackMat = new THREE.MeshBasicMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.15,
        });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = Math.PI / 2;
        wobbleGroup.add(track);

        let accumulatedAngle = 0;
        const M = subs.length;
        const gapSize = M > 1 ? 0.18 : 0; // split gaps between segments

        subs.forEach((sub) => {
          const thetaLength = M > 1
            ? (2 * Math.PI - M * gapSize) * (sub.electronsCount / shellElectrons)
            : 2 * Math.PI;
          const thetaStart = accumulatedAngle + (M > 1 ? gapSize / 2 : 0);
          accumulatedAngle += (M > 1 ? thetaLength + gapSize : thetaLength);

          // Create segmented torus geometry
          const tubeRadius = 0.22;
          const orbitGeo = new THREE.TorusGeometry(radius, tubeRadius, 12, 48, thetaLength);
          orbitGeo.rotateZ(thetaStart);

          const color = getSubshellColor(sub.subshell);

          const isCurrentHovered = hoveredSubshell === sub.subshell;
          const isCurrentSelected = selectedSubshell === sub.subshell;
          const isAnyActive = (hoveredSubshell !== null && hoveredSubshell !== undefined) ||
                              (selectedSubshell !== null && selectedSubshell !== undefined);

          let opacity = 0.45;
          let emissiveIntensity = 0.8;

          if (isAnyActive) {
            const isSelf = isCurrentHovered || isCurrentSelected;
            opacity = isSelf ? 0.85 : 0.12;
            emissiveIntensity = isSelf ? 2.0 : 0.2;
          }

          const orbitMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
          });

          const orbit = new THREE.Mesh(orbitGeo, orbitMat);
          orbit.rotation.x = Math.PI / 2;

          // Place 3D rounded spherical caps on the open ends of the segmented torus
          if (M > 1) {
            const capGeo = new THREE.SphereGeometry(tubeRadius, 12, 12);
            
            const cap1 = new THREE.Mesh(capGeo, orbitMat);
            cap1.position.set(radius * Math.cos(thetaStart), radius * Math.sin(thetaStart), 0);
            orbit.add(cap1);

            const cap2 = new THREE.Mesh(capGeo, orbitMat);
            cap2.position.set(radius * Math.cos(thetaStart + thetaLength), radius * Math.sin(thetaStart + thetaLength), 0);
            orbit.add(cap2);
          }
          
          const subshellSpeed = 0.025 - sIndex * 0.002;
          orbit.userData = {
            subshell: sub.subshell,
            shellIndex: sIndex,
            speed: subshellSpeed,
            color: color
          };

          wobbleGroup.add(orbit);
          orbitMeshes.push(orbit);

          // Create electrons distributed inside this subshell segment
          for (let e = 0; e < sub.electronsCount; e++) {
            const elMat = sharedMaterials.electronMat.clone();
            if (isAnyActive) {
              const isSelf = isCurrentHovered || isCurrentSelected;
              elMat.opacity = isSelf ? 1.0 : 0.15;
              elMat.emissiveIntensity = isSelf ? 0.8 : 0.1;
            }

            const elMesh = new THREE.Mesh(elGeo, elMat);
            const angleOffset = thetaStart + (e + 0.5) * (thetaLength / sub.electronsCount);

            elMesh.userData = {
              radius: radius,
              angle: angleOffset,
              speed: subshellSpeed,
              shell: sIndex,
              subshell: sub.subshell
            };

            elMesh.position.x = radius * Math.cos(angleOffset);
            elMesh.position.z = radius * Math.sin(angleOffset);

            wobbleGroup.add(elMesh);
            electrons.push(elMesh);
            electronMeshes.push(elMesh);
          }
        });
      });
    } else {
      // 2. Standard Planetary Bohr Render Path
      const configToUse = [2, 8, 8, 18, 18, 32, 32];
      let electronsLeft = atomicNumber;
      activeShellCount = 0;

      for (let s = 0; s < configToUse.length; s++) {
        if (electronsLeft <= 0) break;
        const count = Math.min(electronsLeft, configToUse[s]);
        electronsLeft -= count;
        activeShellCount++;

        if (count <= 0) continue;

        const radius = 4.2 + s * 2.2;

        const orbitGeo = new THREE.TorusGeometry(radius, 0.025, 8, 64);
        const orbitMat = new THREE.MeshBasicMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.25,
        });

        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        orbit.userData = { speed: 0.025 - s * 0.002 };
        wobbleGroup.add(orbit);
        orbitMeshes.push(orbit);

        for (let e = 0; e < count; e++) {
          const elMat = sharedMaterials.electronMat.clone();
          const elMesh = new THREE.Mesh(elGeo, elMat);
          const angleOffset = (e / count) * Math.PI * 2;

          elMesh.userData = {
            radius: radius,
            angle: angleOffset,
            speed: 0.025 - s * 0.002,
            shell: s,
          };

          elMesh.position.x = radius * Math.cos(angleOffset);
          elMesh.position.z = radius * Math.sin(angleOffset);

          wobbleGroup.add(elMesh);
          electrons.push(elMesh);
          electronMeshes.push(elMesh);
        }
      }
    }

    orbitMeshesRef.current = orbitMeshes;
    electronMeshesRef.current = electronMeshes;

    // Camera view bounding scale calculation
    const maxRadius = 4.2 + Math.max(0, activeShellCount - 1) * 2.2;
    const vFOV = 45 * (Math.PI / 180);
    const targetCameraZ = (maxRadius * 1.3) / Math.tan(vFOV / 2);
    camera.position.z = Math.max(12, targetCameraZ);

    // ── Raycaster setup (for orbit-ring hover/click in layers mode) ──────────
    const raycaster = new THREE.Raycaster();
    // Widen the raycaster threshold so tubes are easier to hit
    raycaster.params.Mesh = {};
    const mouse = new THREE.Vector2();
    let lastHoveredSub: string | null = null;

    function getCanvasRelativeMouse(e: MouseEvent): { nx: number; ny: number } {
      const rect = canvasEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return { nx, ny };
    }

    function raycastOrbit(nx: number, ny: number): string | null {
      if (!showLayers || orbitMeshesRef.current.length === 0) return null;
      mouse.set(nx, ny);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(orbitMeshesRef.current, true);
      if (hits.length === 0) return null;
      // Walk up the hit object's parent chain to find the mesh with userData.subshell
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj) {
        if (obj.userData && obj.userData.subshell) return obj.userData.subshell as string;
        obj = obj.parent;
      }
      return null;
    }

    // Click/Drag Rotate Interactivity
    let isDragging = false;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
      if (containerRef.current) containerRef.current.style.cursor = "grabbing";
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      // Raycast hover (only in layers mode)
      if (showLayers) {
        const { nx, ny } = getCanvasRelativeMouse(e);
        const sub = raycastOrbit(nx, ny);
        if (sub !== lastHoveredSub) {
          lastHoveredSub = sub;
          onHoverSubshellRef.current?.(sub);
          if (containerRef.current) {
            containerRef.current.style.cursor = sub ? "pointer" : isDragging ? "grabbing" : "grab";
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      atomGroup.rotation.y += deltaX * 0.005;
      atomGroup.rotation.x += deltaY * 0.005;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = isDragging;
      isDragging = false;
      if (containerRef.current) containerRef.current.style.cursor = lastHoveredSub ? "pointer" : "grab";

      // Treat as click only if drag distance is tiny
      const dx = e.clientX - mouseDownX;
      const dy = e.clientY - mouseDownY;
      const dragDist = Math.sqrt(dx * dx + dy * dy);

      if (showLayers && wasDragging && dragDist < 6) {
        const { nx, ny } = getCanvasRelativeMouse(e);
        const sub = raycastOrbit(nx, ny);
        if (sub) {
          // Toggle: clicking same subshell deselects
          const current = selectedSubshellRef.current;
          onSelectSubshellRef.current?.(current === sub ? null : sub);
        } else {
          // Click on empty space → deselect
          onSelectSubshellRef.current?.(null);
        }
      }
    };

    const handleMouseLeave = () => {
      if (lastHoveredSub !== null) {
        lastHoveredSub = null;
        onHoverSubshellRef.current?.(null);
      }
    };

    // Touch Rotate Interactivity
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;

      atomGroup.rotation.y += deltaX * 0.005;
      atomGroup.rotation.x += deltaY * 0.005;

      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      if (e.cancelable) e.preventDefault();
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    // Scroll-to-Zoom Interactivity
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.02;
      camera.position.z += e.deltaY * zoomSpeed;
      const minZ = 6;
      const maxZ = Math.max(40, targetCameraZ * 2.5);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener("mousedown", handleMouseDown);
    canvasEl.addEventListener("mousemove", handleCanvasMouseMove);
    canvasEl.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvasEl.addEventListener("wheel", handleWheel, { passive: false });
    canvasEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvasEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasEl.addEventListener("touchend", handleTouchEnd, { passive: true });

    if (containerRef.current) containerRef.current.style.cursor = "grab";

    // Animation Tick Loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!isPausedRef.current) {
        time += 0.016 * speedRef.current;

        // Slow rotations of nucleus and shell grids
        wobbleGroup.rotation.y += 0.003 * speedRef.current;
        nucleusGroup.rotation.y -= 0.004 * speedRef.current;

        // Add subtle dynamic wobble to the orbital plane
        wobbleGroup.rotation.z = Math.sin(time * 0.5) * 0.15;
        wobbleGroup.rotation.x = Math.cos(time * 0.3) * 0.08;

        // Move electrons along orbits
        electrons.forEach((el) => {
          const ud = el.userData;
          ud.angle += ud.speed * speedRef.current;
          el.position.x = ud.radius * Math.cos(ud.angle);
          el.position.z = ud.radius * Math.sin(ud.angle);
        });

        // Move orbit meshes in sync with electrons in layers mode
        if (showLayers) {
          orbitMeshes.forEach((mesh) => {
            if (mesh.userData && typeof mesh.userData.speed === "number") {
              mesh.rotation.z += mesh.userData.speed * speedRef.current;
            }
          });
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer to handle size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Dispose WebGL context and event listeners on clean unmount
    return () => {
      resizeObserver.disconnect();
      canvasEl.removeEventListener("mousedown", handleMouseDown);
      canvasEl.removeEventListener("mousemove", handleCanvasMouseMove);
      canvasEl.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvasEl.removeEventListener("wheel", handleWheel);
      canvasEl.removeEventListener("touchstart", handleTouchStart);
      canvasEl.removeEventListener("touchmove", handleTouchMove);
      canvasEl.removeEventListener("touchend", handleTouchEnd);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      protonGeo.dispose();
      neutronGeo.dispose();
      elGeo.dispose();
      sharedMaterials.protonMat.dispose();
      sharedMaterials.neutronMat.dispose();
      sharedMaterials.electronMat.dispose();

      // Dispose orbit meshes geometries/materials
      orbitMeshes.forEach((ob) => {
        if (ob.geometry) ob.geometry.dispose();
        if (ob.material) {
          if (Array.isArray(ob.material)) {
            ob.material.forEach((m) => m.dispose());
          } else {
            ob.material.dispose();
          }
        }
      });

      // Dispose electron cloned materials
      electronMeshes.forEach((el) => {
        if (el.material) {
          if (Array.isArray(el.material)) {
            el.material.forEach((m) => m.dispose());
          } else {
            el.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      orbitMeshesRef.current = [];
      electronMeshesRef.current = [];
    };
  }, [element, showLayers, subshells?.join(",")]); // Only rebuild context when element, layers, or subshells config changes

  // Secondary effect: update materials instantly at 60fps on subshell hover/select without recreating context
  useEffect(() => {
    const orbitMeshes = orbitMeshesRef.current;
    const electronMeshes = electronMeshesRef.current;
    if (!orbitMeshes || orbitMeshes.length === 0) return;

    const isAnyActive = (hoveredSubshell !== null && hoveredSubshell !== undefined) ||
                        (selectedSubshell !== null && selectedSubshell !== undefined);

    // 1. Update orbit tube opacity and emission brightness
    orbitMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      if (!mat) return;

      const subName = mesh.userData.subshell;
      const isSelf = hoveredSubshell === subName || selectedSubshell === subName;

      if (showLayers) {
        const stdMat = mat as THREE.MeshStandardMaterial;
        let opacity = 0.45;
        let emissiveIntensity = 0.8;

        if (isAnyActive) {
          opacity = isSelf ? 0.85 : 0.12;
          emissiveIntensity = isSelf ? 2.0 : 0.2;
        }

        stdMat.opacity = opacity;
        if (stdMat.emissiveIntensity !== undefined) {
          stdMat.emissiveIntensity = emissiveIntensity;
        }
      } else {
        const basicMat = mat as THREE.MeshBasicMaterial;
        basicMat.opacity = 0.25;
      }
      mat.needsUpdate = true;
    });

    // 2. Update electron mesh opacities
    if (electronMeshes && electronMeshes.length > 0) {
      electronMeshes.forEach((elMesh) => {
        const mat = elMesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        const subName = elMesh.userData.subshell;
        const isSelf = hoveredSubshell === subName || selectedSubshell === subName;

        if (isAnyActive) {
          mat.opacity = isSelf ? 1.0 : 0.15;
          if (mat.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = isSelf ? 0.8 : 0.1;
          }
        } else {
          mat.opacity = 1.0;
          if (mat.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = 0.8;
          }
        }
        mat.needsUpdate = true;
      });
    }
  }, [hoveredSubshell, selectedSubshell, showLayers]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[180px] md:min-h-[300px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
