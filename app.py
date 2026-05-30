from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import requests
import json
import os
import time  # <-- FIXED: moved to top

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("FEATHERLESS_API_KEY")
API_URL = "https://api.featherless.ai/v1/chat/completions"
MODEL   = "deepseek-ai/DeepSeek-V3-0324"

SYSTEM_PROMPT = """You are Infito, an AI robotics companion that helps students build real robotics projects.

When given a project idea, respond ONLY with a valid JSON object. No explanation, no markdown, no backticks. Just raw JSON.

The JSON must have exactly these 4 keys:

{
  "components": "A numbered list of required hardware components with estimated cost in INR for each. Include total at the end.",
  "wiring": "Step-by-step wiring instructions. Each step on a new line starting with Step 1:, Step 2: etc. Include specific pin numbers.",
  "code": "Complete beginner-friendly Arduino or Python code with helpful comments explaining each section.",
  "image_prompt": "A detailed image generation prompt describing the assembled project. Clean top-down educational view of the circuit."
}

Rules:
- Always use INR for costs
- Keep language simple, the reader is a student not an engineer
- Wiring steps must include specific pin numbers
- Code must be complete and runnable, not just a snippet"""


# ── Serve frontend ─────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), path)


# ── Generate (single function with retry logic) ────────────
@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    idea = data.get("idea", "").strip()

    if not idea:
        return jsonify({"error": "No project idea provided"}), 400

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL,
                    "max_tokens": 3000,
                    "temperature": 0.7,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": f"Project idea: {idea}"}
                    ]
                },
                timeout=60
            )
            
            if response.status_code == 429:
                wait = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait)
                continue
                
            result = response.json()

            if response.status_code != 200:
                return jsonify({"error": result.get("error", {}).get("message", "API error")}), 500

            raw = result["choices"][0]["message"]["content"].strip()

            # Clean any accidental markdown fences
            cleaned = raw
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)

            return jsonify({
                "success":      True,
                "components":   parsed.get("components", ""),
                "wiring":       parsed.get("wiring", ""),
                "code":         parsed.get("code", ""),
                "image_prompt": parsed.get("image_prompt", "")
            })

        except Exception as e:
            if attempt == max_retries - 1:
                return jsonify({"error": str(e)}), 500
            time.sleep(1)


# ── Feedback ───────────────────────────────────────────────
@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()
    data['timestamp'] = datetime.now().isoformat()
    try:
        with open("feedback.json", "a") as f:
            f.write(json.dumps(data) + "\n")
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"success": True})


# ── Health ─────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Infito backend is running!"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)