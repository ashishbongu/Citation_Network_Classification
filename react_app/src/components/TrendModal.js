import React from 'react';

// This is the pop-up component
function TrendModal({ report, isLoading, error, onClose }) {
  return (
    // The "modal-backdrop" is the dark grey background
    <div className="modal-backdrop" onClick={onClose}>
      
      {/* This is the white content box */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2>Trends from the Past Year</h2>
        <p>Based on an analysis of the top recent papers.</p>
        
        {isLoading && (
          <div className="loading">Generating report...</div>
        )}

        {error && (
          <div className="summary-error">{error}</div>
        )}

        {report && (
          <div className="summary-box">
            {/* 'white-space: pre-line' respects line breaks from the AI */}
            <p style={{ whiteSpace: 'pre-line' }}>{report}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrendModal;