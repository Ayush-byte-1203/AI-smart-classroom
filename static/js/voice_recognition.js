let recognition;
let isListening = false;

document.getElementById('start-voice').addEventListener('click', startVoiceRecognition);
document.getElementById('stop-voice').addEventListener('click', stopVoiceRecognition);

function startVoiceRecognition() {
    const voiceStatus = document.getElementById('voice-status');
    
    try {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isListening = true;
            voiceStatus.textContent = "Listening... Speak now.";
            document.getElementById('start-voice').style.display = 'none';
            document.getElementById('stop-voice').style.display = 'inline-block';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('text-query').value = transcript;
            voiceStatus.textContent = "Processing your question...";
            document.getElementById('submit-text').click();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            voiceStatus.textContent = `Error: ${event.error}`;
            stopVoiceRecognition();
        };

        recognition.onend = function() {
            if (isListening) {
                recognition.start();
            }
        };

        recognition.start();
    } catch (error) {
        console.error('Speech recognition not supported', error);
        voiceStatus.textContent = "Speech recognition not supported in your browser.";
    }
}

function stopVoiceRecognition() {
    if (recognition) {
        isListening = false;
        recognition.stop();
        document.getElementById('start-voice').style.display = 'inline-block';
        document.getElementById('stop-voice').style.display = 'none';
        document.getElementById('voice-status').textContent = "Voice recognition stopped.";
    }
}