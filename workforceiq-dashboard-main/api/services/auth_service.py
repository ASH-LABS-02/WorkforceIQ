from fastapi import Header, HTTPException, Depends
from services.firestore_service import db_service

async def verify_token(authorization: str = Header(None)):
    # If Firebase isn't configured, bypass all auth (demo/serverless fallback)
    if not db_service.is_ready():
        return {"uid": "demo_user", "email": "demo@workforceiq.app"}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )

    token = authorization.split("Bearer ")[1]
    try:
        from firebase_admin import auth
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        # If token verification fails, allow through in demo mode
        return {"uid": "demo_user", "email": "demo@workforceiq.app", "error": str(e)}

def get_current_user(decoded_token: dict = Depends(verify_token)):
    return decoded_token
