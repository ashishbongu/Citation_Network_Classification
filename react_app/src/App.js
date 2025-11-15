import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import CategoryFilter from './components/CategoryFilter';
import TrendModal from './components/TrendModal'; // 1. Import the new modal
import './index.css'; 

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');

  // --- 2. Add state for the new modal ---
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [trendReport, setTrendReport] = useState('');
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);
  // --- End of new state ---

  useEffect(() => {
    if (!currentQuery) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      
      const serverUrl = `http://localhost:4000/api/search?q=${encodeURIComponent(currentQuery)}&category=${encodeURIComponent(currentCategory)}`;

      try {
        const response = await fetch(serverUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        setError(err.message);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [currentQuery, currentCategory]); 

  const handleSearch = (query) => {
    setCurrentQuery(query);
  };

  const handleCitationClick = (pmid) => {
    setCurrentQuery(pmid);
    setCurrentCategory('all');
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
  };

  // --- 3. Add the function to call the new server endpoint ---
  const handleAnalyzeTrends = async () => {
    // Don't run if there's no query
    if (!currentQuery) return; 

    setShowTrendModal(true);
    setIsTrendLoading(true);
    setTrendReport('');
    setTrendError(null);

    // This is our new server endpoint
    const serverUrl = `http://localhost:4000/api/trends?q=${encodeURIComponent(currentQuery)}&category=${encodeURIComponent(currentCategory)}`;

    try {
      const response = await fetch(serverUrl);
      if (!response.ok) {
        // Handle the 503 error from Hugging Face
        if (response.status === 503) {
          throw new Error('AI model is loading. Please try again in 30 seconds.');
        }
        throw new Error('Failed to generate trend report');
      }
      const data = await response.json();
      setTrendReport(data.report);
    } catch (err) {
      setTrendError(err.message);
    } finally {
      setIsTrendLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PubMed AI powered Database</h1>
      </header>
      <main>
        <div className="search-controls">
          <SearchBar onSearch={handleSearch} />
          <CategoryFilter 
            selectedCategory={currentCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* 4. Add the new "Analyze" button container */}
        <div className="action-buttons-container">
          <button 
            className="trend-button"
            onClick={handleAnalyzeTrends}
            disabled={!currentQuery} // Disable if no search query
          >
            Analyze Trends 
          </button>
        </div>
        
        {isLoading && <div className="loading">Loading...</div>}
        {error && <div className="error">Error: {error}</div>}
        
        {!isLoading && !error && (
          <SearchResults 
            results={searchResults} 
            onCitationClick={handleCitationClick} 
          />
        )}
      </main>

      {/* 5. Add the modal to the page (it's hidden by default) */}
      {showTrendModal && (
        <TrendModal
          report={trendReport}
          isLoading={isTrendLoading}
          error={trendError}
          onClose={() => setShowTrendModal(false)}
        />
      )}
    </div>
  );
}

export default App;