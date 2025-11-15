import React, { useState } from 'react';

function Paper({ paper, onCitationClick }) {
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * This function will be called when the user clicks "Summarize"
   */
  const handleSummarizeClick = async () => {
    setIsSummarizing(true);
    setError(null);
    setSummary('');

    try {
      const abstractToSummarize = paper.abstract;
      const serverUrl = 'http://localhost:4000/api/summarize';

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abstract: abstractToSummarize }),
      });

      // Handle the 503 "model loading" error
      if (response.status === 503) {
        throw new Error('AI model is loading. Please try again in 30 seconds.');
      }
      
      if (!response.ok) {
        throw new Error('Failed to get summary');
      }

      const data = await response.json();
      setSummary(data.summary);

    } catch (err) {
      setError(err.message); // Set the specific error message
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- THIS IS THE NEW PART ---
  // Create the direct URL to the PubMed article page
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`;
  // --- END OF NEW PART ---

  return (
    <div className="paper-card">
      
      {/* This is the main change. The <h3> is now an <a> tag
        linking to the pubmedUrl.
      */}
      <h3>
        <a href={pubmedUrl} target="_blank" rel="noopener noreferrer">
          {paper.title}
        </a>
      </h3>
      
      <p className="paper-pmid"><strong>PMID:</strong> {paper.pmid}</p>
      
      {/* Abstract and Summarize Button */}
      <div className="abstract-section">
        <p className="paper-abstract">{paper.abstract}</p>
        
        {paper.abstract !== 'No abstract available' && !summary && (
          <button 
            className="summarize-btn" 
            onClick={handleSummarizeClick}
            disabled={isSummarizing}
          >
            {isSummarizing ? 'Summarizing...' : 'Summarize'}
          </button>
        )}
      </div>

      {/* Summary Display Area */}
      {isSummarizing && <div className="summary-loading">Generating summary...</div>}
      {/* Updated to show the specific error message */}
      {error && <div className="summary-error">{error}</div>}
      {summary && (
        <div className="summary-box">
          <h4>Key Points:</h4>
          <p>{summary}</p>
        </div>
      )}
      
      {/* Citations Section (Unchanged) */}
      {paper.citations.length > 0 && (
        <div className="citations-section">
          <strong>Citations:</strong>
          <ul className="citations-list">
            {paper.citations.map(citationPmid => (
              <li 
                key={citationPmid} 
                className="citation-item"
                onClick={() => onCitationClick(citationPmid)}
              >
                {citationPmid}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Paper;