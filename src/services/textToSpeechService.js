import axios from 'axios';

const API_KEY = process.env.REACT_APP_GOOGLE_TTS_API_KEY;
const API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Maximum number of retry attempts for API calls
const MAX_RETRIES = 3;
// Initial delay in ms before retrying (will increase with backoff)
const INITIAL_RETRY_DELAY = 1000;

/**
 * Makes an API call with retry logic for handling rate limiting
 * @param {Function} apiCall - Function that makes the actual API call
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay in ms before retrying
 * @returns {Promise} - Result of the API call
 */
const callWithRetry = async (apiCall, maxRetries = MAX_RETRIES, initialDelay = INITIAL_RETRY_DELAY) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Attempt the API call
            return await apiCall();
        } catch (error) {
            lastError = error;

            // Check if this is a rate limiting error (HTTP 429) or quota exceeded error
            const isRateLimited = error.response &&
                (error.response.status === 429 ||
                    (error.response.status === 403 && error.response.data &&
                        error.response.data.error &&
                        error.response.data.error.message &&
                        error.response.data.error.message.includes('quota')));

            // If it's the last attempt or not a rate limiting error, throw the error
            if (attempt >= maxRetries || !isRateLimited) {
                throw error;
            }

            // Calculate backoff delay with exponential backoff
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`API rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError; // This should not happen but just in case
};

/**
 * Synthesizes speech from text using Google Cloud Text-to-Speech API
 * @param {string} text - The text to synthesize
 * @param {Object} voice - Voice parameters (name, languageCode, etc.)
 * @param {Object} audioConfig - Audio configuration parameters
 * @returns {Promise<string>} - Base64 encoded audio content
 */
export const synthesizeSpeech = async (text, voice, audioConfig) => {
    try {
        console.log(`Synthesizing speech for text (${text.length} characters)`);

        // Split text into chunks if it's too long (max 5000 chars per request)
        const textChunks = splitTextIntoChunks(text, 4800);
        console.log(`Split text into ${textChunks.length} chunks`);

        let audioChunks = [];

        // Process each chunk with delay between requests to avoid rate limiting
        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} characters)`);

            // Add a delay between chunks to prevent rate limiting
            if (i > 0) {
                console.log('Adding delay between API calls to prevent rate limiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const response = await callWithRetry(async () => {
                return axios.post(
                    `${API_URL}?key=${API_KEY}`,
                    {
                        input: { text: chunk },
                        voice: voice || {
                            languageCode: 'en-US',
                            name: 'en-US-Neural2-D', // Default to a neutral voice
                            ssmlGender: 'NEUTRAL'
                        },
                        audioConfig: audioConfig || {
                            audioEncoding: 'MP3',
                            speakingRate: 1.0,
                            pitch: 0.0
                        }
                    }
                );
            });

            audioChunks.push(response.data.audioContent);
            console.log(`Successfully generated audio for chunk ${i + 1}`);
        }

        // If we have multiple chunks, combine them
        if (audioChunks.length > 1) {
            console.log('Combining multiple audio chunks...');
            return combineAudioChunks(audioChunks);
        }

        console.log(`Speech synthesis complete with ${audioChunks.length} chunks`);
        return audioChunks[0];
    } catch (error) {
        console.error('Error synthesizing speech:', error);

        // More descriptive error message
        if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);

            // Provide more helpful error message for common issues
            if (error.response.status === 403) {
                throw new Error('API key may be invalid or missing permissions for Text-to-Speech API');
            } else if (error.response.status === 429) {
                throw new Error('Text-to-Speech API rate limit exceeded. Please try again later.');
            }
        }

        throw error;
    }
};

/**
 * Processes a script with multiple speakers and generates audio with different voices
 * @param {string} script - The full script with speaker markers like "**Host:**"
 * @returns {Promise<string>} - Base64 encoded audio content
 */
export const synthesizeMultiVoiceScript = async (script) => {
    try {
        console.log('Processing multi-voice script');

        // Parse script into segments by speaker
        const segments = parseScriptSegments(script);
        console.log(`Found ${segments.length} segments in script`);

        // Voice configurations for different speakers
        const voiceConfigs = {
            'Host': {
                languageCode: 'en-US',
                name: 'en-US-Chirp3-HD-Achird'
            },
            'Speaker': {
                languageCode: 'en-US',
                name: 'en-US-Chirp3-HD-Kore'
            },
            'Guest': {
                languageCode: 'en-US',
                name: 'en-US-Neural2-C', // Alternative voice for guest
                ssmlGender: 'FEMALE'
            }
        };

        // Default audio config
        const audioConfig = {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0
        };

        // Create audio for each segment
        let audioSegments = [];

        // Process only a limited number of segments for reliability
        // Increase the limit to accommodate longer scripts (4-minute podcast)
        let processedSegmentsCount = 0;
        const maxSegmentsToProcess = 500; // Increased from 5 to 50 to handle longer scripts

        for (const segment of segments) {
            // Skip sound effect markers - we'll handle these differently
            if (segment.type === 'sound') {
                console.log(`Skipping sound effect: ${segment.text}`);
                continue;
            }

            // Limit the number of segments we process to avoid API issues
            if (processedSegmentsCount >= maxSegmentsToProcess) {
                console.log(`Limiting to ${maxSegmentsToProcess} segments to ensure reliability`);
                break;
            }

            // Get appropriate voice for this speaker
            let voice = voiceConfigs['Host']; // Default to host voice

            if (segment.speaker && voiceConfigs[segment.speaker]) {
                voice = voiceConfigs[segment.speaker];
            }

            // Adjust audio config for this segment
            let segmentAudioConfig = { ...audioConfig };

            // Add a slight pause after each segment for natural conversation flow
            const textWithPause = segment.text + '...';

            try {
                // Generate audio for this segment
                console.log(`Generating audio for segment by ${segment.speaker || 'unknown'}`);
                const audioContent = await synthesizeSpeech(textWithPause, voice, segmentAudioConfig);
                audioSegments.push(audioContent);
                processedSegmentsCount++;
            } catch (error) {
                console.error(`Error generating audio for segment: ${segment.text.substring(0, 50)}...`, error);
            }
        }

        // If we have multiple segments, merge them
        if (audioSegments.length > 1) {
            console.log(`Merging ${audioSegments.length} audio segments...`);
            return combineAudioChunks(audioSegments);
        } else if (audioSegments.length === 1) {
            return audioSegments[0];
        } else {
            throw new Error('No audio segments were successfully generated');
        }
    } catch (error) {
        console.error('Error processing multi-voice script:', error);
        throw error;
    }
};

