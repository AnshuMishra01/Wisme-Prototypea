import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import LoadingScreen from '../components/LoadingScreen';
import { podcastStorage } from '../utils/helpers';
import { generatePodcastContent } from '../services/podcastGenerationService';

const Loading = () => {
    const navigate = useNavigate();
    const [loadingMessage, setLoadingMessage] = useState('🧠 Wizzy is crafting your personalized learning journey...');

    useEffect(() => {
        const pendingJourneyData = sessionStorage.getItem('pendingPodcastJourney');

        if (!pendingJourneyData) {
            // No pending journey, redirect to creation page
            navigate('/create');
            return;
        }

        const journeyData = JSON.parse(pendingJourneyData);
        console.log("Generating scripts for journey:", journeyData);

        // Generate scripts only (no audio)
        const generateScripts = async () => {
            try {
                setLoadingMessage('✨ Creating your personalized learning episodes...');
                console.log("Generating podcast scripts...");

                // Generate podcast content (scripts only)
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

                console.log("Generated episodes with scripts:", episodes);

                // Create journey with scripts but no audio
                const episodesWithoutAudio = episodes.map(ep => ({
                    ...ep,
                    audioUrl: null,
                    status: 'pending', // Episodes need audio generation
                    hadAudio: false
                }));

                const initialJourney = {
                    ...journeyData,
                    episodes: episodesWithoutAudio,
                    createdAt: new Date().toISOString(),
                    status: 'ready' // Ready to show episodes
                };

                // Save journey with scripts
                podcastStorage.saveJourney(initialJourney);

                // Get the journey ID
                const journeys = podcastStorage.getAllJourneys();
                const currentJourneyId = journeys[journeys.length - 1].id;

                setLoadingMessage('🎉 Your personalized episodes are ready! Preparing your journey...');
                
                setTimeout(() => {
                    // Navigate to the journey page
                    navigate(`/journey/${currentJourneyId}`);
                    
                    // Clean up
                    sessionStorage.removeItem('pendingPodcastJourney');
                }, 1500);

            } catch (error) {
                console.error('Error generating podcast scripts:', error);
                setLoadingMessage('😔 Oops! Wizzy had trouble creating your journey. Let\'s try again.');
                setTimeout(() => navigate('/create'), 3000);
            }
        };

        // Start script generation
        generateScripts();
    }, [navigate]);

    return (
        <Container maxWidth={false} disableGutters sx={{ height: '100vh' }}>
            <LoadingScreen message={loadingMessage} />
        </Container>
    );
};

export default Loading;