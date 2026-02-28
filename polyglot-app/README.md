# Polyglot Transformer — Local AI Edition

A multi-language code translator powered by your local GPU via Ollama.
No subscriptions, no API keys, no internet required after setup.

---

## Prerequisites (one-time setup)

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install Ollama
Download from https://ollama.com/download/windows

### 3. Download a model
Open PowerShell and run:
```
ollama pull codestral:22b
```
This downloads ~14GB — do it once, then it lives on your PC forever.

---

## Running the app in development

```powershell
cd polyglot-app
npm install
npm start
```

---

## Building the .exe installer

```powershell
cd polyglot-app
npm install
npm run build
```

Your installer will be at: `dist/Polyglot Transformer Setup 1.0.0.exe`

Double-click it to install, then launch from your desktop shortcut.

---

## How it works

- Ollama runs silently in your system tray (starts on boot)
- The app talks to it at http://localhost:11434
- Your GPU only loads the model when you actually use the app
- When idle, GPU is fully free for games/other tasks

---

## Recommended models for RTX 3080 16GB

| Model                    | Command                              | Notes              |
|--------------------------|--------------------------------------|--------------------|
| Codestral 22B ⭐         | `ollama pull codestral:22b`          | Best quality       |
| DeepSeek Coder V2 16B    | `ollama pull deepseek-coder-v2:16b`  | Excellent coder    |
| Qwen 2.5 Coder 14B       | `ollama pull qwen2.5-coder:14b`      | Fast & capable     |
| Qwen 2.5 Coder 7B        | `ollama pull qwen2.5-coder:7b`       | Lightweight        |

---

## Troubleshooting

**App says Ollama not found:**
- Make sure Ollama is installed and running (check system tray)
- Try running `ollama serve` in PowerShell manually

**Model not showing up:**
- Run `ollama list` in PowerShell to see downloaded models
- Pull a model with `ollama pull <model-name>`

**Slow responses:**
- First request after idle takes 3–5s (loading into VRAM) — normal
- Subsequent requests are faster
