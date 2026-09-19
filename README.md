# DAE — Data Analyser Engine

An AI-powered document comparison and analysis engine.
Upload two PDFs, DOCX, or TXT files and DAE finds:
- Contradictions between documents
- Agreements and aligned passages
- Blind spots (topics covered by one doc, missing in the other)
- Severity ratings (CRITICAL / SIGNIFICANT / MINOR)
- A full narrative analysis report

## Tech Stack
- Backend: Python / Flask
- AI: LangChain + FAISS + HuggingFace Embeddings + Groq LLaMA
- Frontend: Vanilla JS / HTML / CSS

## Setup

1. Clone the repo
2. Create a virtual environment:
   python -m venv venv
   venv\Scripts\activate  (Windows)
   source venv/bin/activate  (Mac/Linux)

3. Install dependencies:
   pip install -r requirements.txt

4. Create a .env file in DAE/ folder:
   GROQ_API_KEY=your_key_here

5. Run:
   cd DAE
   python app.py

6. Open: http://localhost:5000

## Features
- Real-time streaming analysis with live counters
- Multi-document comparison (up to 5 docs)
- Token attention heatmap on results
- Ask DAE questions about your documents (Q&A chat)
- Dark / light theme
- Export as PDF, JSON, or TXT
- Full analysis history
- Shareable result links

## Built by
Haripriya — DAE v2.0
