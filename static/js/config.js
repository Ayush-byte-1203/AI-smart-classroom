// Configuration for local AI models
const CONFIG = {
  // Local server endpoint
  LOCAL_AI_ENDPOINT: "http://localhost:5000/generate",
  
  // Face Detection Settings
  FACE: {
    MODEL_PATH: "/models",
    DETECTION_INTERVAL: 500,
    EXPRESSION_THRESHOLDS: {
      happy: 0.7,
      neutral: 0.8,
      confused: 0.6,
      surprised: 0.65
    }
  },
  
  // Voice settings
  VOICE: {
    SAMPLE_RATE: 16000,
    MAX_RECORDING_DURATION: 10000 // 10 seconds
  }
};

export default CONFIG;
