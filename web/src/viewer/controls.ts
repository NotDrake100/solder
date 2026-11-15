import * as THREE from 'three';

export interface CameraControllerOptions {
  domElement: HTMLElement;
  camera: THREE.PerspectiveCamera;
  target?: THREE.Vector3;
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export class EnclosureCameraController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;

  private isPointerDown = false;
  private pointerType: 'rotate' | 'pan' | null = null;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical = new THREE.Spherical(180, Math.PI / 3, Math.PI / 4);
  private targetSpherical = new THREE.Spherical(180, Math.PI / 3, Math.PI / 4);
  private currentTarget = new THREE.Vector3(0, 0, 15);
  private desiredTarget = new THREE.Vector3(0, 0, 15);

  public get target(): THREE.Vector3 {
    return this.currentTarget;
  }
  public set target(val: THREE.Vector3) {
    if (val) {
      this.currentTarget.copy(val);
      this.desiredTarget.copy(val);
    }
  }

  public enableDamping = true;
  public dampingFactor = 0.08;
  public minDistance = 40;
  public maxDistance = 500;
  public autoRotate = false;
  public autoRotateSpeed = 0.8;

  private defaultSpherical = new THREE.Spherical(180, Math.PI / 3, Math.PI / 4);
  private defaultTarget = new THREE.Vector3(0, 0, 15);

  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnContextMenu: (e: Event) => void;

  constructor(options: CameraControllerOptions) {
    this.domElement = options.domElement;
    this.camera = options.camera;
    if (options.target) {
      this.currentTarget.copy(options.target);
      this.desiredTarget.copy(options.target);
      this.defaultTarget.copy(options.target);
    }
    if (options.autoRotate !== undefined) this.autoRotate = options.autoRotate;

    // Initialize spherical from current camera position
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.currentTarget);
    this.spherical.setFromVector3(offset);
    this.targetSpherical.copy(this.spherical);
    this.defaultSpherical.copy(this.spherical);

    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = (e) => e.preventDefault();

    this.attach();
  }

  public attach(): void {
    this.domElement.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    this.domElement.addEventListener('wheel', this.boundOnWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.boundOnContextMenu);
  }

  public dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    this.domElement.removeEventListener('wheel', this.boundOnWheel);
    this.domElement.removeEventListener('contextmenu', this.boundOnContextMenu);
  }

  public reset(): void {
    this.targetSpherical.copy(this.defaultSpherical);
    this.desiredTarget.copy(this.defaultTarget);
  }

  public focusOn(point: THREE.Vector3, distance = 120): void {
    this.desiredTarget.copy(point);
    this.targetSpherical.radius = distance;
  }

  public fitToBox(box: THREE.Box3): void {
    if (!box || typeof box.isEmpty !== 'function' || box.isEmpty()) return;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    this.desiredTarget.copy(center);
    this.defaultTarget.copy(center);

    const maxDim = Math.max(Number(size.x) || 70, Number(size.y) || 110, Number(size.z) || 25);
    const fov = (this.camera.fov * Math.PI) / 180;
    const aspect = Math.max(0.4, this.camera.aspect || 1.0);

    // Compute distance required to fit both vertically and horizontally with margin
    const distV = (maxDim / 2) / Math.tan(fov / 2);
    const distH = (maxDim / 2) / (Math.tan(fov / 2) * aspect);
    // 1.55x margin ensures safe border on 390px wide phone and desktop alike
    const distance = Math.max(distV, distH) * 1.55;

    this.targetSpherical.radius = Math.max(distance, 110);
    this.targetSpherical.phi = Math.PI / 3.4; // 3/4 elevation
    this.targetSpherical.theta = Math.PI / 4.2; // 3/4 angle
    this.defaultSpherical.copy(this.targetSpherical);
  }

  private onPointerDown(e: PointerEvent): void {
    this.isPointerDown = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };

    // Right button or Shift+Left = Pan, otherwise Rotate
    if (e.button === 2 || e.shiftKey) {
      this.pointerType = 'pan';
    } else {
      this.pointerType = 'rotate';
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isPointerDown) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };

    if (this.pointerType === 'rotate') {
      const rotateSpeed = 0.006;
      this.targetSpherical.theta -= deltaX * rotateSpeed;
      this.targetSpherical.phi -= deltaY * rotateSpeed;
      // Clamp phi so camera cannot flip upside down
      this.targetSpherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, this.targetSpherical.phi));
    } else if (this.pointerType === 'pan') {
      const panSpeed = 0.25 * (this.spherical.radius / 150);
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();

      this.desiredTarget.addScaledVector(right, -deltaX * panSpeed);
      this.desiredTarget.addScaledVector(up, deltaY * panSpeed);
    }
  }

  private onPointerUp(): void {
    this.isPointerDown = false;
    this.pointerType = null;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    this.targetSpherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.targetSpherical.radius * zoomFactor)
    );
  }

  public update(delta: number): void {
    if (this.autoRotate && !this.isPointerDown) {
      this.targetSpherical.theta += this.autoRotateSpeed * delta * 0.5;
    }

    if (this.enableDamping) {
      this.spherical.theta = THREE.MathUtils.lerp(
        this.spherical.theta,
        this.targetSpherical.theta,
        this.dampingFactor
      );
      this.spherical.phi = THREE.MathUtils.lerp(
        this.spherical.phi,
        this.targetSpherical.phi,
        this.dampingFactor
      );
      this.spherical.radius = THREE.MathUtils.lerp(
        this.spherical.radius,
        this.targetSpherical.radius,
        this.dampingFactor
      );
      this.currentTarget.lerp(this.desiredTarget, this.dampingFactor);
    } else {
      this.spherical.copy(this.targetSpherical);
      this.currentTarget.copy(this.desiredTarget);
    }

    // Apply to camera
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.currentTarget).add(offset);
    this.camera.lookAt(this.currentTarget);
  }
}
