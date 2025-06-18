import localAI from './localai.js';
import CONFIG from './config.js';

// Initialize Local AI connection
document.addEventListener('DOMContentLoaded', async function() {
  initializeEventListeners();
  
  try {
    const initialized = await localAI.initialize();
    if (!initialized) {
      document.getElementById('model-status').textContent = 
        "Error: Local AI server not available. Please ensure the Python server is running.";
    }
  } catch (error) {
    console.error("AI initialization failed:", error);
  }
});

function initializeEventListeners() {
  document.getElementById('submit-text').addEventListener('click', async function() {
    const query = document.getElementById('text-query').value;
    const faceData = JSON.parse(document.getElementById('face-data').textContent || '{}');
    
    if (!query) {
      alert('Please enter a question');
      return;
    }
    
    try {
      const response = await handleAIQuery(query, faceData);
      displayResponse(response);
    } catch (error) {
      console.error('Error generating response:', error);
      document.getElementById('response-text').textContent = 
        'Error generating response. Please check if the local AI server is running.';
    }
  });
}

async function handleAIQuery(query, faceData) {
  let enhancedQuery = query;
  if (faceData.expression) {
    enhancedQuery = `The student appears ${faceData.expression}. ${query}`;
  }
  
  return await localAI.generateText(enhancedQuery);
}

function displayResponse(response) {
  const responseElement = document.getElementById('response-text');
  responseElement.innerHTML = typeof response === 'string' ? response : JSON.stringify(response);
  
  const chartContainer = document.getElementById('chart-container');
  chartContainer.hidden = !response.includes('[chart]');
}