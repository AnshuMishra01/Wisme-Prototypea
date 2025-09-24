import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const Header = () => {
    return (
        <AppBar
            position="static"
            sx={{
                background: 'linear-gradient(135deg, #7855c0 0%, #6344a3 100%)',
                boxShadow: '0 4px 20px rgba(120, 85, 192, 0.3)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            <Toolbar sx={{ py: 2 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)'
                    }
                }}>
                    <img
                        src={`${process.env.PUBLIC_URL}/images/wizzy.png`}
                        alt="Wizzy"
                        style={{
                            width: '40px',
                            height: '40px',
                            marginRight: '12px',
                            objectFit: 'contain',
                            animation: 'gentlePulse 3s ease-in-out infinite'
                        }}
                    />
                    <Typography
                        variant="h3"
                        component={Link}
                        to="/"
                        sx={{
                            fontWeight: 900,
                            textDecoration: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'linear-gradient(45deg, #ffffff, #f0e6ff)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            letterSpacing: '1px',
                            fontSize: '2.2rem'
                        }}
                    >
                        Wisme
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Box>
                    <Button
                        component={Link}
                        to="/"
                        variant="contained"
                        sx={{
                            borderRadius: '30px',
                            background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                            color: '#333333',
                            fontWeight: 800,
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 15px rgba(255, 183, 77, 0.4)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                                transition: 'left 0.5s'
                            },
                            '&:hover': {
                                background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(255, 183, 77, 0.5)',
                                '&:before': {
                                    left: '100%'
                                }
                            },
                            '&:active': {
                                transform: 'translateY(0px)'
                            }
                        }}
                    >
                        Create Journey
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;