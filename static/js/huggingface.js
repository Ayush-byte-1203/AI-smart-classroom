import CONFIG from './config.js';

class HuggingFaceAI {
  constructor() {
    this.apiUrl = "https://api-inference.huggingface.co/models/";
    this.apiKey = null;
    this.currentModel = null;
  }

  initialize(apiKey) {
    this.apiKey = apiKey;
    return this.checkAPIKey();
  }

  checkAPIKey() {
    if (!this.apiKey) {
      console.error("Hugging Face API key not set");
      return false;
    }
    return true;
  }

  async setModel(modelName) {
    this.currentModel = modelName;
    return this.checkModelStatus();
  }

  async checkModelStatus() {
    if (!this.currentModel) {
      console.error("No model selected");
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}${this.currentModel}`, {
        headers: { "Authorization": `Bearer ${this.apiKey}` }
      });
      
      const data = await response.json();
      return data.ready || false;
    } catch (error) {
      console.error("Model status check failed:", error);
      return false;
    }
  }

  async query(payload) {
    if (!this.checkAPIKey() || !this.currentModel) {
      throw new Error("Hugging Face not properly initialized");
    }

    try {
      const response = await fetch(`${this.apiUrl}${this.currentModel}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Hugging Face query error:", error);
      throw error;
    }
  }

  async generateText(prompt, parameters = {}) {
    return this.query({
      inputs: prompt,
      parameters: {
        max_length: 200,
        temperature: 0.7,
        ...parameters
      }
    });
  }

  async answerQuestion(context, question) {
    return this.query({
      inputs: {
        question: question,
        context: context
      }
    });
  }

  async classifyText(text) {
    return this.query({
      inputs: text
    });
  }

  async transcribeAudio(audioBlob) {
    if (!this.checkAPIKey()) return null;
    
    await this.setModel(CONFIG.HF.SPEECH_RECOGNITION);
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    
    const response = await fetch(`${this.apiUrl}${CONFIG.HF.SPEECH_RECOGNITION}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}` },
      body: formData
    });
    
    return await response.json();
  }
}

const huggingFace = new HuggingFaceAI();
export default huggingFace;