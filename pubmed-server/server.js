const express = require('express');
const axios = require('axios'); // We use this
const cors = require('cors');
const { parseStringPromise } = require('xml2js');
require('dotenv').config(); // Still need this!

const app = express();
const PORT = 4000;

// === Middleware ===
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());


// === Helper Functions ===
// (These are unchanged)
const createCitationMap = (elinkData) => {
  const citationMap = {};
  const linksets = elinkData?.linksets || [];
  for (const linkset of linksets) {
    const pmid = linkset.ids[0];
    let citations = [];
    const linksetdbs = linkset.linksetdbs || [];
    const refLinkDb = linksetdbs.find(db => db.linkname === 'pubmed_pubmed_refs');
    if (refLinkDb && refLinkDb.links) {
      citations = refLinkDb.links;
    }
    citationMap[pmid] = citations;
  }
  return citationMap;
};
const formatPubMedData = (data, citationMap) => {
  const articles = data.PubmedArticleSet?.PubmedArticle || [];
  return articles.map(article => {
    const citation = article.MedlineCitation[0];
    const articleData = citation.Article[0];
    const title = articleData.ArticleTitle[0]?._ || articleData.ArticleTitle[0] || 'No title available';
    let abstract = 'No abstract available';
    if (articleData.Abstract && articleData.Abstract[0].AbstractText) {
      abstract = articleData.Abstract[0].AbstractText.map(text => 
        text._ || text
      ).join('\n');
    }
    const pmid = citation.PMID[0]._ || citation.PMID[0];
    const citations = citationMap[pmid] || [];
    return {
      pmid: pmid,
      title: title,
      abstract: abstract,
      citations: citations
    };
  });
};


// === API Endpoint: /api/search ===
// (This entire endpoint is unchanged)
app.get('/api/search', async (req, res) => {
  const { q: query, category } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  let finalSearchTerm = query;
  if (category && category !== 'all') {
    finalSearchTerm = `(${query}) AND (${category})`;
  }
  console.log(`Final PubMed term: ${finalSearchTerm}`);
  const pmidSet = new Set();
  const isPmid = /^\d{1,8}$/.test(query.trim());
  try {
    const esearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
    const esearchResponse = await axios.get(esearchUrl, {
      params: { db: 'pubmed', term: finalSearchTerm, retmode: 'json', retmax: 10 }
    });
    const keywordPmids = esearchResponse.data.esearchresult?.idlist || [];
    keywordPmids.forEach(pmid => pmidSet.add(pmid));
    if (isPmid) {
      console.log('Original query is a PMID. Searching for papers that cite it...');
      pmidSet.add(query);
      const elinkCitedInUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
      const elinkResponse = await axios.get(elinkCitedInUrl, {
        params: { dbfrom: 'pubmed', db: 'pubmed', id: query, linkname: 'pubmed_pubmed_citedin', retmode: 'json' }
      });
      const linkset = elinkResponse.data?.linksets?.[0]?.linksetdbs?.[0];
      const citedInPmids = linkset?.links || [];
      citedInPmids.forEach(pmid => pmidSet.add(pmid));
    }
    const allPmids = Array.from(pmidSet);
    if (allPmids.length === 0) {
      return res.json([]);
    }
    let citationMap = {};
    try {
      const elinkRefsUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
      const elinkRefsResponse = await axios.get(elinkRefsUrl, {
        params: { dbfrom: 'pubmed', db: 'pubmed', id: allPmids.join(','), linkname: 'pubmed_pubmed_refs', retmode: 'json' }
      });
      citationMap = createCitationMap(elinkRefsResponse.data);
    } catch (elinkErr) {
      console.error('Could not fetch citation references:', elinkErr.message);
    }
    const efetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const efetchResponse = await axios.get(efetchUrl, {
      params: { db: 'pubmed', id: allPmids.join(','), retmode: 'xml', rettype: 'abstract' }
    });
    const xmlData = efetchResponse.data;
    const parsedData = await parseStringPromise(xmlData, { explicitArray: true });
    const formattedData = formatPubMedData(parsedData, citationMap);
    res.json(formattedData);
  } catch (error) {
    console.error('Error executing search:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from PubMed' });
  }
});


