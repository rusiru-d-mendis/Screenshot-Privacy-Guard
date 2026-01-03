
# Screenshot Privacy Guard

![Screenshot of the App](https://github.com/rusiru-d-mendis/Screenshot-Privacy-Guard/blob/main/Screenshot%202026-01-03%20202454.png))

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
-   ** PWA Ready**: Installable on any device (desktop or mobile) and works completely **offline** after the first visit, thanks to its service worker.
-   **🚀 Zero Backend**: A fully static application that is easy to host on any modern platform.

---

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS (via CDN)
-   **AI**: Google Gemini API (`@google/genai`)
-   **Offline Support**: Progressive Web App (PWA) via Service Workers

---

## 🚀 How to Use

1.  **Upload Image**: Click "Upload Image" to select a screenshot from your device.
2.  **Auto-Detect (Optional)**: Click "Auto-detect PII" to let the AI find sensitive data.
3.  **Manual Edit**:
    -   Select a drawing tool (Rectangle, Ellipse, Freehand).
    -   Choose your preferred effect (Blur/Pixelate) and adjust its intensity.
    -   Draw directly on the image to add anonymized areas.
4.  **Manage Regions**: Switch to the Pointer tool to click and delete any unwanted regions.
5.  **Download**: Once you're happy with the result, click "Download" to save the protected image to your device.

---

## 💻 Running Locally

To run this project on your local machine, follow these steps:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/screenshot-privacy-guard.git
    cd screenshot-privacy-guard
    ```

2.  **Set Up Environment Variables**
    This project requires a Google Gemini API key. Create a file named `.env` in the root of the project directory.

    > **Note:** The local development server setup doesn't automatically load `.env` files. When running locally, the `process.env.API_KEY` will be `undefined`. You will need to manually replace `process.env.API_KEY` in `services/geminiService.ts` with your key **for local testing only**. Remember to **never** commit your API key to Git. The `.env` setup is primarily for deployment on platforms that support it.

3.  **Serve the Files**
    Since this is a static application with no build step, you can use any simple HTTP server.

    **Using Python:**
    ```bash
    python -m http.server
    ```
    This will serve the app at `http://localhost:8000`.

    **Using Node.js (`serve` package):**
    ```bash
    npx serve
    ```
    This will serve the app on a local port (usually `http://localhost:3000`).

4.  **Open in Browser**
    Open the URL provided by your local server to view the application.

---

## ☁️ Deployment

This is a static web application and can be deployed to any static hosting service.

**Recommended Providers:**
-   [Netlify](https://www.netlify.com/)
-   [Vercel](https://vercel.com/)
-   [GitHub Pages](https://pages.github.com/)
-   [Firebase Hosting](https://firebase.google.com/docs/hosting)

**Deployment Steps (Example using Netlify):**

1.  Push your code to a GitHub repository.
2.  Sign up for Netlify and connect your GitHub account.
3.  Import your project from the GitHub repository.
4.  **Configure Environment Variables**:
    -   In your Netlify site's settings, go to `Site configuration > Environment variables`.
    -   Add a new variable:
        -   **Key**: `API_KEY`
        -   **Value**: `YOUR_GEMINI_API_KEY`
5.  **Configure Build Settings**:
    -   **Build command**: Leave this blank.
    -   **Publish directory**: `.` (or the root of your project).
6.  Click "Deploy site". Netlify will host your PWA and make it available online.
