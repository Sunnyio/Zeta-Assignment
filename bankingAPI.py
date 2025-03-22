import logging
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, Float, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_USER = "user"
DB_PASSWORD = "password"
DB_HOST = "localhost"
DB_NAME = "banking"
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="USD")
    
    def __repr__(self):
        return f"<Account(id={self.id}, balance={self.balance}, currency={self.currency})>"

class TransactionRequest(BaseModel):
    account_id: int = Field(..., description="ID of the account to debit/credit")
    amount: float = Field(..., gt=0, description="Amount to debit/credit")
    
    class Config:
        schema_extra = {
            "example": {
                "account_id": 1,
                "amount": 100.50
            }
        }

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Banking API",
    description="A simple API for banking operations",
    version="1.0.0"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/debit", response_model=Dict[str, Any])
def debit(request: TransactionRequest, db: Session = Depends(get_db)):
    try:
        with db.begin():
            account = db.query(Account).filter(Account.id == request.account_id).with_for_update().first()
            
            if not account:
                logger.warning(f"Account {request.account_id} not found")
                raise HTTPException(status_code=404, detail="Account not found")
                
            if account.balance < request.amount:
                logger.warning(f"Insufficient funds in account {request.account_id}: {account.balance} < {request.amount}")
                raise HTTPException(status_code=400, detail="Insufficient funds")
                
            account.balance -= request.amount
            
            logger.info(f"Debited {request.amount} from account {request.account_id}")
            
            return {
                "message": "Debit successful",
                "new_balance": account.balance,
                "currency": account.currency
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error during debit operation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/credit", response_model=Dict[str, Any])
def credit(request: TransactionRequest, db: Session = Depends(get_db)):
    try:
        with db.begin():
            account = db.query(Account).filter(Account.id == request.account_id).with_for_update().first()
            
            if not account:
                logger.warning(f"Account {request.account_id} not found")
                raise HTTPException(status_code=404, detail="Account not found")
                
            account.balance += request.amount
            
            logger.info(f"Credited {request.amount} to account {request.account_id}")
            
            return {
                "message": "Credit successful",
                "new_balance": account.balance,
                "currency": account.currency
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error during credit operation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/balance/{account_id}", response_model=Dict[str, Any])
def get_balance(account_id: int, db: Session = Depends(get_db)):
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        
        if not account:
            logger.warning(f"Account {account_id} not found")
            raise HTTPException(status_code=404, detail="Account not found")
            
        logger.info(f"Retrieved balance for account {account_id}")
        
        return {
            "account_id": account.id,
            "balance": account.balance,
            "currency": account.currency
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error during balance query: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
