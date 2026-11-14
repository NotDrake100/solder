import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface PartAnimationNode {
  mesh: THREE.Group;
  assembledPos: THREE.Vector3;
  assembledRot: THREE.Euler;
  explodedPos: THREE.Vector3;
  explodedRot: THREE.Euler;
  scatteredPos: THREE.Vector3;
  scatteredRot: THREE.Euler;
}

export interface CaseAnimationNode {
  baseMesh: THREE.Group;
  lidMesh: THREE.Group;
  assembledLidY: number;
  explodedLidY: number;
}

// Ease curves
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Controller for burst reveal animation and interactive assembled/exploded transitions.
 */
export class ViewerAnimator {
  private parts: PartAnimationNode[] = [];
  private caseNode: CaseAnimationNode | null = null;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  // Burst animation state
  private isBursting: boolean = false;
  private burstStartTime: number = 0;
  private readonly burstDuration: number = 3.6; // seconds

  // Camera keyframes for burst reveal
  private readonly cameraClosePos = new THREE.Vector3(75, 55, 95);
  private readonly cameraHeroPos = new THREE.Vector3(140, 115, 160);
  private readonly cameraTarget = new THREE.Vector3(0, 18, 0);

  // Exploded toggle transition state
  private explodeFactor: number = 0; // 0 = assembled, 1 = exploded
  private targetExplodeFactor: number = 0;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
  }

  public setParts(parts: PartAnimationNode[]) {
    this.parts = parts;
  }

  public setCase(caseNode: CaseAnimationNode | null) {
    this.caseNode = caseNode;
  }

  public triggerBurst() {
    this.isBursting = true;
    this.burstStartTime = performance.now() / 1000;
    this.explodeFactor = 0;
    this.targetExplodeFactor = 0;
  }

  public setExploded(exploded: boolean) {
    this.targetExplodeFactor = exploded ? 1 : 0;
  }

  public getIsBursting(): boolean {
    return this.isBursting;
  }

  /**
   * Called every frame in the render loop.
   * @param delta elapsed time in seconds
   */
  public update(delta: number) {
    const now = performance.now() / 1000;

    if (this.isBursting) {
      const elapsed = now - this.burstStartTime;
      const progress = elapsed / this.burstDuration;

      if (progress >= 1.0) {
        // Burst finished -> enter normal interactive mode
        this.isBursting = false;
        this.explodeFactor = this.targetExplodeFactor;
        this.applyExplodedState(this.explodeFactor);
        this.controls.enabled = true;
      } else {
        this.updateBurst(elapsed);
        return;
      }
    }

    // Normal smooth transition between Assembled <-> Exploded
    if (Math.abs(this.explodeFactor - this.targetExplodeFactor) > 0.001) {
      const speed = 4.5; // smooth fast transition
      this.explodeFactor += (this.targetExplodeFactor - this.explodeFactor) * Math.min(1, delta * speed);
      this.applyExplodedState(this.explodeFactor);
    }
  }

  /**
   * Executes the 3-phase burst reveal animation sequence.
   * Phase 1 (0.0s - 1.8s): Scattered -> ease in slow-mo to Exploded
   * Phase 2 (1.8s - 2.5s): Hold exploded with subtle hover float
   * Phase 3 (2.5s - 3.6s): Snap to Assembled while camera dollies back
   */
  private updateBurst(elapsed: number) {
    this.controls.enabled = false;

    if (elapsed < 1.8) {
      // Phase 1: Scattered -> Exploded (Slow-mo ease out)
      const t = Math.min(1, Math.max(0, elapsed / 1.8));
      const k = easeOutCubic(t);

      for (const part of this.parts) {
        part.mesh.position.lerpVectors(part.scatteredPos, part.explodedPos, k);
        part.mesh.rotation.x = THREE.MathUtils.lerp(part.scatteredRot.x, part.explodedRot.x, k);
        part.mesh.rotation.y = THREE.MathUtils.lerp(part.scatteredRot.y, part.explodedRot.y, k);
        part.mesh.rotation.z = THREE.MathUtils.lerp(part.scatteredRot.z, part.explodedRot.z, k);
      }

      if (this.caseNode) {
        const lidY = THREE.MathUtils.lerp(
          this.caseNode.explodedLidY + 40,
          this.caseNode.explodedLidY,
          k
        );
        this.caseNode.lidMesh.position.y = lidY;
      }

      // Camera starts close
      this.camera.position.lerpVectors(this.cameraClosePos, this.cameraClosePos, 1);
      this.controls.target.copy(this.cameraTarget);
      this.camera.lookAt(this.cameraTarget);

    } else if (elapsed < 2.5) {
      // Phase 2: Hold exploded (with subtle breathing float)
      const holdTime = elapsed - 1.8;
      const floatOffset = Math.sin(holdTime * 4) * 1.5;

      for (let i = 0; i < this.parts.length; i++) {
        const part = this.parts[i];
        const stagger = (i * 0.4);
        const yOffset = Math.sin((holdTime + stagger) * 3) * 1.2;

        part.mesh.position.set(
          part.explodedPos.x,
          part.explodedPos.y + yOffset,
          part.explodedPos.z
        );
        part.mesh.rotation.copy(part.explodedRot);
      }

      if (this.caseNode) {
        this.caseNode.lidMesh.position.y = this.caseNode.explodedLidY + floatOffset;
      }

    } else {
      // Phase 3: Snap to Assembled & camera dollies back (2.5s - 3.6s)
      const t = Math.min(1, Math.max(0, (elapsed - 2.5) / 1.1));
      const k = easeInOutCubic(t);

      for (const part of this.parts) {
        part.mesh.position.lerpVectors(part.explodedPos, part.assembledPos, k);
        part.mesh.rotation.x = THREE.MathUtils.lerp(part.explodedRot.x, part.assembledRot.x, k);
        part.mesh.rotation.y = THREE.MathUtils.lerp(part.explodedRot.y, part.assembledRot.y, k);
        part.mesh.rotation.z = THREE.MathUtils.lerp(part.explodedRot.z, part.assembledRot.z, k);
      }

      if (this.caseNode) {
        const lidY = THREE.MathUtils.lerp(
          this.caseNode.explodedLidY,
          this.caseNode.assembledLidY,
          k
        );
        this.caseNode.lidMesh.position.y = lidY;
      }

      // Camera dollies smoothly back from close-up to full hero view
      this.camera.position.lerpVectors(this.cameraClosePos, this.cameraHeroPos, k);
      this.controls.target.copy(this.cameraTarget);
      this.camera.lookAt(this.cameraTarget);
    }
  }

  /**
   * Applies the current explodeFactor (0.0 to 1.0) to parts and case.
   */
  private applyExplodedState(factor: number) {
    const k = easeInOutCubic(factor);

    for (const part of this.parts) {
      part.mesh.position.lerpVectors(part.assembledPos, part.explodedPos, k);
      part.mesh.rotation.x = THREE.MathUtils.lerp(part.assembledRot.x, part.explodedRot.x, k);
      part.mesh.rotation.y = THREE.MathUtils.lerp(part.assembledRot.y, part.explodedRot.y, k);
      part.mesh.rotation.z = THREE.MathUtils.lerp(part.assembledRot.z, part.explodedRot.z, k);
    }

    if (this.caseNode) {
      const lidY = THREE.MathUtils.lerp(
        this.caseNode.assembledLidY,
        this.caseNode.explodedLidY,
        k
      );
      this.caseNode.lidMesh.position.y = lidY;

      // Base drops down slightly when exploded for dramatic separation
      const baseY = THREE.MathUtils.lerp(0, -10, k);
      this.caseNode.baseMesh.position.y = baseY;
    }
  }
}
