from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import psycopg2
import anthropic
import openai
from google import genai
import os
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(swagger_ui_parameters={"syntaxHighlight": False})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# Environment Variables
DATABASE_URL = os.getenv("DATABASE_URL")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Database connection with retry
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_db_connection():
    try:
        return psycopg2.connect(DATABASE_URL)
    except psycopg2.OperationalError as e:
        raise HTTPException(status_code=500, detail="Database connection failed")

conn = get_db_connection()
cursor = conn.cursor()

# Ensure attendance table exists
cursor.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent', 'WFH')),
        department VARCHAR(50) NOT NULL,
        UNIQUE(employee_id, date)
    )''')
conn.commit()

def remove_duplicate_attendance():
    try:
        cursor.execute("""
            DELETE FROM attendance
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM attendance
                GROUP BY employee_id, date
            )
        """)
        conn.commit()
        print("Duplicate rows deleted successfully.")
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
remove_duplicate_attendance()

# Pydantic models
class AttendanceEntry(BaseModel):
    employee_id: int
    date: str
    status: str
    department: str

class InsightsRequest(BaseModel):
    user_query: Optional[str] = None

# API Endpoints with retry logic
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=5))
@app.post("/attendance/")
def add_attendance(entry: AttendanceEntry):
    if entry.status not in ['Present', 'Absent', 'WFH']:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        time.strptime(entry.date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    try:
        cursor.execute("SELECT 1 FROM attendance WHERE employee_id = %s AND date = %s", (entry.employee_id, entry.date))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Record already exists")
        cursor.execute("INSERT INTO attendance (employee_id, date, status, department) VALUES (%s, %s, %s, %s)", 
                       (entry.employee_id, entry.date, entry.status, entry.department))
        conn.commit()
        return {"message": "Attendance added"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=5))
@app.put("/attendance/")
def update_attendance(entry: AttendanceEntry):
    try:
        cursor.execute("UPDATE attendance SET status = %s, department = %s WHERE employee_id = %s AND date = %s",
                       (entry.status, entry.department, entry.employee_id, entry.date))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="No record found")
        return {"message": "Attendance updated"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=5))
@app.get("/attendance/trends")
def get_attendance_trends():
    try:
        cursor.execute("SELECT employee_id, department, status, COUNT(*) FROM attendance GROUP BY department, employee_id, status")
        records = cursor.fetchall()
        trends = {}
        for emp_id, department, status, count in records:
            if emp_id not in trends:
                trends[emp_id] = {"department": department, "attendance": {}}
            trends[emp_id]["attendance"][status] = count
        return {"attendance_trends": trends}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=5))
@app.get("/attendance/{employee_id}")
def get_attendance(employee_id: int):
    try:
        cursor.execute("SELECT * FROM attendance WHERE employee_id = %s", (employee_id,))
        rows = cursor.fetchall()
        if not rows:
            return {"message": "No records found"}
        return {"attendance": rows}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# AI Insights Endpoint
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=5))
@app.post("/insights/")
def get_insights(request: InsightsRequest):
    try:
        cursor.execute("SELECT employee_id, status, department FROM attendance")
        records = cursor.fetchall()
        text_data = "\n".join([f"Employee {r[0]} from {r[2]} was {r[1]}" for r in records])
        user_query = request.user_query or "Provide insights on the attendance data."
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents=f"Data:\n{text_data}\n\nQuestion: {user_query}"
        )
        return {"insights": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)
