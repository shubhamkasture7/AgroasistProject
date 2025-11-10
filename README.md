<h1 align="center">🌾 AgroAssist — Intelligent Farming Assistant</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-React.js-61DAFB?logo=react&style=flat" />
  <img src="https://img.shields.io/badge/Backend-Firebase-orange?logo=firebase&style=flat" />
  <img src="https://img.shields.io/badge/AI-Gemini%202.5-blueviolet?logo=google&style=flat" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&style=flat" />
  <img src="https://img.shields.io/badge/UI-TailwindCSS-38B2AC?logo=tailwindcss&style=flat" />
</p>

<p align="center">
  🌱 <b>AgroAssist</b> is an AI-powered smart assistant for farmers — combining <b>weather forecasting</b>, <b>pesticide tracking</b>, and <b>AI crop analysis</b> using Google Gemini.<br/>
  Designed to empower agriculture with simplicity, intelligence, and accessibility in local languages.
</p>

---

## 🚀 Features

### 🧑‍🌾 Farmer Portal  
- 🔐 Secure Login & Registration using **Firebase Authentication** (Email + Google)
- 👤 Personalized greeting using Firestore profile data
- 🔁 Session persistence with “Remember Me”  

### ☀️ Smart Weather Dashboard  
- 📍 Auto-detects user location with fallback to Mumbai  
- 🌦️ Shows **current weather**, **humidity**, **wind speed**, and **rainfall**  
- 📅 3-day forecast with condition icons  
- 🧭 Powered by **OpenWeather API**

### 🧴 Pesticide Log (Firestore-only)  
- ✏️ Add pesticide usage logs with name, description, and date  
- 📷 Upload and compress images directly — stored as Base64 (no Storage used)  
- 👩‍🌾 Each log auto-includes farmer name, UID, and date  
- 🕑 Displays last 10 recent logs with thumbnails  

### 🤖 AI Crop Analyzer (Marathi + Gemini AI)  
- 🪴 Upload crop/leaf image + describe issue (in any language)  
- 🧠 Google **Gemini 2.5 Flash** diagnoses disease, pest, or deficiency  
- 📊 Returns structured JSON (schema-validated) with:  
  ```json
  {
    "diagnosis": "पानांवर अर्ली ब्लाईट (Alternaria solani)",
    "confidence": 0.92,
    "probable_causes": ["ओलसर हवामान", "जास्त सिंचन", "कमी नत्र"],
    "severity": "high",
    "recommended_actions": [
      "बुरशीनाशक स्प्रे करा: मँकोझेब 75% WP",
      "संक्रमित पाने काढून टाका"
    ],
    "need_expert": false
  }
