import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { podcastStorage } from '../utils/helpers';

const Journeys = () => {
    const navigate = useNavigate();
    const [journeys, setJourneys] = useState([]);

    // Wizzy's colors for theming
    const wizzyColors = {
        primary: '#7855c0', // Purple
        secondary: '#FFB74D', // Orange
        background: '#f8f6ff', // Light lavender
        card: '#ffffff', // White
        text: '#333333' // Dark grey
    };

    // Load all journeys from localStorage
    useEffect(() => {
        const loadJourneys = () => {
            try {
                const allJourneys = podcastStorage.getAllJourneys();
                console.log('Journeys - Loaded journeys from storage:', allJourneys);
                setJourneys(allJourneys);
            } catch (error) {
                console.error('Error loading journeys:', error);
                setJourneys([]);
            }
        };

        loadJourneys();
    }, []);

    // Navigate to home page to create new journey
    const handleCreateJourney = () => {
        navigate('/');
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Unknown date';
        }
    };

    return (
        <div className="page" style={{ backgroundColor: wizzyColors.background }}>
            <Header />
            
            {/* Enhanced Header Section */}
            <Box sx={{
                textAlign: 'center',
                py: 4,
                background: 'linear-gradient(135deg, rgba(120, 85, 192, 0.08) 0%, rgba(255, 183, 77, 0.05) 100%)',
                borderBottom: '1px solid rgba(120, 85, 192, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Typography variant="h3" sx={{
                    background: 'linear-gradient(135deg, #7855c0 0%, #FFB74D 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    mb: 2
                }}>
                    Your Learning Journeys
                </Typography>
                <Typography variant="h6" sx={{
                    color: wizzyColors.text,
                    opacity: 0.8,
                    fontStyle: 'italic'
                }}>
                    Discover all the amazing topics you've explored with Wizzy
                </Typography>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {journeys.length === 0 ? (
                    // Empty state when no journeys exist
                    <Box sx={{
                        textAlign: 'center',
                        py: 8
                    }}>
                        <Box sx={{
                            width: 200,
                            height: 200,
                            mx: 'auto',
                            mb: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                                alt="Wizzy sleeping"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    opacity: 0.7
                                }}
                            />
                        </Box>
                        <Typography variant="h4" sx={{
                            color: wizzyColors.primary,
                            fontWeight: 'bold',
                            mb: 2
                        }}>
                            No Learning Journeys Yet
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: wizzyColors.text,
                            mb: 4,
                            maxWidth: 500,
                            mx: 'auto'
                        }}>
                            Start your first learning adventure with Wizzy! Create a personalized podcast journey on any topic you're curious about.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={handleCreateJourney}
                            sx={{
                                background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                                color: '#333333',
                                fontWeight: 700,
                                py: 2,
                                px: 4,
                                borderRadius: '25px',
                                boxShadow: '0 8px 25px rgba(255, 183, 77, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 35px rgba(255, 183, 77, 0.5)'
                                }
                            }}
                        >
                            Create Your First Journey
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* Create New Journey Button */}
                        <Box sx={{
                            textAlign: 'center',
                            mb: 6
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={handleCreateJourney}
                                sx={{
                                    background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                                    color: '#333333',
                                    fontWeight: 700,
                                    py: 2,
                                    px: 4,
                                    borderRadius: '25px',
                                    boxShadow: '0 8px 25px rgba(255, 183, 77, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(255, 183, 77, 0.5)'
                                    }
                                }}
                            >
                                Create New Journey
                            </Button>
                        </Box>

                        {/* Journey Cards Grid */}
                        <Grid container spacing={3}>
                            {journeys.map((journey, index) => (
                                <Grid item xs={12} sm={6} md={4} key={journey.id || index}>
                                    <Card sx={{
                                        height: '100%',
                                        backgroundColor: '#000000',
                                        color: 'white',
                                        border: '2px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 25px rgba(0, 0, 0, 0.3)',
                                            border: '2px solid rgba(255, 255, 255, 0.2)'
                                        }
                                    }}>
                                        {/* Unavailable overlay */}
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            zIndex: 2
                                        }}>
                                            <Chip
                                                label="Unavailable to play"
                                                sx={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        </Box>

                                        <CardContent sx={{
                                            p: 3,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {/* Journey Topic */}
                                            <Typography variant="h6" sx={{
                                                fontWeight: 'bold',
                                                mb: 2,
                                                color: 'white',
                                                lineHeight: 1.3
                                            }}>
                                                {journey.topic || 'Untitled Journey'}
                                            </Typography>

                                            {/* Journey Details */}
                                            <Box sx={{ flexGrow: 1, mb: 3 }}>
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    mb: 2
                                                }}>
                                                    Created: {formatDate(journey.createdAt)}
                                                </Typography>

                                                {/* Journey metadata chips */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1,
                                                    mb: 2
                                                }}>
                                                    {journey.experienceLevel && (
                                                        <Chip
                                                            label={journey.experienceLevel}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                                color: 'white',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    )}
                                                    {journey.episodes && (
                                                        <Chip
                                                            label={`${journey.episodes.length} episodes`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                                color: 'white',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    )}
                                                    {journey.focus && (
                                                        <Chip
                                                            label={journey.focus}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                                color: 'white',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Wizzy illustration */}
                                            <Box sx={{
                                                textAlign: 'center',
                                                opacity: 0.3
                                            }}>
                                                <img
                                                    src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                                                    alt="Wizzy"
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Container>

            <Footer />
        </div>
    );
};

export default Journeys;
