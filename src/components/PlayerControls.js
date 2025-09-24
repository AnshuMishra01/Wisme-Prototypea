import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    IconButton,
    Slider,
    Typography,
    Paper,
    Stack
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { formatTime } from '../utils/helpers';

const PlayerControls = ({
    episodes = [],
    currentEpisodeIndex,
    isPlaying,
    onPlayPause,
    onPrevious,
    onNext,
    onEpisodeEnd
}) => {
    const audioRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioLoaded, setIsAudioLoaded] = useState(false);
    const currentEpisode = episodes[currentEpisodeIndex] || {};

    // DEBUG: Log episodes received by PlayerControls
    useEffect(() => {
        console.log('PlayerControls - Episodes received:', episodes);
        console.log('PlayerControls - Current episode index:', currentEpisodeIndex);
        console.log('PlayerControls - Current episode:', currentEpisode);
        if (currentEpisode) {
            console.log('PlayerControls - Audio URL available:', !!currentEpisode.audioUrl);
            console.log('PlayerControls - Had audio flag:', currentEpisode.hadAudio);
            console.log('PlayerControls - Episode status:', currentEpisode.status);
        }
    }, [episodes, currentEpisodeIndex, currentEpisode]);

    // Load audio when episode changes
    useEffect(() => {
        if (currentEpisode?.audioUrl && audioRef.current) {
            console.log('PlayerControls - Attempting to load audio with URL:', currentEpisode.audioUrl.substring(0, 50) + '...');

            const audio = audioRef.current;

            // Only reset if it's a different episode (different URL)
            if (audio.src !== currentEpisode.audioUrl) {
                console.log('PlayerControls - Loading new episode, resetting time');
                setCurrentTime(0);
                setIsAudioLoaded(false);
                audio.src = currentEpisode.audioUrl;
            } else {
                console.log('PlayerControls - Same episode, keeping current time');
                // Audio is already loaded for this episode
                if (audio.readyState >= 2) {
                    setIsAudioLoaded(true);
                }
                return; // Don't reload the same audio
            }

            // Add multiple event listeners for better debugging
            const handleCanPlayThrough = () => {
                console.log('PlayerControls - Audio can play through, readyState:', audio.readyState);
                setIsAudioLoaded(true);

                // If isPlaying is true, play the audio after loading
                if (isPlaying && audio.paused) {
                    console.log('PlayerControls - Auto-playing after load from time:', audio.currentTime);
                    audio.play().catch(error => {
                        console.error('Error playing audio after loading:', error);
                    });
                }
            };

            const handleLoadStart = () => {
                console.log('PlayerControls - Audio load started');
            };

            const handleLoadedData = () => {
                console.log('PlayerControls - Audio data loaded, readyState:', audio.readyState);
            };

            const handleError = (e) => {
                console.error('PlayerControls - Audio loading error:', e);
                setIsAudioLoaded(false);
            };

            // Add event listeners
            audio.addEventListener('canplaythrough', handleCanPlayThrough);
            audio.addEventListener('loadstart', handleLoadStart);
            audio.addEventListener('loadeddata', handleLoadedData);
            audio.addEventListener('error', handleError);

            // Start loading
            audio.load();

            // Cleanup function
            return () => {
                audio.removeEventListener('canplaythrough', handleCanPlayThrough);
                audio.removeEventListener('loadstart', handleLoadStart);
                audio.removeEventListener('loadeddata', handleLoadedData);
                audio.removeEventListener('error', handleError);
            };
        } else {
            // Handle case where episode exists but no audio URL (regenerating or failed)
            if (currentEpisode && currentEpisode.hadAudio && !currentEpisode.audioUrl) {
                console.log('PlayerControls - Episode marked as having audio but no URL - likely regenerating');
                setIsAudioLoaded(false);
                
                // Clear the audio source to prevent "Empty src attribute" error
                if (audioRef.current && audioRef.current.src) {
                    console.log('PlayerControls - Clearing audio src to prevent errors');
                    audioRef.current.removeAttribute('src');
                    // Don't call load() as it will trigger the "Empty src attribute" error
                }
            } else {
                console.warn('PlayerControls - No audio URL available for episode:', currentEpisode);
                setIsAudioLoaded(false);
                
                // Clear the audio source
                if (audioRef.current && audioRef.current.src) {
                    audioRef.current.removeAttribute('src');
                    // Don't call load() as it will trigger the "Empty src attribute" error
                }
            }
        }
    }, [currentEpisode?.audioUrl, currentEpisodeIndex, isPlaying, onPlayPause]);

    // Handle play/pause - simplified to work like EpisodeCard
    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            console.log('PlayerControls - Audio state change:', isPlaying ? 'Should Play' : 'Should Pause');
            console.log('PlayerControls - Audio readyState:', audio.readyState);
            console.log('PlayerControls - Audio current time:', audio.currentTime);
            console.log('PlayerControls - Audio src:', audio.src ? 'Available' : 'Empty');

            if (isPlaying) {
                // Only try to play if we have a valid audio source
                if (audio.src && (isAudioLoaded || audio.readyState >= 2)) {
                    console.log('PlayerControls - Starting playback from time:', audio.currentTime);
                    const playPromise = audio.play();

                    if (playPromise) {
                        playPromise.then(() => {
                            console.log('PlayerControls - Successfully started playback');
                        }).catch(error => {
                            console.error('PlayerControls - Play error:', error);
                            // Don't toggle the play state here - let the user try again
                        });
                    }
                } else if (!audio.src) {
                    console.log('PlayerControls - No audio source available - audio may be regenerating');
                } else {
                    console.log('PlayerControls - Audio not ready, will try to play after loading');
                }
            } else {
                // Simple pause - just like any regular audio element
                if (!audio.paused) {
                    console.log('PlayerControls - Pausing audio at time:', audio.currentTime);
                    audio.pause();
                }
            }
        }
    }, [isPlaying, isAudioLoaded]);

    // Handle volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const handleTimeChange = (_, newValue) => {
        if (audioRef.current) {
            console.log('PlayerControls - User seeking to time:', newValue);
            audioRef.current.currentTime = newValue;
            setCurrentTime(newValue);
        }
    };

    const handleVolumeChange = (_, newValue) => {
        setVolume(newValue);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleLoadedData = () => {
        console.log('PlayerControls - Audio metadata loaded. Duration:', audioRef.current.duration);
        setDuration(audioRef.current.duration);
        setIsAudioLoaded(true);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleEnded = () => {
        console.log('PlayerControls - Audio playback ended');
        if (onEpisodeEnd) {
            onEpisodeEnd();
        }
    };

    // Handle errors with audio playback
    const handleError = () => {
        // Ignore "Empty src attribute" errors when we deliberately clear the src
        if (audioRef.current && audioRef.current.error && audioRef.current.error.code === 4 && !audioRef.current.src) {
            console.log('PlayerControls - Ignoring empty src error (deliberate clear)');
            return;
        }
        
        console.error('PlayerControls - Audio error occurred', audioRef.current.error);
        if (isPlaying) {
            onPlayPause(); // Toggle back to paused state
        }
    };

    return (
        <Paper
            elevation={3}
            className="player-bar"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 2,
                zIndex: 1000,
            }}
        >
            <audio
                ref={audioRef}
                onLoadedData={handleLoadedData}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={handleError}
            >
                Your browser does not support the audio element.
            </audio>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Episode Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '25%', overflow: 'hidden' }} className="episode-info">
                    <Box
                        className="episode-badge"
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            fontSize: '1.1rem'
                        }}
                    >
                        {currentEpisodeIndex + 1}
                    </Box>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography
                            noWrap
                            variant="subtitle1"
                            className="episode-title"
                            sx={{ mb: 0.5 }}
                        >
                            {currentEpisode?.title || 'No episode selected'}
                        </Typography>
                        <Typography
                            noWrap
                            variant="body2"
                            className="episode-subtitle"
                        >
                            Episode {currentEpisodeIndex + 1}
                        </Typography>
                    </Box>
                </Box>

                {/* Player Controls */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <IconButton onClick={onPrevious} disabled={currentEpisodeIndex === 0}>
                            <SkipPreviousIcon />
                        </IconButton>

                        <IconButton
                            onClick={onPlayPause}
                            className="play-pause-button"
                            sx={{
                                width: 48,
                                height: 48,
                                mx: 1
                            }}
                        >
                            {isPlaying ? <PauseIcon sx={{ fontSize: '1.5rem' }} /> : <PlayArrowIcon sx={{ fontSize: '1.5rem' }} />}
                        </IconButton>

                        <IconButton
                            onClick={onNext}
                            disabled={currentEpisodeIndex === episodes.length - 1}
                        >
                            <SkipNextIcon />
                        </IconButton>
                    </Stack>

                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2" className="time-display">
                            {formatTime(currentTime)}
                        </Typography>

                        <Slider
                            size="small"
                            value={currentTime}
                            max={duration || 100}
                            onChange={handleTimeChange}
                            sx={{ mx: 2, flex: 1 }}
                        />

                        <Typography variant="body2" className="time-display">
                            {formatTime(duration)}
                        </Typography>
                    </Box>
                </Box>

                {/* Volume Control */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '20%', justifyContent: 'flex-end' }}>
                    <IconButton
                        onClick={toggleMute}
                        size="small"
                        sx={{ mr: 1 }}
                    >
                        {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>

                    <Slider
                        size="small"
                        value={isMuted ? 0 : volume}
                        max={1}
                        step={0.01}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        sx={{ width: 100 }}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

export default PlayerControls;