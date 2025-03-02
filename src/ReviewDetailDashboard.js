import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';
import { useTheme } from './context/ThemeContext';

const ReviewDetailDashboard = () => {
  const { isDarkMode } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch(`/reviews.csv?nocache=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        // Check if we got any data
        const text = await response.text();
        if (!text.trim()) {
          throw new Error('CSV file is empty');
        }
        
        // Split into rows
        const rows = text.split('\n').filter(row => row.trim());
        if (rows.length < 2) { // Need at least header + 1 data row
          throw new Error('CSV file does not contain enough data');
        }
        
        const parseCSVRow = (row) => {
          const values = [];
          let currentValue = '';
          let withinQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
              withinQuotes = !withinQuotes;
            } else if (char === ',' && !withinQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          return values;
        };

        const headers = parseCSVRow(rows[0]);
        
        const parsedData = rows.slice(1).map(row => {
          const values = parseCSVRow(row);
          if (values.length !== headers.length) {
            return null;
          }
          return headers.reduce((obj, header, index) => {
            if (header === 'polarity' || header.endsWith('_sentiment_code')) {
              const value = parseInt(values[index], 10);
              obj[header] = isNaN(value) ? null : value;
            } else {
              obj[header] = values[index];
            }
            return obj;
          }, {});
        }).filter(row => row !== null);

        setReviews(parsedData);
        setError(null);
      } catch (error) {
        console.error('Error loading CSV data:', error);
        setError('Failed to load review data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  const handleRandomSelect = () => {
    if (reviews.length === 0) return;
    const randomIndex = Math.floor(Math.random() * reviews.length);
    setSelectedReview(reviews[randomIndex]);
  };

  const getSentimentColumns = (review) => {
    if (!review) return [];
    
    // Define the order of columns
    const columnOrder = [
      'polarity',
      'fine_tuned_sentiment_code',
      ...Object.keys(review)
        .filter(key => 
          key.endsWith('_sentiment_code') && 
          key !== 'fine_tuned_sentiment_code'
        )
        .sort()
    ];

    return columnOrder
      .filter(key => review[key] !== undefined)
      .map(key => {
        let displayName = key;
        if (key === 'polarity') {
          displayName = 'Polarity';
        } else if (key === 'fine_tuned_sentiment_code') {
          displayName = 'Fine Tuned';
        } else {
          // Format model names like "gemma2:2b" from "gemma2:2b_sentiment_code"
          displayName = key
            .replace('_sentiment_code', '')
            .split(':')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
        
        return {
          key: key, // Original column name as key
          model: displayName,
          prediction: review[key]
        };
      });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}
    >
      <GlassCard style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ 
          color: 'var(--accent-color)', 
          marginBottom: '2rem',
          fontSize: '1.8rem'
        }}>
          Single Review Analysis - Random
        </h2>
        <button
          onClick={handleRandomSelect}
          style={{
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-color)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '2rem'
          }}
        >
          Select Random Review
        </button>

        {isLoading ? (
          <div>Loading reviews...</div>
        ) : error ? (
          <div style={{ color: 'var(--error-color)' }}>{error}</div>
        ) : selectedReview ? (
          <>
            <div style={{
              padding: '1.5rem',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                Review Text
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                {selectedReview.text}
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                Model Predictions
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}>
                        Sentiment Analysis
                      </th>
                      <th style={{ 
                        padding: '1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}>
                        Prediction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSentimentColumns(selectedReview).map(({ key, model, prediction }) => (
                      <tr key={key}>
                        <td style={{ 
                          padding: '1rem',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}>
                          {model}
                        </td>
                        <td style={{ 
                          padding: '1rem',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}>
                          {prediction}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div>Click the button to select a random review</div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default ReviewDetailDashboard;
