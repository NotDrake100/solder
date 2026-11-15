import { describe, it, expect } from 'vitest';
import {
  toCanonicalPartName,
  boxesOverlap,
  mergeDetections,
  trackMarkers,
  getVisibleMarkers,
  preventLabelOverlap,
  dedupePartsList,
  RawDetection,
  TrackedMarker,
} from './cameraTracking';

describe('cameraTracking utilities', () => {
  describe('toCanonicalPartName', () => {
    it('normalizes Arduino Uno variations to "Arduino Uno"', () => {
      expect(toCanonicalPartName('Arduino Uno R3')).toBe('Arduino Uno');
      expect(toCanonicalPartName('Arduino Uno')).toBe('Arduino Uno');
      expect(toCanonicalPartName('Uno R3')).toBe('Arduino Uno');
      expect(toCanonicalPartName('ATmega328P Board')).toBe('Arduino Uno');
    });

    it('normalizes ESP32 variations to "ESP32"', () => {
      expect(toCanonicalPartName('ESP32 DevKit')).toBe('ESP32');
      expect(toCanonicalPartName('ESP-32')).toBe('ESP32');
      expect(toCanonicalPartName('ESP 32 WROOM')).toBe('ESP32');
    });

    it('normalizes sensors, relays, servos, and displays', () => {
      expect(toCanonicalPartName('5V Single Channel Relay')).toBe('5V Relay Module');
      expect(toCanonicalPartName('DHT11 Temp Sensor')).toBe('DHT11 Sensor');
      expect(toCanonicalPartName('dht-11')).toBe('DHT11 Sensor');
      expect(toCanonicalPartName('Soil Moisture Sensor Hygrometer')).toBe('Soil Moisture Sensor');
      expect(toCanonicalPartName('HC-SR04 Ultrasonic Distance Sensor')).toBe('HC-SR04 Ultrasonic');
      expect(toCanonicalPartName('SG90 9g Micro Servo')).toBe('SG90 Servo');
      expect(toCanonicalPartName('0.96 inch SSD1306 OLED Display')).toBe('OLED Display');
      expect(toCanonicalPartName('Light Emitting Diode (LED)')).toBe('LED');
      expect(toCanonicalPartName('Raspberry Pi Zero 2 W')).toBe('Raspberry Pi Zero 2 W');
    });
  });

  describe('boxesOverlap', () => {
    it('returns true when boxes intersect', () => {
      const boxA: [number, number, number, number] = [200, 200, 500, 500];
      const boxB: [number, number, number, number] = [300, 300, 600, 600];
      expect(boxesOverlap(boxA, boxB)).toBe(true);
    });

    it('returns false when boxes are strictly separated', () => {
      const boxA: [number, number, number, number] = [100, 100, 200, 200];
      const boxB: [number, number, number, number] = [300, 300, 400, 400];
      expect(boxesOverlap(boxA, boxB)).toBe(false);
    });
  });

  describe('mergeDetections (iPhone test scenario)', () => {
    it('merges 6 scattered Arduino Uno detections into 1 single marker at the merged center', () => {
      // Simulating real iPhone test where 6 markers were scattered across one Arduino Uno
      const rawDetections: RawDetection[] = [
        { label: 'Arduino Uno R3', box_2d: [200, 180, 550, 450], confidence: 0.95 },
        { label: 'Arduino Uno', box_2d: [220, 200, 350, 320], confidence: 0.92 },
        { label: 'Arduino Uno', box_2d: [300, 250, 500, 440], confidence: 0.88 },
        { label: 'Arduino Uno R3', box_2d: [210, 190, 480, 400], confidence: 0.90 },
        { label: 'Uno R3', box_2d: [350, 210, 520, 380], confidence: 0.85 },
        { label: 'Arduino Uno', box_2d: [240, 220, 460, 420], confidence: 0.91 },
      ];

      const merged = mergeDetections(rawDetections);

      expect(merged.length).toBe(1);
      expect(merged[0].canonicalName).toBe('Arduino Uno');
      expect(merged[0].label).toBe('Arduino Uno');
      expect(merged[0].confidence).toBe(0.95);
      // Merged box is union of all overlapping boxes
      expect(merged[0].box_2d[0]).toBe(200);
      expect(merged[0].box_2d[1]).toBe(180);
      expect(merged[0].box_2d[2]).toBe(550);
      expect(merged[0].box_2d[3]).toBe(450);
      // Center is at (ymin+ymax)/20, (xmin+xmax)/20
      expect(merged[0].x).toBeCloseTo((180 + 450) / 20, 1);
      expect(merged[0].y).toBeCloseTo((200 + 550) / 20, 1);
    });

    it('keeps two separate objects of the same type distinct when separated by > 25% frame width', () => {
      // 2 LEDs far apart on desk
      const rawDetections: RawDetection[] = [
        { label: 'LED', box_2d: [200, 100, 250, 150], confidence: 0.9 }, // center x = 12.5%
        { label: 'LED', box_2d: [200, 700, 250, 750], confidence: 0.9 }, // center x = 72.5% (dist = 60% > 25%)
      ];

      const merged = mergeDetections(rawDetections);
      expect(merged.length).toBe(2);
      expect(merged[0].canonicalName).toBe('LED');
      expect(merged[1].canonicalName).toBe('LED');
    });

    it('never shows two markers with the same canonical label closer than ~25%', () => {
      // Two detections with same label 15% apart (centers at x=30% and x=45%)
      const rawDetections: RawDetection[] = [
        { label: '5V Relay Module', box_2d: [300, 250, 400, 350], confidence: 0.85 },
        { label: '5V Relay', box_2d: [300, 400, 400, 500], confidence: 0.9 },
      ];

      const merged = mergeDetections(rawDetections, 25);
      expect(merged.length).toBe(1);
      expect(merged[0].canonicalName).toBe('5V Relay Module');
    });

    it('does not merge different components even if close together', () => {
      const rawDetections: RawDetection[] = [
        { label: 'Arduino Uno', box_2d: [200, 200, 500, 500], confidence: 0.95 },
        { label: 'DHT11 Temp Sensor', box_2d: [220, 220, 300, 300], confidence: 0.88 },
      ];

      const merged = mergeDetections(rawDetections);
      expect(merged.length).toBe(2);
      expect(merged.map((m) => m.canonicalName).sort()).toEqual(['Arduino Uno', 'DHT11 Sensor']);
    });
  });

  describe('trackMarkers & 2-consecutive detection gating', () => {
    it('requires 2 consecutive detections before a marker becomes visible', () => {
      // Frame 1: First detection of Arduino Uno
      const frame1Merged = mergeDetections([
        { label: 'Arduino Uno', box_2d: [200, 200, 500, 500], confidence: 0.95 },
      ]);
      const trackedFrame1 = trackMarkers([], frame1Merged);

      expect(trackedFrame1.length).toBe(1);
      expect(trackedFrame1[0].appearCount).toBe(1);
      expect(trackedFrame1[0].confirmed).toBe(false);

      // Visibility filter must hide it after only 1 appearance
      const visibleFrame1 = getVisibleMarkers(trackedFrame1);
      expect(visibleFrame1.length).toBe(0);

      // Frame 2: Second consecutive detection (same place, slightly shifted)
      const frame2Merged = mergeDetections([
        { label: 'Arduino Uno', box_2d: [205, 205, 505, 505], confidence: 0.96 },
      ]);
      const trackedFrame2 = trackMarkers(trackedFrame1, frame2Merged);

      expect(trackedFrame2.length).toBe(1);
      expect(trackedFrame2[0].appearCount).toBe(2);
      expect(trackedFrame2[0].confirmed).toBe(true);

      // Now it must be visible!
      const visibleFrame2 = getVisibleMarkers(trackedFrame2);
      expect(visibleFrame2.length).toBe(1);
      expect(visibleFrame2[0].canonicalName).toBe('Arduino Uno');
    });

    it('smooths position using exponential ease so markers glide instead of jumping', () => {
      const initialMarker: TrackedMarker = {
        id: 'test-1',
        canonicalName: 'Arduino Uno',
        label: 'Arduino Uno',
        confidence: 0.9,
        x: 30,
        y: 30,
        targetX: 30,
        targetY: 30,
        appearCount: 2,
        missCount: 0,
        confirmed: true,
      };

      // Target moves to x=40, y=40
      const newDetections = [
        {
          canonicalName: 'Arduino Uno',
          label: 'Arduino Uno',
          box_2d: [350, 350, 450, 450] as [number, number, number, number],
          x: 40,
          y: 40,
          confidence: 0.95,
          count: 1,
        },
      ];

      const tracked = trackMarkers([initialMarker], newDetections, 0.5);
      expect(tracked.length).toBe(1);
      // Smoothed position: 30 + 0.5 * (40 - 30) = 35 (glides smoothly instead of jumping to 40)
      expect(tracked[0].x).toBe(35);
      expect(tracked[0].y).toBe(35);
      expect(tracked[0].targetX).toBe(40);
    });

    it('fades out after missed frames and prunes completely after 2 missed frames', () => {
      const activeMarker: TrackedMarker = {
        id: 'test-fade',
        canonicalName: 'Arduino Uno',
        label: 'Arduino Uno',
        confidence: 0.95,
        x: 35,
        y: 35,
        targetX: 35,
        targetY: 35,
        appearCount: 3,
        missCount: 0,
        confirmed: true,
      };

      // Miss 1: No detections in frame
      const frame1 = trackMarkers([activeMarker], []);
      expect(frame1.length).toBe(1);
      expect(frame1[0].missCount).toBe(1);
      // Visible with fade out
      expect(getVisibleMarkers(frame1).length).toBe(1);

      // Miss 2: Still no detections
      const frame2 = trackMarkers(frame1, []);
      expect(frame2.length).toBe(1);
      expect(frame2[0].missCount).toBe(2);
      expect(getVisibleMarkers(frame2).length).toBe(1);

      // Miss 3: Exceeded 2 missed frames -> pruned completely
      const frame3 = trackMarkers(frame2, []);
      expect(frame3.length).toBe(0);
      expect(getVisibleMarkers(frame3).length).toBe(0);
    });
  });

  describe('preventLabelOverlap', () => {
    it('nudges label vertically when two chips collide on the same side', () => {
      const markers: TrackedMarker[] = [
        {
          id: 'm1',
          canonicalName: 'Arduino Uno',
          label: 'Arduino Uno',
          confidence: 0.9,
          x: 40, // right-side chip
          y: 30,
          targetX: 40,
          targetY: 30,
          appearCount: 2,
          missCount: 0,
          confirmed: true,
        },
        {
          id: 'm2',
          canonicalName: '5V Relay Module',
          label: '5V Relay Module',
          confidence: 0.9,
          x: 45, // right-side chip, close vertically (32% vs 30%)
          y: 32,
          targetX: 45,
          targetY: 32,
          appearCount: 2,
          missCount: 0,
          confirmed: true,
        },
      ];

      const adjusted = preventLabelOverlap(markers);
      expect(adjusted[0].nudgeY || 0).toBe(0);
      expect(adjusted[1].nudgeY || 0).toBeGreaterThanOrEqual(28);
    });

    it('does not nudge when labels are far apart vertically', () => {
      const markers: TrackedMarker[] = [
        {
          id: 'm1',
          canonicalName: 'Arduino Uno',
          label: 'Arduino Uno',
          confidence: 0.9,
          x: 40,
          y: 20,
          targetX: 40,
          targetY: 20,
          appearCount: 2,
          missCount: 0,
          confirmed: true,
        },
        {
          id: 'm2',
          canonicalName: 'DHT11 Sensor',
          label: 'DHT11 Sensor',
          confidence: 0.9,
          x: 40,
          y: 60, // 40% vertical separation
          targetX: 40,
          targetY: 60,
          appearCount: 2,
          missCount: 0,
          confirmed: true,
        },
      ];

      const adjusted = preventLabelOverlap(markers);
      expect(adjusted[0].nudgeY || 0).toBe(0);
      expect(adjusted[1].nudgeY || 0).toBe(0);
    });
  });

  describe('dedupePartsList (Parts found row)', () => {
    it('deduplicates "Arduino Uno R3" and "Arduino Uno" on one board into a single "Arduino Uno" without count prefix', () => {
      // iPhone bug: pointing at one Arduino Uno board produced "Arduino Uno R3" and "Arduino Uno"
      const result = dedupePartsList(['Arduino Uno R3', 'Arduino Uno']);
      expect(result.length).toBe(1);
      expect(result[0].canonicalName).toBe('Arduino Uno');
      expect(result[0].count).toBe(1);
      expect(result[0].displayText).toBe('Arduino Uno');
    });

    it('adds count prefix for genuinely separate objects (e.g. 2x LED)', () => {
      const result = dedupePartsList([
        { canonicalName: 'LED', count: 2 },
        { canonicalName: 'Arduino Uno', count: 1 },
      ]);

      expect(result.length).toBe(2);
      const led = result.find((r) => r.canonicalName === 'LED');
      const uno = result.find((r) => r.canonicalName === 'Arduino Uno');

      expect(led?.displayText).toBe('2x LED');
      expect(uno?.displayText).toBe('Arduino Uno'); // No count prefix for 1
    });

    it('handles raw detections with overlapping vs separate bounding boxes', () => {
      const rawDetections: RawDetection[] = [
        // 2 overlapping Arduino detections on 1 board
        { label: 'Arduino Uno R3', box_2d: [200, 200, 500, 500], confidence: 0.95 },
        { label: 'Arduino Uno', box_2d: [220, 210, 480, 490], confidence: 0.92 },
        // 2 genuinely separate LEDs (> 25% apart)
        { label: 'LED', box_2d: [100, 100, 150, 150], confidence: 0.9 },
        { label: 'LED', box_2d: [100, 800, 150, 850], confidence: 0.9 },
      ];

      const result = dedupePartsList(rawDetections);
      const uno = result.find((r) => r.canonicalName === 'Arduino Uno');
      const led = result.find((r) => r.canonicalName === 'LED');

      expect(uno?.displayText).toBe('Arduino Uno'); // 1 board
      expect(led?.displayText).toBe('2x LED'); // 2 separate LEDs
    });
  });
});
