import io
import uuid
import logging
from PIL import Image
from minio import Minio
from minio.error import S3Error
from ..config.settings import settings

logger = logging.getLogger(__name__)

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

        logger.info(f"Uploading image - Key: {key}, Size: {len(image_data)} bytes")

        try:
            # Validate image data before upload
            try:
                test_img = Image.open(io.BytesIO(image_data))
                logger.debug(f"Image validation successful - format: {test_img.format}, mode: {test_img.mode}, size: {test_img.size}")
            except Exception as img_error:
                logger.error(f"Image validation failed before upload: {img_error}")
                raise Exception(f"Invalid image data: {img_error}")

            # Upload to S3/MinIO
            self.client.put_object(
                self.bucket,
                key,
                io.BytesIO(image_data),
                len(image_data)
            )

            logger.info(f"Successfully uploaded image to {key}")

            # Verify the upload by reading it back
            try:
                retrieved_data = self.get_image(key)
                if retrieved_data != image_data:
                    logger.error(f"Data integrity check failed for {key} - retrieved size: {len(retrieved_data)}, expected: {len(image_data)}")
                    raise Exception("Data integrity check failed after upload")
                else:
                    logger.debug(f"Data integrity check passed for {key}")
            except Exception as verify_error:
                logger.error(f"Upload verification failed for {key}: {verify_error}")
                raise Exception(f"Upload verification failed: {verify_error}")

            return key

        except Exception as e:
            logger.error(f"Failed to upload image {key}: {e}", exc_info=True)
            raise Exception(f"Storage upload failed: {e}")
    
    def get_image(self, key: str) -> bytes:
        logger.debug(f"Retrieving image: {key}")
        try:
            response = self.client.get_object(self.bucket, key)
            data = response.read()
            logger.debug(f"Retrieved image {key}: {len(data)} bytes")
            return data
        except Exception as e:
            logger.error(f"Failed to retrieve image {key}: {e}")
            raise Exception(f"Failed to retrieve image: {e}")
    
    def upload_original_and_enhanced(self, original_data: bytes, enhanced_data: bytes) -> tuple[str, str]:
        logger.info(f"Uploading original and enhanced images - Original: {len(original_data)} bytes, Enhanced: {len(enhanced_data)} bytes")
        original_key = self.upload_image(original_data, "original")
        enhanced_key = self.upload_image(enhanced_data, "enhanced")
        logger.info(f"Upload completed - Original key: {original_key}, Enhanced key: {enhanced_key}")
        return original_key, enhanced_key