import CONFIG from './config.js';

let faceDetectionInterval;
let modelsLoaded = false;
let isCameraActive = false;

async function initializeFaceDetection() {
  try {
    updateModelStatus('Loading face detection models...');
    updateEngagementStatus('System initializing...');

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(CONFIG.FACE.MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.FACE.MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(CONFIG.FACE.MODEL_PATH),
      faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.FACE.MODEL_PATH)
    ]);

    modelsLoaded = true;
    updateModelStatus('Models loaded successfully');
    updateEngagementStatus('Ready for face detection');
    await startCamera();
    startDetectionLoop();
  } catch (error) {
    console.error('Face detection initialization failed:', error);
    updateModelStatus(`Error: ${error.message}`);
    updateEngagementStatus('System initialization failed');
  }
}

async function startCamera() {
  const video = document.getElementById('video');
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not supported');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 320, height: 240, facingMode: 'user' },
      audio: false 
    });

    video.srcObject = stream;
    isCameraActive = true;
    updateEngagementStatus('Camera active - detecting faces...');

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (error) {
    console.error('Camera access error:', error);
    updateEngagementStatus('Camera access denied or not available');
    isCameraActive = false;
    throw error;
  }
}

function startDetectionLoop() {
  if (!modelsLoaded || !isCameraActive) return;

  const video = document.getElementById('video');
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  });

  if (faceDetectionInterval) clearInterval(faceDetectionInterval);

  faceDetectionInterval = setInterval(async () => {
    try {
      const detections = await faceapi.detectAllFaces(video, options)
        .withFaceLandmarks()
        .withFaceExpressions();
      processDetections(detections);
    } catch (error) {
      console.error('Detection error:', error);
      updateEngagementStatus('Detection error - trying again...');
    }
  }, CONFIG.FACE.DETECTION_INTERVAL);
}

function processDetections(detections) {
  const faceDataElement = document.getElementById('face-data');
  
  if (!detections || detections.length === 0) {
    updateEngagementStatus('No faces detected');
    faceDataElement.textContent = JSON.stringify({
      faceDetected: false,
      timestamp: Date.now()
    });
    return;
  }

  const primaryFace = detections.reduce((prev, current) => 
    (prev.detection.box.area > current.detection.box.area) ? prev : current
  );

  const expressions = primaryFace.expressions;
  const dominantExpression = getDominantExpression(expressions);
  const engagementLevel = calculateEngagement(expressions);

  updateEngagementStatus(`${engagementLevel} engagement - ${dominantExpression}`);
  
  faceDataElement.textContent = JSON.stringify({
    faceDetected: true,
    expression: dominantExpression,
    expressions: expressions,
    engagement: engagementLevel,
    timestamp: Date.now(),
    box: primaryFace.detection.box
  });
}

function getDominantExpression(expressions) {
  return Object.entries(expressions).reduce(
    (max, [expression, score]) => score > max.score ? 
      { expression, score } : max,
    { expression: 'neutral', score: 0 }
  ).expression;
}

function calculateEngagement(expressions) {
  const thresholds = CONFIG.FACE.EXPRESSION_THRESHOLDS;
  if (expressions.happy >= thresholds.happy) return 'high';
  if (expressions.surprised >= thresholds.surprised) return 'medium';
  if (expressions.neutral >= thresholds.neutral) return 'low';
  if (expressions.confused >= thresholds.confused) return 'distracted';
  return 'neutral';
}

function updateModelStatus(message) {
  const statusElement = document.getElementById('model-status');
  statusElement.textContent = message;
  statusElement.className = message.includes('Error') ? 'error' : 'success';
}

function updateEngagementStatus(message, level = 'neutral') {
  const statusElement = document.getElementById('engagement-status');
  statusElement.textContent = message;
  statusElement.className = level.toLowerCase();
}

function stopFaceDetection() {
  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval);
    faceDetectionInterval = null;
  }
  
  const video = document.getElementById('video');
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  
  isCameraActive = false;
  updateEngagementStatus('Face detection stopped');
}

document.addEventListener('DOMContentLoaded', initializeFaceDetection);
window.addEventListener('beforeunload', stopFaceDetection);