// RetroScan AI — Core utility logic for scoring, detection simulation, and analysis

export const IRC_THRESHOLDS = {
  sign: { low: 150, medium: 300 },
  marking: { low: 100, medium: 200 },
  stud: { low: 200, medium: 400 },
};

export const SPEED_THRESHOLDS = {
  40: 100,
  60: 150,
  80: 200,
  100: 250,
  120: 300,
};

export const SHEETING_TYPES = ['Type I (Engineer Grade)', 'Type II (High Intensity)', 'Type III (Diamond Grade)'];

export const MATERIAL_DEGRADATION_RATES = {
  'Type I (Engineer Grade)': 8,
  'Type II (High Intensity)': 5,
  'Type III (Diamond Grade)': 3,
};

export const WEATHER_FACTORS = {
  day_dry: 1.0,
  night_dry: 0.75,
  day_wet: 0.85,
  night_wet: 0.55,
  foggy: 0.6,
  no_streetlight: 0.65,
};

export const NH_LOCATIONS = [
  { id: 'loc1', name: 'NH-44 Delhi Checkpoint', lat: 28.7041, lng: 77.1025, highway: 'NH-44' },
  { id: 'loc2', name: 'NH-44 Panipat Toll', lat: 29.3909, lng: 76.9635, highway: 'NH-44' },
  { id: 'loc3', name: 'NH-48 Gurugram Entry', lat: 28.4595, lng: 77.0266, highway: 'NH-48' },
  { id: 'loc4', name: 'NH-48 Jaipur Outskirts', lat: 26.9124, lng: 75.7873, highway: 'NH-48' },
  { id: 'loc5', name: 'NH-8 Ahmedabad North', lat: 23.0225, lng: 72.5714, highway: 'NH-8' },
  { id: 'loc6', name: 'NH-8 Surat Bypass', lat: 21.1702, lng: 72.8311, highway: 'NH-8' },
  { id: 'loc7', name: 'NH-44 Nagpur Junction', lat: 21.1458, lng: 79.0882, highway: 'NH-44' },
  { id: 'loc8', name: 'NH-44 Hyderabad North', lat: 17.385, lng: 78.4867, highway: 'NH-44' },
  { id: 'loc9', name: 'NH-48 Mumbai Entry', lat: 19.076, lng: 72.8777, highway: 'NH-48' },
  { id: 'loc10', name: 'NH-8 Vadodara South', lat: 22.3072, lng: 73.1812, highway: 'NH-8' },
];

export const STATE_SCOREBOARD = [
  { state: 'Gujarat', highway: 'NH-48', compliance: 87, total: 412, compliant: 358, warning: 38, nonCompliant: 16 },
  { state: 'Maharashtra', highway: 'NH-48', compliance: 82, total: 523, compliant: 429, warning: 64, nonCompliant: 30 },
  { state: 'Haryana', highway: 'NH-44', compliance: 78, total: 318, compliant: 248, warning: 47, nonCompliant: 23 },
  { state: 'Delhi NCR', highway: 'NH-44', compliance: 71, total: 289, compliant: 205, warning: 55, nonCompliant: 29 },
  { state: 'Rajasthan', highway: 'NH-48', compliance: 69, total: 445, compliant: 307, warning: 89, nonCompliant: 49 },
  { state: 'Telangana', highway: 'NH-44', compliance: 65, total: 367, compliant: 238, warning: 82, nonCompliant: 47 },
  { state: 'Uttar Pradesh', highway: 'NH-44', compliance: 58, total: 512, compliant: 297, warning: 123, nonCompliant: 92 },
  { state: 'Madhya Pradesh', highway: 'NH-44', compliance: 52, total: 398, compliant: 207, warning: 109, nonCompliant: 82 },
];

/**
 * Simulates pixel intensity extraction from an uploaded image using canvas.
 * Returns a value between 0–255 representing mean brightness.
 */
export async function extractImageBrightness(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      URL.revokeObjectURL(url);
      resolve(total / pixels);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(128); };
    img.src = url;
  });
}

/**
 * Converts pixel intensity (0-255) to retroreflectivity score (mcd/lx/m²)
 * using a calibrated mapping curve per object type.
 */
