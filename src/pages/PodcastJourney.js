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
    Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { podcastStorage } from '../utils/helpers';
import EpisodeCard from '../components/EpisodeCard';
import PlayerControls from '../components/PlayerControls';
import { generatePodcast } from '../services/podcastGenerationService';

const PodcastJourney = () => {
    const { journeyId } = useParams();
    const navigate = useNavigate();

    const [journey, setJourney] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [regeneratingAudio, setRegeneratingAudio] = useState(false);
    const [currentRegeneratingIndex, setCurrentRegeneratingIndex] = useState(null);

    // Load journey (scripts should already be generated from Loading screen)
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
                console.log('PodcastJourney - Episodes from localStorage:',
                    loadedJourney.episodes.map(ep => ({
                        title: ep.title,
                        status: ep.status,
                        hadAudio: ep.hadAudio,
                        hasAudioUrl: !!ep.audioUrl
                    }))
                );

                setJourney(loadedJourney);
            } catch (err) {
                console.error('Error loading podcast journey:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadJourney();
    }, [journeyId]);

    // Removed auto-fix logic to keep things simple

    // Get episodes that can be played (have audioUrl)
    const getPlayableEpisodes = useCallback(() => {
        if (!journey) return [];

        // Only return episodes that actually have audioUrl (can be played immediately)
        const episodesWithAudio = journey.episodes.filter(ep => ep.status === 'ready' && ep.audioUrl);

        console.log('PodcastJourney - Episodes with audio URLs:', episodesWithAudio.map(ep => ({
            title: ep.title,
            hasAudioUrl: !!ep.audioUrl,
            status: ep.status
        })));

        return episodesWithAudio;
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

    // Manual regeneration trigger
    const handleManualRegeneration = async (episodeIndex) => {
        console.log(`Manual regeneration requested for episode ${episodeIndex + 1}`);
        
        // Trigger regeneration
        const success = await regenerateAudio(episodeIndex);
        if (success) {
            console.log('Manual regeneration successful');
        } else {
            console.error('Manual regeneration failed');
        }
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

            // Update episode status to 'processing' to prevent UI flickering
            const processingEpisodes = [...journey.episodes];
            processingEpisodes[episodeIndex] = {
                ...processingEpisodes[episodeIndex],
                status: 'processing'
            };
            
            const processingJourney = {
                ...journey,
                episodes: processingEpisodes
            };
            
            // Update state immediately to show processing status
            setJourney(processingJourney);

            // Generate audio for this episode using the podcastGenerationService
            const episodeWithAudio = await generatePodcast(episode);

            // Update this episode in our journey state
            if (episodeWithAudio && episodeWithAudio.audioUrl) {
                const updatedEpisodes = [...processingJourney.episodes];
                updatedEpisodes[episodeIndex] = {
                    ...updatedEpisodes[episodeIndex],
                    audioUrl: episodeWithAudio.audioUrl,
                    status: 'ready',
                    hadAudio: true
                };

                const updatedJourney = {
                    ...processingJourney,
                    episodes: updatedEpisodes
                };

                // Update state immediately to prevent recursive regeneration
                console.log(`Successfully regenerated audio for episode ${episodeIndex + 1} - updating state`);
                setJourney(updatedJourney);
                
                // Also save to localStorage immediately to prevent loss during polling
                try {
                    podcastStorage.saveJourney(updatedJourney);
                    console.log(`Audio URL saved to localStorage for episode ${episodeIndex + 1}`);
                } catch (error) {
                    console.warn('Failed to save audioUrl to localStorage:', error);
                }
                
                console.log(`Audio URL now available for episode ${episodeIndex + 1}:`, !!updatedJourney.episodes[episodeIndex].audioUrl);
                return true;
            } else {
                console.error('Failed to generate audio - no audio URL returned');
                
                // Revert episode status to failed
                const failedEpisodes = [...processingJourney.episodes];
                failedEpisodes[episodeIndex] = {
                    ...failedEpisodes[episodeIndex],
                    status: 'failed'
                };
                
                setJourney({
                    ...processingJourney,
                    episodes: failedEpisodes
                });
                
                return false;
            }
        } catch (error) {
            console.error(`Error regenerating audio for episode ${episodeIndex + 1}:`, error);
            
            // Revert episode status to failed
            const failedEpisodes = [...journey.episodes];
            failedEpisodes[episodeIndex] = {
                ...failedEpisodes[episodeIndex],
                status: 'failed'
            };
            
            setJourney({
                ...journey,
                episodes: failedEpisodes
            });
            
            return false;
        } finally {
            setRegeneratingAudio(false);
            setCurrentRegeneratingIndex(null);
        }
    }, [journey]);

    // Simplified: No auto-regeneration for now
    // Episodes that don't have audioUrl will show "Generate Audio" button instead

    if (isLoading) {
        return (
            <Container sx={{ backgroundColor: wizzyColors.background, minHeight: '100vh' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress sx={{ color: wizzyColors.primary, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: wizzyColors.text, textAlign: 'center' }}>
                        🎧 Preparing your personalized learning journey...
                    </Typography>
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
                        ✨ Start Fresh Learning Journey
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
                    {journey.episodes.map((episode, index) => {
                        // Find the index in playable episodes (episodes with audioUrl)
                        const playableIndex = getPlayableEpisodes().findIndex(
                            ep => ep.title === episode.title && ep.description === episode.description
                        );
                        
                        return (
                            <Grid item xs={12} key={index}>
                                <EpisodeCard
                                    episode={episode}
                                    index={index}
                                    isPlaying={isPlaying && playableIndex === currentEpisodeIndex && playableIndex !== -1}
                                    onPlay={() => {
                                        if (playableIndex !== -1) {
                                            setCurrentEpisodeIndex(playableIndex);
                                            setIsPlaying(true);
                                        }
                                    }}
                                    isReady={episode.status === 'ready'}
                                    isRegeneratingAudio={regeneratingAudio && currentRegeneratingIndex === index}
                                    onRegenerate={() => handleManualRegeneration(index)}
                                    wizzyColors={wizzyColors}
                                />
                            </Grid>
                        );
                    })}
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


        </Box>
    );
};

export default PodcastJourney;