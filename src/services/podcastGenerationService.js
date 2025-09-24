import axios from 'axios';
import { synthesizeSpeech, synthesizeMultiVoiceScript } from './textToSpeechService';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

export const generatePodcastContent = async (topic, experienceLevel, focus, episodeLength, episodeCount, contentType, learningStyle, tone) => {
    try {
        console.log(`Generating podcast content for topic: ${topic}, episodes: ${episodeCount}`);

        // Convert minutes to approximate character count (around 140 characters per minute)
        const characterCount = Math.round(episodeLength * 150);

        const response = await axios.post(
            `${API_URL}?key=${API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Create an engaging podcast series about ${topic}. 

                AUDIENCE & EXPERIENCE:
                - The listener is a ${experienceLevel} in this subject
                - They want to focus on ${focus}
                - Their preferred learning style is: ${learningStyle || 'varied approaches'}

                CONTENT PREFERENCES:
                - Content type preference: ${contentType || 'conversational'}
                - Tone should be: ${tone || 'friendly and engaging'}
                - Each episode should be approximately ${characterCount} words (${episodeLength} minutes)
                - Total episodes needed: ${episodeCount}

                CONVERSATION FORMAT REQUIREMENTS:
                Create a conversational format with TWO speakers - a Host and a Guest/Expert Speaker:
                - Host: Asks questions, guides conversation, provides transitions
                - Speaker/Guest: Provides expertise, explanations, and insights
                - Make it feel like a natural dialogue, not a monologue

                CONTENT STRUCTURE (adapt based on user preferences):
                ${contentType === 'Interviews' ? `
                - Structure as an interview format with the Host asking detailed questions
                - Speaker should provide in-depth answers and real-world examples
                ` : contentType === 'Storytelling' ? `
                - Include narrative elements and story-driven explanations  
                - Use anecdotes and case studies to illustrate points
                ` : `
                - Keep it conversational and interactive
                - Balance questions, explanations, and practical insights
                `}

                LEARNING STYLE ADAPTATION:
                ${learningStyle === 'Step by step' ? `
                - Present information in clear, sequential steps
                - Build concepts progressively from basic to advanced
                ` : learningStyle === 'Big picture first' ? `
                - Start with the overall concept before diving into details
                - Explain the 'why' before the 'how'
                ` : learningStyle === 'Through examples' ? `
                - Use plenty of concrete examples and real-world applications
                - Include practical scenarios and case studies
                ` : learningStyle === 'By doing' ? `
                - Focus on practical applications and actionable insights
                - Include tips the listener can immediately implement
                ` : `
                - Use a balanced mix of explanation methods
                `}

                For each episode, provide:
                1. A catchy title
                2. A brief description (2-3 sentences)  
                3. Complete script with natural Host-Speaker dialogue

                SCRIPT FORMAT:
                - Start with "[Intro Music fades in and out]"
                - Use "**Host:**" for all host dialogue
                - Use "**Speaker:**" for all guest/expert dialogue
                - Include natural conversation flow with questions and responses
                - End with "[Outro Music fades in]"
                - Maintain the ${tone || 'friendly and engaging'} tone throughout

                Example format:
                [Intro Music fades in and out]
                **Host:** Welcome to our show! Today we're exploring ${topic}. I'm joined by our expert. Can you tell us...?
                **Speaker:** Thanks for having me! Absolutely, let me explain...
                **Host:** That's fascinating! What about...?
                **Speaker:** Great question...
                [Outro Music fades in]

                Format as JSON array with keys: title, description, and script for each episode.`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 800000,
                }
            }
        );

        const episodes = processPodcastResponse(response.data);
        console.log(`Successfully generated ${episodes.length} episodes`);

        // Save the generated content to a file so you can check the length
        saveGeneratedContent(episodes);

        return episodes;
    } catch (error) {
        console.error('Error generating podcast content:', error);
        throw error;
    }
};

// Function to save the generated content to a file
const saveGeneratedContent = (episodes) => {
    try {
        // For each episode, calculate and add the character count
        const episodesWithStats = episodes.map(episode => ({
            ...episode,
            scriptLength: episode.script ? episode.script.length : 0,
        }));

        // Format the data to be saved
        const contentToSave = {
            generatedAt: new Date().toISOString(),
            episodeCount: episodes.length,
            episodes: episodesWithStats,
        };

        // Convert to pretty JSON string
        const jsonContent = JSON.stringify(contentToSave, null, 2);

        // Log the content (for development purposes)
        console.log('Generated content stats:',
            episodesWithStats.map(ep => ({
                title: ep.title,
                characters: ep.scriptLength
            }))
        );

        // In a browser environment, we can't directly write to the file system
        // So we'll store it in localStorage for now
        if (typeof window !== 'undefined') {
            localStorage.setItem('generatedPodcastContent', jsonContent);
            console.log('Generated content saved to localStorage');
        }

    } catch (error) {
        console.error('Error saving generated content:', error);
    }
};

