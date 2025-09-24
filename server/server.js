const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// TTS API endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'Google Cloud API key not configured' });
    }

    const ttsRequest = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Studio-O', // Zephyr voice
        ssmlGender: 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 0.9,
        effectsProfileId: ['small-bluetooth-speaker-class-device']
      }
    };

    console.log('Making TTS API call for text:', text.substring(0, 50) + '...');

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      ttsRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.audioContent) {
      console.log('TTS API call successful');
      res.json({
        success: true,
        audioContent: response.data.audioContent
      });
    } else {
      throw new Error('No audio content received from TTS API');
    }

  } catch (error) {
    console.error('TTS API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.response?.data || error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TTS Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
