import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Container, Paper } from '@mui/material';
import '../styles/components.css';

const LoadingScreen = ({ message = "Generating your podcast journey..." }) => {
    const [dots, setDots] = useState('');
    const [thoughtIndex, setThoughtIndex] = useState(0);
    const [prevThoughtIndex, setPrevThoughtIndex] = useState(-1); // Track the previous thought index

    // Wizzy's reading thoughts - will display randomly
    const wizzyThoughts = [
        "Hmm, that's an interesting topic! Let me create something special for you...",
        "Reading through my podcast knowledge database...",
        "Finding the perfect content structure for your journey...",
        "Brewing up some engaging discussions and insights...",
        "Crafting narratives that will keep you engaged...",
        "Balancing information and entertainment just right...",
        "Adding a sprinkle of fascinating facts to your episodes...",
        "Tailoring the content to match your experience level...",
        "Almost done! Just putting the finishing touches...",
        "This is going to be a great podcast series!",
        "Did you know podcasts improve knowledge retention by 60%?",
        "Creating content that perfectly matches your interests...",
        "Making sure each episode flows naturally into the next...",
        "Adding thoughtful questions to help you reflect on the material..."
    ];

    useEffect(() => {
        // Animate the dots
        const dotInterval = setInterval(() => {
            setDots((prev) => {
                return prev.length < 3 ? prev + '.' : '';
            });
        }, 500);

        // Change Wizzy's thoughts periodically
        const thoughtInterval = setInterval(() => {
            // Get a new random index that's different from the previous one
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * wizzyThoughts.length);
            } while (newIndex === prevThoughtIndex && wizzyThoughts.length > 1);

            setThoughtIndex(newIndex);
            setPrevThoughtIndex(newIndex);
        }, 4000);

        return () => {
            clearInterval(dotInterval);
            clearInterval(thoughtInterval);
        };
    }, [prevThoughtIndex, wizzyThoughts.length]);

    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                    position: 'relative',
                    py: 4
                }}
            >
                {/* Wizzy Reading Image - Reduced Size */}
                <Box sx={{
                    width: '100%',
                    maxWidth: '220px', // Reduced from 300px to 220px
                    mb: 4,
                    animation: 'float 3s ease-in-out infinite'
                }}>
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-reading.png`}
                        alt="Wizzy reading a book"
                        style={{
                            width: '100%',
                            height: 'auto',
                        }}
                        onError={(e) => {
                            console.error("Error loading Wizzy image");
                            e.target.src = `${process.env.PUBLIC_URL}/images/wizzy.png`;
                        }}
                    />
                </Box>

                {/* Speech Bubble with Wizzy's Thoughts */}
                <Paper elevation={3} sx={{
                    position: 'relative',
                    p: 3,
                    mb: 4,
                    borderRadius: '20px',
                    backgroundColor: '#f5f5f5',
                    maxWidth: '500px',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#f5f5f5',
                        zIndex: -1
                    }
                }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#333333',
                            transition: 'opacity 0.5s ease-in-out',
                            animation: 'fadeInOut 4s infinite'
                        }}
                    >
                        {wizzyThoughts[thoughtIndex]}
                    </Typography>
                </Paper>

                {/* Loading Indicator */}
                <Box sx={{ position: 'relative' }}>
                    <CircularProgress
                        size={60}
                        thickness={5}
                        sx={{
                            color: '#7855c0',
                            mb: 3
                        }}
                    />
                </Box>

                {/* Loading Message */}
                <Typography variant="h6" gutterBottom sx={{ color: '#7855c0', fontWeight: 'bold' }}>
                    {message + dots}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: '600px' }}>
                    Creating your personalized podcast journey. This may take a few minutes as Wizzy crafts the perfect content just for you!
                </Typography>
            </Box>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                
                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </Container>
    );
};

export default LoadingScreen;