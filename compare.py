import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
llm = ChatGroq(model="llama-3.3-70b-versatile")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def process_documents(file_a, file_b, threshold=None, debug=True):
    loader_a = PyPDFLoader(file_a)
    loader_b = PyPDFLoader(file_b)
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs_a = splitter.split_documents(loader_a.load())
    docs_b = splitter.split_documents(loader_b.load())
    print(f"Doc A: {len(docs_a)} chunks | Doc B: {len(docs_b)} chunks")
    vectorstore_b = FAISS.from_documents(docs_b, embeddings)
    prompt_template = """Compare these two excerpts from different documents.
Excerpt A: {text_a}
Excerpt B: {text_b}
Determine if they: AGREE, DISAGREE, or PARTIALLY AGREE.
Provide a brief 1-sentence explanation why."""
    prompt = PromptTemplate(input_variables=["text_a", "text_b"], template=prompt_template)
    chain = prompt | llm
    results = []
    all_scores = []
    for chunk in docs_a:
        match = vectorstore_b.similarity_search_with_score(chunk.page_content, k=1)
        best_match, score = match[0]
        all_scores.append(score)
        if debug:
            print(f"  score={score:.3f}  chunk_a={chunk.page_content[:50]!r}")
        if threshold is None or score < threshold:
            response = chain.invoke({"text_a": chunk.page_content, "text_b": best_match.page_content})
            verdict = response.content
            results.append({"chunk_a": chunk.page_content, "chunk_b": best_match.page_content, "score": score, "verdict": verdict})
    if debug:
        print(f"\nScore range: min={min(all_scores):.3f}  max={max(all_scores):.3f}")
    return results

if __name__ == "__main__":
    findings = process_documents("doc1.pdf", "doc2.pdf", threshold=None)
    for i, res in enumerate(findings):
        print(f"\n--- Comparison {i+1} (score={res['score']:.3f}) ---")
        print(f"Doc A: {res['chunk_a'][:100]}...")
        print(f"Doc B: {res['chunk_b'][:100]}...")
        print(f"Verdict: {res['verdict']}")