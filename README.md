
# GhostSnap

![Screenshot of the App](https://i.imgur.com/8aVz32x.png)

An intelligent Progressive Web App (PWA) built with React and the Gemini API to automatically detect and anonymize sensitive information in screenshots. Protect your privacy with powerful AI-driven detection and intuitive manual editing tools.

---

## ✨ Key Features

-   **🤖 AI-Powered Detection**: Uses the Google Gemini API to automatically find and suggest areas containing Personally Identifiable Information (PII) like names, emails, faces, addresses, and more.
-   **🎨 Manual Drawing Tools**: Precisely add anonymized regions using Rectangle, Ellipse, and Freehand drawing tools.
-   **🎭 Multiple Effect Styles**: Choose between a smooth **Blur** or a classic **Pixelate** effect to hide information.
-   **🎚️ Adjustable Intensity**: Fine-tune the effect with sliders to control the blur amount or pixel size.
-   **⏪ Full History Control**: Easily **Undo** and **Redo** any drawing actions.
-   **🖱️ Simple Region Management**: Switch to the **Pointer** tool to select and delete any unwanted regions with a single click.
-   **🔒 Privacy First**: All image processing is done entirely in your browser. Only the "Auto-detect" feature sends your image to the Google Gemini API for analysis.
-   ** PWA Ready**: Installable on any device (desktop or mobile) and works completely **offline** after the first visit, thanks to its auto-generated service worker.
-   **🚀 Zero Backend**: A fully static application that is easy to host on any modern platform.

---

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS (via CDN)
-   **AI**: Google Gemini API (`@google/genai`)
-   **Offline Support**: Progressive Web App (PWA) via `vite-plugin-pwa`

---

## 💻 Running Locally

To run this project on your local machine, you need to have [Node.js](https://nodejs.org/) and `npm` installed.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/ghostsnap.git
    cd ghostsnap
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    Create a new file named `.env` in the root of the project directory and add your Google Gemini API key:
    ```
    VITE_API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, typically at `http://localhost:5173`.

---

## ☁️ Deployment (Netlify)

This static web application can be deployed to any modern hosting service like Netlify, Vercel, or GitHub Pages.

1.  Push your code to a GitHub repository.
2.  Sign up for Netlify and import your project from the GitHub repository.
3.  **Configure Environment Variables**:
    -   In your Netlify site's settings, go to `Site configuration > Environment variables`.
    -   Add a new variable:
        -   **Key**: `VITE_API_KEY`
        -   **Value**: `YOUR_GEMINI_API_KEY`
4.  **Configure Build Settings**:
    -   **Build command**: `npm run build`
    -   **Publish directory**: `dist`
5.  Click "Deploy site". Netlify will now build your project from the source and deploy the optimized output from the `dist` directory.
