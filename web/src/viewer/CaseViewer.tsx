import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewerProps, PartLayoutItem } from './types';
import { createPartMesh } from './partGeometries';
import { createCaseMesh, CaseMeshes } from './caseGeometries';
import { ViewerAnimator, PartAnimationNode } from './animator';
import { MaterialPalette } from './materials';
import { Box, Layers, RotateCcw, Sparkles, Eye, EyeOff } from 'lucide-react';

export const CaseViewer: React.FC<ViewerProps> = ({
  layout = [],
  caseData = { outerMm: [140, 100, 45], wallMm: 2.0, lidType: 'snap' },
  isExploded: controlledExploded,
  onToggleExploded,
  burstKey,
  className = '',
  autoRotate = false,
  showCase: initialShowCase = true,
  showGrid = true,
  onPartSelect,
  selectedPartId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Internal states
  const [internalExploded, setInternalExploded] = useState(false);
  const isExploded = controlledExploded !== undefined ? controlledExploded : internalExploded;
  const [showCase, setShowCase] = useState(initialShowCase);
  const [hoveredPart, setHoveredPart] = useState<PartLayoutItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isBursting, setIsBursting] = useState(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animatorRef = useRef<ViewerAnimator | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const caseMeshesRef = useRef<CaseMeshes | null>(null);
  const partNodesRef = useRef<PartAnimationNode[]>([]);
  const hoverOutlineRef = useRef<THREE.LineSegments | null>(null);
  const selectedOutlineRef = useRef<THREE.LineSegments | null>(null);

  // Toggle exploded handler
  const handleToggleExploded = useCallback(() => {
    if (onToggleExploded) {
      onToggleExploded();
    } else {
      setInternalExploded((prev) => !prev);
    }
  }, [onToggleExploded]);

  // Trigger burst reveal animation
  const handleTriggerBurst = useCallback(() => {
    if (animatorRef.current) {
      animatorRef.current.triggerBurst();
      setIsBursting(true);
    }
  }, []);

  // Reset camera view
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(140, 115, 160);
      controlsRef.current.target.set(0, 18, 0);
      controlsRef.current.update();
    }
  }, []);

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null; // transparent to inherit clean b4 white background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    camera.position.set(140, 115, 160);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below ground
    controls.minDistance = 60;
    controls.maxDistance = 450;
    controls.target.set(0, 18, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // 5. Lighting (Clean studio setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirKeyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirKeyLight.position.set(120, 200, 140);
    dirKeyLight.castShadow = true;
    dirKeyLight.shadow.mapSize.width = 2048;
    dirKeyLight.shadow.mapSize.height = 2048;
    dirKeyLight.shadow.camera.near = 10;
    dirKeyLight.shadow.camera.far = 500;
    const shadowD = 120;
    dirKeyLight.shadow.camera.left = -shadowD;
    dirKeyLight.shadow.camera.right = shadowD;
    dirKeyLight.shadow.camera.top = shadowD;
    dirKeyLight.shadow.camera.bottom = -shadowD;
    dirKeyLight.shadow.bias = -0.0005;
    scene.add(dirKeyLight);

    const dirFillLight = new THREE.DirectionalLight(0xf1f5f9, 0.45);
    dirFillLight.position.set(-140, 80, -100);
    scene.add(dirFillLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.4);
    rimLight.position.set(0, -60, -120);
    scene.add(rimLight);

    // 6. Ground Shadow Receiver & Subtle Grid
    if (showGrid) {
      // Soft shadow plane
      const shadowPlaneGeom = new THREE.PlaneGeometry(350, 350);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.2;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // Clean aesthetic studio grid plane
      const grid = new THREE.GridHelper(260, 26, 0xcbd5e1, 0xf1f5f9);
      grid.position.y = 0;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.55;
      scene.add(grid);
    }

    // 7. Animator instance
    const animator = new ViewerAnimator(camera, controls);
    animatorRef.current = animator;

    // 8. Groups for parts & case
    const partsGroup = new THREE.Group();
    partsGroup.name = 'all_parts';
    scene.add(partsGroup);
    partsGroupRef.current = partsGroup;

    // Hover outline helper
    const hoverWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      MaterialPalette.HighlightHover
    );
    hoverWire.visible = false;
    scene.add(hoverWire);
    hoverOutlineRef.current = hoverWire;

    // Selected outline helper
    const selectWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      MaterialPalette.HighlightSelected
    );
    selectWire.visible = false;
    scene.add(selectWire);
    selectedOutlineRef.current = selectWire;

    // Render loop
    let reqId: number;
    let lastTime = performance.now();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      animator.update(delta);
      setIsBursting(animator.getIsBursting());

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Initial burst reveal on mount
    animator.triggerBurst();
    setIsBursting(true);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [showGrid, autoRotate]);

  // Re-build 3D Meshes whenever layout or caseData changes
  useEffect(() => {
    const scene = sceneRef.current;
    const partsGroup = partsGroupRef.current;
    const animator = animatorRef.current;
    if (!scene || !partsGroup || !animator) return;

    // Clear previous parts
    while (partsGroup.children.length > 0) {
      const child = partsGroup.children[0];
      partsGroup.remove(child);
    }

    // Remove previous case meshes if any
    if (caseMeshesRef.current) {
      scene.remove(caseMeshesRef.current.caseGroup);
      caseMeshesRef.current = null;
    }

    // 1. Create Enclosure Meshes
    if (caseData && caseData.outerMm) {
      const caseMeshes = createCaseMesh(caseData);
      caseMeshes.caseGroup.visible = showCase;
      scene.add(caseMeshes.caseGroup);
      caseMeshesRef.current = caseMeshes;

      animator.setCase({
        baseMesh: caseMeshes.baseGroup,
        lidMesh: caseMeshes.lidGroup,
        assembledLidY: caseMeshes.assembledLidY,
        explodedLidY: caseMeshes.explodedLidY,
      });
    } else {
      animator.setCase(null);
    }

    // 2. Create Part Meshes & Setup Animation Keyframes
    const wall = caseData?.wallMm || 2.0;
    const partNodes: PartAnimationNode[] = [];
    const count = layout.length;

    layout.forEach((item, index) => {
      const mesh = createPartMesh(item);
      partsGroup.add(mesh);

      // Assembled coordinates (Three.js: X=CAD x, Y=wall + CAD z, Z=CAD y)
      const ax = item.x || 0;
      const ay = wall + (item.z || 0);
      const az = item.y || 0;
      const assembledPos = new THREE.Vector3(ax, ay, az);

      const rotY = -((item.rotZ || 0) * Math.PI) / 180;
      const assembledRot = new THREE.Euler(0, rotY, 0);

      // Exploded coordinates: fan outward along expansion vectors
      const distFromCenter = Math.hypot(ax, az);
      let dx = 0;
      let dz = 0;
      if (distFromCenter < 5) {
        const angle = (index / Math.max(1, count)) * Math.PI * 2;
        dx = Math.cos(angle);
        dz = Math.sin(angle);
      } else {
        dx = ax / distFromCenter;
        dz = az / distFromCenter;
      }

      const explodedPos = new THREE.Vector3(
        ax + dx * 45,
        ay + 18 + index * 6,
        az + dz * 40
      );
      const explodedRot = new THREE.Euler(
        (index % 2 === 0 ? 0.08 : -0.08),
        rotY + (index % 2 === 0 ? 0.2 : -0.2),
        (index % 3 === 0 ? 0.05 : -0.05)
      );

      // Scattered coordinates for burst reveal initial state
      const scatterAngle = (index / Math.max(1, count)) * Math.PI * 2 + 0.6;
      const scatterRadius = 90 + index * 12;
      const scatteredPos = new THREE.Vector3(
        Math.cos(scatterAngle) * scatterRadius,
        ay + 50 + (index % 3) * 18,
        Math.sin(scatterAngle) * scatterRadius
      );
      const scatteredRot = new THREE.Euler(
        assembledRot.x + ((index % 3) - 1) * 1.5,
        assembledRot.y + ((index % 4) - 1.5) * 2,
        assembledRot.z + ((index % 2) ? 1.2 : -1.2)
      );

      partNodes.push({
        mesh,
        assembledPos,
        assembledRot,
        explodedPos,
        explodedRot,
        scatteredPos,
        scatteredRot,
      });
    });

    partNodesRef.current = partNodes;
    animator.setParts(partNodes);
    animator.setExploded(isExploded);
  }, [layout, caseData, showCase, isExploded]);

  // Update exploded state when prop changes
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setExploded(isExploded);
    }
  }, [isExploded]);

  // Replay burst reveal when burstKey changes
  useEffect(() => {
    if (burstKey !== undefined && animatorRef.current) {
      animatorRef.current.triggerBurst();
      setIsBursting(true);
    }
  }, [burstKey]);

  // Toggle case visibility
  useEffect(() => {
    if (caseMeshesRef.current) {
      caseMeshesRef.current.caseGroup.visible = showCase;
    }
  }, [showCase]);

  // Highlight selected part
  useEffect(() => {
    const wire = selectedOutlineRef.current;
    if (!wire) return;

    if (!selectedPartId) {
      wire.visible = false;
      return;
    }

    const targetNode = partNodesRef.current.find(
      (n) => n.mesh.userData.part?.id === selectedPartId || n.mesh.userData.part?.libId === selectedPartId
    );

    if (targetNode) {
      const part = targetNode.mesh.userData.part as PartLayoutItem;
      const [w, d, h] = part.dims || [30, 20, 10];
      wire.geometry.dispose();
      wire.geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 1.5, h + 1.5, d + 1.5));
      wire.position.copy(targetNode.mesh.position);
      wire.position.y += h / 2;
      wire.rotation.copy(targetNode.mesh.rotation);
      wire.visible = true;
    } else {
      wire.visible = false;
    }
  }, [selectedPartId]);

  // Mouse Raycasting for hover tooltip & selection
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const partsGroup = partsGroupRef.current;
      if (!container || !camera || !partsGroup) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObjects(partsGroup.children, true);

      if (intersects.length > 0) {
        // Find ancestor group with userData.part
        let current: THREE.Object3D | null = intersects[0].object;
        let foundPart: PartLayoutItem | null = null;
        let foundMesh: THREE.Group | null = null;

        while (current && current !== partsGroup) {
          if (current.userData && current.userData.part) {
            foundPart = current.userData.part as PartLayoutItem;
            foundMesh = current as THREE.Group;
            break;
          }
          current = current.parent;
        }

        if (foundPart && foundMesh) {
          setHoveredPart(foundPart);
          setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top - 15 });

          if (hoverOutlineRef.current) {
            const [w, d, h] = foundPart.dims || [30, 20, 10];
            hoverOutlineRef.current.geometry.dispose();
            hoverOutlineRef.current.geometry = new THREE.EdgesGeometry(
              new THREE.BoxGeometry(w + 1, h + 1, d + 1)
            );
            hoverOutlineRef.current.position.copy(foundMesh.position);
            hoverOutlineRef.current.position.y += h / 2;
            hoverOutlineRef.current.rotation.copy(foundMesh.rotation);
            hoverOutlineRef.current.visible = true;
          }
          return;
        }
      }

      setHoveredPart(null);
      setTooltipPos(null);
      if (hoverOutlineRef.current) {
        hoverOutlineRef.current.visible = false;
      }
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredPart(null);
    setTooltipPos(null);
    if (hoverOutlineRef.current) {
      hoverOutlineRef.current.visible = false;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredPart) {
      if (onPartSelect) {
        onPartSelect(hoveredPart);
      }
    } else {
      if (onPartSelect) {
        onPartSelect(null);
      }
    }
  }, [hoveredPart, onPartSelect]);

  const [w, d, h] = caseData?.outerMm || [140, 100, 45];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[420px] bg-slate-50/60 rounded-xl overflow-hidden select-none border border-slate-200/80 shadow-inner ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left Status Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full shadow-sm text-xs font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Case Fit Verified</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-mono">
            {w}×{d}×{h} mm
          </span>
        </div>
        {caseData?.clearanceMm && (
          <div className="text-[11px] text-slate-500 px-3 font-mono">
            Clearance: {caseData.clearanceMm} mm ({caseData.lidType} lid)
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredPart && tooltipPos && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="absolute z-20 pointer-events-none bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700/60 flex flex-col gap-0.5 transition-transform"
        >
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredPart.color || '#38bdf8' }}
            />
            {hoveredPart.name}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {hoveredPart.libId} • {hoveredPart.dims[0]}×{hoveredPart.dims[1]}×{hoveredPart.dims[2]} mm
          </div>
          <div className="text-[10px] text-slate-500">Click to inspect</div>
        </div>
      )}

      {/* Bottom Floating Control HUD */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full border border-slate-200/90 shadow-md">
          {/* Assembled vs Exploded Toggle */}
          <button
            type="button"
            onClick={handleToggleExploded}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isExploded
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle between assembled and exploded parts layout"
          >
            {isExploded ? <Layers className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
            <span>{isExploded ? 'Exploded' : 'Assembled'}</span>
          </button>

          {/* Burst Reveal Replay Button */}
          <button
            type="button"
            onClick={handleTriggerBurst}
            disabled={isBursting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isBursting
                ? 'bg-amber-100 text-amber-700 cursor-wait'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Replay cinematic burst reveal animation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Burst Reveal</span>
          </button>

          {/* Toggle Enclosure Visibility */}
          <button
            type="button"
            onClick={() => setShowCase((prev) => !prev)}
            className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            title={showCase ? 'Hide enclosure' : 'Show enclosure'}
          >
            {showCase ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Reset Camera View */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            title="Reset camera view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseViewer;
