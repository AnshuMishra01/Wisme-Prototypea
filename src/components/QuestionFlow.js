import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Slider,
    FormLabel,
    Paper
} from '@mui/material';

const experienceLevels = ['beginner', 'intermediate', 'advanced'];
const focusOptions = ['theory and concepts', 'practical examples', 'balanced approach'];

const QuestionFlow = ({ onSubmit }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [topic, setTopic] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('beginner');
    const [focus, setFocus] = useState('balanced approach');
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
            case 2:
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
                            What's your experience level with this topic?
                        </Typography>
                        <FormControl component="fieldset" sx={{ mt: 2 }}>
                            <RadioGroup
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                            >
                                <FormControlLabel
                                    value="beginner"
                                    control={<Radio />}
                                    label="Beginner - I'm new to this topic"
                                />
                                <FormControlLabel
                                    value="intermediate"
                                    control={<Radio />}
                                    label="Intermediate - I have some knowledge"
                                />
                                <FormControlLabel
                                    value="advanced"
                                    control={<Radio />}
                                    label="Advanced - I want to deepen my expertise"
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ py: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            What would you like to focus on?
                        </Typography>
                        <FormControl component="fieldset" sx={{ mt: 2 }}>
                            <RadioGroup
                                value={focus}
                                onChange={(e) => setFocus(e.target.value)}
                            >
                                <FormControlLabel
                                    value="theory and concepts"
                                    control={<Radio />}
                                    label="Theory and concepts - Learn the fundamentals"
                                />
                                <FormControlLabel
                                    value="practical examples"
                                    control={<Radio />}
                                    label="Practical examples - Focus on applications"
                                />
                                <FormControlLabel
                                    value="balanced approach"
                                    control={<Radio />}
                                    label="Balanced approach - Mix of theory and practice"
                                />
                            </RadioGroup>
                        </FormControl>
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