const GRID_SIZE = 8;
const BRIGHTNESS_THRESHOLD = 120;
const MAX_OBJECTS = 5;

export const SPEED_THRESHOLDS = {
  40: 100,
  60: 150,
  80: 200,
  100: 250,
  120: 300,
};

export const OBJECT_TYPES = {
  sign: {
    label: 'Road Sign',
    shortLabel: 'Sign',
    standard: 'IRC 67',
    scoreMultiplier: 2.1,
    compliant: 300,
    warning: 150,
  },
  marking: {
    label: 'Pavement Marking',
    shortLabel: 'Marking',
    standard: 'IRC 35',
    scoreMultiplier: 1.6,
    compliant: 200,
    warning: 100,
  },
  stud: {
    label: 'Road Stud',
    shortLabel: 'Road Stud',
    standard: 'IRC 35',
    scoreMultiplier: 2.8,
    compliant: 400,
    warning: 200,
  },
};

export const STATUS_COLORS = {
  COMPLIANT: '#22C55E',
  WARNING: '#F59E0B',
  'NON-COMPLIANT': '#EF4444',
  UNSAFE_AT_SPEED: '#F97316',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const brightnessToType = (brightness) => {
  if (brightness > 200) return 'sign';
  if (brightness >= 130) return 'marking';
  return 'stud';
};

const scoreToStatus = (score, type) => {
  const thresholds = OBJECT_TYPES[type];
  if (score >= thresholds.compliant) return 'COMPLIANT';
  if (score >= thresholds.warning) return 'WARNING';
  return 'NON-COMPLIANT';
};

const getRecommendation = (status) => {
  if (status === 'COMPLIANT') return 'No action needed';
  if (status === 'WARNING') return 'Schedule inspection within 3 months';
  return 'Immediate replacement required';
};

const getPriority = (status, score, type) => {
  const thresholds = OBJECT_TYPES[type];
  if (status === 'NON-COMPLIANT') {
    if (score < thresholds.warning * 0.75) return 'CRITICAL';
    return 'HIGH';
  }
  if (status === 'WARNING') return 'MEDIUM';
  return 'LOW';
};

const getSegmentColor = (objects) => {
  if (objects.some((object) => object.ircStatus === 'NON-COMPLIANT')) return STATUS_COLORS['NON-COMPLIANT'];
  if (objects.some((object) => object.ircStatus === 'WARNING')) return STATUS_COLORS.WARNING;
  return STATUS_COLORS.COMPLIANT;
};

export const formatObjectId = (index) => `OBJ-${String(index + 1).padStart(3, '0')}`;

export const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

export const getSafetyGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

export const calculateOverallSafety = (objects) => {
  if (!objects.length) {
    return {
      score: 0,
      compliantCount: 0,
      totalCount: 0,
      grade: 'F',
    };
  }

  const totalWeight = objects.reduce((sum, object) => {
    if (object.ircStatus === 'COMPLIANT') return sum + 1;
    if (object.ircStatus === 'WARNING') return sum + 0.5;
    return sum;
  }, 0);
  const score = Math.round((totalWeight / objects.length) * 100);
  const compliantCount = objects.filter((object) => object.ircStatus === 'COMPLIANT').length;

  return {
    score,
    compliantCount,
    totalCount: objects.length,
    grade: getSafetyGrade(score),
  };
};

export const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to load image: ${file.name}`));
    };
    image.src = objectUrl;
  });

export const analyzeCanvasImage = async (file, speed = 80) => {
  const { image, objectUrl } = await loadImageFromFile(file);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    const cellWidth = Math.max(1, Math.floor(canvas.width / GRID_SIZE));
    const cellHeight = Math.max(1, Math.floor(canvas.height / GRID_SIZE));
    const regions = [];

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const startX = col * cellWidth;
        const startY = row * cellHeight;
        const endX = col === GRID_SIZE - 1 ? canvas.width : Math.min(canvas.width, startX + cellWidth);
        const endY = row === GRID_SIZE - 1 ? canvas.height : Math.min(canvas.height, startY + cellHeight);

        let totalBrightness = 0;
        let pixelCount = 0;

        for (let y = startY; y < endY; y += 1) {
          for (let x = startX; x < endX; x += 1) {
            const index = (y * canvas.width + x) * 4;
            const brightness = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
            totalBrightness += brightness;
            pixelCount += 1;
          }
        }

        const averageBrightness = pixelCount ? totalBrightness / pixelCount : 0;
        regions.push({
          id: `${row}-${col}`,
          row,
          col,
          brightness: averageBrightness,
          isBright: averageBrightness > BRIGHTNESS_THRESHOLD,
          bbox: {
            x: startX,
            y: startY,
            width: endX - startX,
            height: endY - startY,
          },
        });
      }
    }

    const brightRegionMap = new Map(regions.filter((region) => region.isBright).map((region) => [region.id, region]));
    const visited = new Set();
    const mergedObjects = [];

    brightRegionMap.forEach((region) => {
      if (visited.has(region.id)) return;

      const queue = [region];
      const component = [];
      visited.add(region.id);

      while (queue.length) {
        const current = queue.shift();
        component.push(current);

        const neighbors = [
          [current.row - 1, current.col],
          [current.row + 1, current.col],
          [current.row, current.col - 1],
          [current.row, current.col + 1],
        ];

        neighbors.forEach(([row, col]) => {
          const key = `${row}-${col}`;
          if (brightRegionMap.has(key) && !visited.has(key)) {
            visited.add(key);
            queue.push(brightRegionMap.get(key));
          }
        });
      }

      const totalBrightness = component.reduce((sum, item) => sum + item.brightness, 0);
      const averageBrightness = totalBrightness / component.length;
      const minX = Math.min(...component.map((item) => item.bbox.x));
      const minY = Math.min(...component.map((item) => item.bbox.y));
      const maxX = Math.max(...component.map((item) => item.bbox.x + item.bbox.width));
      const maxY = Math.max(...component.map((item) => item.bbox.y + item.bbox.height));
      const type = brightnessToType(averageBrightness);
      const score = Math.round(averageBrightness * OBJECT_TYPES[type].scoreMultiplier);
      const ircStatus = scoreToStatus(score, type);
      const speedThreshold = SPEED_THRESHOLDS[speed];
      const speedSafe = score >= speedThreshold;
      const speedStatus = speedSafe ? 'SAFE' : 'UNSAFE';
      const confidence = Math.round(clamp(60 + averageBrightness / 5, 0, 99));

      mergedObjects.push({
        id: '',
        type,
        typeLabel: OBJECT_TYPES[type].label,
        standard: OBJECT_TYPES[type].standard,
        brightness: Math.round(averageBrightness),
        score,
        ircStatus,
        speedThreshold,
        speedStatus,
        speedUnsafeDespiteIrc: ircStatus === 'COMPLIANT' && !speedSafe,
        confidence,
        visibilityDistance: Math.round(score * 0.8),
        recommendation: getRecommendation(ircStatus),
        priority: getPriority(ircStatus, score, type),
        bbox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        regions: component,
      });
    });

    const objects = mergedObjects
      .sort((left, right) => right.brightness - left.brightness)
      .slice(0, MAX_OBJECTS)
      .map((object, index) => ({
        ...object,
        id: formatObjectId(index),
      }));

    const summary = calculateOverallSafety(objects);

    return {
      file,
      fileName: file.name,
      objectUrl,
      width: canvas.width,
      height: canvas.height,
      originalCanvas: canvas,
      regions,
      objects,
      summary,
      segmentColor: getSegmentColor(objects),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
};

export const buildAnalysisFromDetectedObjects = async (file, objects, summary) => {
  const { image, objectUrl } = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const normalizedObjects = (objects || []).map((object, index) => ({
    ...object,
    id: object.id || formatObjectId(index),
  }));

  return {
    file,
    fileName: file.name,
    objectUrl,
    width: canvas.width,
    height: canvas.height,
    originalCanvas: canvas,
    regions: [],
    objects: normalizedObjects,
    summary: summary || calculateOverallSafety(normalizedObjects),
    segmentColor: getSegmentColor(normalizedObjects),
  };
};

export const drawAnnotatedDetections = ({ sourceCanvas, objects, targetCanvas }) => {
  if (!sourceCanvas || !targetCanvas) return;

  const ctx = targetCanvas.getContext('2d');
  targetCanvas.width = sourceCanvas.width;
  targetCanvas.height = sourceCanvas.height;
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);

  objects.forEach((object) => {
    const boxColor = STATUS_COLORS[object.ircStatus];
    const label = `${object.typeLabel} - ${object.score} mcd/lx/m²`;
    const meta = `${object.confidence}% confidence`;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 7;
    ctx.shadowColor = `${boxColor}AA`;
    ctx.shadowBlur = 14;
    ctx.strokeRect(object.bbox.x, object.bbox.y, object.bbox.width, object.bbox.height);
    ctx.shadowBlur = 0;

    const labelWidth = Math.max(object.bbox.width, 240);
    const labelHeight = 52;
    const labelX = object.bbox.x;
    const labelY = Math.max(0, object.bbox.y - labelHeight - 6);

    ctx.fillStyle = `${boxColor}E6`;
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(label, labelX + 12, labelY + 20);
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(meta, labelX + 12, labelY + 37);
    ctx.fillText(`Brightness ${object.brightness}`, labelX + 12, labelY + 50);
  });
};

export const buildSurveyCoordinates = (startLat, startLng, index) => ({
  lat: Number((startLat + index * 0.001).toFixed(6)),
  lng: Number((startLng + index * 0.00035).toFixed(6)),
});

export const buildMaintenanceCost = (object) => {
  if (object.ircStatus === 'NON-COMPLIANT') {
    if (object.type === 'sign') return '₹22,000';
    if (object.type === 'marking') return '₹9,500';
    return '₹4,000';
  }
  if (object.ircStatus === 'WARNING') return '₹3,500';
  return '₹0';
};

export const summarizeSurvey = (entries) => {
  const allObjects = entries.flatMap((entry) => entry.objects);
  const compliant = allObjects.filter((object) => object.ircStatus === 'COMPLIANT').length;
  const warning = allObjects.filter((object) => object.ircStatus === 'WARNING').length;
  const nonCompliant = allObjects.filter((object) => object.ircStatus === 'NON-COMPLIANT').length;
  const totalDistanceMeters = entries.length > 1 ? (entries.length - 1) * 111 : 0;
  const overallScore = calculateOverallSafety(allObjects).score;
  const criticalFindings = entries.flatMap((entry) =>
    entry.objects
      .filter((object) => object.ircStatus === 'NON-COMPLIANT')
      .map((object) => ({
        imageNumber: entry.imageNumber,
        gps: entry.gps,
        fileName: entry.fileName,
        object,
      }))
  );

  return {
    totalObjects: allObjects.length,
    compliant,
    warning,
    nonCompliant,
    totalDistanceMeters,
    overallScore,
    criticalFindings,
  };
};