// === API Endpoint: /api/summarize ===
// (This entire endpoint is unchanged)
app.post('/api/summarize', async (req, res) => {
  try {
    const { abstract } = req.body;
    if (!abstract) {
      return res.status(400).json({ error: 'No abstract provided' });
    }
    const model = "facebook/bart-large-cnn";
    const hfApiKey = process.env.HF_API_KEY;
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;

    const aiResponse = await axios.post(
      url,
      { 
        inputs: abstract,
        // --- ADD THESE PARAMETERS ---
        // This will give a 2-3 sentence summary
        parameters: { 
          min_length: 30,
          max_length: 150
        }
        // --- END OF CHANGE ---
      },
      { headers: { 'Authorization': `Bearer ${hfApiKey}`, 'Content-Type': 'application/json' } }
    );

    if (!aiResponse.data || !aiResponse.data[0] || !aiResponse.data[0].summary_text) {
      throw new Error('Invalid response structure from Hugging Face');
    }
    const summary = aiResponse.data[0].summary_text;
    res.json({ summary: summary });
  } catch (error) {
    console.error('Error with Hugging Face summarization:');
    if (error.response && error.response.status === 503) {
      console.error('Model is loading, try again.');
      return res.status(503).json({ error: 'AI model is loading. This is normal. Please try again in 20-30 seconds.' });
    }
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});
// === End /api/summarize ===


// === API ENDPOINT: /api/trends (UPDATED) ===
app.get('/api/trends', async (req, res) => {
  try {
    const { q: query, category } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // 1. Create the base search term
    let finalSearchTerm = query;
    if (category && category !== 'all') {
      finalSearchTerm = `(${query}) AND (${category})`;
    }

    // 2. Create a date range for the past 12 months
    const today = new Date();
    const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
    const formatDate = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    const dateRange = `("${formatDate(oneYearAgo)}"[Date - Publication] : "${formatDate(new Date())}"[Date - Publication])`;

    // 3. Combine base term with date range
    const trendSearchTerm = `(${finalSearchTerm}) AND (${dateRange})`;
    console.log(`Trend search term: ${trendSearchTerm}`);

    // 4. ESearch: Find PMIDs for recent papers
    const esearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
    const esearchResponse = await axios.get(esearchUrl, {
      params: {
        db: 'pubmed',
        term: trendSearchTerm,
        sort: 'relevance', 
        retmode: 'json',
        retmax: 10 
      }
    });
    
    const pmids = esearchResponse.data.esearchresult?.idlist;
    if (!pmids || pmids.length === 0) {
      return res.json({ report: 'No recent papers found for this topic.' });
    }

    // 5. EFetch: Get abstracts for these PMIDs
    const efetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
    const efetchResponse = await axios.get(efetchUrl, {
      params: { db: 'pubmed', id: pmids.join(','), retmode: 'xml', rettype: 'abstract' }
    });

    // 6. Parse XML and combine all abstracts into one text block
    const parsedData = await parseStringPromise(efetchResponse.data, { explicitArray: true });
    const articles = parsedData.PubmedArticleSet?.PubmedArticle || [];
    let allAbstracts = '';
    
    for (const article of articles) {
      const articleData = article.MedlineCitation[0].Article[0];
      if (articleData.Abstract && articleData.Abstract[0].AbstractText) {
        allAbstracts += articleData.Abstract[0].AbstractText.map(text => text._ || text).join('\n') + '\n\n';
      }
    }

    if (allAbstracts.trim() === '') {
      return res.json({ report: 'Found recent papers, but none had abstracts to analyze.' });
    }

    // Truncate the combined abstracts to a safe character limit
    const maxChars = 3500;
    if (allAbstracts.length > maxChars) {
      console.log(`Truncating abstracts from ${allAbstracts.length} to ${maxChars} chars.`);
      allAbstracts = allAbstracts.substring(0, maxChars) + "\n...[Text Truncated]";
    }

    // 7. Send to AI for trend analysis
    const model = "facebook/bart-large-cnn";
    const hfApiKey = process.env.HF_API_KEY;
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    
    // Create a new, specific prompt for trend analysis
    const aiPrompt = `The following text contains several scientific abstracts from the past year. Analyze them and generate a detailed 20 to 30 line report on the key developments and trends in this field: \n\n${allAbstracts}`;

    const aiResponse = await axios.post(
      url,
      { 
        inputs: aiPrompt,
        // --- +++ THIS IS THE FIX +++ ---
        // We are *forcing* the model to output a longer response.
        // 150 tokens is ~110 words. 400 tokens is ~300 words.
        parameters: { 
          min_length: 150, // Force a longer minimum output
          max_length: 400  // Allow a longer maximum output
        }
        // --- +++ END OF FIX +++ ---
      },
      { headers: { 'Authorization': `Bearer ${hfApiKey}`, 'Content-Type': 'application/json' } }
    );

    if (!aiResponse.data || !aiResponse.data[0] || !aiResponse.data[0].summary_text) {
      throw new Error('Invalid response structure from Hugging Face');
    }
    
    const report = aiResponse.data[0].summary_text;
    res.json({ report: report });

  } catch (error) {
    console.error('Error with Hugging Face trend analysis:');
    if (error.response && error.response.status === 503) {
      console.error('Model is loading, try again.');
      return res.status(503).json({ error: 'AI model is loading. This is normal. Please try again in 20-30 seconds.' });
    }
    if (error.response && error.response.data && error.response.data.error === 'index out of range in self') {
      console.error('Input text was too long for the model.');
      return res.status(400).json({ error: 'Input text was too long for the AI model.' });
    }
    console.error(error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate trend report' });
  }
});
// === End /api/trends ===


// === Start the Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Listening for requests from http://localhost:3000...');
});