from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from threading import Lock

app = Flask(__name__)
model_lock = Lock()

# Use Qwen1.5-7B instead (fully supported)
model_name = "Qwen/Qwen1.5-7B"
device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading model {model_name} on {device}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    device_map="auto"
).eval()
print("Model loaded successfully")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    text = data.get('text', '')
    parameters = data.get('parameters', {})
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        with model_lock:
            inputs = tokenizer(text, return_tensors="pt").to(device)
            outputs = model.generate(
                **inputs,
                max_new_tokens=parameters.get('max_new_tokens', 200),
                temperature=parameters.get('temperature', 0.7),
                do_sample=True
            )
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)