import os
import re
import difflib
import pymupdf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Try initializing NLTK sentence tokenizer with safe fallback
try:
    import nltk
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('punkt_tab', quiet=True)
        except Exception:
            pass
    from nltk.tokenize import sent_tokenize
except Exception:
    def sent_tokenize(text):
        return [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', text) if s.strip()]

def extract_pdf_data(pdf_path):
    """Extract page-by-page text and aggregate text from a PDF file using PyMuPDF."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")
        
    doc = pymupdf.open(pdf_path)
    pages_text = []
    full_text_list = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text_str = str(page.get_text("text") or "")
        pages_text.append({
            "page": page_num + 1,
            "text": text_str.strip()
        })
        full_text_list.append(text_str)
        
    page_count = len(doc)
    doc.close()
    
    full_text = "\n".join(full_text_list)
    words = len(full_text.split())
    chars = len(full_text)
    
    return {
        "pages_text": pages_text,
        "full_text": full_text,
        "page_count": page_count,
        "word_count": words,
        "char_count": chars
    }

def compute_overall_similarity(text_a, text_b):
    """Compute overall document TF-IDF Cosine Similarity percentage."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(similarity) * 100, 2)
    except Exception:
        # Fallback to difflib ratio if vectorizer fails (e.g. empty/short stopword text)
        return round(difflib.SequenceMatcher(None, text_a, text_b).ratio() * 100, 2)

def generate_diff(text_a, text_b):
    """Generate line-by-line diff blocks comparing Document A and Document B."""
    lines_a = [l.strip() for l in text_a.splitlines() if l.strip()]
    lines_b = [l.strip() for l in text_b.splitlines() if l.strip()]

    matcher = difflib.SequenceMatcher(None, lines_a, lines_b)
    diff_blocks = []
    stats = {
        "added_count": 0,
        "removed_count": 0,
        "modified_count": 0,
        "unchanged_count": 0
    }

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for a_idx, b_idx in zip(range(i1, i2), range(j1, j2)):
                diff_blocks.append({
                    "type": "unchanged",
                    "text_a": lines_a[a_idx],
                    "text_b": lines_b[b_idx],
                    "line_a": a_idx + 1,
                    "line_b": b_idx + 1,
                    "similarity": 100.0
                })
                stats["unchanged_count"] += 1
        elif tag == "replace":
            sub_a = lines_a[i1:i2]
            sub_b = lines_b[j1:j2]
            max_len = max(len(sub_a), len(sub_b))
            for k in range(max_len):
                ta = sub_a[k] if k < len(sub_a) else ""
                tb = sub_b[k] if k < len(sub_b) else ""
                sim = round(difflib.SequenceMatcher(None, ta, tb).ratio() * 100, 1) if ta and tb else 0.0
                diff_type = "modified" if ta and tb else ("removed" if ta else "added")
                diff_blocks.append({
                    "type": diff_type,
                    "text_a": ta,
                    "text_b": tb,
                    "line_a": i1 + k + 1 if k < len(sub_a) else None,
                    "line_b": j1 + k + 1 if k < len(sub_b) else None,
                    "similarity": sim
                })
                if diff_type == "modified":
                    stats["modified_count"] += 1
                elif diff_type == "removed":
                    stats["removed_count"] += 1
                else:
                    stats["added_count"] += 1
        elif tag == "delete":
            for a_idx in range(i1, i2):
                diff_blocks.append({
                    "type": "removed",
                    "text_a": lines_a[a_idx],
                    "text_b": "",
                    "line_a": a_idx + 1,
                    "line_b": None,
                    "similarity": 0.0
                })
                stats["removed_count"] += 1
        elif tag == "insert":
            for b_idx in range(j1, j2):
                diff_blocks.append({
                    "type": "added",
                    "text_a": "",
                    "text_b": lines_b[b_idx],
                    "line_a": None,
                    "line_b": b_idx + 1,
                    "similarity": 0.0
                })
                stats["added_count"] += 1

    return diff_blocks, stats

def compare_documents(file_a_path, file_b_path, name_a="Document A", name_b="Document B"):
    """Main comparison pipeline extracting PDF data and computing text similarity and diffs."""
    data_a = extract_pdf_data(file_a_path)
    data_b = extract_pdf_data(file_b_path)
    
    overall_sim = compute_overall_similarity(data_a["full_text"], data_b["full_text"])
    diff_blocks, summary_stats = generate_diff(data_a["full_text"], data_b["full_text"])
    
    # Extract unique sections
    unique_a = [b["text_a"] for b in diff_blocks if b["type"] == "removed" and len(b["text_a"]) > 10][:10]
    unique_b = [b["text_b"] for b in diff_blocks if b["type"] == "added" and len(b["text_b"]) > 10][:10]
    
    # Extract top matching pairs
    top_matches = [
        {"text_a": b["text_a"], "text_b": b["text_b"], "similarity": b["similarity"]}
        for b in diff_blocks if b["type"] == "unchanged" or (b["type"] == "modified" and b["similarity"] > 70.0)
    ][:10]
    
    return {
        "doc_a": {
            "name": name_a,
            "pages": data_a["page_count"],
            "word_count": data_a["word_count"],
            "char_count": data_a["char_count"]
        },
        "doc_b": {
            "name": name_b,
            "pages": data_b["page_count"],
            "word_count": data_b["word_count"],
            "char_count": data_b["char_count"]
        },
        "overall_similarity": overall_sim,
        "diff_blocks": diff_blocks,
        "summary_stats": summary_stats,
        "unique_a": unique_a,
        "unique_b": unique_b,
        "top_matches": top_matches
    }

def get_llm():
    from langchain_groq import ChatGroq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    return ChatGroq(model="llama3-70b-8192", api_key=GROQ_API_KEY)

try:
    from langchain_huggingface import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
except Exception:
    embeddings = None

if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        res = compare_documents(sys.argv[1], sys.argv[2])
        print(f"Overall Similarity: {res['overall_similarity']}%")
        print(f"Stats: {res['summary_stats']}")
