
# LiquidUpscale (Banana Pro Edition)

A premium AI image upscaler and editor featuring a "Dark Liquid Glass" aesthetic.
Powered by:
- **Replicate Real-ESRGAN** (for Upscaling)
- **Google Gemini 2.5 ("Banana Pro")** (for Intelligent Editing & Outpainting)

## Features

- **High-Fidelity Upscaling:** Up to 10x resolution using Real-ESRGAN.
- **Banana Pro Edit:** "Zoom Out" / Outpaint images to expand their background using Generative AI.
- **Face Enhancement:** Optional GFPGAN integration.
- **Liquid Glass UI:** Responsive dark mode aesthetic with animated modal drawers.

## 🚀 How to Download and Test on Your PC

To run this application locally on your machine, follow these steps:

### 1. Prerequisites
Ensure you have **Node.js** installed (Version 18+ recommended).
Download it here: [https://nodejs.org/](https://nodejs.org/)

### 2. Download the Code
Since this is a generated project, you need to save the files to a folder.
1. Create a new folder named `liquid-upscale`.
2. Save the files provided (e.g., `package.json`, `index.html`, `App.tsx`, `server/index.js`, etc.) into that folder, maintaining the folder structure (e.g., create a `server` folder for `index.js`).

### 3. Install Dependencies
Open your terminal (Command Prompt or Terminal) in the `liquid-upscale` folder and run:
```bash
npm install
```

### 4. Configure API Keys
Create a file named `.env` in the root folder and add your API keys:
```
REPLICATE_API_TOKEN=your_replicate_token_here
API_KEY=your_google_gemini_api_key_here
PORT=3001
```
*   Get a Replicate token: [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
*   Get a Google Gemini API key: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 5. Run the App
Start both the backend server and the frontend interface:
```bash
npm start
```
This command runs `concurrently "npm run server" "npm run dev"`.

### 6. Usage
Open your browser and go to:
[http://localhost:5173](http://localhost:5173)

## Troubleshooting
- **Missing dependencies?** Run `npm install` again.
- **Server error?** Check if port 3001 is available.
- **"Banana Pro" not working?** Ensure your `API_KEY` in `.env` is valid and has access to Gemini models.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion.
- **Backend:** Node.js, Express.
- **AI:** Replicate API, Google GenAI SDK.
