import CONFIG from './config.js';

class OpenAI {
  constructor() {
    this.apiKey = null;
  }

  initialize(apiKey) {
    this.apiKey = apiKey;
    return this.checkAPIKey();
  }

  checkAPIKey() {
    if (!this.apiKey) {
      console.error("OpenAI API key not set");
      return false;
    }
    return true;
  }

  async chatCompletion(messages, model = CONFIG.OPENAI.DEFAULT_MODEL) {
    if (!this.checkAPIKey()) {
      throw new Error("OpenAI not properly initialized");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: CONFIG.OPENAI.TEMPERATURE,
          max_tokens: CONFIG.OPENAI.MAX_TOKENS
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  }
}

const openAI = new OpenAI();
export default openAI;