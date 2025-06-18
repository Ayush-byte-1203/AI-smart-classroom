document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textQuery = document.getElementById('text-query');
    const submitTextBtn = document.getElementById('submit-text');
    const startVoiceBtn = document.getElementById('start-voice');
    const responseText = document.getElementById('response-text');
    const chartContainer = document.getElementById('chart-container');
    const voiceStatus = document.getElementById('voice-status');
    const apiKeyInput = document.getElementById('api-key');

    // Speech Synthesis
    const synth = window.speechSynthesis;
    let isSpeaking = false;

    // Load API key from localStorage if available
    if (localStorage.getItem('openai_key')) {
      apiKeyInput.value = localStorage.getItem('openai_key');
    }

    // Save API key to localStorage when changed
    apiKeyInput.addEventListener('change', () => {
      localStorage.setItem('openai_key', apiKeyInput.value);
    });

    // Generate response using OpenAI API
    async function generateResponse(query) {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        return "Please enter your OpenAI API key to get responses.";
      }
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful classroom assistant for students and teachers. Provide clear, concise explanations suitable for an educational setting. When appropriate, suggest that a visual aid might be helpful."
              },
              {
                role: "user",
                content: query
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error);
        return `Sorry, I encountered an error: ${error.message}. Please check your API key and try again.`;
      }
    }

    // Add response to the UI and speak it
    function addResponse(text) {
      responseText.textContent = text;
      chartContainer.hidden = !text.toLowerCase().includes('visual aid');
      speakText(text);
    }

    // Speak text using speech synthesis
    function speakText(text) {
      if (!synth) {
        console.warn('Speech synthesis not supported');
        return;
      }
      
      if (isSpeaking) {
        synth.cancel();
      }
      
      const utterThis = new SpeechSynthesisUtterance(text);
      utterThis.pitch = 1.0;
      utterThis.rate = 1.1;
      
      utterThis.onstart = () => {
        isSpeaking = true;
      };
      
      utterThis.onend = () => {
        isSpeaking = false;
      };
      
      synth.speak(utterThis);
    }

    // Handle query submission
    async function handleQuery(query) {
      if (!query) return;
      
      // Disable buttons during processing
      submitTextBtn.disabled = true;
      startVoiceBtn.disabled = true;
      responseText.textContent = "Processing your request...";
      
      try {
        const response = await generateResponse(query);
        addResponse(response);
        
        // Show chart placeholder if response suggests a visual
        if (response.toLowerCase().includes('visual aid') || 
            response.toLowerCase().includes('chart') || 
            response.toLowerCase().includes('diagram')) {
          showChartPlaceholder();
        }
      } catch (error) {
        addResponse(`Error: ${error.message}`);
      } finally {
        submitTextBtn.disabled = false;
        startVoiceBtn.disabled = false;
      }
    }

    // Show a placeholder for charts/visual aids
    function showChartPlaceholder() {
      chartContainer.hidden = false;
      const canvas = document.getElementById('chart');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Clear and draw placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '16px Arial';
      ctx.fillText('Visual representation would appear here', canvas.width/2, canvas.height/2);
    }

    // Text query submission
    submitTextBtn.addEventListener('click', () => {
      const query = textQuery.value.trim();
      handleQuery(query);
    });

    // Also allow Enter key in textarea to submit
    textQuery.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const query = textQuery.value.trim();
        handleQuery(query);
      }
    });

    // Speech recognition setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        voiceStatus.textContent = 'Listening... Speak now.';
        startVoiceBtn.textContent = '🛑 Stop';
        submitTextBtn.disabled = true;
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        voiceStatus.textContent = 'Recognized: ' + transcript;
        textQuery.value = transcript;
        await handleQuery(transcript);
      };

      recognition.onerror = (event) => {
        voiceStatus.textContent = 'Error: ' + event.error;
        submitTextBtn.disabled = false;
      };

      recognition.onend = () => {
        if (startVoiceBtn.textContent === '🛑 Stop') {
          voiceStatus.textContent = 'Voice recognition stopped.';
          startVoiceBtn.textContent = '🎙️ Start';
          submitTextBtn.disabled = false;
        }
      };

      startVoiceBtn.addEventListener('click', () => {
        if (startVoiceBtn.textContent === '🎙️ Start') {
          recognition.start();
        } else {
          recognition.stop();
        }
      });
    } else {
      startVoiceBtn.disabled = true;
      voiceStatus.textContent = 'Speech recognition not supported in your browser.';
    }
  });