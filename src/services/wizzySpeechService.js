import axios from 'axios';

const API_KEY = process.env.REACT_APP_GOOGLE_TTS_API_KEY;
const API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// TTS Service for Wizzy character speech
class WizzySpeechService {
    constructor() {
        this.cache = new Map();
        this.isPlaying = false;
        this.currentAudio = null;

        if (!API_KEY) {
            console.warn('Google Cloud API key not found. TTS functionality will be disabled.');
        }
    }

    // Generate cache key for text
    getCacheKey(text) {
        return `wizzy_speech_${text.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}`;
    }

    // Check if audio is cached in localStorage
    getCachedAudio(text) {
        const cacheKey = this.getCacheKey(text);
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                console.log('Using cached audio for Wizzy speech');
                return cached;
            }
        } catch (error) {
            console.warn('Error accessing localStorage cache:', error);
        }
        return null;
    }

    // Cache audio in localStorage
    setCachedAudio(text, audioContent) {
        const cacheKey = this.getCacheKey(text);
        try {
            localStorage.setItem(cacheKey, audioContent);
            console.log('Cached Wizzy speech audio');
        } catch (error) {
            console.warn('Error caching audio to localStorage:', error);
            // If localStorage is full, try to clear old cache
            this.clearOldCache();
        }
    }

    // Clear old cached audio to make space
    clearOldCache() {
        const keys = Object.keys(localStorage);
        const wizzyKeys = keys.filter(key => key.startsWith('wizzy_speech_'));

        // Remove oldest cache entries (simple approach)
        if (wizzyKeys.length > 10) {
            const toRemove = wizzyKeys.slice(0, wizzyKeys.length - 10);
            toRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.warn('Error removing cached audio:', error);
                }
            });
        }
    }

    // Generate speech using Google Cloud TTS API
    async generateSpeech(text) {
        if (!API_KEY) {
            throw new Error('Google Cloud API key not configured');
        }

        // Check cache first
        const cachedAudio = this.getCachedAudio(text);
        if (cachedAudio) {
            return cachedAudio;
        }

        try {
            console.log('Generating Wizzy speech for:', text.substring(0, 50) + '...');

            const response = await axios.post(
                `${API_URL}?key=${API_KEY}`,
                {
                    input: { text },
                    voice: {
                        languageCode: "it-IT",
                        name: 'it-IT-Chirp3-HD-Achernar'
                    },
                    audioConfig: {
                        audioEncoding: 'LINEAR16',
                        pitch: 0.0,
                        speakingRate: 1
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.audioContent) {
                // Cache the audio
                this.setCachedAudio(text, response.data.audioContent);
                console.log('Successfully generated Wizzy speech');
                return response.data.audioContent;
            } else {
                throw new Error('No audio content received from TTS API');
            }

        } catch (error) {
            console.error('Wizzy TTS Error:', error.response?.data || error.message);
            throw new Error(`Failed to generate Wizzy speech: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // Play speech with synchronized text animation
    async playSpeechWithAnimation(text, animationCallback) {
        try {
            // Stop any currently playing audio
            this.stopSpeech();

            // Get audio content
            const audioContent = await this.generateSpeech(text);

            // Create audio blob
            const audioBlob = this.base64ToBlob(audioContent, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create audio element
            this.currentAudio = new Audio(audioUrl);
            this.isPlaying = true;

            // Calculate timing for text animation
            const words = text.split(' ');
            const estimatedDuration = this.estimateAudioDuration(text);
            const wordDelay = estimatedDuration / words.length;

            console.log(`Starting Wizzy speech animation for ${words.length} words over ${estimatedDuration}ms`);

            // Wait for audio to actually start playing before starting text animation
            const startTextAnimation = () => {
                if (animationCallback) {
                    console.log('Starting synchronized text animation with audio');
                    this.animateText(words, wordDelay, animationCallback);
                }
            };

            // Add event listener for when audio actually starts playing
            this.currentAudio.addEventListener('playing', startTextAnimation, { once: true });

            // Start audio playback
            const playPromise = this.currentAudio.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Audio playback failed:', error);
                    this.isPlaying = false;
                    // Still start text animation as fallback
                    startTextAnimation();
                });
            }

            // Handle audio end
            this.currentAudio.addEventListener('ended', () => {
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                console.log('Wizzy speech playback completed');
            });

            this.currentAudio.addEventListener('error', (error) => {
                console.error('Audio playback error:', error);
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
            });

        } catch (error) {
            console.error('Error playing Wizzy speech:', error);
            this.isPlaying = false;
            throw error;
        }
    }

    // Animate text word by word
    async animateText(words, wordDelay, callback) {
        let currentText = '';

        for (let i = 0; i < words.length; i++) {
            if (!this.isPlaying) break; // Stop if audio was stopped

            currentText += (i > 0 ? ' ' : '') + words[i];

            if (callback) {
                callback(currentText, i / words.length); // Pass progress percentage
            }

            await new Promise(resolve => setTimeout(resolve, wordDelay));
        }
    }

    // Estimate audio duration based on text length and speaking rate
    estimateAudioDuration(text) {
        // Average speaking rate: ~150 words per minute at normal speed (1.0)
        const wordsPerMinute = 150 * 1.0;
        const words = text.split(' ').length;
        const estimatedMinutes = words / wordsPerMinute;
        return estimatedMinutes * 60 * 1000; // Convert to milliseconds
    }

    // Convert base64 to blob
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Stop current speech
    stopSpeech() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;
    }

    // Check if speech is currently playing
    isSpeechPlaying() {
        return this.isPlaying;
    }

    // Get quick speech for short texts (no caching)
    async getQuickSpeech(text) {
        if (!API_KEY) {
            throw new Error('Google Cloud API key not configured');
        }

        try {
            const response = await axios.post(
                `${API_URL}?key=${API_KEY}`,
                {
                    input: { text },
                    voice: {
                        languageCode: 'en-US',
                        name: 'en-US-Chirp3-HD-Puck'
                    },
                    audioConfig: {
                        audioEncoding: 'LINEAR16',
                        pitch: 2.0,
                        speakingRate: 1
                    }
                }
            );

            return response.data.audioContent;
        } catch (error) {
            console.error('Quick speech generation failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new WizzySpeechService();
