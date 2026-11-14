export { CaseViewer, default } from './CaseViewer';
export type {
  CaseSpec,
  PartLayoutItem,
  WireConnection,
  CaseViewerProps,
  CaseViewerRef,
  MaterialTheme,
} from './types';
export { createMaterialLibrary } from './materials';
export { createPartMesh } from './models/partMeshes';
export { buildEnclosureAssembly, computeOptimalEnclosureSize, parseSTL } from './enclosure';
export { buildWiresAssembly } from './wires';
export { BurstAnimationController } from './animation';
export { EnclosureCameraController } from './controls';
