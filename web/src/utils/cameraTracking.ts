/**
 * Camera Vision & Marker Tracking Utilities
 *
 * Implements:
 * 1. Canonical part name normalization
 * 2. Spatial detection merging (same canonical name, overlapping or within ~25% frame width)
 * 3. Multi-frame marker tracking with exponential ease smoothing
 * 4. 2-consecutive detection requirement before display, fade out on miss, pruning after 2 misses
 * 5. Non-overlapping label positioning (vertical nudging)
 * 6. "Parts found" deduplication with count suffixes (e.g. "2x LED")
 */

export interface RawDetection {
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number;
}

export interface MergedDetection {
  canonicalName: string;
  label: string;
  box_2d: [number, number, number, number];
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  confidence: number;
  count: number;
}

export interface TrackedMarker {
  id: string;
  canonicalName: string;
  label: string;
  confidence: number;
  x: number; // smoothed percentage 0-100
  y: number; // smoothed percentage 0-100
  targetX: number;
  targetY: number;
  appearCount: number; // consecutive appearances
  missCount: number; // consecutive misses
  confirmed: boolean; // true once appearCount >= 2
  nudgeY?: number;
}

export interface FoundPartItem {
  canonicalName: string;
  count: number;
  displayText: string;
}

/**
 * Normalizes any maker hardware label into its canonical component name.
 * e.g. "Arduino Uno R3", "Arduino Uno", "Uno R3" -> "Arduino Uno"
 */
export function toCanonicalPartName(rawLabel: string): string {
  if (!rawLabel || typeof rawLabel !== 'string') return '';
  const s = rawLabel.trim().toLowerCase();

  // Arduino Uno variants
  if (s.includes('arduino') || s.includes('uno') || s.includes('atmega328')) {
    return 'Arduino Uno';
  }
  // ESP32 variants
  if (
    s.includes('esp32') ||
    s.includes('esp-32') ||
    s.includes('esp 32') ||
    s.includes('wroom') ||
    s.includes('devkit')
  ) {
    return 'ESP32';
  }
  // Raspberry Pi Zero
  if (s.includes('pi zero') || s.includes('pizero') || s.includes('rpi zero')) {
    return 'Raspberry Pi Zero 2 W';
  }
  // Raspberry Pi general
  if (s.includes('raspberry') || s.includes('rpi')) {
    return 'Raspberry Pi';
  }
  // Relay
  if (s.includes('relay')) {
    return '5V Relay Module';
  }
  // Servo
  if (s.includes('servo') || s.includes('sg90')) {
    return 'SG90 Servo';
  }
  // OLED Display
  if (s.includes('oled') || s.includes('ssd1306') || s.includes('0.96')) {
    return 'OLED Display';
  }
  // Ultrasonic HC-SR04
  if (
    s.includes('ultrasonic') ||
    s.includes('sr04') ||
    s.includes('hcsr04') ||
    s.includes('distance sensor')
  ) {
    return 'HC-SR04 Ultrasonic';
  }
  // DHT11 / DHT22 / Temperature
  if (
    s.includes('dht11') ||
    s.includes('dht-11') ||
    s.includes('dht22') ||
    s.includes('temp sensor') ||
    s.includes('humidity')
  ) {
    return 'DHT11 Sensor';
  }
  // Soil Moisture
  if (s.includes('soil') || s.includes('moisture') || s.includes('hygrometer')) {
    return 'Soil Moisture Sensor';
  }
  // Breadboard
  if (s.includes('breadboard')) {
    return 'Breadboard';
  }
  // Jumper Wires
  if (s.includes('jumper') || s.includes('wire') || s.includes('cable')) {
    return 'Jumper Wires';
  }
  // Battery
  if (s.includes('battery') || s.includes('18650') || s.includes('lipo')) {
    return '18650 Battery';
  }
  // Buzzer
  if (s.includes('buzzer') || s.includes('piezo')) {
    return 'Buzzer';
  }
  // LED
  if (s.includes('led') || s.includes('light emitting diode')) {
    return 'LED';
  }
  // Push Button
  if (s.includes('button') || s.includes('pushbutton') || s.includes('switch')) {
    return 'Push Button';
  }
  // Potentiometer
  if (s.includes('potentiometer') || s.includes('pot')) {
    return 'Potentiometer';
  }

  // Fallback: capitalize words cleanly
  return rawLabel.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Checks whether two boxes overlap in 0-1000 coordinate space.
 */
export function boxesOverlap(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): boolean {
  const [yminA, xminA, ymaxA, xmaxA] = boxA;
  const [yminB, xminB, ymaxB, xmaxB] = boxB;
  return !(xmaxA < xminB || xminA > xmaxB || ymaxA < yminB || yminA > ymaxB);
}

/**
 * Client-side detection merger:
 * Merges detections with the same canonical name whose boxes overlap OR whose centers
 * are within ~25% of frame width (25 percentage points) into a single marker at the merged box center.
 * Never allows two markers with the same canonical label closer than that.
 */
export function mergeDetections(
  detections: RawDetection[],
  distanceThresholdPct = 25
): MergedDetection[] {
  if (!detections || detections.length === 0) return [];

  // 1. Initial conversion to MergedDetection items with canonical name
  const items: MergedDetection[] = detections
    .filter((d) => d && d.label && Array.isArray(d.box_2d) && d.box_2d.length === 4)
    .map((d) => {
      const canonicalName = toCanonicalPartName(d.label);
      const [ymin, xmin, ymax, xmax] = d.box_2d;
      const x = Math.max(5, Math.min(95, (xmin + xmax) / 20));
      const y = Math.max(5, Math.min(95, (ymin + ymax) / 20));
      return {
        canonicalName,
        label: canonicalName,
        box_2d: [ymin, xmin, ymax, xmax],
        x,
        y,
        confidence: typeof d.confidence === 'number' ? d.confidence : 0.9,
        count: 1,
      };
    });

  // 2. Iteratively merge items that have the same canonical name AND (boxes overlap OR centers within threshold)
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        if (a.canonicalName === b.canonicalName) {
          const distX = Math.abs(a.x - b.x);
          const distHypot = Math.hypot(a.x - b.x, a.y - b.y);
          const overlap = boxesOverlap(a.box_2d, b.box_2d);

          if (overlap || distX <= distanceThresholdPct || distHypot <= distanceThresholdPct) {
            // Merge b into a
            const unionBox: [number, number, number, number] = [
              Math.min(a.box_2d[0], b.box_2d[0]),
              Math.min(a.box_2d[1], b.box_2d[1]),
              Math.max(a.box_2d[2], b.box_2d[2]),
              Math.max(a.box_2d[3], b.box_2d[3]),
            ];
            a.box_2d = unionBox;
            a.x = Math.max(5, Math.min(95, (unionBox[1] + unionBox[3]) / 20));
            a.y = Math.max(5, Math.min(95, (unionBox[0] + unionBox[2]) / 20));
            a.confidence = Math.max(a.confidence, b.confidence);
            a.count = a.count + b.count;

            items.splice(j, 1);
            merged = true;
            break;
          }
        }
      }
      if (merged) break;
    }
  }

  return items;
}

