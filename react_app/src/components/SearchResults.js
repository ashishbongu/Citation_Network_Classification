import React from 'react';
import Paper from './Paper';

function SearchResults({ results, onCitationClick }) {
  if (results.length === 0) {
    return <div className="no-results">No papers found. Try a different search.</div>;
  }

  return (
    <div className="results-list">
      {results.map(paper => (
        <Paper
          key={paper.pmid}
          paper={paper}
          onCitationClick={onCitationClick}
        />
      ))}
    </div>
  );
}

export default SearchResults;