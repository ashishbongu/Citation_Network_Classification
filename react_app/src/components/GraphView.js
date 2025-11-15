import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { MiniMap, Controls } from 'reactflow';
import 'reactflow/dist/style.css'; // Import reactflow styles

import { SearchContext } from '../data/SearchContext';

// This function converts our search results into nodes and edges
const generateGraph = (papers) => {
  const nodes = [];
  const edges = [];
  const paperPmids = new Set(papers.map(p => p.pmid));

  // Create a node for each paper
  papers.forEach((paper, index) => {
    nodes.push({
      id: paper.pmid,
      data: { label: paper.title },
      position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
    });

    // Create edges for citations *that are also in the results*
    paper.citations.forEach(citedPmid => {
      if (paperPmids.has(citedPmid)) {
        edges.push({
          id: `${paper.pmid}-${citedPmid}`,
          source: paper.pmid,
          target: citedPmid,
          animated: true,
        });
      }
    });
  });

  return { nodes, edges };
};


function GraphView() {
  const { searchResults } = useContext(SearchContext);
  const navigate = useNavigate();

  // State to manage highlighted nodes
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  
  // Generate the graph. useMemo prevents re-calculating every render
  const { nodes, edges } = useMemo(() => generateGraph(searchResults), [searchResults]);

  // --- Feature Implementations ---

  // 1. On Click: Open PubMed
  const onNodeClick = (event, node) => {
    const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${node.id}/`;
    window.open(pubmedUrl, '_blank');
  };

  // 2. On Hover: Highlight connections
  const onNodeMouseEnter = (event, node) => {
    const connectedPmids = new Set([node.id]);
    edges.forEach(edge => {
      if (edge.source === node.id) connectedPmids.add(edge.target);
      if (edge.target === node.id) connectedPmids.add(edge.source);
    });
    setHighlightedNodes(connectedPmids);
  };

  // 3. On Leave: Clear highlights
  const onNodeMouseLeave = () => {
    setHighlightedNodes(new Set());
  };

  // 4. Dynamically style nodes based on highlight state
  const styledNodes = nodes.map(node => {
    const isHighlighted = highlightedNodes.has(node.id);
    return {
      ...node,
      style: {
        ...node.style,
        border: isHighlighted ? '2px solid #007bff' : '1px solid #999',
        boxShadow: isHighlighted ? '0 0 10px #007bff' : 'none',
        opacity: highlightedNodes.size > 0 && !isHighlighted ? 0.3 : 1,
        transition: 'all 0.2s ease',
      }
    };
  });

  if (searchResults.length === 0) {
    return (
      <div className="graph-container-empty">
        <h2>No data to display</h2>
        <button onClick={() => navigate('/')}>Go Back to Search</button>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <button className="graph-back-btn" onClick={() => navigate('/')}>
        ← Back to Search
      </button>
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
      >
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default GraphView;