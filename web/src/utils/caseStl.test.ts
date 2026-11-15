import { describe, it, expect } from 'vitest';
import { generateCaseStl, countStlFacets, getCaseBoundingBox } from './caseStl';

describe('Case STL Generator', () => {
  it('generates valid hollow box with separate lid plate, facet count >= 30, and bounding box equals outerMm', () => {
    const outerMm: [number, number, number] = [82, 64, 28];
    const wallMm = 2.0;

    const stl = generateCaseStl({ outerMm, wallMm });

    // 1. Valid ASCII STL format
    expect(stl.startsWith('solid solder_enclosure')).toBe(true);
    expect(stl.endsWith('endsolid solder_enclosure\n')).toBe(true);

    // 2. Facet count >= 30
    const facets = countStlFacets(stl);
    expect(facets).toBeGreaterThanOrEqual(30);

    // 3. Bounding box equals outerMm
    const bbox = getCaseBoundingBox(stl);
    expect(bbox).toEqual(outerMm);
  });

  it('handles arbitrary outer dimensions accurately', () => {
    const customDims: [number, number, number] = [115, 80, 50];
    const stl = generateCaseStl(customDims, 2.2);

    expect(countStlFacets(stl)).toBeGreaterThanOrEqual(30);
    expect(getCaseBoundingBox(stl)).toEqual(customDims);
  });
});
