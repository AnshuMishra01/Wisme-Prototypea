import React from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    Box,
    Collapse,
    Divider,
    CircularProgress,
    Chip,
    Avatar,
    Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { randomGradient, truncateText } from '../utils/helpers';

// Define paths to intro and outro music
const INTRO_MUSIC_PATH = `${process.env.PUBLIC_URL}/assets/intro_music.mp3`;
const OUTRO_MUSIC_PATH = `${process.env.PUBLIC_URL}/assets/outro_music.mp3`;

const EpisodeCard = ({
    episode,
    index,
    isPlaying,
    onPlay,
    isReady = true,
    isRegeneratingAudio = false,
    wizzyColors = {
        primary: '#7855c0', // Purple
        secondary: '#FFB74D', // Orange
        background: '#f8f6ff', // Light lavender
        card: '#ffffff', // White
        text: '#333333' // Dark grey
    }
}) => {
    const [expanded, setExpanded] = React.useState(false);
    const [audioPlayer, setAudioPlayer] = React.useState(null);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const isCurrentlyPlaying = isPlaying;
    const episodeStatus = episode.status || 'ready'; // Default to ready for backward compatibility
    const canPlay = isReady && (episode.audioUrl || episode.hadAudio);

    const backgroundGradient = React.useMemo(() => {
        // Create Wizzy-themed gradients instead of random ones
        const gradients = [
            `linear-gradient(135deg, ${wizzyColors.primary} 0%, #9173d9 100%)`,
            `linear-gradient(135deg, #9173d9 0%, ${wizzyColors.primary} 100%)`,
            `linear-gradient(135deg, ${wizzyColors.primary} 30%, ${wizzyColors.secondary} 100%)`,
            `linear-gradient(135deg, ${wizzyColors.secondary} 0%, ${wizzyColors.primary} 100%)`
        ];
        return gradients[index % gradients.length];
    }, [index, wizzyColors]);

    // Play intro or outro music
    const playMusic = (type) => {
        if (audioPlayer) {
            audioPlayer.pause();
        }

        const musicPath = type === 'intro' ? INTRO_MUSIC_PATH : OUTRO_MUSIC_PATH;
        const player = new Audio(musicPath);

        player.onended = () => {
            setAudioPlayer(null);
        };

        player.play().catch(err => {
            console.error(`Error playing ${type} music:`, err);
        });

        setAudioPlayer(player);
    };

    // Stop any playing music
    const stopMusic = () => {
        if (audioPlayer) {
            audioPlayer.pause();
            setAudioPlayer(null);
        }
    };

    // Function to format the script with styled speakers and sound effects
    const renderFormattedScript = (script) => {
        // Check if script is undefined or null
        if (!script) {
            console.warn('Script is not defined or null');
            return null;
        }

        // Handle array format (new format)
        if (Array.isArray(script)) {
            return script.map((item, idx) => {
                const speaker = item.speaker;
                const line = item.line;

                // If it's an intro music marker
                if (line && line.trim().match(/^\[Intro Music\]$/i)) {
                    return (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: `${wizzyColors.secondary}20`,
                                borderRadius: '4px',
                                p: 1,
                                my: 1,
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                                    [Intro Music]
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => playMusic('intro')}
                                sx={{
                                    color: wizzyColors.secondary,
                                    borderColor: wizzyColors.secondary,
                                    '&:hover': {
                                        borderColor: wizzyColors.secondary,
                                        backgroundColor: `${wizzyColors.secondary}20`
                                    },
                                    ml: 2,
                                    minWidth: '80px'
                                }}
                            >
                                Play
                            </Button>
                        </Box>
                    );
                }

                // If it's an outro music marker
                if (line && line.trim().match(/^\[Outro Music\]$/i)) {
                    return (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: `${wizzyColors.secondary}20`,
                                borderRadius: '4px',
                                p: 1,
                                my: 1,
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                                    [Outro Music]
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => playMusic('outro')}
                                sx={{
                                    color: wizzyColors.secondary,
                                    borderColor: wizzyColors.secondary,
                                    '&:hover': {
                                        borderColor: wizzyColors.secondary,
                                        backgroundColor: `${wizzyColors.secondary}20`
                                    },
                                    ml: 2,
                                    minWidth: '80px'
                                }}
                            >
                                Play
                            </Button>
                        </Box>
                    );
                }

                // If it's a regular sound effect [...]
                if (line && line.trim().match(/^\[.*\]$/)) {
                    return (
                        <Box
                            key={idx}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: `${wizzyColors.secondary}20`,
                                borderRadius: '4px',
                                p: 1,
                                my: 1
                            }}
                        >
                            <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                                {line.trim()}
                            </Typography>
                        </Box>
                    );
                }

                // Different styling based on speaker
                let speakerColor;
                switch (speaker) {
                    case 'Host':
                        speakerColor = wizzyColors.primary; // Primary Wizzy color
                        break;
                    case 'Speaker':
                        speakerColor = '#1E88E5'; // Blue
                        break;
                    case 'Guest':
                        speakerColor = wizzyColors.secondary; // Secondary Wizzy color
                        break;
                    default:
                        speakerColor = '#9C27B0'; // Purple
                }

                return (
                    <Box key={idx} sx={{ mb: 1 }}>
                        <Typography
                            variant="body2"
                            component="span"
                            sx={{
                                fontWeight: 'bold',
                                color: speakerColor,
                                display: 'inline-block',
                                minWidth: '60px'
                            }}
                        >
                            {speaker}:
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ color: wizzyColors.text }}>
                            {line}
                        </Typography>
                    </Box>
                );
            });
        }

        // Handle string format (old format)
        if (typeof script !== 'string') {
            console.warn('Script is not a valid string or array:', script);
            return null;
        }

        // Split script into lines for processing
        const lines = script.split('\n');

        return lines.map((line, idx) => {
            // Check if it's an intro music marker
            if (line.trim().match(/^\[Intro Music\]$/i)) {
                return (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: `${wizzyColors.secondary}20`,
                            borderRadius: '4px',
                            p: 1,
                            my: 1,
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                                [Intro Music]
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => playMusic('intro')}
                            sx={{
                                color: wizzyColors.secondary,
                                borderColor: wizzyColors.secondary,
                                '&:hover': {
                                    borderColor: wizzyColors.secondary,
                                    backgroundColor: `${wizzyColors.secondary}20`
                                },
                                ml: 2,
                                minWidth: '80px'
                            }}
                        >
                            Play
                        </Button>
                    </Box>
                );
            }

            // Check if it's an outro music marker
            if (line.trim().match(/^\[Outro Music\]$/i)) {
                return (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: `${wizzyColors.secondary}20`,
                            borderRadius: '4px',
                            p: 1,
                            my: 1,
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                                [Outro Music]
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => playMusic('outro')}
                            sx={{
                                color: wizzyColors.secondary,
                                borderColor: wizzyColors.secondary,
                                '&:hover': {
                                    borderColor: wizzyColors.secondary,
                                    backgroundColor: `${wizzyColors.secondary}20`
                                },
                                ml: 2,
                                minWidth: '80px'
                            }}
                        >
                            Play
                        </Button>
                    </Box>
                );
            }

            // Check if it's a sound effect [...]
            if (line.trim().match(/^\[.*\]$/)) {
                return (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: `${wizzyColors.secondary}20`,
                            borderRadius: '4px',
                            p: 1,
                            my: 1
                        }}
                    >
                        <MusicNoteIcon sx={{ mr: 1, color: wizzyColors.secondary }} />
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: wizzyColors.secondary }}>
                            {line.trim()}
                        </Typography>
                    </Box>
                );
            }

            // Check if it's a speaker line "**Speaker:**"
            const speakerMatch = line.match(/^\*\*(.*?):\*\*/);
            if (speakerMatch) {
                const speaker = speakerMatch[1];
                const speakerText = line.replace(/^\*\*(.*?):\*\*\s*/, '');

                // Different styling based on speaker
                let speakerColor;
                switch (speaker) {
                    case 'Host':
                        speakerColor = wizzyColors.primary; // Primary Wizzy color
                        break;
                    case 'Speaker':
                        speakerColor = '#1E88E5'; // Blue
                        break;
                    case 'Guest':
                        speakerColor = wizzyColors.secondary; // Secondary Wizzy color
                        break;
                    default:
                        speakerColor = '#9C27B0'; // Purple
                }

                return (
                    <Box key={idx} sx={{ mb: 1 }}>
                        <Typography
                            variant="body2"
                            component="span"
                            sx={{
                                fontWeight: 'bold',
                                color: speakerColor,
                                display: 'inline-block',
                                minWidth: '60px'
                            }}
                        >
                            {speaker}:
                        </Typography>
                        <Typography variant="body2" component="span" sx={{ color: wizzyColors.text }}>
                            {speakerText}
                        </Typography>
                    </Box>
                );
            }

            // Regular line
            return (
                <Typography key={idx} variant="body2" paragraph={true} sx={{ color: wizzyColors.text }}>
                    {line}
                </Typography>
            );
        });
    };

    // Clean up audio player when component unmounts
    React.useEffect(() => {
        return () => {
            if (audioPlayer) {
                audioPlayer.pause();
            }
        };
    }, [audioPlayer]);

    // Stop music when card collapses
    React.useEffect(() => {
        if (!expanded && audioPlayer) {
            stopMusic();
        }
    }, [expanded, audioPlayer]);

    // Function to render different UI based on episode status
    const renderEpisodeActions = () => {
        if (isRegeneratingAudio) {

            return (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress
                            size={24}
                            sx={{ color: wizzyColors.primary, mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ color: wizzyColors.text }}>
                            Making it personalized for you...
                        </Typography>
                    </Box>
                    <IconButton disabled>
                        <ExpandMoreIcon />
                    </IconButton>
                </>
            );
        } else if (episodeStatus === 'generating' || episodeStatus === 'processing') {
            return (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress
                            size={24}
                            sx={{
                                color: wizzyColors.primary,
                                mr: 1
                            }}
                        />
                        <Typography variant="body2" sx={{ color: wizzyColors.text }}>
                            {episodeStatus === 'generating' ? 'Generating episode...' : 'Processing audio...'}
                        </Typography>
                    </Box>

                    <IconButton disabled>
                        <ExpandMoreIcon />
                    </IconButton>
                </>
            );
        } else if (episodeStatus === 'failed') {
            return (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="error">
                            Generation failed
                        </Typography>
                    </Box>

                    <IconButton onClick={handleExpandClick} sx={{ color: wizzyColors.text }}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </>
            );
        } else {
            // Ready state
            return (
                <>
                    <IconButton
                        onClick={() => onPlay(index)}
                        sx={{
                            backgroundColor: isCurrentlyPlaying ? wizzyColors.primary : `${wizzyColors.primary}20`,
                            color: isCurrentlyPlaying ? 'white' : wizzyColors.primary,
                            visibility: isCurrentlyPlaying ? 0 : 1,
                            '&:hover': {
                                backgroundColor: isCurrentlyPlaying ? `${wizzyColors.primary}DD` : `${wizzyColors.primary}30`,
                            }
                        }}
                    >
                        <PlayArrowIcon />
                    </IconButton>

                    <IconButton onClick={handleExpandClick} sx={{ color: wizzyColors.text }}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </>
            );
        }
    };

    return (
        <Card
            sx={{
                mb: 2,
                backgroundColor: wizzyColors.card,
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                border: `1px solid ${wizzyColors.card}`,
                '&:hover': {
                    transform: canPlay ? 'translateY(-5px)' : 'none',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    borderColor: `${wizzyColors.primary}30`
                },
                opacity: canPlay ? 1 : 0.9
            }}
        >
            <Box
                sx={{
                    height: '130px',
                    background: backgroundGradient,
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 2,
                    position: 'relative',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                    overflow: 'hidden'
                }}
            >
                {/* Add a decorative Wizzy image to the corner of each card */}
                <Box sx={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '60px',
                    height: '60px',
                    opacity: 0.85
                }}>
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                        alt="Wizzy"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }}
                    />
                </Box>

                {isRegeneratingAudio && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10
                        }}
                    >
                        <Chip
                            icon={<AutorenewIcon className="rotating-icon" />}
                            label="Regenerating Audio"
                            size="small"
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: wizzyColors.primary,
                                fontWeight: 'bold',
                                '& .rotating-icon': {
                                    animation: 'spin 2s linear infinite',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    },
                                    color: wizzyColors.primary
                                }
                            }}
                        />
                    </Box>
                )}

                {!isReady && !isRegeneratingAudio && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10
                        }}
                    >
                        <Chip
                            icon={episodeStatus === 'failed' ? <ErrorOutlineIcon /> : <HourglassEmptyIcon />}
                            label={episodeStatus.charAt(0).toUpperCase() + episodeStatus.slice(1)}
                            color={episodeStatus === 'failed' ? 'error' : 'default'}
                            size="small"
                            sx={{
                                backgroundColor: episodeStatus === 'failed'
                                    ? 'rgba(211, 47, 47, 0.9)'
                                    : 'rgba(255, 255, 255, 0.9)',
                                color: episodeStatus === 'failed' ? 'white' : wizzyColors.text
                            }}
                        />
                    </Box>
                )}

                <Typography
                    variant="h5"
                    component="div"
                    sx={{
                        color: 'white',
                        fontWeight: 700,
                        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
                        zIndex: 2,
                        maxWidth: '80%'
                    }}
                >
                    Episode {index + 1}: {episode.title}
                </Typography>
            </Box>

            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                        src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                        alt="Wizzy"
                        sx={{
                            width: 50,
                            height: 50,
                            bgcolor: `${wizzyColors.secondary}30`
                        }}
                    />
                    <Typography variant="body1" sx={{ color: wizzyColors.text, fontStyle: 'italic' }}>
                        {episode.description}
                    </Typography>
                </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                {renderEpisodeActions()}
            </CardActions>

            {(isReady || episodeStatus === 'failed') && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ mx: 2, borderColor: `${wizzyColors.primary}30` }} />
                    <CardContent sx={{ pt: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{
                            color: wizzyColors.primary,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Box component="span" sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: `${wizzyColors.primary}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                color: wizzyColors.primary
                            }}>
                                {index + 1}
                            </Box>
                            Episode Transcript
                        </Typography>
                        <Box sx={{
                            whiteSpace: 'pre-wrap',
                            mt: 2,
                            pt: 2,
                            pl: 2,
                            pr: 2,
                            pb: 1,
                            bgcolor: `${wizzyColors.background}80`,
                            borderRadius: 2,
                            border: `1px solid ${wizzyColors.background}`
                        }}>
                            {renderFormattedScript(episode.script)}
                        </Box>
                        {episode.script && episode.script.length > 3000 && (
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    mt: 2,
                                    pt: 2,
                                    borderTop: `1px dashed ${wizzyColors.primary}30`
                                }}
                            >
                                <Typography variant="body2" sx={{ color: wizzyColors.primary, fontStyle: 'italic' }}>
                                    Full transcript truncated for display
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Collapse>
            )}
        </Card>
    );
};

export default EpisodeCard;