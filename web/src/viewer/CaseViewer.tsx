import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import * as THREE from 'three';
import {
  CaseViewerProps,
  CaseViewerRef,
  MaterialTheme,
} from './types';
import { createMaterialLibrary, MaterialLibrary } from './materials';
import { createPartMesh } from './models/partMeshes';
import { buildEnclosureAssembly, EnclosureAssembly } from './enclosure';
import { buildWiresAssembly, WireAssembly } from './wires';
import { BurstAnimationController } from './animation';
import { EnclosureCameraController } from './controls';

export const CaseViewer = forwardRef<CaseViewerRef, CaseViewerProps>(
  (
    {
      layout = [],
      caseSpec,
      wiring = [],
      isExploded: externalIsExploded,
      onExplodeToggle,
      materialTheme: externalTheme = 'pla',
      enableBurstReveal = true,
      burstTrigger,
      onBurstRevealComplete,
      className = '',
      style,
      showLid: initialShowLid = true,
      showWireframe: initialShowWireframe = false,
      showWires: initialShowWires = true,
      selectedPartId = null,
      onSelectPart,
      autoRotate = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Local UI state
    const [internalExploded, setInternalExploded] = useState(externalIsExploded || false);
    const [currentTheme, setCurrentTheme] = useState<MaterialTheme>(externalTheme);
    const [showLid, setShowLid] = useState(initialShowLid);
    const [showWireframe, setShowWireframe] = useState(initialShowWireframe);
    const [showWires, setShowWires] = useState(initialShowWires);
    const [hoveredPartName, setHoveredPartName] = useState<string | null>(null);
    const [isBurstActive, setIsBurstActive] = useState(false);

    // Keep internal exploded state synced with prop if provided
    const isExploded = externalIsExploded !== undefined ? externalIsExploded : internalExploded;

    // References to Three.js instances
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const cameraControllerRef = useRef<EnclosureCameraController | null>(null);
    const animControllerRef = useRef<BurstAnimationController | null>(null);
    const enclosureAssemblyRef = useRef<EnclosureAssembly | null>(null);
    const wiresAssemblyRef = useRef<WireAssembly | null>(null);
    const partsGroupRef = useRef<THREE.Group | null>(null);
    const materialsRef = useRef<MaterialLibrary | null>(null);
    const animFrameIdRef = useRef<number | null>(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    // Sync external exploded prop to controller
    useEffect(() => {
      if (animControllerRef.current) {
        animControllerRef.current.setExploded(isExploded);
      }
    }, [isExploded]);

    // Handle toggle exploded
    const handleToggleExploded = useCallback(() => {
      const nextState = !isExploded;
      setInternalExploded(nextState);
      if (onExplodeToggle) {
        onExplodeToggle(nextState);
      }
      if (animControllerRef.current) {
        animControllerRef.current.setExploded(nextState);
      }
    }, [isExploded, onExplodeToggle]);

    // Replay burst reveal animation
    const triggerBurst = useCallback(() => {
      if (animControllerRef.current) {
        setIsBurstActive(true);
        animControllerRef.current.startBurstReveal(() => {
          setIsBurstActive(false);
          if (onBurstRevealComplete) {
            onBurstRevealComplete();
          }
        });
      }
    }, [onBurstRevealComplete]);

    // Expose ref methods
    useImperativeHandle(
      ref,
      () => ({
        resetCamera: () => {
          cameraControllerRef.current?.reset();
        },
        triggerBurstReveal: () => {
          triggerBurst();
        },
        setExploded: (exploded: boolean) => {
          setInternalExploded(exploded);
          animControllerRef.current?.setExploded(exploded);
          onExplodeToggle?.(exploded);
        },
        toggleLid: () => {
          setShowLid((prev) => !prev);
        },
        focusPart: (libId: string) => {
          if (!partsGroupRef.current) return;
          partsGroupRef.current.children.forEach((child) => {
            if (child.userData?.libId === libId) {
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              cameraControllerRef.current?.focusOn(worldPos, 90);
            }
          });
        },
      }),
      [triggerBurst, onExplodeToggle]
    );

    // Watch burstTrigger prop
    useEffect(() => {
      if (burstTrigger !== undefined && burstTrigger > 0) {
        triggerBurst();
      }
    }, [burstTrigger, triggerBurst]);

    // Initialize Three.js scene
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 450;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = null; // transparent to inherit dark container background (#262626) seamlessly
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(42, width / height, 1, 2000);
      camera.position.set(130, -140, 110);
      camera.up.set(0, 0, 1); // Z is UP (CAD standard)
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
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      // 4. Crafted Maker Bench Studio Lighting (Warm desk lamp, copper rim highlights, soft contact shadows)
      const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.75);
      scene.add(ambientLight);

      // Key light with soft PCF shadow
      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
      keyLight.position.set(90, -100, 160);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 500;
      const d = 110;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.radius = 3.2; // soft shadow penumbra
      scene.add(keyLight);

      // Soft neutral fill bounce
      const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
      fillLight.position.set(-100, 80, 90);
      scene.add(fillLight);

      // Signature warm copper / solder-orange rim light catching translucent acrylic edges
      const rimLight = new THREE.DirectionalLight(0xf97316, 0.5);
      rimLight.position.set(-30, 140, 60);
      scene.add(rimLight);

      // Subtle warm secondary rim light for component depth
      const warmRimLight = new THREE.DirectionalLight(0xfef08a, 0.25);
      warmRimLight.position.set(40, 120, -40);
      scene.add(warmRimLight);

      // 5. Studio Ground Grid Floor (Warm copper/espresso hairline) & Contact Shadow
      const gridHelper = new THREE.GridHelper(320, 32, 0x5c4d3c, 0x262422);
      gridHelper.rotation.x = Math.PI / 2;
      gridHelper.position.set(0, 0, -2);
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.38;
      scene.add(gridHelper);

      // Soft shadow-catching contact ground disc
      const shadowPlaneGeom = new THREE.PlaneGeometry(360, 360);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.38 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
      shadowPlane.position.set(0, 0, -1.95);
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // 6. Camera Controller
      const cameraController = new EnclosureCameraController({
        domElement: canvas,
        camera,
        target: new THREE.Vector3(0, 0, 15),
        autoRotate,
        autoRotateSpeed: 0.6,
      });
      cameraControllerRef.current = cameraController;

      // 7. Animation Controller
      const animController = new BurstAnimationController(camera, cameraController.target);
      animControllerRef.current = animController;

      // 8. Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      // 9. Animation render loop
      let lastTime = performance.now();
      const animate = () => {
        animFrameIdRef.current = requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Update controllers
        cameraController.update(delta);
        animController.update(delta);

        // Update wires in exploded mode
        if (wiresAssemblyRef.current) {
          wiresAssemblyRef.current.updatePositions(animController.getExplodedProgress());
        }

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
        resizeObserver.disconnect();
        cameraController.dispose();
        renderer.dispose();
      };
    }, [autoRotate]);

    // Build or update 3D scene objects when layout, caseSpec, or theme changes
    useEffect(() => {
      const scene = sceneRef.current;
      const animController = animControllerRef.current;
      const cameraController = cameraControllerRef.current;
      if (!scene || !animController) return;

      // Clear previous models
      if (partsGroupRef.current) {
        scene.remove(partsGroupRef.current);
      }
      if (enclosureAssemblyRef.current) {
        scene.remove(enclosureAssemblyRef.current.group);
      }
      if (wiresAssemblyRef.current) {
        scene.remove(wiresAssemblyRef.current.group);
      }
      animController.clear();

      // Create material library
      const materials = createMaterialLibrary(
        currentTheme,
        caseSpec?.color || '#2563eb',
        showWireframe
      );
      materialsRef.current = materials;

      // 1. Build Enclosure Assembly
      const enclosure = buildEnclosureAssembly(caseSpec, layout, materials);
      enclosure.lidMesh.visible = showLid;
      scene.add(enclosure.group);
      enclosureAssemblyRef.current = enclosure;
      animController.registerEnclosure(enclosure);

      // 2. Build Parts
      const partsGroup = new THREE.Group();
      partsGroup.name = 'electronic_parts';

      for (const item of layout || []) {
        if (!item) continue;
        const mesh = createPartMesh(
          item,
          materials,
          enclosure.outerDimensions,
          caseSpec?.wallMm || 2.0
        );

        // Check if selected
        if (selectedPartId && (item.id === selectedPartId || item.libId === selectedPartId)) {
          // Highlight halo
          const haloGeom = new THREE.BoxGeometry(
            (item.dimensions?.width || 30) + 4,
            (item.dimensions?.length || 30) + 4,
            (item.dimensions?.height || 10) + 4
          );
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
          });
          const halo = new THREE.Mesh(haloGeom, haloMat);
          halo.position.set(0, 0, (item.dimensions?.height || 10) / 2);
          mesh.add(halo);
        }

        partsGroup.add(mesh);
        animController.registerPart(mesh);
      }

      scene.add(partsGroup);
      partsGroupRef.current = partsGroup;

      // 3. Build Wires
      if (showWires) {
        const wiresAssembly = buildWiresAssembly(wiring || [], layout || [], materials, partsGroup);
        scene.add(wiresAssembly.group);
        wiresAssemblyRef.current = wiresAssembly;
      }

      // Fit camera to enclosure assembly
      if (enclosure?.group && cameraController) {
        const box = new THREE.Box3().setFromObject(enclosure.group);
        cameraController.fitToBox(box);
      }

      // Trigger burst reveal if enabled
      if (enableBurstReveal) {
        triggerBurst();
      }
    }, [
      layout,
      caseSpec,
      wiring,
      currentTheme,
      showWireframe,
      showLid,
      showWires,
      selectedPartId,
      enableBurstReveal,
      triggerBurst,
    ]);

    // Handle mouse move for part hovering / tooltip
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !cameraRef.current || !partsGroupRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        partsGroupRef.current.children,
        true
      );

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && parent.parent !== partsGroupRef.current && parent !== partsGroupRef.current) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.name) {
          setHoveredPartName(parent.userData.name);
          return;
        }
      }
      setHoveredPartName(null);
    };

    // Handle click for part selection
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !cameraRef.current || !partsGroupRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        partsGroupRef.current.children,
        true
      );

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && parent.parent !== partsGroupRef.current && parent !== partsGroupRef.current) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.libId) {
          if (onSelectPart) {
            onSelectPart(parent.userData.libId);
          }
          return;
        }
      }
      if (onSelectPart) {
        onSelectPart(null);
      }
    };

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[420px] select-none overflow-hidden rounded-2xl bg-[#161514]/70 border border-[#2e2a25] shadow-sm ${className}`}
        style={style}
      >
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
          className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
        />

        {/* Floating Part Inspector Tooltip */}
        {hoveredPartName && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-[#1c1a17]/95 text-neutral-200 backdrop-blur text-xs font-mono shadow-md border border-[#38332e] pointer-events-none flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>{hoveredPartName}</span>
          </div>
        )}

        {/* Burst Reveal Playing Indicator Badge */}
        {isBurstActive && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white backdrop-blur text-xs font-medium shadow-lg border border-orange-500/30 flex items-center space-x-2 animate-pulse pointer-events-none">
            <svg
              className="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Burst Reveal...</span>
          </div>
        )}

        {/* Aesthetic Floating Control Pill Toolbar (Bottom) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#1c1a17]/95 border border-[#38332e] shadow-2xl backdrop-blur-md">
          {/* Exploded / Assembled Toggle */}
          <button
            type="button"
            onClick={handleToggleExploded}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isExploded
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-neutral-300 hover:bg-[#2a2622] hover:text-white'
            }`}
            title="Toggle Exploded CAD View"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>{isExploded ? 'Assembled' : 'Exploded'}</span>
          </button>

          {/* Burst Reveal Signature Animation Replay */}
          <button
            type="button"
            onClick={triggerBurst}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:bg-[#2a2622] hover:text-white transition-colors"
            title="Replay Signature Burst Reveal"
          >
            <svg
              className="w-3.5 h-3.5 text-orange-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
            </svg>
            <span>Burst</span>
          </button>

          <div className="w-[1px] h-4 bg-[#38332e] mx-0.5" />

          {/* Material Theme Switcher */}
          <div className="flex items-center space-x-0.5">
            <button
              type="button"
              onClick={() => setCurrentTheme('pla')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                currentTheme === 'pla'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#2a2622]'
              }`}
              title="3D Print Matte PLA"
            >
              PLA
            </button>
            <button
              type="button"
              onClick={() => setCurrentTheme('acrylic')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                currentTheme === 'acrylic'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#2a2622]'
              }`}
              title="Frosted Translucent Acrylic"
            >
              Acrylic
            </button>
            <button
              type="button"
              onClick={() => setCurrentTheme('dark')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                currentTheme === 'dark'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#2a2622]'
              }`}
              title="Stealth Matte Dark"
            >
              Dark
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#38332e] mx-0.5" />

          {/* Lid Toggle */}
          <button
            type="button"
            onClick={() => setShowLid((v) => !v)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showLid ? 'text-orange-400 bg-[#2a2622]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#2a2622]'
            }`}
            title={showLid ? 'Hide Lid' : 'Show Lid'}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
          </button>

          {/* Wireframe Toggle */}
          <button
            type="button"
            onClick={() => setShowWireframe((v) => !v)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showWireframe ? 'text-orange-400 bg-[#2a2622]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#2a2622]'
            }`}
            title="Toggle Wireframe CAD mesh"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          {/* Wires Toggle */}
          <button
            type="button"
            onClick={() => setShowWires((v) => !v)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showWires ? 'text-emerald-400 bg-[#2a2622]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#2a2622]'
            }`}
            title="Toggle 3D Jumper Wires"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </button>

          {/* Reset Camera View Button */}
          <button
            type="button"
            onClick={() => cameraControllerRef.current?.reset()}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-orange-200 hover:bg-[#2a2622] transition-colors"
            title="Reset Camera Isometric View"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>

        {/* Bottom Left Quick Specs Overlay */}
        {caseSpec?.outerMm && (
          <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#1c1a17]/85 backdrop-blur border border-[#38332e] text-[11px] font-mono text-neutral-300 pointer-events-none">
            <span className="text-orange-400/80">ENCLOSURE:</span>
            <span>
              {caseSpec.outerMm[0]} × {caseSpec.outerMm[1]} × {caseSpec.outerMm[2]} mm
            </span>
            <span className="text-neutral-600">|</span>
            <span>wall {caseSpec.wallMm || 2.0}mm</span>
          </div>
        )}
      </div>
    );
  }
);

CaseViewer.displayName = 'CaseViewer';

export default CaseViewer;
