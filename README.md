# Podcast Journey Creator

A web application that creates personalized podcast journeys using Google Cloud Text-to-Speech and Gemini 2.5 Pro.

## Features

- Create personalized podcast series on any topic
- Tailor content to your experience level
- Focus on theory, practical examples, or a balanced approach
- Customize episode length and number of episodes
- Listen to episodes with a Spotify-like player interface
- Save your podcast journeys for later listening

## Tech Stack

- React.js with React Router for navigation
- Material-UI for the UI components
- Google Cloud Text-to-Speech for audio generation
- Gemini 2.5 Pro for content generation
- Local Storage for saving podcast journeys

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud API key with Text-to-Speech enabled
- Gemini 2.5 Pro API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd podcast-journey-creator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
REACT_APP_GOOGLE_TTS_API_KEY=your-google-cloud-api-key
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Create Your Podcast Journey" on the homepage
2. Enter a topic you want to learn about
3. Select your experience level (beginner, intermediate, advanced)
4. Choose what you want to focus on (theory, practical examples, or balanced)
5. Set your preferred episode length and number of episodes
6. Click "Generate Podcast" to create your personalized podcast journey
7. Wait while the content and audio are being generated
8. Enjoy your personalized podcast series with Spotify-like controls

## License

MIT

## Acknowledgments

- Google Cloud for the Text-to-Speech API
- Google for the Gemini 2.5 Pro API