/**
 * Multi-frame marker tracking with exponential ease smoothing:
 * - Matches markers by canonical name + nearest center distance (< 35%)
 * - Smooths position: x = prevX + alpha * (targetX - prevX)
 * - Tracks consecutive detections: appearCount
 * - Confirms marker display once appearCount >= 2
 * - Tracks misses: missCount
 * - Fades out on miss, prunes markers after 2 missed frames
 * - Enforces that no two markers with the same label ever stay closer than 25%
 */
export function trackMarkers(
  prevMarkers: TrackedMarker[],
  newMerged: MergedDetection[],
  alpha = 0.45,
  matchDistThreshold = 35
): TrackedMarker[] {
  const result: TrackedMarker[] = [];
  const usedNewIndices = new Set<number>();

  // 1. Match each existing marker to nearest incoming detection of the same canonical name
  prevMarkers.forEach((marker) => {
    let bestDist = Infinity;
    let bestIdx = -1;

    newMerged.forEach((det, idx) => {
      if (usedNewIndices.has(idx)) return;
      if (marker.canonicalName !== det.canonicalName) return;

      const dist = Math.hypot(marker.targetX - det.x, marker.targetY - det.y);
      if (dist <= matchDistThreshold && dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    if (bestIdx >= 0) {
      usedNewIndices.add(bestIdx);
      const match = newMerged[bestIdx];

      // Exponential position smoothing towards new target
      const smoothedX = marker.x + alpha * (match.x - marker.x);
      const smoothedY = marker.y + alpha * (match.y - marker.y);
      const nextAppearCount = marker.appearCount + 1;
      const confirmed = marker.confirmed || nextAppearCount >= 2;

      result.push({
        id: marker.id,
        canonicalName: marker.canonicalName,
        label: match.label,
        confidence: match.confidence,
        x: Math.round(smoothedX * 100) / 100,
        y: Math.round(smoothedY * 100) / 100,
        targetX: match.x,
        targetY: match.y,
        appearCount: nextAppearCount,
        missCount: 0,
        confirmed,
      });
    } else {
      // Missed frame: increment missCount
      const nextMiss = marker.missCount + 1;
      // Fade out on miss; prune after 2 missed frames (keep missCount 1 and 2 for fade out)
      if (nextMiss <= 2) {
        result.push({
          ...marker,
          appearCount: 0,
          missCount: nextMiss,
        });
      }
      // If nextMiss > 2: pruned completely
    }
  });

  // 2. Add unmatched new detections as fresh markers
  newMerged.forEach((det, idx) => {
    if (!usedNewIndices.has(idx)) {
      result.push({
        id: `marker-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        canonicalName: det.canonicalName,
        label: det.label,
        confidence: det.confidence,
        x: det.x,
        y: det.y,
        targetX: det.x,
        targetY: det.y,
        appearCount: 1, // First appearance (needs >= 2 to be confirmed/visible)
        missCount: 0,
        confirmed: false,
      });
    }
  });

  // 3. Guarantee: never show two markers with the same canonical label closer than ~25%
  const deduplicated: TrackedMarker[] = [];
  result.forEach((m) => {
    const existingIdx = deduplicated.findIndex(
      (d) =>
        d.canonicalName === m.canonicalName &&
        Math.hypot(d.x - m.x, d.y - m.y) <= 25
    );
    if (existingIdx >= 0) {
      const ex = deduplicated[existingIdx];
      // Keep the more established / higher confidence marker
      if (
        m.appearCount > ex.appearCount ||
        (m.appearCount === ex.appearCount && m.confidence > ex.confidence)
      ) {
        deduplicated[existingIdx] = m;
      }
    } else {
      deduplicated.push(m);
    }
  });

  return deduplicated;
}

/**
 * Filter to get only visible markers according to rules:
 * - Appears in at least 2 consecutive detections (appearCount >= 2 or confirmed)
 * - Has not exceeded 2 missed frames (missCount <= 2)
 */
export function getVisibleMarkers(markers: TrackedMarker[]): TrackedMarker[] {
  return markers.filter((m) => (m.confirmed || m.appearCount >= 2) && m.missCount <= 2);
}

/**
 * Collision avoidance: nudges label chips vertically if two visible labels collide.
 */
export function preventLabelOverlap(markers: TrackedMarker[]): TrackedMarker[] {
  const result = markers.map((m) => ({ ...m, nudgeY: 0 }));
  result.sort((a, b) => a.y - b.y);

  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < i; j++) {
      const m1 = result[j];
      const m2 = result[i];

      // Same side of screen (left vs right chip placement) or close horizontally
      const isLeft1 = m1.x > 70;
      const isLeft2 = m2.x > 70;
      const sameSide = isLeft1 === isLeft2 || Math.abs(m1.x - m2.x) < 25;

      if (sameSide) {
        const y1 = m1.y + (m1.nudgeY || 0) * 0.14; // approximate percentage space
        const y2 = m2.y + (m2.nudgeY || 0) * 0.14;
        // If vertical separation is less than 8%
        if (Math.abs(y1 - y2) < 8) {
          m2.nudgeY = (m1.nudgeY || 0) + 28;
        }
      }
    }
  }

  return result;
}

/**
 * Deduplicates "Parts found" by canonical name:
 * - Suffix only for genuinely separate objects (e.g. "2x LED", but "Arduino Uno" for count 1)
 * - Deduplicates multiple mentions (e.g. "Arduino Uno R3" and "Arduino Uno" -> 1 "Arduino Uno")
 */
export function dedupePartsList(
  items: Array<
    | string
    | {
        canonicalName?: string;
        label?: string;
        count?: number;
        box_2d?: [number, number, number, number];
      }
  >
): FoundPartItem[] {
  if (!items || items.length === 0) return [];

  // If raw detections with boxes are passed, run spatial merge first
  const isRawDetection = items.some(
    (it) => typeof it === 'object' && it !== null && Array.isArray((it as any).box_2d)
  );

  if (isRawDetection) {
    const rawDets: RawDetection[] = items.map((it) => {
      const obj = it as any;
      return {
        label: obj.label || obj.canonicalName || '',
        box_2d: obj.box_2d || [0, 0, 0, 0],
        confidence: typeof obj.confidence === 'number' ? obj.confidence : 1,
      };
    });
    const merged = mergeDetections(rawDets);
    const separateCounts = new Map<string, number>();
    merged.forEach((m) => {
      separateCounts.set(m.canonicalName, (separateCounts.get(m.canonicalName) || 0) + 1);
    });
    return Array.from(separateCounts.entries()).map(([canonicalName, count]) => ({
      canonicalName,
      count,
      displayText: count > 1 ? `${count}x ${canonicalName}` : canonicalName,
    }));
  }

  const counts = new Map<string, number>();

  items.forEach((item) => {
    let name = '';
    let count = 1;

    if (typeof item === 'string') {
      name = toCanonicalPartName(item);
      // When a list of raw string names like ['Arduino Uno R3', 'Arduino Uno'] is passed,
      // deduplicate to 1
      counts.set(name, Math.max(counts.get(name) || 0, 1));
      return;
    } else if (item && typeof item === 'object') {
      name = toCanonicalPartName(item.canonicalName || item.label || '');
      count = typeof item.count === 'number' && item.count > 0 ? item.count : 1;
    }

    if (!name) return;

    if (typeof (item as any)?.count === 'number') {
      // Explicit count provided
      counts.set(name, Math.max(counts.get(name) || 0, count));
    } else {
      // Multiple separate items passed without explicit count
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  });

  const result: FoundPartItem[] = [];
  counts.forEach((count, canonicalName) => {
    const displayText = count > 1 ? `${count}x ${canonicalName}` : canonicalName;
    result.push({
      canonicalName,
      count,
      displayText,
    });
  });

  return result;
}
