import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { calculateMetrics, generateConfusionMatrix } from './analysisUtils';
import GlassCard from './components/GlassCard';
import { useTheme } from './context/ThemeContext';

const ModelMetricsDashboard = () => {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('accuracy');
  const [modelMetrics, setModelMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const metrics = [
    { value: 'accuracy', label: 'Accuracy' },
    { value: 'f1', label: 'F1 Score' },
    { value: 'sensitivity', label: 'Sensitivity' },
    { value: 'specificity', label: 'Specificity' },
    { value: 'kappa', label: 'Cohen\'s Kappa' }
  ];

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
        const modelColumns = headers.filter(header => header.endsWith('_sentiment_code'));
        
        if (!headers.includes('polarity') || modelColumns.length === 0) {
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
        
        // Calculate metrics for each model
        const metricsData = modelColumns.map(modelColumn => {
          const modelValues = parsedData.map(row => row[modelColumn]);
          const polarityValues = parsedData.map(row => row.polarity);
          
          // Filter out rows where either value is null
          const validPairs = modelValues.map((val, i) => ({
            model: val,
            polarity: polarityValues[i]
          })).filter(pair => pair.model != null && pair.polarity != null);
          
          const confusionMatrix = generateConfusionMatrix(
            validPairs.map(p => p.model),
            validPairs.map(p => p.polarity)
          );
          
          const metrics = calculateMetrics(confusionMatrix);
          
          return {
            model: modelColumn
              .replace('_sentiment_code', '')
              .split(':')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' '),
            ...metrics
          };
        });

        setModelMetrics(metricsData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
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
          Model Performance Metrics
        </h2>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            marginRight: '1rem',
            color: 'var(--text-primary)'
          }}>
            Select Metric:
          </label>
          <select 
            value={selectedMetric} 
            onChange={handleMetricChange}
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
            {metrics.map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <GlassCard style={{ 
        padding: '2rem',
        width: '100%', 
        height: '600px', 
        overflowX: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Loading model metrics...
          </motion.div>
        ) : modelMetrics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            No model metrics available
          </motion.div>
        ) : (
        <BarChart
          width={Math.max(900, modelMetrics.length * 200)}
          height={500}
          data={modelMetrics}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          style={{
            backgroundColor: 'transparent'
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
          />
          <XAxis 
            dataKey="model" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <YAxis 
            domain={[0, 1]} 
            tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <Tooltip 
            formatter={(value) => (typeof value === 'number' ? value.toFixed(3) : value)}
            contentStyle={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
          />
          <Legend 
            wrapperStyle={{
              color: 'var(--text-primary)'
            }}
          />
          <Bar 
            dataKey={selectedMetric} 
            fill="var(--accent-color)"
            radius={[8, 8, 0, 0]}
            label={{ 
              position: 'top',
              formatter: (value) => (typeof value === 'number' ? value.toFixed(3) : value)
            }}
          />
        </BarChart>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default ModelMetricsDashboard;
