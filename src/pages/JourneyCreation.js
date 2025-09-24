import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import QuestionFlow from '../components/QuestionFlow';
import { podcastStorage } from '../utils/helpers';

const JourneyCreation = () => {
    const navigate = useNavigate();

    const handleSubmit = (journeyData) => {
        // Store the journey data in sessionStorage for the loading page to access
        sessionStorage.setItem('pendingPodcastJourney', JSON.stringify(journeyData));

        // Navigate to the loading page
        navigate('/loading');
    };

    return (
        <div className="page">
            <Header />
            <Container>
                <Box sx={{ py: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        Create Your Learning Journey
                    </Typography>
                    <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                        Answer a few questions to generate personalized study sessions with Wizzy on your topic of interest
                    </Typography>

                    <Paper
                        elevation={3}
                        sx={{
                            backgroundColor: '#282828',
                            borderRadius: 2,
                            overflow: 'hidden',
                            p: { xs: 2, md: 4 }
                        }}
                    >
                        <QuestionFlow onSubmit={handleSubmit} />
                    </Paper>
                </Box>
            </Container>
            <Footer />
        </div>
    );
};

export default JourneyCreation;