const processPodcastResponse = (data) => {
    try {
        console.log('Processing AI response for podcast content');
        const textResponse = data.candidates[0].content.parts[0].text;
        // Extract JSON content from the response
        const jsonMatch = textResponse.match(/```json([\s\S]*?)```/) ||
            textResponse.match(/{[\s\S]*}/) ||
            [null, textResponse];

        let jsonContent = jsonMatch[1] || textResponse;

        // Clean up the JSON string and parse it
        jsonContent = jsonContent.replace(/^```json/, '').replace(/```$/, '').trim();
        const episodes = JSON.parse(jsonContent);

        return Array.isArray(episodes) ? episodes : episodes.episodes || [episodes];
    } catch (error) {
        console.error('Error parsing podcast content:', error);
        throw new Error('Failed to parse podcast content');
    }
};

export const generateAudioForEpisodes = async (episodes) => {
    // Validate input
    if (!episodes || !Array.isArray(episodes) || episodes.length === 0) {
        console.error('Invalid episodes array provided to generateAudioForEpisodes');
        return [];
    }

    console.log(`Generating audio for ${episodes.length} episode(s) sequentially`);
    const episodesWithAudio = [];

    for (const episode of episodes) {
        try {
            // Defensive validation for episode object
            if (!episode) {
                console.error('Invalid episode object (undefined or null)');
                episodesWithAudio.push({
                    title: 'Unknown Episode',
                    status: 'failed',
                    error: 'Invalid episode data'
                });
                continue;
            }

            const episodeTitle = episode.title || 'Unknown Episode';
            console.log(`Processing audio for episode "${episodeTitle}"`);

            // Validate the script exists
            if (!episode.script) {
                console.error(`Missing script for episode "${episodeTitle}"`);
                episodesWithAudio.push({
                    ...episode,
                    status: 'failed',
                    error: 'Missing script content',
                    hadAudio: false
                });
                continue;
            }

            // Make sure script is a string with proper formatting
            let scriptToProcess = episode.script;
            if (typeof scriptToProcess !== 'string') {
                console.log('Script is not a string, converting to proper script format');

                // Handle when script is an array of speaker objects
                if (Array.isArray(scriptToProcess)) {
                    scriptToProcess = scriptToProcess.map(item => {
                        // Handle common formats where each item has speaker and text/line properties
                        if (item.speaker && (item.text || item.line)) {
                            return `**${item.speaker}:** ${item.text || item.line}`;
                        }
                        // Handle sound effect markers
                        else if (item.soundEffect) {
                            return `[${item.soundEffect}]`;
                        }
                        // Fallback to string representation
                        return String(item);
                    }).join('\n\n');
                }
                // Handle when script is an object with speakers or segments
                else if (typeof scriptToProcess === 'object') {
                    let dialogueLines = [];

                    // Try to handle the format from your logs where we have numbered properties (0, 1, 2...)
                    // with speaker and line information
                    const numericKeys = Object.keys(scriptToProcess).filter(k => !isNaN(parseInt(k)));

                    if (numericKeys.length > 0) {
                        console.log('Detected numbered dialogue segments');

                        numericKeys.forEach(key => {
                            const segment = scriptToProcess[key];
                            if (segment && segment.speaker) {
                                // Format with speaker and line
                                const line = segment.text || segment.line || '';
                                dialogueLines.push(`**${segment.speaker}:** ${line}`);
                            }
                        });
                    }
                    // If dialogue property exists and is an array
                    else if (scriptToProcess.dialogue && Array.isArray(scriptToProcess.dialogue)) {
                        scriptToProcess.dialogue.forEach(line => {
                            if (line.speaker && (line.text || line.line)) {
                                dialogueLines.push(`**${line.speaker}:** ${line.text || line.line}`);
                            }
                        });
                    }
                    // Try to process general object format by extracting properties
                    else {
                        for (const [key, value] of Object.entries(scriptToProcess)) {
                            if (typeof value === 'string') {
                                dialogueLines.push(`**${key}:** ${value}`);
                            }
                        }
                    }

                    // If we successfully extracted dialogue lines
                    if (dialogueLines.length > 0) {
                        scriptToProcess = dialogueLines.join('\n\n');
                        console.log(`Extracted ${dialogueLines.length} dialogue lines from object`);
                    }
                    // Last resort - convert to JSON string but with better formatting
                    else {
                        console.warn('Could not extract dialogue from script object, using JSON.stringify');
                        try {
                            // Try to make a more readable script from the object
                            scriptToProcess = `[Intro Music]\n\n**Host:** Welcome to our podcast about ${episode.title}.\n\n${JSON.stringify(scriptToProcess, null, 2)}\n\n**Host:** Thanks for listening!`;
                        } catch (e) {
                            scriptToProcess = JSON.stringify(scriptToProcess);
                        }
                    }
                }

                console.log('Converted script format:', scriptToProcess.substring(0, 100) + '...');
            }

            // IMPORTANT CHANGE: Remove the length limitation to process the full script
            // Instead of truncating scripts, we'll process them fully
            console.log(`Processing full script (${scriptToProcess.length} chars).`);

            // Use multi-voice synthesis for the script
            try {
                console.log(`Starting audio generation for episode "${episodeTitle}"`);
                const audioContent = await synthesizeMultiVoiceScript(scriptToProcess);

                episodesWithAudio.push({
                    ...episode,
                    audioUrl: `data:audio/mp3;base64,${audioContent}`,
                    status: 'ready',
                    hadAudio: true // Explicitly set hadAudio to true
                });

                console.log(`Successfully generated audio for episode "${episodeTitle}" and set hadAudio to true`);
            } catch (error) {
                console.error(`Error generating audio for episode "${episodeTitle}":`, error);

                if (error.message && error.message.includes('rate limit')) {
                    // If we hit rate limits, wait longer between retries
                    console.log('Rate limit hit, waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

                    // Try again with just a simple greeting as fallback
                    try {
                        const fallbackText = `This is a podcast episode titled: ${episodeTitle}. Due to high demand, the full audio will be available shortly.`;
                        const fallbackAudio = await synthesizeSpeech(
                            fallbackText,
                            {
                                languageCode: 'en-US',
                                name: 'en-US-Neural2-D',
                                ssmlGender: 'MALE'
                            },
                            {
                                audioEncoding: 'MP3',
                                speakingRate: 1.0,
                                pitch: 0.0
                            }
                        );

                        episodesWithAudio.push({
                            ...episode,
                            audioUrl: `data:audio/mp3;base64,${fallbackAudio}`,
                            status: 'ready',
                            hadAudio: true, // Still mark as having audio even for fallback
                            isFallbackAudio: true // Mark that this is simplified audio
                        });

                        console.log(`Generated fallback audio for episode "${episodeTitle}" and set hadAudio to true`);
                    } catch (fallbackError) {
                        console.error('Failed to generate even fallback audio:', fallbackError);
                        episodesWithAudio.push({
                            ...episode,
                            status: 'failed',
                            hadAudio: false // Mark that audio generation failed
                        });
                    }
                } else {
                    // For other errors, mark as failed
                    episodesWithAudio.push({
                        ...episode,
                        status: 'failed',
                        hadAudio: false // Mark that audio generation failed
                    });
                }
            }
        } catch (error) {
            const episodeTitle = episode?.title || 'Unknown Episode';
            console.error(`General error processing episode "${episodeTitle}":`, error);
            episodesWithAudio.push({
                ...episode,
                status: 'failed',
                hadAudio: false // Mark that audio generation failed
            });
        }

        // Add a more significant delay between episodes to prevent API rate limiting
        // and ensure one episode is completely processed before starting the next
        if (episodes.length > 1) {
            console.log('Episode completed. Waiting before processing next episode to prevent API rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay between episodes
        }
    }

    return episodesWithAudio;
};

export const generatePodcast = async (episode) => {
    // Validate episode data
    if (!episode) {
        console.error('Invalid episode object provided to generatePodcast');
        return null;
    }

    const episodeTitle = episode.title || 'Unknown Episode';

    console.log(`Processing audio for episode "${episodeTitle}"`);

    // Validate script exists
    if (!episode.script) {
        console.error(`Missing script for episode "${episodeTitle}"`);
        return {
            ...episode,
            status: 'failed',
            error: 'Missing script content'
        };
    }

    try {
        // Ensure script is a string
        let scriptContent = episode.script;
        if (typeof scriptContent !== 'string') {
            console.log('Converting non-string script to proper format');
            scriptContent = Array.isArray(scriptContent)
                ? scriptContent.join('\n\n')
                : JSON.stringify(scriptContent);
        }

        console.log(`Generating audio for script with ${scriptContent.length} characters`);

        // Generate the audio using multi-voice synthesis
        const audioContent = await synthesizeMultiVoiceScript(scriptContent);

        console.log(`Audio generation completed for "${episodeTitle}"`);

        return {
            ...episode,
            audioUrl: `data:audio/mp3;base64,${audioContent}`,
            status: 'ready'
        };
    } catch (error) {
        console.error(`Error generating podcast audio for "${episodeTitle}":`, error);

        // Attempt fallback if it's a rate limit issue
        if (error.message && error.message.includes('rate limit')) {
            console.log('Rate limit hit, trying fallback audio...');
            try {
                const fallbackText = `This is a podcast episode titled: ${episodeTitle}. Due to high demand, the full audio will be available shortly.`;
                const fallbackAudio = await synthesizeSpeech(
                    fallbackText,
                    {
                        languageCode: 'en-US',
                        name: 'en-US-Neural2-D',
                        ssmlGender: 'MALE'
                    },
                    {
                        audioEncoding: 'MP3',
                        speakingRate: 1.0,
                        pitch: 0.0
                    }
                );

                return {
                    ...episode,
                    audioUrl: `data:audio/mp3;base64,${fallbackAudio}`,
                    status: 'ready',
                    isFallbackAudio: true
                };
            } catch (fallbackError) {
                console.error('Fallback audio generation failed:', fallbackError);
            }
        }

        return {
            ...episode,
            status: 'failed',
            error: error.message || 'Unknown error during audio generation'
        };
    }
};