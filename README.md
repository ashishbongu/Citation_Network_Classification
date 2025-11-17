# An Analysis on Citation Network Classification Using Various Graph Neural Network Architectures on CORA and PubMed Datasets.

##  Overview

This project provides an Analysis on citation network classification using various GNN Architectures on cora and pubMed datasets. Also on top of this analysis we have built a react based interface for PubMed, allowing users to find papers based not only on keywords, categories, and citation relationships. It includes AI-powered features to summarize individual abstracts and generate high-level trend reports for a given research field.
1.  **Baselines:** `GCN`, `GAT`, `SGC`, `APPNP`
2.  **Advanced Architectures:** `MultiHopGAT`, `EFM` (Expert Fusion Model), `WR-EFM` (Wasserstein-Rubinstein EFM))

<img width="400" height="400" alt="cora_tnse" src="https://github.com/user-attachments/assets/03bee222-052e-4413-a4a3-168dce78432e" />
<img width="400" height="400" alt="dizz2" src="https://github.com/user-attachments/assets/5a566dbb-1b85-437b-a854-f8420843ff22" />



The project is split into three main parts:
* **`Project_Analysis/`**: Jupyter Notebooks used for initial data analysis.
* **`react_app/`**: The frontend user interface built in React.
* **`pubmed-server/`**: The backend server (Node.js/Express) that securely connects to the PubMed and Hugging Face AI APIs.

---
## Team Members

| Name | Roll Number | GitHub |
| :--- | :--- | :--- |
| BONGU ASHISH | 23BDS014 | [@ashishbongu](https://github.com/ashishbongu) |
| PB SHREYAS | 23BDS041 | [@shreyas7ss](https://github.com/shreyas7ss) |
| TARAN JAIN | 23BDS062 | [@Taranjain](https://github.com/Taranjain) |


---

## Repository Structure
```
Citation_Network_Classification/
├── Project_Analysis/             (Might take some time to render)
│   ├── Cora_Analysis.ipynb
│   └── PubMed_Analysis.ipynb
│
├── pubmed-server/
│   ├── .env                
│   ├── .gitignore          
│   ├── server.js          
│   └── package.json
│
├── react_app/
│   ├── public/
│   ├── src/
│   │   ├── components/    
│   │   ├── App.js          
│   │   └── index.js
│   ├── .gitignore
│   └── package.json
│
└── README.md
```


## Installation & Implementation

To run this application, you must run **both** the backend server and the frontend app in two separate terminals.

### Prerequisites

* [Node.js](https://nodejs.org/) (which includes `npm`)
* A **free** [Hugging Face API Key](https://huggingface.co/settings/tokens) for the AI summarization features.

### Clone the repository
```bash
git clone https://github.com/ashishbongu/Citation_Network_Classification.git

```
### 1. Backend Server Setup (`pubmed-server`)

This server handles all API calls to PubMed and Hugging Face.

```bash
# 1. Navigate to the backend folder
cd pubmed-server

# 2. Install dependencies
npm install

# 3. Create the .env file to store your Hugging Face API key
#    (Windows users can run: notepad .env)
touch .env

# 4. Add this line inside the .env file:
HF_API_KEY=your_hugging_face_key_here

# 5. Start the backend server
node server.js
```
### 2. React App Setup (`react_app`)

```bash
# 1. Open a NEW, separate terminal
cd react_app

# 2. Install all required dependencies
npm install

# 3. Run the app
npm start

```
### APP DEMO



https://github.com/user-attachments/assets/28e6a474-ac84-4213-92b2-cd73c844fed4


