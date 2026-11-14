import * as THREE from 'three';
import { EnclosureAssembly } from './enclosure';

// Easing functions for buttery smooth motion
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number, s = 1.70158): number {
  const c1 = s;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export interface PartAnimationTarget {
  mesh: THREE.Group;
  assembledPos: THREE.Vector3;
  assembledRot: THREE.Euler;
  explodedPos: THREE.Vector3;
  explodedRot: THREE.Euler;
  scatterPos: THREE.Vector3;
  scatterRot: THREE.Euler;
}

export class BurstAnimationController {
  private parts: PartAnimationTarget[] = [];
  private enclosure: EnclosureAssembly | null = null;
  private camera: THREE.PerspectiveCamera;
  private cameraTarget: THREE.Vector3;
  private cameraBaseOffset: THREE.Vector3 = new THREE.Vector3();
  private isRunningBurst = false;
  private burstStartTime = 0;
  private burstDuration = 4.0; // total seconds (smooth cinematic timing)
  private explodedProgress = 0; // 0 = assembled, 1 = exploded
  private targetExplodedProgress = 0;
  private onCompleteCallback?: () => void;

  constructor(camera: THREE.PerspectiveCamera, cameraTarget: THREE.Vector3) {
    this.camera = camera;
    this.cameraTarget = cameraTarget;
  }

  public registerPart(mesh: THREE.Group): void {
    const assembledPos = mesh.position.clone();
    const assembledRot = mesh.rotation.clone();

    // Calculate exploded position (dispersed radially in XY and elevated in Z)
    const explodedPos = assembledPos.clone();
    explodedPos.x *= 1.35;
    explodedPos.y *= 1.35;
    explodedPos.z += 26.0;

    const explodedRot = assembledRot.clone();

    // Calculate initial scattered burst position (far out in space)
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 80;
    const scatterPos = new THREE.Vector3(
      assembledPos.x + Math.cos(angle) * distance,
      assembledPos.y + Math.sin(angle) * distance,
      assembledPos.z + 60 + Math.random() * 50
    );

    const scatterRot = new THREE.Euler(
      assembledRot.x + (Math.random() - 0.5) * Math.PI * 2,
      assembledRot.y + (Math.random() - 0.5) * Math.PI * 2,
      assembledRot.z + (Math.random() - 0.5) * Math.PI * 2
    );

    this.parts.push({
      mesh,
      assembledPos,
      assembledRot,
      explodedPos,
      explodedRot,
      scatterPos,
      scatterRot,
    });
  }

  public registerEnclosure(enclosure: EnclosureAssembly): void {
    this.enclosure = enclosure;
  }

  public clear(): void {
    this.parts = [];
    this.enclosure = null;
  }

  public startBurstReveal(onComplete?: () => void): void {
    this.isRunningBurst = true;
    this.burstStartTime = performance.now() / 1000;
    (this as any).burstElapsed = 0;
    this.onCompleteCallback = onComplete;
    this.targetExplodedProgress = 0; // ends assembled

    // Capture initial camera position relative to target for organic orbit
    this.cameraBaseOffset.subVectors(this.camera.position, this.cameraTarget);
  }

  public setExploded(exploded: boolean): void {
    this.targetExplodedProgress = exploded ? 1.0 : 0.0;
  }

  public getExplodedProgress(): number {
    return this.explodedProgress;
  }

  public isBursting(): boolean {
    return this.isRunningBurst;
  }

  /**
   * Main per-frame update loop
   */
  public update(delta: number): void {
    const now = performance.now() / 1000;

    if (this.isRunningBurst) {
      (this as any).burstElapsed = ((this as any).burstElapsed || 0) + delta;
      const elapsed = Math.max(now - this.burstStartTime, (this as any).burstElapsed);
      const t = Math.min(1.0, elapsed / this.burstDuration);

      // Signature 3-stage choreography:
      // Stage 1: 0.0 - 0.45 (0.0s - 1.8s) -> Staggered easing part flight from scatter into exploded formation
      // Stage 2: 0.45 - 0.65 (1.8s - 2.6s) -> Gentle breathing hover & subtle cinematic camera orbit
      // Stage 3: 0.65 - 1.0  (2.6s - 4.0s) -> Smooth settling back into assembled enclosure

      if (t < 0.45) {
        // Stage 1: Staggered part flight
        const stageProgress = easeOutCubic(t / 0.45);
        const count = Math.max(1, this.parts.length);

        for (let i = 0; i < this.parts.length; i++) {
          const item = this.parts[i];
          const stagger = (i / count) * 0.16;
          const partT = Math.min(1.0, Math.max(0, (t - stagger) / (0.45 - 0.16)));
          const partProgress = easeOutCubic(partT);

          item.mesh.position.lerpVectors(item.scatterPos, item.explodedPos, partProgress);
          item.mesh.rotation.x = THREE.MathUtils.lerp(item.scatterRot.x, item.explodedRot.x, partProgress);
          item.mesh.rotation.y = THREE.MathUtils.lerp(item.scatterRot.y, item.explodedRot.y, partProgress);
          item.mesh.rotation.z = THREE.MathUtils.lerp(item.scatterRot.z, item.explodedRot.z, partProgress);
        }

        if (this.enclosure) {
          const lid = this.enclosure.lidMesh;
          lid.position.lerpVectors(
            this.enclosure.assembledLidPos.clone().add(new THREE.Vector3(0, 0, 110)),
            this.enclosure.explodedLidPos,
            stageProgress
          );
          lid.rotation.x = THREE.MathUtils.lerp(0.35, this.enclosure.explodedLidRot.x, stageProgress);
        }

        this.explodedProgress = 1.0;
      } else if (t < 0.65) {
        // Stage 2: Gentle hover & subtle cinematic camera orbit
        const hoverTime = (t - 0.45) / 0.2;
        const count = Math.max(1, this.parts.length);

        for (let i = 0; i < this.parts.length; i++) {
          const item = this.parts[i];
          const staggerBob = Math.sin(hoverTime * Math.PI * 2 + (i / count) * Math.PI) * 1.4;
          const subtleTilt = Math.cos(hoverTime * Math.PI * 2 + i) * 0.03;

          item.mesh.position.copy(item.explodedPos);
          item.mesh.position.z += staggerBob;
          item.mesh.rotation.copy(item.explodedRot);
          item.mesh.rotation.z += subtleTilt;
        }

        if (this.enclosure) {
          const lidBob = Math.sin(hoverTime * Math.PI * 2) * 1.6;
          this.enclosure.lidMesh.position.copy(this.enclosure.explodedLidPos);
          this.enclosure.lidMesh.position.z += lidBob;
          this.enclosure.lidMesh.rotation.copy(this.enclosure.explodedLidRot);
        }

        // Subtle organic camera orbit around the target
        if (this.cameraBaseOffset.lengthSq() > 1) {
          const orbitAngle = Math.sin(hoverTime * Math.PI) * 0.08;
          const rotatedOffset = this.cameraBaseOffset
            .clone()
            .applyAxisAngle(new THREE.Vector3(0, 0, 1), orbitAngle);
          this.camera.position.copy(this.cameraTarget).add(rotatedOffset);
          this.camera.lookAt(this.cameraTarget);
        }

        this.explodedProgress = 1.0;
      } else {
        // Stage 3: Smooth settling back into assembled enclosure
        const settleT = (t - 0.65) / 0.35;
        const snapProgress = easeInOutCubic(settleT);

        for (const item of this.parts) {
          item.mesh.position.lerpVectors(item.explodedPos, item.assembledPos, snapProgress);
          item.mesh.rotation.x = THREE.MathUtils.lerp(item.explodedRot.x, item.assembledRot.x, snapProgress);
          item.mesh.rotation.y = THREE.MathUtils.lerp(item.explodedRot.y, item.assembledRot.y, snapProgress);
          item.mesh.rotation.z = THREE.MathUtils.lerp(item.explodedRot.z, item.assembledRot.z, snapProgress);
        }

        if (this.enclosure) {
          this.enclosure.lidMesh.position.lerpVectors(
            this.enclosure.explodedLidPos,
            this.enclosure.assembledLidPos,
            snapProgress
          );
          this.enclosure.lidMesh.rotation.x = THREE.MathUtils.lerp(
            this.enclosure.explodedLidRot.x,
            this.enclosure.assembledLidRot.x,
            snapProgress
          );
        }

        // Camera smoothly glides back to original position
        if (this.cameraBaseOffset.lengthSq() > 1) {
          const targetCamPos = this.cameraTarget.clone().add(this.cameraBaseOffset);
          this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * 8.0));
          this.camera.lookAt(this.cameraTarget);
        }

        this.explodedProgress = 1.0 - snapProgress;
      }

      if (t >= 1.0) {
        this.isRunningBurst = false;
        this.explodedProgress = 0;
        this.targetExplodedProgress = 0;

        // Ensure camera perfectly restored
        if (this.cameraBaseOffset.lengthSq() > 1) {
          this.camera.position.copy(this.cameraTarget).add(this.cameraBaseOffset);
          this.camera.lookAt(this.cameraTarget);
        }

        if (this.onCompleteCallback) {
          this.onCompleteCallback();
          this.onCompleteCallback = undefined;
        }
      }
    } else {
      // Normal continuous exploded / assembled toggle animation
      const lerpSpeed = Math.min(1.0, delta * 5.0);
      this.explodedProgress = THREE.MathUtils.lerp(
        this.explodedProgress,
        this.targetExplodedProgress,
        lerpSpeed
      );

      const p = easeInOutCubic(this.explodedProgress);

      for (const item of this.parts) {
        item.mesh.position.lerpVectors(item.assembledPos, item.explodedPos, p);
        item.mesh.rotation.x = THREE.MathUtils.lerp(item.assembledRot.x, item.explodedRot.x, p);
        item.mesh.rotation.y = THREE.MathUtils.lerp(item.assembledRot.y, item.explodedRot.y, p);
        item.mesh.rotation.z = THREE.MathUtils.lerp(item.assembledRot.z, item.explodedRot.z, p);
      }

      if (this.enclosure) {
        this.enclosure.lidMesh.position.lerpVectors(
          this.enclosure.assembledLidPos,
          this.enclosure.explodedLidPos,
          p
        );
        this.enclosure.lidMesh.rotation.x = THREE.MathUtils.lerp(
          this.enclosure.assembledLidRot.x,
          this.enclosure.explodedLidRot.x,
          p
        );
      }
    }
  }
}
