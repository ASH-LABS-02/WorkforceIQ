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
            # Check for service account key file
            cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT") or "serviceAccountKey.json"
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                try:
                    firebase_admin.get_app()
                except ValueError:
                    firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                logger.info("Firebase Firestore initialized successfully.")
            else:
                logger.warning(f"Firebase service account key not found at {cred_path}. Firestore will be disabled.")
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
