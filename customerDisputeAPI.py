from flask import Flask, request, jsonify, abort
from sentence_transformers import SentenceTransformer, util
import logging
import time
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('dispute-api')

app = Flask(__name__)

MODEL_NAME = "all-MiniLM-L6-v2"

print(f"Loading model {MODEL_NAME}...")
start = time.time()
model = SentenceTransformer(MODEL_NAME)
print(f"Model loaded in {time.time() - start:.2f} seconds")

DISPUTE_CATEGORIES = {
    "Fraud": "Unauthorized transaction detected on my account.",
    "Billing Error": "Incorrect charge or double charge on my bill.",
    "Service Issue": "Service was not delivered as promised.",
    "General Inquiry": "I have a question about my transaction.",
}

category_embeddings = {}
for category, desc in DISPUTE_CATEGORIES.items():
    category_embeddings[category] = model.encode(desc)

MEDIUM_THRESHOLD = 1000
HIGH_THRESHOLD = 5000


def classify_dispute(description, amount, customer_history=None):
    if not description:
        logger.warning("Empty dispute description received")
        return "General Inquiry", "Low"
    
    text_embedding = model.encode(description)
    
    best_category = None
    best_score = -1
    
    for category, embedding in category_embeddings.items():
        similarity = float(util.cos_sim(text_embedding, embedding)[0][0])
        if similarity > best_score:
            best_score = similarity
            best_category = category
    
    if best_category == "Fraud" or amount > HIGH_THRESHOLD:
        priority = "High"
    elif best_category == "Billing Error" and amount > MEDIUM_THRESHOLD:
        priority = "Medium"
    elif best_category == "Service Issue":
        priority = "Medium" if amount > MEDIUM_THRESHOLD / 2 else "Low"
    else:
        priority = "Low"
    
    if customer_history:
        priority = adjust_priority_by_history(best_category, priority, customer_history)
        
    logger.info(f"Classified as {best_category} (priority: {priority})")
    return best_category, priority


def adjust_priority_by_history(dispute_type, priority, history):
    customer_tier = history.get("tier", "standard").lower()
    previous_disputes = history.get("previous_disputes", 0)
    valid_disputes_pct = history.get("valid_disputes_pct", 0)
    account_age_days = history.get("account_age_days", 0)
    recent_disputes = history.get("recent_disputes_30d", 0)
    lifetime_value = history.get("lifetime_value", 0)
    
    logger.debug(f"Adjusting priority based on {customer_tier} tier, {previous_disputes} previous disputes")
    
    initial_priority = priority
    
    if customer_tier == "vip" and priority != "High":
        priority = "High"
    elif customer_tier == "premium" and priority == "Low":
        priority = "Medium"
    
    if valid_disputes_pct > 80 and previous_disputes > 2:
        priority = upgrade_priority(priority)
    
    if recent_disputes >= 3 and dispute_type == "Billing Error":
        priority = "High"
    
    if account_age_days < 30 and priority == "Low":
        priority = "Medium"
    
    if lifetime_value > 50000:
        priority = upgrade_priority(priority)
        
    if initial_priority != priority:
        logger.info(f"Priority adjusted from {initial_priority} to {priority} based on customer history")
        
    return priority


def upgrade_priority(current):
    if current == "Low":
        return "Medium"
    elif current == "Medium":
        return "High"
    return current


def get_next_steps(dispute_type, priority, customer_history=None):
    customer_tier = customer_history.get("tier", "standard").lower() if customer_history else "standard"
    
    if dispute_type == "Fraud":
        if priority == "High":
            return "URGENT: Escalate to fraud team immediately. Freeze account if transaction is recent."
        else:
            return "Escalate to fraud investigation team within 24 hours."
    
    elif dispute_type == "Billing Error":
        if customer_tier in ["premium", "vip"]:
            return "Review transaction history in CRM. Expedite refund approval if charge is incorrect."
        return "Review transaction history in CRM. Process refund if charge is clearly incorrect."
    
    elif dispute_type == "Service Issue":
        if priority == "High":
            return "Contact customer ASAP. Check with fulfillment team for delivery status."
        return "Verify service records and offer appropriate resolution to customer."
    
    else:
        if customer_tier == "vip":
            return "Provide personalized response using knowledge base. Offer additional assistance."
        return "Answer customer's question using knowledge base. Escalate only if necessary."


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model": MODEL_NAME})


@app.route('/dispute', methods=['POST'])
def handle_dispute():
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        description = data.get("description")
        if not description:
            return jsonify({"error": "Missing required field: description"}), 400
            
        amount = float(data.get("transaction_amount", 0))
        customer_history = data.get("customer_history", {})
        
        dispute_type, priority = classify_dispute(description, amount, customer_history)
        next_steps = get_next_steps(dispute_type, priority, customer_history)
        
        response = {
            "dispute_type": dispute_type,
            "priority": priority,
            "recommended_action": next_steps,
            "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing dispute: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    
    logger.info(f"Starting dispute classification service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
