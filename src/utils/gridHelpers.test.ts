/**
 * Tests for Grid Helper Functions
 * 
 * Pure math functions for D&D 5e spatial positioning.
 * Based on dnd_spatial_rules.md specifications.
 */
import { describe, it, expect } from 'vitest';
import {
  CREATURE_SIZE_MAP,
  getSnappingOffset,
  calculateGridPosition,
  type CreatureSize,
} from './gridHelpers';

describe('gridHelpers', () => {
  describe('CREATURE_SIZE_MAP', () => {
    it('should have correct grid units for each size', () => {
      expect(CREATURE_SIZE_MAP.Tiny).toBe(1);
      expect(CREATURE_SIZE_MAP.Small).toBe(1);
      expect(CREATURE_SIZE_MAP.Medium).toBe(1);
      expect(CREATURE_SIZE_MAP.Large).toBe(2);
      expect(CREATURE_SIZE_MAP.Huge).toBe(3);
      expect(CREATURE_SIZE_MAP.Gargantuan).toBe(4);
    });

    it('should cover all D&D 5e size categories', () => {
      const sizes: CreatureSize[] = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
      sizes.forEach((size) => {
        expect(CREATURE_SIZE_MAP[size]).toBeDefined();
        expect(CREATURE_SIZE_MAP[size]).toBeGreaterThan(0);
      });
    });
  });

  describe('getSnappingOffset', () => {
    /**
     * Snapping rules:
     * - Odd-width tokens (1x1, 3x3): Position must end in .5 (center of cell)
     * - Even-width tokens (2x2, 4x4): Position must be an integer (grid line)
     * 
     * Offset = units / 2
     */
    
    it('should return 0.5 for Medium creatures (1x1)', () => {
      // 1x1 token centered at cell center: offset = 1/2 = 0.5
      expect(getSnappingOffset('Medium')).toBe(0.5);
    });

    it('should return 0.5 for Small creatures (1x1)', () => {
      expect(getSnappingOffset('Small')).toBe(0.5);
    });

    it('should return 0.5 for Tiny creatures (1x1)', () => {
      expect(getSnappingOffset('Tiny')).toBe(0.5);
    });

    it('should return 1.0 for Large creatures (2x2)', () => {
      // 2x2 token at (0,0) occupies (0,0)-(2,2), center at (1,1)
      // offset = 2/2 = 1.0
      expect(getSnappingOffset('Large')).toBe(1.0);
    });

    it('should return 1.5 for Huge creatures (3x3)', () => {
      // 3x3 token at (0,0) occupies (0,0)-(3,3), center at (1.5,1.5)
      // offset = 3/2 = 1.5
      expect(getSnappingOffset('Huge')).toBe(1.5);
    });

    it('should return 2.0 for Gargantuan creatures (4x4)', () => {
      // 4x4 token at (0,0) occupies (0,0)-(4,4), center at (2,2)
      // offset = 4/2 = 2.0
      expect(getSnappingOffset('Gargantuan')).toBe(2.0);
    });
  });

  describe('calculateGridPosition', () => {
    const STANDARD_HEIGHT = 0.8;
    const EXPECTED_Y = STANDARD_HEIGHT / 2; // 0.4

    describe('Medium creatures (1x1)', () => {
      it('should center at (0.5, 0.4, 0.5) for grid (0, 0)', () => {
        const [x, y, z] = calculateGridPosition(0, 0, 'Medium');
        expect(x).toBe(0.5);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(0.5);
      });

      it('should center at (5.5, 0.4, 3.5) for grid (5, 3)', () => {
        const [x, y, z] = calculateGridPosition(5, 3, 'Medium');
        expect(x).toBe(5.5);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(3.5);
      });
    });

    describe('Large creatures (2x2)', () => {
      it('should center at (1, 0.4, 1) for grid (0, 0)', () => {
        const [x, y, z] = calculateGridPosition(0, 0, 'Large');
        expect(x).toBe(1.0);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(1.0);
      });

      it('should center at (6, 0.4, 4) for grid (5, 3)', () => {
        const [x, y, z] = calculateGridPosition(5, 3, 'Large');
        expect(x).toBe(6.0);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(4.0);
      });
    });

    describe('Huge creatures (3x3)', () => {
      it('should center at (1.5, 0.4, 1.5) for grid (0, 0)', () => {
        const [x, y, z] = calculateGridPosition(0, 0, 'Huge');
        expect(x).toBe(1.5);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(1.5);
      });
    });

    describe('Gargantuan creatures (4x4)', () => {
      it('should center at (2, 0.4, 2) for grid (0, 0)', () => {
        const [x, y, z] = calculateGridPosition(0, 0, 'Gargantuan');
        expect(x).toBe(2.0);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(2.0);
      });
    });

    describe('edge cases', () => {
      it('should handle negative grid coordinates', () => {
        const [x, y, z] = calculateGridPosition(-5, -3, 'Medium');
        expect(x).toBe(-4.5);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(-2.5);
      });

      it('should handle large grid coordinates', () => {
        const [x, y, z] = calculateGridPosition(100, 200, 'Large');
        expect(x).toBe(101.0);
        expect(y).toBeCloseTo(EXPECTED_Y);
        expect(z).toBe(201.0);
      });
    });
  });

  describe('integration: grid snapping consistency', () => {
    it('should maintain consistent offset across all 1x1 sizes', () => {
      const smallOffset = getSnappingOffset('Small');
      const mediumOffset = getSnappingOffset('Medium');
      const tinyOffset = getSnappingOffset('Tiny');

      expect(smallOffset).toBe(mediumOffset);
      expect(mediumOffset).toBe(tinyOffset);
    });

    it('should produce correct token footprints', () => {
      // Verify that the grid position calculations produce correct footprints
      // A Medium creature at grid (2, 2) should occupy cell (2, 2)
      // A Large creature at grid (2, 2) should occupy cells (2,2), (2,3), (3,2), (3,3)
      
      const mediumPos = calculateGridPosition(2, 2, 'Medium');
      const largePos = calculateGridPosition(2, 2, 'Large');

      // Medium center should be in the middle of cell (2, 2)
      expect(mediumPos[0]).toBe(2.5);
      expect(mediumPos[2]).toBe(2.5);

      // Large center should be at the intersection of 4 cells starting at (2, 2)
      expect(largePos[0]).toBe(3.0);
      expect(largePos[2]).toBe(3.0);
    });
  });
});
