import json
import os
import random
from locust import HttpUser, task, between
from locust.stats import sort_stats

# Sample test data
TEST_QUERIES = [
    "How does ChromaDB work?",
    "What are vector embeddings?",
    "Explain Google Gemini API",
    "How to process PDF documents?",
    "What is FastAPI?",
    "Explain similarity search",
    "How to implement RAG?",
    "What is the purpose of text splitting?",
    "How to optimize response times?",
    "What file formats are supported?"
]

class APILoadTestUser(HttpUser):
    wait_time = between(1, 3)  # Wait between 1-3 seconds between tasks
    
    def on_start(self):
        """Setup before tests start running"""
        # Create a sample text file to upload
        self.sample_file_path = "sample_test_doc.txt"
        with open(self.sample_file_path, "w") as f:
            f.write("This is a sample document for testing the API.")
    
    def on_stop(self):
        """Cleanup after tests complete"""
        # Remove the sample file
        if os.path.exists(self.sample_file_path):
            os.remove(self.sample_file_path)
    
    @task(1)
    def upload_document(self):
        """Test file upload endpoint"""
        with open(self.sample_file_path, "rb") as f:
            self.client.post(
                "/upload/",
                files={"file": (os.path.basename(self.sample_file_path), f, "text/plain")}
            )
    
    @task(5)
    def query_knowledge(self):
        """Test query endpoint with random queries"""
        query = random.choice(TEST_QUERIES)
        payload = {"query": query}
        self.client.post(
            "/query/",
            json=payload
        )
    
    @task(2)
    def get_query_history(self):
        """Test query history endpoint with random pagination"""
        limit = random.choice([10, 20, 50])
        offset = random.choice([0, 10, 20])
        self.client.get(f"/analytics/queries?limit={limit}&offset={offset}")
    
    @task(1)
    def get_query_stats(self):
        """Test query stats endpoint"""
        self.client.get("/analytics/stats")
    
    @task(1)
    def get_performance_metrics(self):
        """Test performance metrics endpoint with random day range"""
        days = random.choice([1, 3, 7, 14, 30])
        self.client.get(f"/analytics/performance?days={days}")


# Configuration for running the load test
if __name__ == "__main__":
    # This section will be used when running locust from the command line
    # Example: locust -f locustfile.py --host=http://localhost:8000
    pass

# Custom sorting function for statistics
def sort_stats_by_name(stats):
    """Sort stats by endpoint name"""
    return sort_stats(stats, "name")