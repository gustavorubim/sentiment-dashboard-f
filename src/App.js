import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import IntroPage from './IntroPage';
import Dashboard from './Dashboard';
import AnalysisDashboard from './AnalysisDashboard';
import ModelMetricsDashboard from './ModelMetricsDashboard';
import ReviewDetailDashboard from './ReviewDetailDashboard';
import DisagreementExamination from './DisagreementExamination';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './styles/theme.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <nav className="glass-card" style={{ 
          padding: '1rem',
          margin: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link to="/" className="nav-link" style={{ marginRight: '1rem' }}>Home</Link>
            <Link to="/spatial-sentiment" className="nav-link" style={{ marginRight: '1rem' }}>Spatial Sentiment Analysis by model</Link>
            <Link to="/disagreement" className="nav-link" style={{ marginRight: '1rem' }}>Spatial Sentiment Disagreement by model</Link>
            <Link to="/analysis" className="nav-link" style={{ marginRight: '1rem' }}>Core Model Metrics</Link>
            <Link to="/metrics" className="nav-link" style={{ marginRight: '1rem' }}>Model Metrics Bar Chart</Link>
            <Link to="/review-detail" className="nav-link">Single Review Analysis - Random</Link>
          </div>
          <ThemeToggle />
        </nav>
        <AnimatePresence mode="wait">
          <motion.div
            style={{ padding: '2rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/spatial-sentiment" element={<Dashboard />} />
          <Route path="/analysis" element={<AnalysisDashboard />} />
          <Route path="/metrics" element={<ModelMetricsDashboard />} />
          <Route path="/review-detail" element={<ReviewDetailDashboard />} />
          <Route path="/disagreement" element={<DisagreementExamination />} />
          </Routes>
        </motion.div>
        </AnimatePresence>
      </Router>
    </ThemeProvider>
  );
}

export default App;
