import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Container, Box, TextField, Paper, Grid } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import wizzySpeechService from '../services/wizzySpeechService';
import '../styles/components.css';

const Home = () => {
    const navigate = useNavigate();
    const [typedText, setTypedText] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [questionSequence, setQuestionSequence] = useState([]);
    // Add a state to store the selected questions to prevent changing during user interaction
    const [selectedQuestions, setSelectedQuestions] = useState({});
    // State to track animation status
    const [textAnimating, setTextAnimating] = useState(true);
    // State for animated characters
    const [animatedChars, setAnimatedChars] = useState([]);
    // State to track if Wizzy is speaking
    const [wizzyIsSpeaking, setWizzyIsSpeaking] = useState(false);

    // Combined Wizzy speech and text animation effect
    useEffect(() => {
        if (!typedText || currentStep === null) return;

        // Reset animation state
        setTextAnimating(true);
        setAnimatedChars([]);
        setWizzyIsSpeaking(true);

        const startWizzySpeechWithAnimation = async () => {
            try {
                // Start Wizzy speech with synchronized text animation
                await wizzySpeechService.playSpeechWithAnimation(
                    typedText,
                    (currentAnimatedText, progress) => {
                        // Update animated characters based on speech progress
                        const processedText = currentAnimatedText.split('').map((char, index) => ({
                            char: char === ' ' ? '\u00A0' : char,
                            isSpace: char === ' ',
                            delay: index * 20
                        }));
                        setAnimatedChars(processedText);
                    }
                );

                // Animation and speech complete
                setTimeout(() => {
                    setTextAnimating(false);
                    setWizzyIsSpeaking(false);
                }, 200);

            } catch (error) {
                console.error('Error with Wizzy speech:', error);

                // Fallback to regular text animation if TTS fails
                const processedText = typedText.split('').map((char, index) => ({
                    char: char === ' ' ? '\u00A0' : char,
                    isSpace: char === ' ',
                    delay: index * 20
                }));

                let charIndex = 0;
                let lastTimestamp = 0;
                const animationSpeed = 20;

                const animateNextChar = (timestamp) => {
                    if (!lastTimestamp || timestamp - lastTimestamp >= animationSpeed) {
                        if (charIndex < processedText.length) {
                            setAnimatedChars(prev => [...prev, processedText[charIndex]]);
                            charIndex++;
                            lastTimestamp = timestamp;
                        }

                        if (charIndex < processedText.length) {
                            requestAnimationFrame(animateNextChar);
                        } else {
                            setTimeout(() => {
                                setTextAnimating(false);
                                setWizzyIsSpeaking(false);
                            }, 200);
                        }
                    } else {
                        requestAnimationFrame(animateNextChar);
                    }
                };

                requestAnimationFrame(animateNextChar);
            }
        };

        startWizzySpeechWithAnimation();

        // Cleanup function
        return () => {
            wizzySpeechService.stopSpeech();
        };
    }, [typedText, currentStep]);

    // A larger pool of possible questions with multiple format variations for each
    const allPossibleQuestions = {
        greeting: {
            questions: [
                "Hi there! I'm Wizzy, your study buddy. What topic would you like to learn about together today?",
                "Hello! Wizzy here, ready to be your learning companion. What topic interests you?",
                "Hey! I'm Wizzy, your friendly study mate. What would you like to explore and learn together?",
                "Greetings! Wizzy at your service as your study partner. Tell me what topic you'd like to dive into today?",
                "Welcome! I'm Wizzy, your learning buddy. What subject are you curious about studying today?"
            ],
            input: "userTopic",
            required: true
        },
        experienceLevel: {
            questions: [
                "Cool! How familiar are you with this topic already?",
                "Great topic! How would you rate your knowledge level on this subject?",
                "Awesome choice! What's your current understanding of this area?",
                "Excellent! How much do you already know about this topic?",
                "That sounds interesting! How experienced are you with this subject matter?"
            ],
            input: "experienceLevel",
            options: ["Total beginner", "Some knowledge", "Intermediate", "Pretty advanced"],
            required: true
        },
        contentType: {
            questions: [
                "What type of content do you enjoy most?",
                "Which podcast format do you prefer to listen to?",
                "How would you like your podcast content to be structured?",
                "What style of podcast content resonates with you most?",
                "Which of these podcast formats would you find most engaging?"
            ],
            input: "contentType",
            options: ["Interviews", "Storytelling", "Conversational"],
            required: false
        },
        focus: {
            questions: [
                "Would you like to focus more on theory, practical skills, or a mix?",
                "What approach would be most valuable for your learning journey?",
                "Should we emphasize practical application, theory, or balance both?",
                "For your podcast journey, would you prefer theoretical concepts or practical applications?",
                "How would you like the content to be oriented: theory, practice, or balanced?"
            ],
            input: "focus",
            options: ["Practical skills", "Theory and concepts", "Balanced approach"],
            required: true
        },
        episodeLength: {
            questions: [
                "How long would you like each episode to be?",
                "What's your preferred episode duration?",
                "How much time do you have for each podcast episode?",
                "What episode length works best for your schedule?",
                "What's the ideal episode length for your listening habits?"
            ],
            input: "episodeLength",
            options: ["Short (3 min)", "Medium (5-7 min)"],
            required: true
        },
        episodeCount: {
            questions: [
                "How many episodes should your podcast series have?",
                "How long of a podcast series would you like me to create?",
                "How many episodes would you like in your podcast journey?",
                "What's your preferred number of episodes for this series?",
                "How extensive would you like this podcast journey to be?"
            ],
            input: "episodeCount",
            options: [1, 2],
            required: true
        },
        learningStyle: {
            questions: [
                "How do you prefer to learn new things?",
                "What learning approach works best for you?",
                "How do you most effectively absorb new information?",
                "What's your preferred way of understanding new concepts?",
                "Which of these learning methods resonates with you most?"
            ],
            input: "learningStyle",
            options: ["Step by step", "Big picture first", "Through examples", "By doing"],
            required: false
        },
        finalStep: {
            questions: [
                "Awesome! I have everything I need to create our personalized learning journey together!",
                "Perfect! I've got all the details to craft our custom study sessions!",
                "Great! I'm ready to create a learning journey tailored just for us!",
                "Fantastic! All set to build our personalized study series!",
                "Excellent! I have all I need to make our custom learning adventure a reality!"
            ],
            finalStep: true,
            required: true
        }
    };

    // Function to randomly select a question from the available variations
    const getRandomQuestionVariation = (questionType) => {
        if (!allPossibleQuestions[questionType] || !allPossibleQuestions[questionType].questions) {
            return "Something went wrong. Let's continue.";
        }

        const variations = allPossibleQuestions[questionType].questions;
        const randomIndex = Math.floor(Math.random() * variations.length);
        return variations[randomIndex];
    };

    // Generate a sequence of questions - with a fixed, predictable order
    useEffect(() => {
        // Define a fixed order of questions for better predictability
        const sequence = [
            'greeting',
            'experienceLevel',
            'focus',
            'episodeLength',
            'episodeCount',
            'contentType',
            'learningStyle',
            'finalStep'
        ];

        setQuestionSequence(sequence);
    }, []);

    // Current question based on the generated sequence
    const currentQuestion = questionSequence.length > 0 && currentStep < questionSequence.length
        ? allPossibleQuestions[questionSequence[currentStep]]
        : null;

    // State to hold all user answers
    const [userAnswers, setUserAnswers] = useState({
        userTopic: '',
        experienceLevel: '',
        focus: '',
        episodeLength: '',
        episodeCount: 1,
        contentType: '',
        learningStyle: '',
        tone: ''
    });

    // Display full question immediately without typing animation
    useEffect(() => {
        if (!currentQuestion) return;

        // Only select a new random question if we don't already have one for this step
        if (!selectedQuestions[currentStep]) {
            // Get a random question variation for the current question type
            const questionText = currentQuestion.questions
                ? getRandomQuestionVariation(questionSequence[currentStep])
                : "Let's continue with our learning journey setup";

            // Store the selected question in our state to keep it stable
            setSelectedQuestions(prev => ({
                ...prev,
                [currentStep]: questionText
            }));

            // Set the selected question text without animation
            setTypedText(questionText);
        } else {
            // Use the previously selected question
            setTypedText(selectedQuestions[currentStep]);
        }
    }, [currentStep, currentQuestion, questionSequence, selectedQuestions]);

    // Handle user input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserAnswers({
            ...userAnswers,
            [name]: value
        });
    };

    // Handle option selection
    const handleOptionSelect = (option) => {
        if (!currentQuestion) return;

        const inputName = currentQuestion.input;
        setUserAnswers({
            ...userAnswers,
            [inputName]: option
        });

        // No longer automatically advancing to next step
        // Let the user click the Next button instead
    };

    // Check if current answer is valid
    const isCurrentAnswerValid = () => {
        if (!currentQuestion) return false;

        if (currentQuestion.finalStep) return true;

        const inputName = currentQuestion.input;
        return Boolean(userAnswers[inputName]);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        if (currentStep < questionSequence.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step - create podcast journey
            startPodcastCreation();
        }
    };

    // Start learning journey creation process
    const startPodcastCreation = () => {
        // Process the data
        const podcastData = {
            topic: userAnswers.userTopic,
            experienceLevel: userAnswers.experienceLevel || 'Intermediate',
            focus: userAnswers.focus || 'Balanced approach',
            episodeLength: userAnswers.episodeLength === "Short (3 min)" ? 3 :
                userAnswers.episodeLength === "Medium (5-7 min)" ? 6 : 3,
            episodeCount: Number(userAnswers.episodeCount) || 1,
            // Include optional fields
            contentType: userAnswers.contentType || '',
            learningStyle: userAnswers.learningStyle || '',
            tone: userAnswers.tone || ''
        };

        // Save to session storage for the loading page
        sessionStorage.setItem('pendingPodcastJourney', JSON.stringify(podcastData));

        // Navigate to loading page
        navigate('/loading');
    };

    // If sequence isn't generated yet, return loading
    if (!currentQuestion) {
        return (
            <div className="page" style={{ backgroundColor: '#f8f6ff' }}>
                <Header />
                <Container maxWidth="xl" sx={{
                    py: 4,
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Typography>Preparing your experience...</Typography>
                </Container>
            </div>
        );
    }

    return (
        <div className="page" style={{ backgroundColor: '#f8f6ff' }}>
            <Header />
            {/* Enhanced Tagline */}
            <Box sx={{
                textAlign: 'center',
                py: 3,
                background: 'linear-gradient(135deg, rgba(120, 85, 192, 0.08) 0%, rgba(255, 183, 77, 0.05) 100%)',
                borderBottom: '1px solid rgba(120, 85, 192, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    animation: 'shimmer 3s ease-in-out infinite'
                }
            }}>
                <Typography variant="h6" sx={{
                    background: 'linear-gradient(135deg, #7855c0 0%, #FFB74D 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    fontStyle: 'italic',
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    animation: 'fadeInScale 1s ease-out'
                }}>
                    Knowledge Sounds Good This Way
                </Typography>
            </Box>
            <Container maxWidth="xl" sx={{
                py: 4,
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
            }}>
                {/* Sleeping Wizzy Background Icons */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    opacity: 0.65,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}>
                    {/* Top Left Sleeping Wizzy */}
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: '10%',
                            left: '5%',
                            width: '180px',
                            height: '180px',
                            objectFit: 'contain',
                            transform: 'rotate(-15deg)',
                            animation: 'float 8s ease-in-out infinite'
                        }}
                    />

                    {/* Top Right Sleeping Wizzy */}
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: '15%',
                            right: '10%',
                            width: '160px',
                            height: '160px',
                            objectFit: 'contain',
                            transform: 'rotate(20deg)',
                            animation: 'float 10s ease-in-out infinite reverse'
                        }}
                    />

                    {/* Bottom Left Sleeping Wizzy */}
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                        alt=""
                        style={{
                            position: 'absolute',
                            bottom: '20%',
                            left: '8%',
                            width: '170px',
                            height: '170px',
                            objectFit: 'contain',
                            transform: 'rotate(10deg)',
                            animation: 'float 12s ease-in-out infinite'
                        }}
                    />

                    {/* Bottom Right Sleeping Wizzy */}
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                        alt=""
                        style={{
                            position: 'absolute',
                            bottom: '5%',
                            right: '45%',
                            width: '150px',
                            height: '150px',
                            objectFit: 'contain',
                            transform: 'rotate(-25deg)',
                            animation: 'float 9s ease-in-out infinite reverse'
                        }}
                    />

                    {/* Center Background Sleeping Wizzy */}
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy-sleeping.png`}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '90%',
                            transform: 'translateY(-50%) rotate(5deg)',
                            width: '190px',
                            height: '190px',
                            objectFit: 'contain',
                            animation: 'float 15s ease-in-out infinite'
                        }}
                    />
                </Box>
                {/* Enhanced Floating and reactive Wizzy on the right */}
                <Box sx={{
                    position: { xs: 'relative', md: 'absolute' },
                    right: { md: '0' },
                    top: { md: '50%' },
                    transform: { md: 'translateY(-50%)' },
                    width: { xs: '100%', md: '50%' },
                    height: { md: '90vh' },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1,
                    overflow: 'hidden',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        width: '200%',
                        height: '200%',
                        animation: 'gentlePulse 4s ease-in-out infinite',
                        zIndex: -1
                    }
                }}>
                    <Box className="wizzy-container"
                        sx={{
                            animation: 'float 6s ease-in-out infinite',
                            position: 'relative'
                        }}
                    >
                        <img
                            src={currentStep === questionSequence.length - 1
                                ? `${process.env.PUBLIC_URL}/images/wizzy-laugh.png`
                                : `${process.env.PUBLIC_URL}/images/wizzy.png`}
                            alt="Wizzy - Your Study Buddy"
                            className={`wizzy-character ${wizzyIsSpeaking ? 'talking' :
                                currentStep === 0 ? 'excited' :
                                    currentStep === questionSequence.length - 1 ? 'excited' :
                                        'thinking'
                                }`}
                            style={{
                                height: '90%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                transition: 'all 0.5s ease',
                                animation: wizzyIsSpeaking ? 'talking 1s ease-in-out infinite' :
                                    currentStep === questionSequence.length - 1
                                        ? 'laughBounce 0.6s ease-in-out infinite'
                                        : currentStep === 0
                                            ? 'excited 3s ease-in-out'
                                            : 'thinking 5s infinite ease-in-out'
                            }}
                            onError={(e) => {
                                console.error("Error loading Wizzy image");
                                e.target.src = `${process.env.PUBLIC_URL}/images/wizzy-reading.png`; // Fallback to another local image
                            }}
                        />
                    </Box>
                </Box>

                {/* Conversation Interface on the Left Side */}
                <Grid container spacing={3} sx={{
                    width: { xs: '100%', md: '50%' },
                    marginRight: { md: 'auto' },
                    zIndex: 2
                }}>
                    <Grid item xs={12}>
                        {/* Enhanced Cloud-shaped Speech Bubble */}
                        <Paper
                            elevation={0}
                            className="cloud-bubble"
                            sx={{
                                position: 'relative',
                                p: 4,
                                mb: 5,
                                minHeight: '120px',
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                animation: `fadeInScale 0.8s ease-out ${currentStep * 0.1}s both`
                            }}
                        >
                            <Box
                                key={`text-${currentStep}`}
                                className="typing-text-container"
                                sx={{
                                    width: '100%',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'normal',
                                    overflowWrap: 'break-word',
                                    color: '#333333',
                                    fontWeight: 500,
                                    fontSize: '1.25rem',
                                    lineHeight: 1.6
                                }}
                            >
                                {textAnimating ? (
                                    // Show animated characters appearing one by one
                                    <div style={{ minHeight: '24px' }}>
                                        {animatedChars.map((item, index) => (
                                            <span
                                                key={index}
                                                className="animated-letter"
                                                style={{
                                                    animationDelay: `${index * 20}ms`,
                                                    display: 'inline-block'
                                                }}
                                            >
                                                {item.isSpace ? '\u00A0' : item.char}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    // Show full text once animation is complete
                                    <div>
                                        {typedText}
                                    </div>
                                )}
                            </Box>
                        </Paper>

                        {/* User Input Area */}
                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                            {!currentQuestion.finalStep ? (
                                <>
                                    {/* Enhanced Text input for topic */}
                                    {currentQuestion.input === "userTopic" && (
                                        <TextField
                                            fullWidth
                                            label="Enter a topic"
                                            name="userTopic"
                                            value={userAnswers.userTopic}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            className="enhanced-input"
                                            sx={{
                                                mb: 3,
                                                borderRadius: '15px',
                                                animation: 'slideInFromBottom 0.6s ease-out',
                                                animationFillMode: 'both',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '15px',
                                                    backgroundColor: 'transparent',
                                                    '& fieldset': {
                                                        borderColor: 'rgba(120, 85, 192, 0.3)',
                                                        borderWidth: '2px',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'rgba(120, 85, 192, 0.6)',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#7855c0',
                                                        borderWidth: '2px',
                                                        boxShadow: '0 0 0 3px rgba(120, 85, 192, 0.1)',
                                                    },
                                                    '& input': {
                                                        color: '#333333',
                                                        fontSize: '1.1rem',
                                                        fontWeight: 500,
                                                        padding: '14px 16px',
                                                    }
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: '#7855c0',
                                                    fontWeight: 600,
                                                    '&.Mui-focused': {
                                                        color: '#7855c0',
                                                    }
                                                }
                                            }}
                                            required
                                        />
                                    )}

                                    {/* Enhanced Options for other steps */}
                                    {currentQuestion.options && (
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 2.5,
                                            justifyContent: 'flex-start',
                                            my: 4
                                        }}>
                                            {currentQuestion.options.map((option, idx) => (
                                                <Button
                                                    key={`${currentStep}-${idx}`}
                                                    variant={userAnswers[currentQuestion.input] === option ? "contained" : "outlined"}
                                                    onClick={() => handleOptionSelect(option)}
                                                    sx={{
                                                        borderRadius: '25px',
                                                        minWidth: '140px',
                                                        py: 1.5,
                                                        px: 3,
                                                        fontSize: '0.95rem',
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        transition: 'all 0.3s ease',
                                                        ...(userAnswers[currentQuestion.input] === option ? {
                                                            background: 'linear-gradient(135deg, #7855c0 0%, #6344a3 100%)',
                                                            color: 'white',
                                                            boxShadow: '0 6px 20px rgba(120, 85, 192, 0.4)',
                                                            transform: 'translateY(-2px)',
                                                            '&:before': {
                                                                content: '""',
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                                                                borderRadius: '25px',
                                                            }
                                                        } : {
                                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%)',
                                                            color: '#7855c0',
                                                            borderColor: 'rgba(120, 85, 192, 0.3)',
                                                            borderWidth: '2px',
                                                            backdropFilter: 'blur(10px)',
                                                            boxShadow: '0 4px 15px rgba(120, 85, 192, 0.1)',
                                                        }),
                                                        '&:hover': {
                                                            transform: 'translateY(-3px)',
                                                            ...(userAnswers[currentQuestion.input] === option ? {
                                                                boxShadow: '0 8px 25px rgba(120, 85, 192, 0.5)',
                                                            } : {
                                                                background: 'linear-gradient(135deg, rgba(120, 85, 192, 0.1) 0%, rgba(120, 85, 192, 0.05) 100%)',
                                                                borderColor: 'rgba(120, 85, 192, 0.5)',
                                                                boxShadow: '0 6px 20px rgba(120, 85, 192, 0.2)',
                                                            })
                                                        },
                                                        '&:active': {
                                                            transform: 'translateY(-1px)',
                                                        },
                                                        animation: `slideInFromBottom ${0.4 + idx * 0.1}s ease-out`,
                                                        animationFillMode: 'both'
                                                    }}
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </Box>
                                    )}

                                    {/* Enhanced Next button */}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        className="enhanced-button"
                                        sx={{
                                            mt: 3,
                                            borderRadius: '25px',
                                            py: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            animation: 'slideInFromBottom 0.8s ease-out',
                                            animationFillMode: 'both',
                                            opacity: isCurrentAnswerValid() ? 1 : 0.6,
                                            pointerEvents: isCurrentAnswerValid() ? 'auto' : 'none',
                                            '&:disabled': {
                                                background: 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)',
                                                color: 'white',
                                                opacity: 0.6,
                                            }
                                        }}
                                        disabled={!isCurrentAnswerValid()}
                                    >
                                        Next
                                    </Button>
                                </>
                            ) : (
                                /* Enhanced Create Journey Button for final step */
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={startPodcastCreation}
                                    sx={{
                                        mt: 4,
                                        borderRadius: '25px',
                                        py: 2.5,
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                                        color: '#333333',
                                        boxShadow: '0 8px 25px rgba(255, 183, 77, 0.4)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        animation: 'gentlePulse 2s ease-in-out infinite',
                                        '&:before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                                            transition: 'left 0.6s'
                                        },
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 12px 35px rgba(255, 183, 77, 0.5)',
                                            animation: 'none',
                                            '&:before': {
                                                left: '100%'
                                            }
                                        },
                                        '&:active': {
                                            transform: 'translateY(-1px)'
                                        }
                                    }}
                                >
                                    🚀 Create My Podcast Journey
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
            <Footer />
        </div>
    );
};

export default Home;