import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';
import { useTheme } from './context/ThemeContext';

const DisagreementExamination = () => {
  const { isDarkMode } = useTheme();
  // State to hold the full dataset
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for the dropdown selections
  const [embeddingType, setEmbeddingType] = useState('PCA');
  const [model1, setModel1] = useState('fine_tuned_sentiment_code');
  const [model2, setModel2] = useState('gemma2:2b_sentiment_code');
  const [plotData, setPlotData] = useState([]);

  // Define dropdown options
  const embeddingOptions = ['PCA', 'UMAP'];
  const modelOptions = [
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
    'qwen2.5:7b_sentiment_code'
  ];

  // Load CSV data on mount
  useEffect(() => {
    const loadCSV = async () => {
      setLoading(true);
      setError(null);
      
      // First try to fetch the file to ensure it's accessible
      try {
        console.log('Starting to fetch CSV file...');
        const csvPath = './reviews.csv';
        
        // Use Papa Parse's built-in download with additional config
        Papa.parse(csvPath, {
          download: true,
          downloadRequestHeaders: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: function(results) {
            console.log('CSV parsing complete');
            console.log('Number of rows:', results.data.length);
            console.log('Fields:', results.meta.fields);
            
            if (results.errors.length > 0) {
              console.warn('Parse errors:', results.errors);
              const errorMessage = results.errors
                .map(e => `Row ${e.row}: ${e.message}`)
                .join('; ');
              setError(`CSV parse warnings: ${errorMessage}`);
            }
            
            if (results.data.length === 0) {
              setError('No data found in CSV file');
              setLoading(false);
              return;
            }
            
            // Verify required columns exist
            const requiredColumns = ['mah_pca_embedding_1', 'mah_pca_embedding_2', 'mah_pca_embedding_3',
                                  'mah_umap_embedding_1', 'mah_umap_embedding_2', 'mah_umap_embedding_3'];
            const missingColumns = requiredColumns.filter(col => !results.meta.fields.includes(col));
            
            if (missingColumns.length > 0) {
              setError(`Missing required columns: ${missingColumns.join(', ')}`);
              setLoading(false);
              return;
            }
            
            // Store the parsed data
            setData(results.data);
            setLoading(false);
          },
          error: function(err) {
            console.error('Papa Parse error:', err);
            setError(`Failed to parse CSV: ${err.message || 'Unknown parsing error'}`);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadCSV();
  }, []);

  // Update the plot data when the data or dropdown selections change
  useEffect(() => {
    const xCol = embeddingType === 'PCA' ? 'mah_pca_embedding_1' : 'mah_umap_embedding_1';
    const yCol = embeddingType === 'PCA' ? 'mah_pca_embedding_2' : 'mah_umap_embedding_2';
    const zCol = embeddingType === 'PCA' ? 'mah_pca_embedding_3' : 'mah_umap_embedding_3';
    
    // Calculate agreement/disagreement for all points
    const colors = data.map(d => {
      const model1Value = +d[model1];
      const model2Value = +d[model2];
      return model1Value === model2Value ? 0 : 1; // 0 for agreement, 1 for disagreement
    });

    // Construct the trace for a 3D scatter plot using all data
    const trace = {
      x: data.map(d => d[xCol]),
      y: data.map(d => d[yCol]),
      z: data.map(d => d[zCol]),
      mode: 'markers',
      type: 'scatter3d',
      hovertext: data.map(d => `Model 1: ${d[model1] === 1 ? 'Positive' : 'Negative'}<br>Model 2: ${d[model2] === 1 ? 'Positive' : 'Negative'}`),
      hoverinfo: 'text',
      marker: {
        size: 4,
        color: colors,
        colorscale: [
          [0, 'var(--success-color)'], // Green for agreement
          [1, 'var(--error-color)']  // Red for disagreement
        ],
        opacity: 0.8,
        showscale: true,
        colorbar: {
          title: {
            text: 'Model Agreement',
            font: {
              color: 'var(--text-primary)',
              size: 14
            }
          },
          ticktext: ['Agreement', 'Disagreement'],
          tickvals: [0, 1],
          tickmode: 'array',
          tickfont: {
            color: 'var(--text-primary)',
            size: 12
          }
        }
      }
    };
    setPlotData([trace]);
  }, [data, embeddingType, model1, model2]);

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
          Model Disagreement Examination
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
              Select Model 1:
            </label>
            <select 
              value={model1} 
              onChange={e => setModel1(e.target.value)}
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
              {modelOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.replace(/_/g, ' ').replace('sentiment code', '').trim()}
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
              Select Model 2:
            </label>
            <select 
              value={model2} 
              onChange={e => setModel2(e.target.value)}
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
              {modelOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt.replace(/_/g, ' ').replace('sentiment code', '').trim()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '2rem', minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && <div>Loading data...</div>}
        {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}
        {!loading && !error && 
        <Plot 
          data={plotData}
          layout={{
            autosize: true,
            height: 600,
            paper_bgcolor: 'var(--card-bg)',
            plot_bgcolor: 'var(--card-bg)',
            scene: {
              camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 },
                center: { x: 0, y: 0, z: 0 }
              },
              xaxis: { 
                title: `${embeddingType} X`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)',
                showgrid: true,
                zeroline: false,
                showline: true,
                linecolor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              },
              yaxis: { 
                title: `${embeddingType} Y`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)',
                showgrid: true,
                zeroline: false,
                showline: true,
                linecolor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              },
              zaxis: { 
                title: `${embeddingType} Z`,
                gridcolor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-primary)',
                showgrid: true,
                zeroline: false,
                showline: true,
                linecolor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              },
              bgcolor: 'var(--card-bg)'
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            font: {
              color: 'var(--text-primary)'
            }
          }}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />}
      </GlassCard>
    </motion.div>
  );
};

export default DisagreementExamination;
