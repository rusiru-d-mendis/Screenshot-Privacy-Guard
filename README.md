
# GhostSnap

![Screenshot of the App](Screenshot%202026-01-03%20203501.png)

An intelligent Progressive Web App (PWA) built with React, Vite, and the Gemini API to automatically detect and anonymize sensitive information in screenshots. Protect your privacy with powerful AI-driven detection and intuitive manual editing tools.

---

## ✨ Key Features

-   **🤖 AI-Powered Detection**: Uses the Google Gemini API to automatically find and suggest areas containing Personally Identifiable Information (PII).
-   **🎨 Manual Drawing Tools**: Precisely add anonymized regions using Rectangle, Ellipse, and Freehand drawing tools.
-   **🎭 Multiple Effect Styles**: Choose between a smooth **Blur** or a classic **Pixelate** effect to hide information.
-   **🎚️ Adjustable Intensity**: Fine-tune the effect with sliders to control the blur amount or pixel size.
-   **⏪ Full History Control**: Easily **Undo** and **Redo** any drawing actions.
-   **🖱️ Simple Region Management**: Switch to the **Pointer** tool to select and delete any unwanted regions with a single click.
-   **🔒 Privacy First**: All image processing is done in your browser. The "Auto-detect" feature securely sends your image to the Google Gemini API for analysis.
-   ** PWA Ready**: Installable on any device and works completely **offline** thanks to an auto-generated service worker.
-   **🚀 Zero Backend**: A fully static application that is easy to host on any modern platform.

---

## 🛠️ Tech Stack

-   **Framework**: React, TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS (via CDN)
-   **AI**: Google Gemini API (`@google/genai`)
-   **Offline Support**: Progressive Web App (PWA) via `vite-plugin-pwa`

---

## 🚀 Running Locally

To run this project on your local machine, you need to have Node.js installed.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/ghostsnap.git
    cd ghostsnap
    ```

2.  **Install Dependencies**
    This command reads your `package.json` file and downloads all the necessary tools.
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    Create a file named `.env` in the root of the project directory and add your Google Gemini API key:
    ```
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    This will start the app, typically at `http://localhost:3000`.

---

## ☁️ Deployment (Netlify - Recommended)

This static web app is perfect for services like Netlify.

1.  **Push to GitHub**: Make sure your code is in a GitHub repository.

2.  **Import to Netlify**:
    -   Log in to Netlify and select "Add new site" > "Import an existing project".
    -   Connect to GitHub and choose your `ghostsnap` repository.

3.  **Configure Build Settings & Environment Variables**:
    Netlify will likely detect it's a Vite project. Ensure the settings are:
    -   **Build command**: `npm run build`
    -   **Publish directory**: `dist`
    -   Go to **Site configuration > Environment variables** and add your API key:
        -   **Key**: `API_KEY`
        -   **Value**: `YOUR_GEMINI_API_KEY_HERE`

4.  **Deploy**: Click "Deploy site". Netlify will build and host your PWA.
