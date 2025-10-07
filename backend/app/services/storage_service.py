import io
import os
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

    def upload_multi_size_images(self, original_data: bytes, enhanced_sizes: dict[str, bytes]) -> dict[str, str]:
        """Upload original and multiple sizes of enhanced image (thumbnail, preview, full)"""
        file_id = str(uuid.uuid4())

        keys = {}

        # Upload original
        original_key = f"original/{file_id}.png"
        self.client.put_object(self.bucket, original_key, io.BytesIO(original_data), len(original_data))
        keys['original_url'] = original_key
        logger.info(f"Uploaded original: {original_key}")

        # Upload thumbnail
        if 'thumbnail' in enhanced_sizes:
            thumbnail_key = f"thumbnails/{file_id}.png"
            self.client.put_object(self.bucket, thumbnail_key, io.BytesIO(enhanced_sizes['thumbnail']), len(enhanced_sizes['thumbnail']))
            keys['thumbnail_url'] = thumbnail_key
            logger.info(f"Uploaded thumbnail: {thumbnail_key} ({len(enhanced_sizes['thumbnail'])} bytes)")

        # Upload preview
        if 'preview' in enhanced_sizes:
            preview_key = f"previews/{file_id}.png"
            self.client.put_object(self.bucket, preview_key, io.BytesIO(enhanced_sizes['preview']), len(enhanced_sizes['preview']))
            keys['preview_url'] = preview_key
            logger.info(f"Uploaded preview: {preview_key} ({len(enhanced_sizes['preview'])} bytes)")

        # Upload full
        if 'full' in enhanced_sizes:
            full_key = f"enhanced/{file_id}.png"
            self.client.put_object(self.bucket, full_key, io.BytesIO(enhanced_sizes['full']), len(enhanced_sizes['full']))
            keys['enhanced_url'] = full_key
            logger.info(f"Uploaded full: {full_key} ({len(enhanced_sizes['full'])} bytes)")

        return keys

    def get_full_url(self, key: str, use_presigned: bool = True) -> str:
        """Generate full S3 URL for a given key

        Args:
            key: The S3 object key
            use_presigned: If True, generate presigned URL. If False, use API proxy URL
        """
        if not key:
            return None

        if use_presigned:
            # Generate a presigned URL that's valid for 1 hour
            try:
                url = self.client.presigned_get_object(
                    bucket_name=self.bucket,
                    object_name=key,
                    expires=3600  # 1 hour expiry
                )
                logger.debug(f"Generated presigned URL: {url} for key: {key}")
                return url
            except Exception as e:
                logger.error(f"Failed to generate presigned URL for {key}: {e}")
                logger.info(f"Falling back to API proxy URL for {key}")

        # Fallback to API proxy URL (this always works if backend is accessible)
        api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        if settings.MINIO_SECURE:
            api_base_url = api_base_url.replace("http://", "https://")

        proxy_url = f"{api_base_url}/api/image/{key}"
        logger.debug(f"Generated API proxy URL: {proxy_url} for key: {key}")
        return proxy_url