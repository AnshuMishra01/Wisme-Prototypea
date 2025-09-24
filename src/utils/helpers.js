/**
 * Formats time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time as MM:SS
 */
export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Calculates estimated reading time based on word count
 * @param {string} text - The text to calculate reading time for
 * @param {number} wordsPerMinute - Reading speed in words per minute
 * @returns {number} - Estimated minutes to read
 */
export const calculateReadingTime = (text, wordsPerMinute = 150) => {
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
};

/**
 * Truncates text to a specific length and adds ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
};

/**
 * Creates a simple hash from a string
 * @param {string} str - String to hash
 * @returns {string} - Hash string
 */
export const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

/**
 * Generates a random gradient color
 * @returns {string} - CSS gradient
 */
export const randomGradient = () => {
    const colors = [
        '#1DB954', '#1ED760', '#2D46B9', '#1E3264',
        '#8400E7', '#B026FF', '#F573A0', '#E8115B'
    ];
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    const color2 = colors[Math.floor(Math.random() * colors.length)];
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
};

/**
 * Local storage helper for saving and retrieving podcast journeys
 */
export const podcastStorage = {
    saveJourney: (journey) => {
        try {
            // Create a cleaned version of the journey without audio data
            const journeyToStore = {
                ...journey,
                id: simpleHash(journey.topic + new Date().getTime()),
                createdAt: new Date().toISOString()
            };

            // Remove audioUrl from episodes to avoid exceeding localStorage quota
            if (journeyToStore.episodes) {
                journeyToStore.episodes = journeyToStore.episodes.map(episode => {
                    // Save a flag to indicate the episode had audio before
                    const hadAudio = !!episode.audioUrl;

                    return {
                        ...episode,
                        audioUrl: undefined, // Don't store audio in localStorage
                        hadAudio, // Flag to indicate audio was generated
                        status: episode.status || 'ready' // Ensure status is defined
                    };
                });
            }

            const journeys = podcastStorage.getAllJourneys();
            journeys.push(journeyToStore);

            // Check approximate size before saving
            const journeysString = JSON.stringify(journeys);
            console.log(`Journey storage size: approximately ${Math.round(journeysString.length / 1024)} KB`);

            if (journeysString.length > 4000000) { // ~4MB limit as safety measure
                console.warn('Journey storage size is very large, removing oldest journeys');
                // Remove oldest journeys if too large
                while (journeys.length > 1 && JSON.stringify(journeys).length > 3000000) {
                    journeys.shift(); // Remove oldest journey
                }
            }

            localStorage.setItem('podcastJourneys', JSON.stringify(journeys));
            console.log('Journey saved successfully (without audio data)');
            return true;
        } catch (error) {
            console.error('Error saving journey to local storage:', error);

            // Try one more time after clearing some space
            try {
                const journeys = podcastStorage.getAllJourneys();
                if (journeys.length > 0) {
                    // Only keep the most recent journey as emergency cleanup
                    const latestJourney = journeys[journeys.length - 1];
                    localStorage.setItem('podcastJourneys', JSON.stringify([latestJourney]));
                    console.log('Emergency cleanup: only kept most recent journey');
                }
                return false;
            } catch (e) {
                console.error('Even emergency cleanup failed:', e);
                return false;
            }
        }
    },

    updateJourney: (journey) => {
        try {
            const journeys = podcastStorage.getAllJourneys();
            const index = journeys.findIndex(j => j.id === journey.id);

            if (index !== -1) {
                // Create a cleaned version without audio data
                const journeyToStore = { ...journey };

                // Remove audioUrl from episodes to avoid exceeding localStorage quota
                if (journeyToStore.episodes) {
                    journeyToStore.episodes = journeyToStore.episodes.map(episode => {
                        // Save a flag to indicate the episode had audio before
                        const hadAudio = !!episode.audioUrl;

                        return {
                            ...episode,
                            audioUrl: undefined, // Don't store audio in localStorage
                            hadAudio, // Flag to indicate audio was generated
                            status: episode.status || 'ready' // Ensure status is defined
                        };
                    });
                }

                journeys[index] = journeyToStore;
                localStorage.setItem('podcastJourneys', JSON.stringify(journeys));
                console.log(`Journey ${journey.id} updated successfully (without audio data)`);
                return true;
            }

            console.error(`Journey ${journey.id} not found for update`);
            return false;
        } catch (error) {
            console.error('Error updating journey in local storage:', error);
            return false;
        }
    },

    getAllJourneys: () => {
        try {
            const journeys = localStorage.getItem('podcastJourneys');
            return journeys ? JSON.parse(journeys) : [];
        } catch (error) {
            console.error('Error retrieving journeys from local storage:', error);
            return [];
        }
    },

    getJourneyById: (id) => {
        try {
            const journeys = podcastStorage.getAllJourneys();
            return journeys.find(journey => journey.id === id) || null;
        } catch (error) {
            console.error('Error retrieving journey from local storage:', error);
            return null;
        }
    }
};