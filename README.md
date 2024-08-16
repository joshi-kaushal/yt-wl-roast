# YouTube Watch Later Roast

We all come across random videos that we find interesting and add them in the watch later, never to actually watch them. This is a fun project that roasts you based on your YouTube's watch later playlist.

It uses Google's Gemini as an LLM to generate the roast.

## Tech stack
- TypeScript
- React (Vite)
- Tailwind CSS
- Gemini API

## Setup
1. Clone the Repository: Start by cloning the repository to your local machine.
2. Create an `.env` file: In the root directory of the project, create an `.env` file and add your Gemini API key.
3. Build the Application: Run the build command to compile the app:
```bash
npm run build
```
4. Load the Extension:
  - Open Chrome or any Chromium-based browser.
  - Navigate to the extensions settings.
  - Click on "Load unpacked."
  - Select the dist folder created during the build process.