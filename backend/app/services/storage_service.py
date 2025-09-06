import io
import uuid
from PIL import Image
from minio import Minio
from minio.error import S3Error
from ..config.settings import settings

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
    
    def initialize(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
            print(f"MinIO connected successfully. Bucket '{self.bucket}' ready.")
        except Exception as e:
            print(f"WARNING: MinIO connection failed: {e}")
            print(f"MinIO endpoint: {settings.MINIO_ENDPOINT}")
            print("The app will start but image storage won't work until MinIO is available.")
    
    def upload_image(self, image_data: bytes, prefix: str = "original") -> str:
        file_id = str(uuid.uuid4())
        key = f"{prefix}/{file_id}.png"
        
        self.client.put_object(
            self.bucket,
            key,
            io.BytesIO(image_data),
            len(image_data)
        )
        
        return key
    
    def get_image(self, key: str) -> bytes:
        response = self.client.get_object(self.bucket, key)
        return response.read()
    
    def upload_original_and_enhanced(self, original_data: bytes, enhanced_data: bytes) -> tuple[str, str]:
        original_key = self.upload_image(original_data, "original")
        enhanced_key = self.upload_image(enhanced_data, "enhanced")
        return original_key, enhanced_key