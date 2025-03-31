# Attendance Management API

## Overview
This API is built using FastAPI and allows for the management of employee attendance records. It provides endpoints to add, update, retrieve, and analyze attendance data stored in a PostgreSQL database. Additionally, it leverages AI-powered insights for attendance trends using Gemini API.

## Features
- **CRUD Operations** for attendance records
- **Duplicate Handling** to ensure unique employee-date records
- **Database Connection with Retry** to handle connection failures
- **AI-Generated Insights** on attendance trends
- **CORS Support** for cross-origin requests

## Technologies Used
- **FastAPI** for API framework
- **PostgreSQL** as the database
- **Pydantic** for data validation
- **Anthropic, OpenAI, Gemini APIs** for AI insights
- **Tenacity** for retry mechanisms
- **Docker** for containerization

## Environment Variables
Ensure the following environment variables are set before running the API:

```plaintext
DATABASE_URL=<your_postgres_connection_url>
ANTHROPIC_KEY=<your_anthropic_api_key>
OPENAI_KEY=<your_openai_api_key>
GEMINI_API_KEY=<your_gemini_api_key>
```

## Installation & Setup
### **1. Clone the Repository**
```sh
git clone <repository_url>
cd <project_directory>
```

### **2. Create and Activate Virtual Environment**
```sh
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

### **3. Install Dependencies**
```sh
pip install -r requirements.txt
```

### **4. Run the API**
```sh
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Docker Setup
### **1. Build the Docker Image**
```sh
docker build -t attendance-api .
```

### **2. Run the Docker Container**
```sh
docker run -p 8000:8000 --env-file .env attendance-api
```

### **3. List Running Containers**
```sh
docker ps
```

## API Endpoints
### **1. Add Attendance Record**
```http
POST /attendance/
```
**Request Body:**
```json
{
  "employee_id": 123,
  "date": "2024-03-30",
  "status": "Present",
  "department": "IT"
}
```
**Response:**
```json
{
  "message": "Attendance added"
}
```

### **2. Update Attendance Record**
```http
PUT /attendance/
```
**Request Body:** Same as Add Attendance.

**Response:**
```json
{
  "message": "Attendance updated"
}
```

### **3. Retrieve Employee Attendance**
```http
GET /attendance/{employee_id}
```
**Response:**
```json
{
  "attendance": [
    { "id": 1, "employee_id": 123, "date": "2024-03-30", "status": "Present", "department": "IT" }
  ]
}
```

### **4. Get Attendance Trends**
```http
GET /attendance/trends
```
**Response:**
```json
{
  "attendance_trends": {
    "123": { "department": "IT", "attendance": { "Present": 10, "Absent": 2 } }
  }
}
```

### **5. AI-Powered Insights**
```http
POST /insights/
```
**Request Body:**
```json
{
  "user_query": "Provide insights on IT department attendance trends."
}
```
**Response:**
```json
{
  "insights": "Employees in IT department have an attendance rate of 80%."
}
```

## Error Handling
- **400 Bad Request** for invalid input data
- **404 Not Found** if a record does not exist
- **500 Internal Server Error** for database or AI processing failures

## Contribution
Feel free to contribute by creating pull requests. Ensure code quality and documentation updates with each change.

## License
This project is licensed under the MIT License.

