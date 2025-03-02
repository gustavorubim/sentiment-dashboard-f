import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';
import { useTheme } from './context/ThemeContext';

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  // State to hold the full dataset
  const [data, setData] = useState([]);
  // State for the dropdown selections
  const [embeddingType, setEmbeddingType] = useState('PCA');
  const [colorColumn, setColorColumn] = useState('fine_tuned_sentiment_code');
  const [plotData, setPlotData] = useState([]);

  // Define dropdown options
  const embeddingOptions = ['PCA', 'UMAP'];
  // Update these options to include all relevant binary and probability columns from your file
  const colorOptions = [
    'fine_tuned_sentiment_code',
    'gemma2:2b_sentiment_code',
    'granite3-moe:1b_sentiment_code',
    'granite3.1-dense:2b_sentiment_code',
    'granite3.1-dense:8b_sentiment_code',
    'llama3.1:8b_sentiment_code',
    'llama3.2:1b_sentiment_code',
    'llama3.2:3b_sentiment_code',
    'mistral:latest_sentiment_code',
    'phi4:latest_sentiment_code',
    'qwen2.5:0.5b_sentiment_code',
    'qwen2.5:1.5b_sentiment_code',
    'qwen2.5:14b_sentiment_code',
    'qwen2.5:3b_sentiment_code',
    'qwen2.5:7b_sentiment_code',
    'mah_predicted_class',
    'mah_prob_class_0',
    'mah_prob_class_1'
  ];

  // Load CSV data on mount (assumes the CSV is placed in the public folder)
  useEffect(() => {
    d3.csv(process.env.PUBLIC_URL + '/reviews.csv').then(dataset => {
      // Convert numeric columns (embeddings and probabilities) from strings to numbers.
      const numericCols = [
        'mah_pca_embedding_1', 'mah_pca_embedding_2', 'mah_pca_embedding_3',
        'mah_umap_embedding_1', 'mah_umap_embedding_2', 'mah_umap_embedding_3',
        'mah_prob_class_0', 'mah_prob_class_1'
      ];
      dataset.forEach(d => {
        numericCols.forEach(col => {
          d[col] = +d[col];
        });
      });
      setData(dataset);
    });
  }, []);

  // Update the plot data when the data or dropdown selections change.
  useEffect(() => {
    // Choose embedding columns based on the dropdown selection
    const xCol = embeddingType === 'PCA' ? 'mah_pca_embedding_1' : 'mah_umap_embedding_1';
    const yCol = embeddingType === 'PCA' ? 'mah_pca_embedding_2' : 'mah_umap_embedding_2';
    const zCol = embeddingType === 'PCA' ? 'mah_pca_embedding_3' : 'mah_umap_embedding_3';
    // For performance reasons, limit the number of points to plot (e.g., first 10000 records)
    const subset = data.slice(0, 10000);

    let marker = {};
    // Check if the selected color column is a probability (starts with 'mah_prob_')
    if (colorColumn.startsWith('mah_prob_')) {
      marker = {
        color: subset.map(d => +d[colorColumn]),
        colorscale: 'Plasma',
        colorbar: { title: colorColumn },
        showscale: true
      };
    } else {
      // For all other columns (binary classifications), use consistent red/blue colors
      marker = {
        color: subset.map(d => +d[colorColumn]),
        colors: ['#FF0000', '#0000FF'],
        showscale: false
      };
    }

    // Construct the trace for a 3D scatter plot.
    const trace = {
      x: subset.map(d => d[xCol]),
      y: subset.map(d => d[yCol]),
      z: subset.map(d => d[zCol]),
      mode: 'markers',
      type: 'scatter3d',
      marker: { size: 3, ...marker }
    };
    setPlotData([trace]);
  }, [data, embeddingType, colorColumn]);

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
          Spatial Sentiment Analysis by model
        </h2>
        <div style={{ 
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Select Embedding:
            </label>
            <select 
              value={embeddingType} 
              onChange={e => setEmbeddingType(e.target.value)}
              style={{ 
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              {embeddingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Select Model Sentiment:
            </label>
            <select 
              value={colorColumn} 
              onChange={e => setColorColumn(e.target.value)}
              style={{ 
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                minWidth: '300px'
              }}
            >
              {colorOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.replace(/_/g, ' ').replace('sentiment code', '').trim()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '2rem' }}>
        <Plot 
          data={plotData}
          layout={{
            autosize: true,
            height: 600,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            scene: {
              xaxis: { 
                title: `${embeddingType} X`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)'
              },
              yaxis: { 
                title: `${embeddingType} Y`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)'
              },
              zaxis: { 
                title: `${embeddingType} Z`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)'
              },
              bgcolor: 'rgba(0,0,0,0)'
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            font: {
              color: 'var(--text-primary)'
            }
          }}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </GlassCard>
    </motion.div>
  );
};

export default Dashboard;