export function intensityToRetro(intensity, type, conditions) {
  const base = {
    sign: intensity * 2.5,
    marking: intensity * 1.8,
    stud: intensity * 3.2,
  }[type] || intensity * 2.0;

  const factor = conditions.night ? 0.72 : 1.0;
  const wetFactor = conditions.wet ? 0.82 : 1.0;
  const fogFactor = conditions.foggy ? 0.65 : 1.0;
  const lightFactor = conditions.noStreetlight ? 0.78 : 1.0;

  return Math.round(base * factor * wetFactor * fogFactor * lightFactor);
}

/**
 * Classifies retroreflectivity score into compliance status per IRC standards.
 */
export function classifyCompliance(score, type) {
  const thresholds = IRC_THRESHOLDS[type] || IRC_THRESHOLDS.sign;
  if (score >= thresholds.medium) return 'COMPLIANT';
  if (score >= thresholds.low) return 'WARNING';
  return 'NON-COMPLIANT';
}

/**
 * Returns status color for UI rendering.
 */
export function statusColor(status) {
  if (status === 'COMPLIANT') return '#22C55E';
  if (status === 'WARNING') return '#F59E0B';
  return '#EF4444';
}

export function statusBg(status) {
  if (status === 'COMPLIANT') return 'bg-green-100 text-green-800 border-green-300';
  if (status === 'WARNING') return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

/**
 * Generates mock detection results based on image brightness.
 */
export function generateDetections(baseBrightness, conditions, imageFile) {
  const seed = baseBrightness;
  const rand = (min, max, offset = 0) => {
    const s = (seed + offset) % 1;
    return Math.round(min + (Math.abs(Math.sin(seed * 9301 + offset * 49297 + 233995)) % 1) * (max - min));
  };

  const objects = [
    { id: 'OBJ-001', type: 'sign', label: 'Speed Limit Sign', age: rand(1, 8, 1), material: SHEETING_TYPES[rand(0, 2, 10)] },
    { id: 'OBJ-002', type: 'sign', label: 'Warning Sign', age: rand(1, 10, 2), material: SHEETING_TYPES[rand(0, 2, 20)] },
    { id: 'OBJ-003', type: 'marking', label: 'Lane Centerline', age: rand(1, 5, 3), material: 'Thermoplastic' },
    { id: 'OBJ-004', type: 'marking', label: 'Edge Line Marking', age: rand(1, 6, 4), material: 'Paint' },
    { id: 'OBJ-005', type: 'stud', label: 'Road Stud (Delineator)', age: rand(1, 4, 5), material: 'Cat-eye Reflector' },
    { id: 'OBJ-006', type: 'sign', label: 'Direction Signboard', age: rand(2, 9, 6), material: SHEETING_TYPES[rand(0, 2, 60)] },
  ];

  const intensityVariants = [1.0, 0.78, 0.62, 0.88, 0.71, 0.95];

  return objects.map((obj, i) => {
    const intensity = Math.min(255, Math.max(30, baseBrightness * intensityVariants[i] + (Math.sin(i * 37) * 20)));
    const score = intensityToRetro(intensity, obj.type, conditions);
    const status = classifyCompliance(score, obj.type);
    const loc = NH_LOCATIONS[i % NH_LOCATIONS.length];
    return {
      ...obj,
      intensity: Math.round(intensity),
      score,
      status,
      location: loc,
      timestamp: new Date(Date.now() - i * 3600000 * 24).toISOString(),
      bbox: {
        x: 50 + i * 80,
        y: 40 + (i % 2) * 120,
        w: 60 + (i % 3) * 20,
        h: 45 + (i % 2) * 30,
      },
    };
  });
}

/**
 * Computes overall highway safety score from detection results.
 */
export function computeSafetyScore(detections) {
  if (!detections.length) return 0;
  const compliant = detections.filter(d => d.status === 'COMPLIANT').length;
  const warning = detections.filter(d => d.status === 'WARNING').length;
  const total = detections.length;
  return Math.round(((compliant + warning * 0.5) / total) * 100);
}

/**
 * Predicts months until non-compliant for a given object.
 */
export function predictDeteriorationMonths(score, type, age, material, weatherFactor = 1.0) {
  const thresholds = IRC_THRESHOLDS[type] || IRC_THRESHOLDS.sign;
  const degradeRate = (MATERIAL_DEGRADATION_RATES[material] || 6) * weatherFactor;
  const deficit = score - thresholds.low;
  if (deficit <= 0) return 0;
  return Math.max(1, Math.round(deficit / degradeRate));
}

/**
 * Generates maintenance recommendation text.
 */
export function getRecommendation(status, type, score, months) {
  if (status === 'COMPLIANT') return `✅ No immediate action required. Schedule routine inspection in ${Math.max(6, months)} months.`;
  if (status === 'WARNING') return `⚠️ Plan maintenance within ${Math.min(months, 6)} months. Consider cleaning or partial repainting.`;
  if (type === 'sign') return `🚨 Replace retroreflective sheeting immediately. Below IRC 67 minimum threshold.`;
  if (type === 'marking') return `🚨 Repaint pavement markings immediately. Below IRC 35 minimum threshold.`;
  return `🚨 Replace road stud reflectors immediately. Safety hazard at night.`;
}

/**
 * Calculates speed-aware minimum retroreflectivity threshold.
 */
export function speedToMinRetro(speed) {
  const speeds = Object.keys(SPEED_THRESHOLDS).map(Number).sort((a, b) => a - b);
  for (let i = speeds.length - 1; i >= 0; i--) {
    if (speed >= speeds[i]) return SPEED_THRESHOLDS[speeds[i]];
  }
  return SPEED_THRESHOLDS[40];
}

/**
 * Estimates driver visibility distance based on retroreflectivity score.
 */
export function estimateVisibilityDistance(score) {
  return Math.round(Math.min(300, Math.max(30, score * 0.6)));
}

/**
 * Calculates degradation percentage between two scores.
 */
export function calcDegradation(oldScore, newScore) {
  if (!oldScore || oldScore === 0) return 0;
  return Math.round(((oldScore - newScore) / oldScore) * 100);
}

/**
 * Generates deterioration timeline data points for charting.
 */
export function generateDeteriorationTimeline(score, type, material, months = 24) {
  const degradeRate = MATERIAL_DEGRADATION_RATES[material] || 6;
  const points = [];
  for (let m = 0; m <= months; m += 2) {
    const projected = Math.max(0, score - degradeRate * m * 0.08);
    points.push({ month: m, score: Math.round(projected) });
  }
  return points;
}

/**
 * Generates a unique ticket ID.
 */
export function generateTicketId() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

/**
 * Derives priority level from compliance status and score.
 */
export function derivePriority(status, score, type) {
  if (status === 'NON-COMPLIANT') {
    const threshold = IRC_THRESHOLDS[type]?.low || 150;
    const deficit = threshold - score;
    if (deficit > 80) return 'CRITICAL';
    return 'HIGH';
  }
  if (status === 'WARNING') return 'MEDIUM';
  return 'LOW';
}

/**
 * Returns mock cost estimate for maintenance action.
 */
export function estimateCost(type, action) {
  const costs = {
    sign: { Replace: '₹12,000 – ₹25,000', Repaint: '₹3,000 – ₹6,000', Clean: '₹500 – ₹1,500' },
    marking: { Replace: '₹8,000 – ₹18,000', Repaint: '₹2,000 – ₹5,000', Clean: '₹800 – ₹2,000' },
    stud: { Replace: '₹1,500 – ₹4,000', Repaint: 'N/A', Clean: '₹200 – ₹600' },
  };
  return costs[type]?.[action] || '₹5,000 – ₹15,000';
}

/**
 * Suggests cause for degradation based on percentage and conditions.
 */
export function suggestDegradationCause(pct, conditions) {
  if (pct > 50) return 'Severe sun exposure / material fatigue';
  if (conditions.wet) return 'Moisture penetration / tyre erosion';
  if (conditions.foggy) return 'Acid mist / atmospheric corrosion';
  if (pct > 30) return 'Pollution / UV degradation';
  return 'Normal wear — tyre abrasion + dust accumulation';
}