const DEFAULT_API_URL = 'http://127.0.0.1:8000';

export async function requestYoloDetections(file, speed) {
  const baseUrl = import.meta.env.VITE_YOLO_API_URL || DEFAULT_API_URL;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('speed', String(speed));

  const response = await fetch(`${baseUrl}/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let detail = 'YOLO detection request failed.';
    try {
      const data = await response.json();
      detail = data?.detail || detail;
    } catch {
      // ignore json parse failures
    }
    throw new Error(detail);
  }

  return response.json();
}
