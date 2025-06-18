import CONFIG from './config.js';

class LocalAI {
  constructor() {
    this.endpoint = CONFIG.LOCAL_AI_ENDPOINT;
    this.isInitialized = false;
  }

 async generateText(prompt) {
  try {
    const response = await fetch('http://localhost:5000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Local Qwen1.5-7B server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Local AI error:", error);
    throw error;
  }
}
}

const localAI = new LocalAI();
export default localAI;