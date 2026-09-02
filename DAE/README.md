# DAE — Data Analyser Engine

> Find where two documents agree, contradict, and what each one misses entirely.

A RAG-powered document intelligence tool built with Flask, LangChain, FAISS and Groq.

## What it does

Upload any two PDFs. DAE:
- Detects **contradictions** — exact passages that directly conflict
- Finds **agreements** — where both documents say the same thing
- Surfaces **blind spots** — topics one document covers that the other ignores entirely
- Exports results as **JSON, TXT, or PDF**
- Saves a full **history** of every comparison

## How the architecture works

DAE builds two independent FAISS vector stores — one per document. For every chunk in Document A, it runs a similarity search against Document B's vector store. High-similarity pairs (same topic) are sent to an LLM with a prompt asking: "Do these agree or contradict?" The LLM verdict + the FAISS similarity score together determine what appears in the results.

This cross-document similarity search is the core insight: similarity search is usually used to find relevant content. Here it's used to find where two documents are talking about the same thing — then the LLM judges whether they agree.

## Stack

- **Flask** — web framework, routes UI to Python backend
- **LangChain** — RAG pipeline orchestration
- **FAISS** — local vector store, runs without any API
- **HuggingFace all-MiniLM-L6-v2** — local embedding model, free
- **Groq LLaMA3** — free LLM API for contradiction judgment

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/DAE.git
cd DAE
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file:
```
GROQ_API_KEY=your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com).

```bash
py app.py
```

Open `localhost:5000`.

## Limitations

- Only works with text-extractable PDFs (not scanned images)
- Tables and charts lose structure during text extraction
- Contradiction detection uses LLM judgment — treat results as candidates for human review, not definitive verdicts
- Single-user in-memory session (vector stores reset on refresh)

## Live demo

[Deploy link here]

---

Built by [Your Name] — 2nd year CS student
