import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { podcastStorage } from '../utils/helpers';
import EpisodeCard from '../components/EpisodeCard';
import PlayerControls from '../components/PlayerControls';
import { generatePodcast } from '../services/podcastGenerationService'; // Import generatePodcast function

const PodcastJourney = () => {
    const { journeyId } = useParams();
    const navigate = useNavigate();

    const [journey, setJourney] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showFixMessage, setShowFixMessage] = useState(false);
    const [regeneratingAudio, setRegeneratingAudio] = useState(false);
    const [currentRegeneratingIndex, setCurrentRegeneratingIndex] = useState(null);

    // Load journey and set up polling for updates
    useEffect(() => {
        const loadJourney = async () => {
            try {
                // Get journey from localStorage
                const loadedJourney = podcastStorage.getJourneyById(journeyId);
                console.log('PodcastJourney - Journey loaded from storage:', loadedJourney);

                if (!loadedJourney) {
                    throw new Error('Podcast journey not found');
                }

                // DEBUG: Check episode status and audio availability
                if (loadedJourney.episodes) {
                    console.log('PodcastJourney - Episodes from localStorage:',
                        loadedJourney.episodes.map(ep => ({
                            title: ep.title,
                            status: ep.status,
                            hadAudio: ep.hadAudio,
                            hasAudioUrl: !!ep.audioUrl
                        }))
                    );
                }

                // Simplify: Mark all episodes with 'ready' status as having audio
                if (loadedJourney.episodes) {
                    loadedJourney.episodes = loadedJourney.episodes.map(episode => {
                        return {
                            ...episode,
                            // If status is ready, always set hadAudio to true
                            hadAudio: episode.status === 'ready' ? true : episode.hadAudio
                        };
                    });

                    // Save updated journey with fixed flags
                    podcastStorage.updateJourney(loadedJourney);
                    console.log("Updated all ready episodes with hadAudio = true");
                }

                setJourney(loadedJourney);
            } catch (err) {
                console.error('Error loading podcast journey:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadJourney();

        // Set up polling to check for episode updates every 5 seconds (less aggressive)
        const pollInterval = setInterval(() => {
            // Only poll if we're not currently regenerating audio to avoid conflicts
            if (!regeneratingAudio) {
                const updatedJourney = podcastStorage.getJourneyById(journeyId);
                if (updatedJourney) {
                    // Check if any episodes have changed status
                    setJourney(prevJourney => {
                        if (!prevJourney) return updatedJourney;

                        // Only update if there are meaningful status changes (not audio URL changes during regeneration)
                        const hasStatusChanges = updatedJourney.episodes.some((updatedEp, index) => {
                            const prevEp = prevJourney.episodes[index];
                            return prevEp && prevEp.status !== updatedEp.status;
                        });

                        if (hasStatusChanges) {
                            console.log('PodcastJourney - Episode status updates detected, refreshing state');
                            return updatedJourney;
                        }

                        return prevJourney;
                    });
                }
            }
        }, 5000); // Poll every 5 seconds

        // Cleanup polling on unmount
        return () => {
            clearInterval(pollInterval);
        };
    }, [journeyId, regeneratingAudio]);

    // More aggressive fix for hadAudio flag
    const forceUpdateAudioFlags = useCallback(() => {
        if (!journey) return;

        console.log("Force updating audio flags for all episodes");

        // Force all episodes with status "ready" to have hadAudio = true
        const updatedEpisodes = journey.episodes.map(episode => ({
            ...episode,
            hadAudio: episode.status === 'ready' ? true : episode.hadAudio
        }));

        const updatedJourney = {
            ...journey,
            episodes: updatedEpisodes
        };

        // Update journey in state and localStorage
        setJourney(updatedJourney);
        podcastStorage.updateJourney(updatedJourney);

        // Show confirmation message
        setShowFixMessage(true);
        console.log("Force update complete - all episodes now have hadAudio = true");
    }, [journey]);

    // Auto-fix on load if we detect inconsistencies (run only once)
    useEffect(() => {
        if (!journey) return;

        // Check if any episodes need fixing
        const needsFixing = journey.episodes.some(ep =>
            (ep.status === 'ready' && !ep.hadAudio)
        );

        if (needsFixing) {
            console.log("Detected inconsistencies in audio flags, auto-fixing...");
            forceUpdateAudioFlags();
        }
    }, []); // Empty dependency array to run only once

    // Get episodes that can be played (status is 'ready')
    const getPlayableEpisodes = useCallback(() => {
        if (!journey) return [];

        // Simply return all ready episodes - we trust the ready status
        const readyEpisodes = journey.episodes.filter(ep => ep.status === 'ready');

        console.log('PodcastJourney - Playable episodes:', readyEpisodes.map(ep => ({
            title: ep.title,
            hasAudioUrl: !!ep.audioUrl,
            hadAudio: ep.hadAudio,
            status: ep.status
        })));

        return readyEpisodes;
    }, [journey]);

    // Simple play/pause handler
    const handlePlayPause = () => {
        console.log('PodcastJourney - Play/Pause toggled:', !isPlaying);
        console.log('PodcastJourney - Current episode index:', currentEpisodeIndex);

        const episodes = getPlayableEpisodes();
        if (episodes.length > 0) {
            const currentEp = episodes[currentEpisodeIndex];
            console.log('PodcastJourney - Current episode audio available:', !!currentEp.audioUrl);
        }

        setIsPlaying(!isPlaying);
    };

    // Navigation between episodes
    const handlePreviousEpisode = () => {
        if (currentEpisodeIndex > 0) {
            setIsPlaying(false);
            setCurrentEpisodeIndex(currentEpisodeIndex - 1);
        }
    };

    const handleNextEpisode = () => {
        const episodes = getPlayableEpisodes();
        if (currentEpisodeIndex < episodes.length - 1) {
            setIsPlaying(false);
            setCurrentEpisodeIndex(currentEpisodeIndex + 1);
        }
    };

    // When an episode ends, play the next one or stop
    const handleEpisodeEnd = () => {
        const episodes = getPlayableEpisodes();
        if (currentEpisodeIndex < episodes.length - 1) {
            setCurrentEpisodeIndex(currentEpisodeIndex + 1);
        } else {
            setIsPlaying(false);
        }
    };

    // Handle episode selection
    const handleEpisodeSelect = (index) => {
        setIsPlaying(false);
        setCurrentEpisodeIndex(index);
    };

    // Navigate back to home
    const goBack = () => {
        navigate('/');
    };

    // Wizzy's colors for theming
    const wizzyColors = {
        primary: '#7855c0', // Purple
        secondary: '#FFB74D', // Orange
        background: '#f8f6ff', // Light lavender
        card: '#ffffff', // White
        text: '#333333' // Dark grey
    };

    // Function to regenerate audio for an episode
    const regenerateAudio = useCallback(async (episodeIndex) => {
        if (!journey || !journey.episodes || !journey.episodes[episodeIndex]) {
            console.error('Cannot regenerate audio: invalid episode');
            return false;
        }

        const episode = journey.episodes[episodeIndex];

        // Skip if episode already has audio
        if (episode.audioUrl) {
            console.log('Episode already has audio URL, no need to regenerate');
            return true;
        }

        // Skip if episode doesn't have script
        if (!episode.script) {
            console.error('Cannot regenerate audio: episode has no script');
            return false;
        }

        try {
            console.log(`Regenerating audio for episode ${episodeIndex + 1}: ${episode.title}`);
            setCurrentRegeneratingIndex(episodeIndex);
            setRegeneratingAudio(true);

            // Generate audio for this episode using the podcastGenerationService
            const episodeWithAudio = await generatePodcast(episode);

            // Update this episode in our journey state
            if (episodeWithAudio && episodeWithAudio.audioUrl) {
                const updatedEpisodes = [...journey.episodes];
                updatedEpisodes[episodeIndex] = {
                    ...updatedEpisodes[episodeIndex],
                    audioUrl: episodeWithAudio.audioUrl,
                    status: 'ready',
                    hadAudio: true
                };

                const updatedJourney = {
                    ...journey,
                    episodes: updatedEpisodes
                };

                // Update state (but not localStorage - we don't save audio there)
                setJourney(updatedJourney);
                console.log(`Successfully regenerated audio for episode ${episodeIndex + 1}`);
                return true;
            } else {
                console.error('Failed to generate audio - no audio URL returned');
                return false;
            }
        } catch (error) {
            console.error(`Error regenerating audio for episode ${episodeIndex + 1}:`, error);
            return false;
        } finally {
            setRegeneratingAudio(false);
            setCurrentRegeneratingIndex(null);
        }
    }, [journey]);

    // Track which episodes have attempted regeneration to prevent loops
    const [regenerationAttempts, setRegenerationAttempts] = useState(new Set());

    // Auto-regenerate audio when needed for the current episode
    useEffect(() => {
        const episodes = getPlayableEpisodes();

        if (episodes.length > 0 && currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length) {
            const currentEp = episodes[currentEpisodeIndex];

            // Check if audio needs regeneration (marked as having audio but URL is missing)
            if (currentEp && currentEp.hadAudio === true && !currentEp.audioUrl && !regeneratingAudio) {
                // Find the index in the original journey array
                const originalIndex = journey.episodes.findIndex(
                    ep => ep.title === currentEp.title && ep.description === currentEp.description
                );

                // Create a unique key for this episode to track regeneration attempts
                const episodeKey = `${originalIndex}-${currentEp.title}`;

                // Only regenerate if we haven't already attempted it
                if (originalIndex !== -1 && !regenerationAttempts.has(episodeKey)) {
                    console.log(`Current episode (${currentEp.title}) needs audio regeneration - attempting once`);

                    // Mark this episode as having attempted regeneration
                    setRegenerationAttempts(prev => new Set(prev).add(episodeKey));

                    regenerateAudio(originalIndex).then(success => {
                        if (success && isPlaying) {
                            // If we were trying to play, retry playing after regeneration
                            console.log('Auto-playing after audio regeneration');
                            setIsPlaying(false);
                            setTimeout(() => setIsPlaying(true), 500);
                        }
                    });
                } else if (regenerationAttempts.has(episodeKey)) {
                    console.log(`Skipping regeneration for episode (${currentEp.title}) - already attempted`);
                }
            }
        }
    }, [journey, currentEpisodeIndex, getPlayableEpisodes, regeneratingAudio, isPlaying, regenerateAudio, regenerationAttempts]);

    if (isLoading) {
        return (
            <Container sx={{ backgroundColor: wizzyColors.background, minHeight: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress sx={{ color: wizzyColors.primary }} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, mb: 4, backgroundColor: wizzyColors.background, minHeight: '100vh', pt: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    variant="outlined"
                    sx={{ mb: 2, color: wizzyColors.primary, borderColor: wizzyColors.primary }}
                >
                    Back to Home
                </Button>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Typography variant="body1" sx={{ color: wizzyColors.text }}>
                    The podcast journey you're looking for couldn't be found. It may have been deleted or never existed.
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: wizzyColors.primary, '&:hover': { backgroundColor: '#644da8' } }}
                        onClick={() => navigate('/create')}
                    >
                        Create New Journey
                    </Button>
                </Box>
            </Container>
        );
    }

    const playableEpisodes = getPlayableEpisodes();

    return (
        <Box sx={{ backgroundColor: wizzyColors.background, minHeight: '100vh', position: 'relative' }}>
            {/* Background Wizzy Icons */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1,
                opacity: 0.4,
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                {/* Top Left Wizzy Reading */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '18%',
                        left: '3%',
                        width: '140px',
                        height: '140px',
                        objectFit: 'contain',
                        transform: 'rotate(-10deg)',
                        animation: 'float 10s ease-in-out infinite'
                    }}
                />

                {/* Top Right Sleeping Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '16%',
                        right: '5%',
                        width: '130px',
                        height: '130px',
                        objectFit: 'contain',
                        transform: 'rotate(15deg)',
                        animation: 'float 12s ease-in-out infinite reverse'
                    }}
                />

                {/* Middle Left Regular Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '45%',
                        left: '22%',
                        width: '120px',
                        height: '120px',
                        objectFit: 'contain',
                        transform: 'rotate(8deg)',
                        animation: 'float 14s ease-in-out infinite'
                    }}
                />

                {/* Bottom Right Wizzy Laugh */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-laugh.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        bottom: '15%',
                        right: '18%',
                        width: '135px',
                        height: '135px',
                        objectFit: 'contain',
                        transform: 'rotate(-12deg)',
                        animation: 'float 9s ease-in-out infinite reverse'
                    }}
                />

                {/* Center Bottom Sleeping Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        bottom: '5%',
                        left: '45%',
                        transform: 'translateX(-50%) rotate(20deg)',
                        width: '125px',
                        height: '125px',
                        objectFit: 'contain',
                        animation: 'float 16s ease-in-out infinite'
                    }}
                />

                {/* Far Right Wizzy Reading */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '70%',
                        right: '1%',
                        width: '110px',
                        height: '110px',
                        objectFit: 'contain',
                        transform: 'rotate(-8deg)',
                        animation: 'float 11s ease-in-out infinite'
                    }}
                />

                {/* Additional Background Icons for more density */}
                
                {/* Top Center Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '5%',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-5deg)',
                        width: '100px',
                        height: '100px',
                        objectFit: 'contain',
                        animation: 'float 13s ease-in-out infinite reverse'
                    }}
                />

                {/* Left Center Sleeping Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '25%',
                        left: '8%',
                        width: '115px',
                        height: '115px',
                        objectFit: 'contain',
                        transform: 'rotate(25deg)',
                        animation: 'float 18s ease-in-out infinite'
                    }}
                />

                {/* Right Center Wizzy Reading */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '35%',
                        right: '12%',
                        width: '105px',
                        height: '105px',
                        objectFit: 'contain',
                        transform: 'rotate(-18deg)',
                        animation: 'float 15s ease-in-out infinite reverse'
                    }}
                />

                {/* Bottom Left Wizzy Laugh */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-laugh.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        bottom: '25%',
                        left: '15%',
                        width: '120px',
                        height: '120px',
                        objectFit: 'contain',
                        transform: 'rotate(12deg)',
                        animation: 'float 17s ease-in-out infinite'
                    }}
                />

                {/* Far Left Wizzy Reading */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '60%',
                        left: '1%',
                        width: '95px',
                        height: '95px',
                        objectFit: 'contain',
                        transform: 'rotate(22deg)',
                        animation: 'float 20s ease-in-out infinite reverse'
                    }}
                />

                {/* Top Right Corner Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '2%',
                        right: '2%',
                        width: '90px',
                        height: '90px',
                        objectFit: 'contain',
                        transform: 'rotate(-22deg)',
                        animation: 'float 14s ease-in-out infinite'
                    }}
                />

                {/* Bottom Far Right Sleeping Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        bottom: '8%',
                        right: '2%',
                        width: '108px',
                        height: '108px',
                        objectFit: 'contain',
                        transform: 'rotate(-15deg)',
                        animation: 'float 16s ease-in-out infinite reverse'
                    }}
                />

                {/* Mid Bottom Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        bottom: '35%',
                        left: '75%',
                        width: '112px',
                        height: '112px',
                        objectFit: 'contain',
                        transform: 'rotate(8deg)',
                        animation: 'float 19s ease-in-out infinite'
                    }}
                />

                {/* High Right Wizzy Laugh */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-laugh.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '8%',
                        right: '25%',
                        width: '118px',
                        height: '118px',
                        objectFit: 'contain',
                        transform: 'rotate(18deg)',
                        animation: 'float 12s ease-in-out infinite reverse'
                    }}
                />

                {/* Center Left Reading Wizzy */}
                <img
                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: '80%',
                        left: '25%',
                        width: '102px',
                        height: '102px',
                        objectFit: 'contain',
                        transform: 'rotate(-12deg)',
                        animation: 'float 21s ease-in-out infinite'
                    }}
                />
            </Box>

            <Box sx={{
                background: `linear-gradient(135deg, ${wizzyColors.primary} 0%, #9173d9 100%)`,
                padding: 3,
                color: 'white',
                position: 'relative',
                zIndex: 2,
                borderBottom: `5px solid ${wizzyColors.secondary}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <Button
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={goBack}
                    sx={{
                        position: 'absolute',
                        left: 16,
                        top: 16,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.35)' }
                    }}
                >
                    Back
                </Button>

                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 3 }}>
                        <Box sx={{ flexShrink: 0, width: 100, height: 100, position: 'relative' }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                                alt="Wizzy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography
                                variant="h2"
                                component="h1"
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                }}
                            >
                                {journey.topic}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2, flexWrap: 'wrap' }}>
                                <Typography variant="body1" sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.15)',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    {journey.experienceLevel}
                                </Typography>
                                <Typography variant="body1" sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.15)',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    {journey.focus}
                                </Typography>
                                <Typography variant="body1" sx={{
                                    color: 'white',
                                    bgcolor: 'rgba(0,0,0,0.15)',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    {journey.episodes.length} episodes
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ my: 4, pb: 10, position: 'relative', zIndex: 2 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 4
                }}>
                    <Typography variant="h5" component="h2" sx={{
                        color: wizzyColors.primary,
                        fontWeight: 'bold'
                    }}>
                        Your Episodes
                    </Typography>
                    <Box sx={{
                        height: '2px',
                        flexGrow: 1,
                        background: `linear-gradient(90deg, ${wizzyColors.primary} 0%, ${wizzyColors.background} 100%)`
                    }} />
                </Box>

                <Paper elevation={0} sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 4,
                    border: `1px solid ${wizzyColors.secondary}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{
                            width: 50,
                            height: 50,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                                alt="Wizzy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body1" sx={{ color: wizzyColors.text, fontStyle: 'italic' }}>
                                "Hey there! I've put together these study episodes to help us learn {journey.topic} together!
                                Each one is designed to make our learning journey fun and engaging. Let's start with episode 1 and dive in!"
                            </Typography>
                            <Typography variant="body2" sx={{ color: wizzyColors.primary, mt: 1, fontWeight: 'bold' }}>
                                - Wizzy, your study buddy
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Grid container spacing={3}>
                    {journey.episodes.map((episode, index) => (
                        <Grid item xs={12} key={index}>
                            <EpisodeCard
                                episode={episode}
                                index={index}
                                isPlaying={isPlaying && index === currentEpisodeIndex}
                                onPlay={() => {
                                    setCurrentEpisodeIndex(index);
                                    setIsPlaying(true);
                                }}
                                isReady={episode.status === 'ready'}
                                isRegeneratingAudio={regeneratingAudio && currentRegeneratingIndex === index}
                                wizzyColors={wizzyColors}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {playableEpisodes.length > 0 && (
                <PlayerControls
                    episodes={playableEpisodes}
                    currentEpisodeIndex={currentEpisodeIndex}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    onPrevious={handlePreviousEpisode}
                    onNext={handleNextEpisode}
                    onEpisodeEnd={handleEpisodeEnd}
                    wizzyColors={wizzyColors} // Pass Wizzy's colors to the PlayerControls
                />
            )}

            {/* Fix Audio flag notification */}
            <Snackbar
                open={showFixMessage}
                autoHideDuration={3000}
                onClose={() => setShowFixMessage(false)}
                message="Audio status fixed for all episodes"
            />
        </Box>
    );
};

export default PodcastJourney;