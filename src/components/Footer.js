import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: '#6344a8', // Wizzy purple dark
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="body2" color="white" align="center">
                    Wisme
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;