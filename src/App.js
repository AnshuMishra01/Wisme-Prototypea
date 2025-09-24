import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import JourneyCreation from './pages/JourneyCreation';
import Loading from './pages/Loading';
import PodcastJourney from './pages/PodcastJourney';
import Journeys from './pages/Journeys';

function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<JourneyCreation />} />
                <Route path="/loading" element={<Loading />} />
                <Route path="/journey/:journeyId" element={<PodcastJourney />} />
                <Route path="/journey" element={<Navigate to="/journeys" replace />} />
                <Route path="/journeys" element={<Journeys />} />
            </Routes>
        </div>
    );
}

export default App;