/**
 * Combines multiple base64-encoded audio chunks into a single base64 string
 * @param {Array<string>} audioChunks - Array of base64-encoded audio chunks
 * @returns {string} - Combined base64-encoded audio
 */
const combineAudioChunks = (audioChunks) => {
    try {
        console.log(`Combining ${audioChunks.length} audio chunks`);

        // For MP3 files, we can often just concatenate the decoded binary data
        // Note: This is a simple approach that works for MP3 in many cases
        // A more robust solution would use Web Audio API or a dedicated audio library

        // Convert all base64 chunks to binary
        const binaryChunks = audioChunks.map(base64 => {
            try {
                return base64ToArrayBuffer(base64);
            } catch (error) {
                console.error("Error decoding base64 chunk:", error);
                return null;
            }
        }).filter(chunk => chunk !== null); // Remove any failed chunks

        // Check if we have any valid chunks
        if (binaryChunks.length === 0) {
            console.error("No valid audio chunks to combine");
            // Return the first original chunk as fallback
            return audioChunks[0];
        }

        // Simple concatenation of binary chunks
        // Determine total length
        const totalLength = binaryChunks.reduce((total, chunk) => total + chunk.byteLength, 0);

        // Create a new buffer with the total size
        const combinedBuffer = new ArrayBuffer(totalLength);
        const combinedView = new Uint8Array(combinedBuffer);

        // Copy each chunk into the combined buffer
        let offset = 0;
        for (const chunk of binaryChunks) {
            const chunkView = new Uint8Array(chunk);
            combinedView.set(chunkView, offset);
            offset += chunk.byteLength;
        }

        // Convert back to base64
        const base64Combined = arrayBufferToBase64(combinedBuffer);

        console.log(`Successfully combined ${binaryChunks.length} audio chunks`);
        return base64Combined;
    } catch (error) {
        console.error("Error combining audio chunks:", error);
        // Fallback to just returning the first chunk if combination fails
        console.log("Falling back to returning only the first audio chunk");
        return audioChunks[0];
    }
};

/**
 * Convert a base64 string to an ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} - Decoded array buffer
 */
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * Convert an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - Array buffer to convert
 * @returns {string} - Base64 encoded string
 */
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

/**
 * Parse a podcast script into segments by speaker
 * @param {string} script - Full script text
 * @returns {Array} - Array of segment objects with speaker and text
 */
const parseScriptSegments = (script) => {
    const segments = [];

    // Ensure script is a string to prevent "split is not a function" error
    if (!script || typeof script !== 'string') {
        console.error('Invalid script format. Expected string but got:', typeof script);
        // Return empty segments if script is not valid
        return segments;
    }

    // Look for speaker markers like "**Host:**" or sound effect markers like "[Intro Music]"
    const lines = script.split('\n');
    let currentSpeaker = '';
    let currentText = '';

    for (const line of lines) {
        // Check for sound effect marker [...]
        if (line.match(/^\[.*\]$/)) {
            // If we have accumulated text from previous speaker, save it
            if (currentText.trim()) {
                segments.push({
                    type: 'speech',
                    speaker: currentSpeaker,
                    text: currentText.trim()
                });
                currentText = '';
            }

            // Add sound effect marker
            segments.push({
                type: 'sound',
                text: line
            });
            continue;
        }

        // Check for speaker change with "**Speaker:**" pattern
        const speakerMatch = line.match(/^\*\*(.*?):\*\*/);
        if (speakerMatch) {
            // If we have accumulated text from previous speaker, save it
            if (currentText.trim()) {
                segments.push({
                    type: 'speech',
                    speaker: currentSpeaker,
                    text: currentText.trim()
                });
            }

            // Start new speaker segment
            currentSpeaker = speakerMatch[1];
            currentText = line.replace(/^\*\*(.*?):\*\*\s*/, '');
        } else {
            // Continue with current speaker
            currentText += ' ' + line;
        }
    }

    // Don't forget the last segment
    if (currentText.trim()) {
        segments.push({
            type: 'speech',
            speaker: currentSpeaker,
            text: currentText.trim()
        });
    }

    return segments;
};

/**
 * Split text into chunks of specified maximum length
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length of each chunk
 * @returns {Array<string>} - Array of text chunks
 */
const splitTextIntoChunks = (text, maxLength = 4800) => {
    const chunks = [];

    // Simple split by sentences and then combine until reaching maxLength
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
};