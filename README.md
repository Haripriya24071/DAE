# DAE — Document Analysis Engine

> **AI-powered semantic document comparison that detects contradictions, agreements, and blind spots.**

DAE compares two documents based on **meaning rather than keywords**. It combines embeddings, vector search, and LLM reasoning to identify conflicting information, matching claims, and information that may be missing between documents.

---

## 🚀 What It Does

- 📄 Supports **PDF, DOCX & TXT**
- 🔍 Semantic matching using **FAISS + embeddings**
- 🤖 LLM-powered agreement & contradiction detection
- ⚠️ Classifies contradictions as **Critical / Significant / Minor**
- 🕳️ Detects potential **blind spots**
- 🎯 Generates confidence scores for findings
- ⚡ Streams analysis progress in real time
- 📊 Generates a structured comparison report
- 💾 Maintains analysis history

---

## 🧠 How It Works

```text
 ┌──────────────┐       ┌──────────────┐
 │  Document A  │       │  Document B  │
 └──────┬───────┘       └──────┬───────┘
        ↓                      ↓
   Text Extraction        Text Extraction
        ↓                      ↓
      Chunking               Chunking
        ↓                      ↓
     Embeddings            Embeddings
        ↓                      ↓
     FAISS Index A         FAISS Index B
        └──────────┬───────────┘
                   ↓
           Semantic Retrieval
                   ↓
             LLaMA + Groq
                   ↓
       ┌───────────┼───────────┐
       ↓           ↓           ↓
   AGREEMENTS  CONTRADICTIONS  BLIND SPOTS
                   ↓
             Final Analysis
```

### 🔬 Pipeline

**1. Ingest** → Extracts content from PDF, DOCX and TXT files.

**2. Chunk** → Splits documents into overlapping chunks using recursive text splitting.

**3. Embed** → Converts chunks into vector representations using `all-MiniLM-L6-v2`.

**4. Retrieve** → Creates separate FAISS indexes and retrieves the most relevant counterpart for each chunk.

**5. Reason** → LLaMA analyzes the retrieved context and classifies the relationship as **AGREE, DISAGREE, or PARTIALLY AGREE**.

**6. Evaluate** → Contradictions receive severity levels, while similarity and reasoning signals contribute to confidence scoring.

**7. Report** → Results are streamed to the interface and assembled into a structured analysis.

---

## ⚡ Example

```text
Document A
"The subscription expires after 30 days."

              ↕ Semantic Match

Document B
"The subscription remains active for 90 days."

              ↓

        LLM Comparison

        ⚠ DISAGREE
        SIGNIFICANT
```

DAE isn't simply looking for different words. It identifies that both statements refer to the **same concept while providing conflicting information**.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Backend | Python, Flask |
| LLM | LLaMA, Groq |
| AI / RAG | LangChain |
| Embeddings | Hugging Face `all-MiniLM-L6-v2` |
| Vector Search | FAISS |
| Document Processing | PyMuPDF, python-docx |
| NLP | scikit-learn, NLTK |
| Deployment | Gunicorn, Render |

---

## 🏗️ Architecture

```text
                    ┌──────────────────┐
                    │    Flask App     │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              ↓                             ↓
        Document A                     Document B
              ↓                             ↓
        Text Extraction               Text Extraction
              ↓                             ↓
           Chunking                      Chunking
              ↓                             ↓
         Embeddings                    Embeddings
              ↓                             ↓
          FAISS A                       FAISS B
              └──────────────┬──────────────┘
                             ↓
                    Semantic Retrieval
                             ↓
                       LLaMA + Groq
                             ↓
               ┌─────────────┼─────────────┐
               ↓             ↓             ↓
          Agreements    Contradictions  Blind Spots
               └─────────────┬─────────────┘
                             ↓
                       Final Analysis
```

---

## 📁 Project Structure

```text
DAE/
├── DAE/
│   ├── app.py
│   ├── templates/
│   ├── static/
│   └── history/
├── requirements.txt
├── Procfile
├── render.yaml
└── README.md
```

---

## 🔧 Configuration

DAE requires a **Groq API key** for LLM-based analysis.

For local development, configure it as an environment variable:

```text
GROQ_API_KEY=<your-key>
```

**Never commit API keys or `.env` files to the repository.**

The included `render.yaml` provides the deployment configuration and expects `GROQ_API_KEY` to be supplied through the deployment environment.

---

## 🔗 Built With

[LangChain](https://www.langchain.com/) · [FAISS](https://github.com/facebookresearch/faiss) · [Hugging Face](https://huggingface.co/) · [Groq](https://groq.com/) · [Flask](https://flask.palletsprojects.com/)

---

## 👨‍💻 My Contribution

Built the core document-analysis pipeline covering **document ingestion, chunking, embeddings, FAISS retrieval, LLM-based comparison, contradiction detection, confidence scoring, blind-spot detection, and result generation.**
