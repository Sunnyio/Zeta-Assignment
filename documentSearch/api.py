import os
import shutil
import uvicorn
import time
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from google import genai
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.environ["GEMINI_API_KEY"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure ChromaDB
VECTOR_DB_PATH = "./chroma_db"
ANALYTICS_PATH = "./analytics"
os.makedirs(VECTOR_DB_PATH, exist_ok=True)
os.makedirs(ANALYTICS_PATH, exist_ok=True)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=VECTOR_DB_PATH, embedding_function=embeddings)

# Data models
class QueryRequest(BaseModel):
    query: str

class QueryRecord(BaseModel):
    id: str
    timestamp: str
    query: str
    response: str
    response_time: float
    sources: List[str]
    success: bool

class QueryStats(BaseModel):
    total_queries: int
    success_rate: float
    avg_response_time: float
    queries_per_day: Dict[str, int]
    top_sources: List[Dict[str, Any]]
    top_queries: List[Dict[str, Any]]

# In-memory analytics storage
query_records: List[QueryRecord] = []

def save_analytics():
    """Save analytics data to disk"""
    with open(os.path.join(ANALYTICS_PATH, "query_records.json"), "w") as f:
        json.dump([record.dict() for record in query_records], f)

def load_analytics():
    """Load analytics data from disk if available"""
    global query_records
    try:
        if os.path.exists(os.path.join(ANALYTICS_PATH, "query_records.json")):
            with open(os.path.join(ANALYTICS_PATH, "query_records.json"), "r") as f:
                data = json.load(f)
                query_records = [QueryRecord(**record) for record in data]
    except Exception as e:
        print(f"Error loading analytics: {e}")

# Load analytics on startup
load_analytics()

def process_and_store(file_path: str):
    """Processes and stores document embeddings in ChromaDB."""
    filename = os.path.basename(file_path)
    ext = filename.split(".")[-1].lower()
    
    loader_mapping = {
        "pdf": PyPDFLoader,
        "csv": CSVLoader,
        "txt": TextLoader,
        "md": TextLoader
    }
    
    loader_class = loader_mapping.get(ext)
    if not loader_class:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    documents = loader_class(file_path).load()
    
    # Add source filename to metadata
    for doc in documents:
        if not doc.metadata:
            doc.metadata = {}
        doc.metadata["source"] = filename
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = text_splitter.split_documents(documents)
    
    vector_db.add_documents(docs)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Uploads and processes a document file."""
    file_path = f"temp_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        process_and_store(file_path)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
    
    return {"message": f"File '{file.filename}' uploaded and processed successfully"}

@app.post("/query/")
async def query_knowledge(request: QueryRequest):
    """Retrieves relevant knowledge from stored embeddings and queries Google Gemini."""
    query_id = f"q-{int(time.time())}-{len(query_records)}"
    start_time = time.time()
    success = False
    response_text = ""
    sources = []
    
    try:
        if not request.query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Retrieve relevant documents from ChromaDB
        results = vector_db.similarity_search(request.query, k=5)
        
        # Extract source information and create context
        context_parts = []
        for doc in results:
            source = doc.metadata.get("source", "Unknown")
            if source not in sources:
                sources.append(source)
            context_parts.append(doc.page_content)
        
        context = "\n".join(context_parts)
        
        # Format sources for citation
        sources_citation = ", ".join([f"'{s}'" for s in sources])
        
        # Send query to Google Gemini with instruction to include citations
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"""Based on the following information, answer the question: {request.query}

Context:
{context}
"""

        gemini_response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        response_text = gemini_response.text
        success = True
        
    except Exception as e:
        response_text = f"Error processing query: {str(e)}"
        success = False
        
    finally:
        # Calculate response time
        end_time = time.time()
        response_time = end_time - start_time
        
        # Record the query
        record = QueryRecord(
            id=query_id,
            timestamp=datetime.now().isoformat(),
            query=request.query,
            response=response_text,
            response_time=response_time,
            sources=sources,
            success=success
        )
        query_records.append(record)
        save_analytics()
        
        return {
            "query_id": query_id,
            "response": response_text,
            "sources": sources,
            "response_time": response_time
        }

@app.get("/analytics/queries")
async def get_query_history(limit: int = 50, offset: int = 0):
    """Get history of recent queries"""
    total = len(query_records)
    records = sorted(query_records, key=lambda x: x.timestamp, reverse=True)
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "records": records[offset:offset+limit]
    }

@app.get("/analytics/stats")
async def get_query_stats():
    """Get aggregated query statistics"""
    if not query_records:
        return {"message": "No query data available"}
    
    # Calculate basic metrics
    total_queries = len(query_records)
    successful_queries = sum(1 for record in query_records if record.success)
    success_rate = successful_queries / total_queries if total_queries > 0 else 0
    avg_response_time = sum(record.response_time for record in query_records) / total_queries if total_queries > 0 else 0
    
    # Queries per day
    queries_per_day = defaultdict(int)
    for record in query_records:
        day = record.timestamp.split('T')[0]  # Extract YYYY-MM-DD
        queries_per_day[day] += 1
    
    # Top sources
    source_counter = Counter()
    for record in query_records:
        for source in record.sources:
            source_counter[source] += 1
    
    top_sources = [{"source": source, "count": count} 
                 for source, count in source_counter.most_common(10)]
    
    # Top queries (simple exact match)
    query_counter = Counter()
    for record in query_records:
        query_counter[record.query] += 1
    
    top_queries = [{"query": query, "count": count} 
                  for query, count in query_counter.most_common(10)]
    
    return {
        "total_queries": total_queries,
        "success_rate": success_rate,
        "avg_response_time": avg_response_time,
        "queries_per_day": dict(queries_per_day),
        "top_sources": top_sources,
        "top_queries": top_queries
    }

@app.get("/analytics/performance")
async def get_performance_metrics(days: int = 7):
    """Get performance metrics over time"""
    if not query_records:
        return {"message": "No query data available"}
    
    # Determine date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days-1)
    
    # Initialize data structure
    daily_metrics = {}
    for i in range(days):
        current_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_metrics[current_date] = {
            "queries": 0,
            "success_count": 0,
            "total_response_time": 0,
            "sources_used": Counter()
        }
    
    # Populate metrics
    for record in query_records:
        timestamp = datetime.fromisoformat(record.timestamp)
        if timestamp < start_date:
            continue
            
        day_key = timestamp.strftime("%Y-%m-%d")
        if day_key in daily_metrics:
            daily_metrics[day_key]["queries"] += 1
            if record.success:
                daily_metrics[day_key]["success_count"] += 1
            daily_metrics[day_key]["total_response_time"] += record.response_time
            for source in record.sources:
                daily_metrics[day_key]["sources_used"][source] += 1
    
    # Calculate averages and prepare result
    result = []
    for day, metrics in daily_metrics.items():
        daily_result = {
            "date": day,
            "query_volume": metrics["queries"],
            "success_rate": metrics["success_count"] / metrics["queries"] if metrics["queries"] > 0 else 0,
            "avg_latency": metrics["total_response_time"] / metrics["queries"] if metrics["queries"] > 0 else 0,
            "top_documents": [{"source": s, "count": c} for s, c in metrics["sources_used"].most_common(3)]
        }
        result.append(daily_result)
    
    return sorted(result, key=lambda x: x["date"], reverse=True)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)