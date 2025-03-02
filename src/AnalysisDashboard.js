import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateMetrics, generateConfusionMatrix } from './analysisUtils';
import GlassCard from './components/GlassCard';
import { useTheme } from './context/ThemeContext';
import ReactMarkdown from 'react-markdown';

const AnalysisDashboard = () => {
  const { isDarkMode } = useTheme();
  const [rowModel, setRowModel] = useState(null);
  const [columnModel, setColumnModel] = useState(null);
  const [modelOptions, setModelOptions] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/reviews.csv');
        const text = await response.text();
        const rows = text.split('\n').filter(row => row.trim());
        
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
        
        if (!headers.some(header => header === 'polarity') || 
            !headers.some(header => header.endsWith('_sentiment_code'))) {
          throw new Error('CSV file must contain polarity and at least one model sentiment code column');
        }

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

        setData(parsedData);
        
        const models = [
          { value: 'polarity', label: 'Polarity' },
          ...headers
            .filter(header => header.endsWith('_sentiment_code'))
            .map(header => ({
              value: header,
              label: header
                .replace('_sentiment_code', '')
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            }))
        ];
        setModelOptions(models);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    loadCSVData();
  }, []);

  useEffect(() => {
    if (rowModel && columnModel && data.length > 0) {
      try {
        const rowValues = data.map(row => row[rowModel]);
        const columnValues = data.map(row => row[columnModel]);
        
        const validPairs = rowValues.map((rowVal, i) => ({
          row: rowVal,
          col: columnValues[i]
        })).filter(pair => pair.row != null && pair.col != null);
        
        if (validPairs.length === 0) {
          throw new Error('No valid sentiment pairs found for selected models');
        }
        
        const rowsForMatrix = validPairs.map(p => p.row);
        const colsForMatrix = validPairs.map(p => p.col);

        const confusionMatrix = generateConfusionMatrix(
          rowsForMatrix,
          colsForMatrix
        );
        
        const calculatedMetrics = {
          ...calculateMetrics(confusionMatrix),
          ...confusionMatrix,
          totalComparisons: validPairs.length
        };
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error generating confusion matrix:', error);
        setMetrics({
          error: error.message,
          truePos: 0,
          trueNeg: 0,
          falsePos: 0,
          falseNeg: 0
        });
      }
    } else {
      setMetrics({});
    }
  }, [rowModel, columnModel, data]);
  
  const handleRowModelChange = (event) => {
    setRowModel(event.target.value);
  };

  const handleColumnModelChange = (event) => {
    setColumnModel(event.target.value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: '2' }}>
          <div style={{ marginBottom: '2rem' }}>
            <GlassCard style={{ padding: '2rem' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                  }}>
                    Rows Model:
                  </label>
                  <select 
                    value={rowModel || ''} 
                    onChange={handleRowModelChange}
                    style={{ 
                      width: '100%', 
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    disabled={modelOptions.length === 0}
                  >
                    <option value="">
                      {modelOptions.length === 0 ? 'Loading models...' : 'Select a model for rows'}
                    </option>
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                  }}>
                    Columns Model:
                  </label>
                  <select 
                    value={columnModel || ''} 
                    onChange={handleColumnModelChange}
                    style={{ 
                      width: '100%', 
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    disabled={modelOptions.length === 0}
                  >
                    <option value="">
                      {modelOptions.length === 0 ? 'Loading models...' : 'Select a model for columns'}
                    </option>
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              {(!rowModel || !columnModel) && (
                <GlassCard style={{ margin: '2rem', padding: '2rem' }}>
                  <p>Please select both row and column models to view the confusion matrix</p>
                </GlassCard>
              )}
            
              {rowModel && columnModel && !metrics && (
                <GlassCard style={{ margin: '2rem', padding: '2rem' }}>
                  <p>Loading metrics...</p>
                </GlassCard>
              )}
            
              {rowModel && columnModel && metrics && (
                <>
                  <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>
                    Confusion Matrix Comparison
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Rows: {modelOptions.find(m => m.value === rowModel)?.label}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Columns: {modelOptions.find(m => m.value === columnModel)?.label}
                  </p>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'auto auto auto',
                    gap: '1px',
                    backgroundColor: 'var(--border-color)',
                    border: '1px solid var(--border-color)',
                    margin: '2rem auto',
                    maxWidth: '500px'
                  }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', textAlign: 'center', color: 'var(--text-primary)' }}
                         title="Row vs Column Model Predictions">Matrix</div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', textAlign: 'center', color: 'var(--text-primary)' }}
                         title="Column model predicted positive">Column Positive</div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', textAlign: 'center', color: 'var(--text-primary)' }}
                         title="Column model predicted negative">Column Negative</div>
                    
                    <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', textAlign: 'center', color: 'var(--text-primary)' }}
                         title="Row model predicted positive">Row Positive</div>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)', 
                      color: 'var(--success-color)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    title="Both models predicted positive">
                      {metrics.truePos || 0}
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: isDarkMode ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)', 
                      color: 'var(--error-color)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    title="Row model positive, Column model negative">
                      {metrics.falseNeg || 0}
                    </div>
                    
                    <div style={{ padding: '1rem', backgroundColor: 'var(--card-bg)', textAlign: 'center', color: 'var(--text-primary)' }}
                         title="Row model predicted negative">Row Negative</div>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: isDarkMode ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.1)', 
                      color: 'var(--error-color)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    title="Row model negative, Column model positive">
                      {metrics.falsePos || 0}
                    </div>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: isDarkMode ? 'rgba(46, 204, 113, 0.2)' : 'rgba(46, 204, 113, 0.1)', 
                      color: 'var(--success-color)',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}
                    title="Both models predicted negative">
                      {metrics.trueNeg || 0}
                    </div>
                  </div>
                </>
              )}
            </div>

            <GlassCard style={{ marginTop: '2rem', padding: '2rem' }}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '1.5rem' }}>Metrics</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {[
                  { label: 'Accuracy', value: metrics.accuracy },
                  { label: 'F1 Score', value: metrics.f1 },
                  { label: 'Sensitivity', value: metrics.sensitivity },
                  { label: 'Specificity', value: metrics.specificity },
                  { label: "Cohen's Kappa", value: metrics.kappa }
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {metric.label}
                    </p>
                    <p style={{ 
                      color: 'var(--accent-color)', 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold' 
                    }}>
                      {metric.value || 'N/A'}
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <GlassCard style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
            <ReactMarkdown>
              {`# Understanding the Embeddings and Sentiment Separation

This visualization represents text embeddings projected into a 3D space using **Principal Component Analysis (PCA)** and **Uniform Manifold Approximation and Projection (UMAP)**. Each point corresponds to a text sample, and its color reflects sentiment, as predicted by different models.

### Sentiment Clustering and Uncertainty
- **Separation of Sentiments**: Positive sentiments (e.g., joy, excitement) cluster together, while negative sentiments (e.g., frustration, sadness) form a distinct region.
- **Region of Uncertainty**: Between these clusters, there is a transitional area where neutral or ambiguous sentiments are found, illustrating the challenge of sentiment classification in edge cases.

### Impact of Model Size on Embedding Separation
- **Larger Models (0.5B → 14B Parameters)**: These models show strong out-of-the-box sentiment separation, leveraging structured embeddings that naturally capture nuanced differences in sentiment.
- **Smaller Models (e.g., ModernBERT, 150M Parameters)**: While smaller models may not initially exhibit the same level of separation, fine-tuning significantly improves performance, allowing them to achieve competitive results.

This comparison highlights the trade-off between model size, generalization ability, and the effectiveness of fine-tuning in sentiment analysis tasks.`}
            </ReactMarkdown>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisDashboard;
