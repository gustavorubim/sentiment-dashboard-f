import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';

const IntroPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Spatial Sentiment Analysis',
      description: 'Visualize sentiment distribution in 3D space using PCA or UMAP embeddings.',
      path: '/spatial-sentiment'
    },
    {
      title: 'Sentiment Disagreement Analysis',
      description: 'Examine how different models disagree on sentiment classifications.',
      path: '/disagreement'
    },
    {
      title: 'Core Model Metrics',
      description: 'Explore detailed performance metrics across different sentiment models.',
      path: '/analysis'
    },
    {
      title: 'Model Metrics Visualization',
      description: 'Compare model performance through intuitive bar charts.',
      path: '/metrics'
    },
    {
      title: 'Single Review Analysis',
      description: 'Deep dive into individual review sentiment analysis.',
      path: '/review-detail'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}
    >
      <GlassCard style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          color: 'var(--accent-color)', 
          marginBottom: '1.5rem',
          fontSize: '2.5rem'
        }}>
          Sentiment Analysis Dashboard
        </h1>
        <p style={{ 
          color: 'var(--text-primary)', 
          fontSize: '1.2rem',
          maxWidth: '800px',
          margin: '0 auto 2rem'
        }}>
          Welcome to our comprehensive sentiment analysis platform. This dashboard provides
          powerful visualization and analysis tools for understanding sentiment patterns
          across multiple models, helping you gain deeper insights into sentiment analysis
          performance and model behavior.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/spatial-sentiment')}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          Get Started
        </motion.button>
      </GlassCard>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {sections.map((section) => (
          <Link 
            key={section.path} 
            to={section.path}
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard style={{ 
                padding: '1.5rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <h2 style={{ 
                  color: 'var(--accent-color)',
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>
                  {section.title}
                </h2>
                <p style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  lineHeight: '1.5'
                }}>
                  {section.description}
                </p>
              </GlassCard>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default IntroPage;
