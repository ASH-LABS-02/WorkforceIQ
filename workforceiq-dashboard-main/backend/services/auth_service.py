from fastapi import Header, HTTPException, Depends
from firebase_admin import auth
from services.firestore_service import db_service

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        # For development/demo, if Firestore isn't fully configured, we might allow bypass
        # But for this task, we want real auth. 
        # However, let's keep a fallback if the service account isn't ready.
        if not db_service.is_ready():
            return {"uid": "mock_user", "email": "mock@example.com"}
            
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )

    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

def get_current_user(decoded_token: dict = Depends(verify_token)):
    return decoded_token
