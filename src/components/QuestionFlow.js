import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    Slider,
    FormLabel,
    Paper,
    Chip,
    Stack
} from '@mui/material';

// Updated to use input fields with suggestion chips instead of radio buttons
const experienceLevelSuggestions = ['Total beginner', 'Some knowledge', 'Intermediate', 'Pretty advanced'];
const focusSuggestions = ['Theory and concepts', 'Practical examples', 'Balanced approach', 'Case studies', 'Hands-on tutorials'];

const QuestionFlow = ({ onSubmit }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [topic, setTopic] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [focus, setFocus] = useState('');
    const [episodeLength, setEpisodeLength] = useState(10);
    const [episodeCount, setEpisodeCount] = useState(3);

    const steps = ['Topic', 'Experience Level', 'Content Focus', 'Format Preferences', 'Review'];

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSubmit = () => {
        onSubmit({
            topic,
            experienceLevel,
            focus,
            episodeLength,
            episodeCount
        });
    };

    const isStepValid = () => {
        switch (activeStep) {
            case 0:
                return topic.trim().length >= 3;
            case 1:
                return experienceLevel.trim().length >= 2;
            case 2:
                return focus.trim().length >= 2;
            case 3:
                return true;
            default:
                return true;
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            What topic would you like to learn about?
                        </Typography>
                        <TextField
                            fullWidth
                            label="Enter a topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Machine Learning, Photography, JavaScript, etc."
                            helperText="Be specific for better results"
                            sx={{ mt: 2 }}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Great topic! How would you rate your knowledge level on this subject?
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Describe your experience level"
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            placeholder="e.g., Total beginner, Some experience, Pretty advanced..."
                            helperText="You can use the suggested terms below or write your own"
                            sx={{ mt: 2 }}
                        />
                        
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Suggested terms:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {experienceLevelSuggestions.map((suggestion) => (
                                    <Chip
                                        key={suggestion}
                                        label={suggestion}
                                        variant={experienceLevel === suggestion ? "filled" : "outlined"}
                                        onClick={() => setExperienceLevel(suggestion)}
                                        sx={{
                                            cursor: 'pointer',
                                            mb: 1,
                                            '&:hover': {
                                                backgroundColor: experienceLevel === suggestion ? '#1DB954' : 'rgba(29, 185, 84, 0.1)'
                                            },
                                            backgroundColor: experienceLevel === suggestion ? '#1DB954' : 'transparent',
                                            color: experienceLevel === suggestion ? 'white' : 'inherit'
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            What would you like to focus on in your learning journey?
                        </Typography>
                        
                        <TextField
                            fullWidth
                            label="Describe your learning focus"
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            placeholder="e.g., Practical examples, Theory and concepts, Real-world applications..."
                            helperText="You can use the suggested terms below or describe your own focus"
                            sx={{ mt: 2 }}
                        />
                        
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Suggested focuses:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {focusSuggestions.map((suggestion) => (
                                    <Chip
                                        key={suggestion}
                                        label={suggestion}
                                        variant={focus === suggestion ? "filled" : "outlined"}
                                        onClick={() => setFocus(suggestion)}
                                        sx={{
                                            cursor: 'pointer',
                                            mb: 1,
                                            '&:hover': {
                                                backgroundColor: focus === suggestion ? '#1DB954' : 'rgba(29, 185, 84, 0.1)'
                                            },
                                            backgroundColor: focus === suggestion ? '#1DB954' : 'transparent',
                                            color: focus === suggestion ? 'white' : 'inherit'
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Format preferences
                        </Typography>

                        <Box sx={{ mt: 4, mb: 3 }}>
                            <FormLabel component="legend">Episode Length (minutes)</FormLabel>
                            <Slider
                                value={episodeLength}
                                onChange={(e, newValue) => setEpisodeLength(newValue)}
                                step={5}
                                marks
                                min={5}
                                max={30}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: '#1DB954',
                                    '& .MuiSlider-thumb': {
                                        '&:hover, &.Mui-focusVisible': {
                                            boxShadow: '0px 0px 0px 8px rgba(29, 185, 84, 0.16)'
                                        }
                                    }
                                }}
                            />
                        </Box>

                        <Box sx={{ mt: 4 }}>
                            <FormLabel component="legend">Number of Episodes</FormLabel>
                            <Slider
                                value={episodeCount}
                                onChange={(e, newValue) => setEpisodeCount(newValue)}
                                step={1}
                                marks
                                min={1}
                                max={5}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: '#1DB954',
                                    '& .MuiSlider-thumb': {
                                        '&:hover, &.Mui-focusVisible': {
                                            boxShadow: '0px 0px 0px 8px rgba(29, 185, 84, 0.16)'
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                );
            case 4:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Review Your Podcast Journey
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 3, mt: 2, backgroundColor: '#282828' }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Topic:</strong> {topic}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Experience Level:</strong> {experienceLevel}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Content Focus:</strong> {focus}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Episode Length:</strong> {episodeLength} minutes
                            </Typography>
                            <Typography variant="subtitle1">
                                <strong>Number of Episodes:</strong> {episodeCount}
                            </Typography>
                        </Paper>

                        <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
                            This will generate a {episodeCount}-episode podcast series about {topic},
                            tailored for {experienceLevel}s with a focus on {focus}.
                            Each episode will be approximately {episodeLength} minutes long.
                        </Typography>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                >
                    Back
                </Button>

                <Box>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!isStepValid()}
                            sx={{
                                backgroundColor: '#1DB954',
                                '&:hover': {
                                    backgroundColor: '#1ed760'
                                }
                            }}
                        >
                            Generate Podcast
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            sx={{
                                backgroundColor: '#1DB954',
                                '&:hover': {
                                    backgroundColor: '#1ed760'
                                }
                            }}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default QuestionFlow;


