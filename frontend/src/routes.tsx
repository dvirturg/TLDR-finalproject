import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FeedPage from './pages/FeedPage';

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/feed" element={<FeedPage />} />
        {/* Other routes can be added here */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
