import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import LoadingScreen from '../components/LoadingScreen';
import { generatePodcastContent, generateAudioForEpisodes } from '../services/podcastGenerationService';
import { podcastStorage } from '../utils/helpers';

const Loading = () => {
    const navigate = useNavigate();
    const [loadingMessage, setLoadingMessage] = useState('Generating podcast content...');

    useEffect(() => {
        const pendingJourneyData = sessionStorage.getItem('pendingPodcastJourney');

        if (!pendingJourneyData) {
            // No pending journey, redirect to creation page
            navigate('/create');
            return;
        }

        const journeyData = JSON.parse(pendingJourneyData);
        console.log("Starting journey generation with data:", journeyData);

        const generatePodcast = async () => {
            try {
                // Generate podcast content
                setLoadingMessage('Creating captivating podcast scripts...');
                console.log("Generating podcast scripts...");
                const episodes = await generatePodcastContent(
                    journeyData.topic,
                    journeyData.experienceLevel,
                    journeyData.focus,
                    journeyData.episodeLength,
                    journeyData.episodeCount,
                    journeyData.contentType,
                    journeyData.learningStyle,
                    journeyData.tone
                );
                console.log("Generated episodes:", episodes);

                // Process first episode completely before showing the journey page
                setLoadingMessage('Processing audio for first episode...');
                console.log("Processing audio for first episode...");

                // Generate audio for just the first episode
                const firstEpisodeWithAudio = await generateAudioForEpisodes([episodes[0]]);
                console.log("First episode audio generated successfully");

                // Set up the rest of the episodes for background processing
                const initialEpisodes = [
                    {
                        ...firstEpisodeWithAudio[0],
                        hadAudio: true // Explicitly set hadAudio flag for first episode
                    },
                    ...episodes.slice(1).map(ep => ({
                        ...ep,
                        audioUrl: null,
                        status: 'generating',
                        hadAudio: false // Explicitly initialize other episodes with hadAudio false
                    }))
                ];

                // Initialize the complete journey with the first episode ready
                const initialJourney = {
                    ...journeyData,
                    episodes: initialEpisodes,
                    createdAt: new Date().toISOString()
                };

                // Save to localStorage to make at least first episode playable
                podcastStorage.saveJourney(initialJourney);

                // Get the current journey ID
                const journeys = podcastStorage.getAllJourneys();
                const currentJourneyId = journeys[journeys.length - 1].id;

                // Navigate to the journey page with the ID in the URL
                navigate(`/journey/${currentJourneyId}`);

                // Now process remaining episodes in the background
                setTimeout(async () => {
                    try {
                        console.log("Processing remaining episodes in background...");
                        for (let i = 1; i < episodes.length; i++) {
                            console.log(`Processing audio for episode ${i + 1}...`);
                            // Update the episode status to show it's being processed
                            const updatedJourney = podcastStorage.getJourneyById(currentJourneyId);

                            // Check if journey and episodes exist
                            if (updatedJourney && updatedJourney.episodes && updatedJourney.episodes[i]) {
                                updatedJourney.episodes[i].status = 'processing';
                                podcastStorage.updateJourney(updatedJourney);
                            } else {
                                console.error(`Could not update episode ${i + 1} status - episode not found`);
                                continue; // Skip this episode and try the next one
                            }

                            try {
                                // Generate audio for just this episode
                                const episodeWithAudio = await generateAudioForEpisodes([episodes[i]]);
                                console.log(`Generated audio for episode ${i + 1}`);

                                // Update this episode with its audio
                                const latestJourney = podcastStorage.getJourneyById(currentJourneyId);
                                if (latestJourney && latestJourney.episodes && latestJourney.episodes[i]) {
                                    latestJourney.episodes[i] = {
                                        ...latestJourney.episodes[i],
                                        audioUrl: episodeWithAudio[0].audioUrl,
                                        status: 'ready',
                                        hadAudio: true // Explicitly set hadAudio to true when audio is generated
                                    };
                                    podcastStorage.updateJourney(latestJourney);
                                    console.log(`Updated episode ${i + 1} with hadAudio=true`);
                                } else {
                                    console.error(`Could not update episode ${i + 1} with audio - episode not found`);
                                }
                            } catch (error) {
                                console.error(`Error generating audio for episode ${i + 1}:`, error);
                                // Mark this episode as failed
                                const latestJourney = podcastStorage.getJourneyById(currentJourneyId);
                                if (latestJourney && latestJourney.episodes && latestJourney.episodes[i]) {
                                    latestJourney.episodes[i].status = 'failed';
                                    latestJourney.episodes[i].hadAudio = false; // Ensure hadAudio is false for failed episodes
                                    podcastStorage.updateJourney(latestJourney);
                                }
                            }
                        }

                        // After all episodes are processed, update the entire journey one more time
                        // to ensure all hadAudio flags are correctly set
                        const finalJourney = podcastStorage.getJourneyById(currentJourneyId);
                        if (finalJourney && finalJourney.episodes) {
                            finalJourney.episodes = finalJourney.episodes.map(episode => ({
                                ...episode,
                                // Set hadAudio to true if the episode has audio or is ready
                                hadAudio: !!episode.audioUrl || (episode.status === 'ready' && episode.hadAudio)
                            }));
                            podcastStorage.updateJourney(finalJourney);
                            console.log("All episodes processed and hadAudio flags updated");
                        }

                        // Clean up
                        sessionStorage.removeItem('pendingPodcastJourney');
                    } catch (error) {
                        console.error("Error processing remaining episodes:", error);
                    }
                }, 1000); // Start processing remaining episodes after a short delay

            } catch (error) {
                console.error('Error generating podcast:', error);
                setLoadingMessage('Error generating podcast. Please try again.');
                // Wait a bit then redirect to creation page
                setTimeout(() => navigate('/create'), 3000);
            }
        };

        // Start the generation process
        generatePodcast();
    }, [navigate]);

    return (
        <Container maxWidth={false} disableGutters sx={{ height: '100vh' }}>
            <LoadingScreen message={loadingMessage} />
        </Container>
    );
};

export default Loading;