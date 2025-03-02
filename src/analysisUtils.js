export const calculateMetrics = (confusionMatrix) => {
  const { truePos, trueNeg, falsePos, falseNeg } = confusionMatrix;
  
  const accuracy = (truePos + trueNeg) / (truePos + trueNeg + falsePos + falseNeg);
  const precision = truePos / (truePos + falsePos);
  const recall = truePos / (truePos + falseNeg);
  const f1 = 2 * (precision * recall) / (precision + recall);
  const sensitivity = recall;
  const specificity = trueNeg / (trueNeg + falsePos);

  // Calculate Cohen's Kappa
  const total = truePos + trueNeg + falsePos + falseNeg;
  const pObserved = (truePos + trueNeg) / total;
  
  // Calculate expected agreement by chance
  const pos1 = (truePos + falsePos) / total;
  const pos2 = (truePos + falseNeg) / total;
  const neg1 = (trueNeg + falseNeg) / total;
  const neg2 = (trueNeg + falsePos) / total;
  const pExpected = (pos1 * pos2) + (neg1 * neg2);
  
  // Calculate Kappa
  const kappa = (pObserved - pExpected) / (1 - pExpected);

  return {
    accuracy: accuracy.toFixed(3),
    f1: f1.toFixed(3),
    sensitivity: sensitivity.toFixed(3),
    specificity: specificity.toFixed(3),
    kappa: kappa.toFixed(3)
  };
};

export const generateConfusionMatrix = (rowValues, columnValues) => {
  const matrix = {
    truePos: 0,
    trueNeg: 0,
    falsePos: 0,
    falseNeg: 0
  };

  // Compare the values directly as numbers
  rowValues.forEach((rowVal, index) => {
    const colVal = columnValues[index];
    
    // Skip any null or undefined values
    if (rowVal == null || colVal == null) return;

    // Both predict positive (2)
    if (rowVal === 2 && colVal === 2) {
      matrix.truePos++;
    }
    // Both predict negative (1)
    else if (rowVal === 1 && colVal === 1) {
      matrix.trueNeg++;
    }
    // Row predicts negative (1), Column predicts positive (2)
    else if (rowVal === 1 && colVal === 2) {
      matrix.falsePos++;
    }
    // Row predicts positive (2), Column predicts negative (1)
    else if (rowVal === 2 && colVal === 1) {
      matrix.falseNeg++;
    }
  });

  return matrix;
};
