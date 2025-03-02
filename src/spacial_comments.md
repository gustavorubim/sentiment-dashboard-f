# Understanding the Embeddings and Sentiment Separation

This visualization represents text embeddings projected into a 3D space using **Principal Component Analysis (PCA)** and **Uniform Manifold Approximation and Projection (UMAP)**. Each point corresponds to a text sample, and its color reflects sentiment, as predicted by different models.

### Sentiment Clustering and Uncertainty
- **Separation of Sentiments**: Positive sentiments (e.g., joy, excitement) cluster together, while negative sentiments (e.g., frustration, sadness) form a distinct region.
- **Region of Uncertainty**: Between these clusters, there is a transitional area where neutral or ambiguous sentiments are found, illustrating the challenge of sentiment classification in edge cases.

### Impact of Model Size on Embedding Separation
- **Larger Models (0.5B → 14B Parameters)**: These models show strong out-of-the-box sentiment separation, leveraging structured embeddings that naturally capture nuanced differences in sentiment.
- **Smaller Models (e.g., ModernBERT, 150M Parameters)**: While smaller models may not initially exhibit the same level of separation, fine-tuning significantly improves performance, allowing them to achieve competitive results.

This comparison highlights the trade-off between model size, generalization ability, and the effectiveness of fine-tuning in sentiment analysis tasks.