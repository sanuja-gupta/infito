
readme = '''# 🤖 Infito — AI-Powered Visual Robotics Companion

> **"Humanity finally getting instructions better than 'some assembly required.'"**

Transform your robotics ideas into real, working projects with interactive visual guidance. Describe your project in plain English, and Infito generates everything you need — components, wiring diagrams, starter code, and 3D assembly views.

![Infito Demo](https://img.shields.io/badge/Demo-Live-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-Flask%20%7C%20Three.js%20%7C%20AI-orange?style=flat-square)

---

## ✨ What It Does

| Feature | Description |
|---------|-------------|
| 📝 **Natural Language Input** | Describe your idea — *"Build an obstacle avoiding robot"* |
| 📦 **Smart Component List** | Auto-generated parts list with cost estimates (INR) |
| 🔌 **Interactive Wiring Guide** | Step-by-step instructions with specific pin numbers |
| 🎨 **Visual Assembly** | **3D GLB models** for supported projects, **2D SVG wiring diagrams** for everything else |
| 💻 **Starter Code** | Complete, beginner-friendly Arduino/Python code with comments |
| 🤖 **AI-Powered** | DeepSeek-V3 backend for intelligent project generation |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js (optional, for frontend dev)
- A [Featherless AI](https://featherless.ai/) API key

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/infito.git
cd infito
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Featherless API key:
# FEATHERLESS_API_KEY=your_key_here
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the App

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🏗️ Project Structure

```
infito/
├── app.py                    # Flask backend + AI generation API
├── index.html                # Frontend (pastel glassmorphism UI)
├── .env                      # API keys & secrets
├── requirements.txt          # Python dependencies
├── js/
│   ├── three-canvas.js       # Three.js 3D GLB viewer
│   ├── wiring-2d.js          # SVG 2D wiring diagram generator
│   └── feedback-form.js      # User feedback handler
├── assets/
│   └── 3d-models/
│       ├── obstacle-robot.glb
│       ├── line-follower.glb
│       └── auto-street-light.glb
└── feedback.json             # Collected user feedback
```

---

## 🎮 Supported Projects

### ✅ Full 3D Assembly View
| Project | 3D Model | Description |
|---------|----------|-------------|
| 🤖 **Obstacle Avoiding Robot** | `obstacle-robot.glb` | Ultrasonic sensor + servo + motors |
| 📏 **Line Follower Robot** | `line-follower.glb` | IR sensors + motor driver |
| 💡 **Auto Street Light** | `auto-street-light.glb` | LDR + relay + LED |

### 📐 2D Wiring Diagram (All Other Projects)
- Temperature Monitoring System
- Smart Water Level Indicator
- Home Security Alarm
- *...and anything else you can imagine!*

> **Note:** 3D models are loaded via Three.js GLTFLoader. For unsupported projects, the 2D wiring diagram is auto-generated from AI wiring instructions using SVG paths.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python, Flask, Featherless AI API (DeepSeek-V3) |
| **Frontend** | Vanilla JS, CSS3 (glassmorphism, animations) |
| **3D Graphics** | Three.js (r128), GLTFLoader, OrbitControls |
| **2D Diagrams** | Custom SVG generator with color-coded wires |
| **Styling** | Pastel color palette, backdrop-filter blur, CSS animations |

---

## 🎨 Design Philosophy

Infito uses a **soft pastel aesthetic** instead of typical dark-mode tech interfaces:

- 🌸 **Blush Pink** — Primary accents
- 🌤️ **Sky Blue** — Secondary highlights
- 🍃 **Mint Green** — Success states
- 💜 **Lavender** — Interactive elements
- 🍑 **Peach** — Warm touches

The UI features floating background shapes, rising particles, glassmorphism cards, and spring-physics animations for a delightful, approachable experience.

---

## 🧠 How It Works

```
User Input ("Obstacle avoiding robot")
        ↓
[Flask API] → [DeepSeek-V3 via Featherless]
        ↓
JSON Response:
  ├── components  (parts + INR costs)
  ├── wiring      (step-by-step pin connections)
  ├── code        (complete Arduino/Python sketch)
  └── image_prompt (for future image gen)
        ↓
[Frontend]
  ├── Render components & code
  ├── Parse wiring → 2D SVG diagram
  └── Match keyword → Load 3D GLB (if available)
```

---

## 🤝 Contributing

This is an MVP/demo project, but contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-thing`
3. Commit your changes: `git commit -m 'Add amazing thing'`
4. Push to the branch: `git push origin feature/amazing-thing`
5. Open a Pull Request

### Ideas for Contributions
- 🆕 Add more 3D GLB models for popular projects
- 🎨 Improve wiring diagram parsing for complex circuits
- 🌐 Add multi-language support
- 📱 Better mobile responsiveness
- 🖼️ Integrate AI image generation for project previews

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License
Copyright (c) 2026 [Your Name]
```

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) community for the amazing 3D library
- [Featherless AI](https://featherless.ai/) for the DeepSeek-V3 API
- All the students and makers who inspired this project

---

<p align="center">
  <b>Built with 💖 for students who dream in circuits</b><br>
  <sub>Star ⭐ this repo if it helped you!</sub>
</p>
'''
