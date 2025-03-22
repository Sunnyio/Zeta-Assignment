from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import asyncpg
import os


app = FastAPI()

SUPABASE_URL = ""
SUPABASE_KEY = ""

class LoanRequest(BaseModel):
    income: float
    credit_score: int
    loan_amount: float

async def connect_db():
    return await asyncpg.connect(SUPABASE_URL, password=SUPABASE_KEY)

@app.post("/check_eligibility")
def check_eligibility(income, credit_score, loan_amount):
    if income > 50000 and credit_score > 750 and loan_amount < (income * 5):
        return {"score": 90, "recommendation": "Excellent eligibility! High chances of approval."}
    elif income > 30000 and credit_score > 600 and loan_amount < (income * 7):
        return {"score": 70, "recommendation": "Moderate eligibility, manual review is required. Consider reducing loan amount for high eligibility."}
    else:
        return {"score": 40, "recommendation": "Low eligibility. Improve credit score or income."}

@app.get("/get_balance/{user_id}")
async def get_balance(user_id: int):
    conn = await connect_db()
    query = "SELECT account_balance FROM users WHERE user_id = $1"
    result = await conn.fetchval(query, user_id)
    await conn.close()

    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user_id": user_id, "account_balance": result}

@app.get("/get_dispute_history/{user_id}")
async def get_dispute_history(user_id: int):
    conn = await connect_db()
    query = "SELECT dispute_history FROM users WHERE user_id = $1"
    result = await conn.fetchval(query, user_id)
    await conn.close()

    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user_id": user_id, "dispute_history": result}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
