import os
import firebase_admin
from firebase_admin import credentials, firestore
from models.schemas import HiringAnalysis
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FirestoreService:
    def __init__(self):
        self.db = None
        self._initialize()

    def _initialize(self):
        try:
            cred = None

            # Option 1: JSON string in env var (best for Vercel/serverless)
            sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if sa_json:
                import json
                cred = credentials.Certificate(json.loads(sa_json))
                logger.info("Firebase credentials loaded from FIREBASE_SERVICE_ACCOUNT_JSON env var.")
            else:
                # Option 2: File path (local dev fallback)
                default_key_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json")
                cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT") or default_key_path

                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    logger.info(f"Firebase credentials loaded from file: {cred_path}")
                else:
                    logger.warning(f"No Firebase credentials found. Firestore will be disabled.")

            if cred:
                try:
                    firebase_admin.get_app()
                except ValueError:
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase Firestore initialized successfully.")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
            self.db = None

    def is_ready(self):
        return self.db is not None

    async def save_candidate(self, analysis: HiringAnalysis):
        if not self.db:
            return False
            
        try:
            # Convert Pydantic model to dict
            data = analysis.model_dump()
            self.db.collection("candidates").document(analysis.candidate_id).set(data)
            return True
        except Exception as e:
            logger.error(f"Error saving candidate to Firestore: {str(e)}")
            return False

    async def get_candidates(self):
        if not self.db:
            return []
            
        try:
            docs = self.db.collection("candidates").stream()
            candidates = []
            for doc in docs:
                data = doc.to_dict()
                candidates.append(HiringAnalysis(**data))
            return candidates
        except Exception as e:
            logger.error(f"Error fetching candidates from Firestore: {str(e)}")
            return []

    async def get_candidate(self, candidate_id: str):
        if not self.db:
            return None
            
        try:
            doc = self.db.collection("candidates").document(candidate_id).get()
            if doc.exists:
                return HiringAnalysis(**doc.to_dict())
            return None
        except Exception as e:
            logger.error(f"Error fetching candidate {candidate_id} from Firestore: {str(e)}")
            return None

    async def delete_candidate(self, candidate_id: str):
        if not self.db:
            return False
            
        try:
            self.db.collection("candidates").document(candidate_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting candidate {candidate_id} index: {str(e)}")
            return False

# Global instance
db_service = FirestoreService()
