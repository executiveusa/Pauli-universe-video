from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional
import os
import logging
from google.cloud import storage as gcs
import dropbox
from azure.storage.blob import BlobServiceClient
from database import VideoRepository, MetadataRepository
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cloud", tags=["cloud"])

class CloudSyncManager:
    def __init__(self):
        self.gcs_client = None
        self.dropbox_client = None
        self.onedrive_client = None
        self.init_clients()

    def init_clients(self):
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            self.gcs_client = gcs.Client()

        if os.getenv("DROPBOX_ACCESS_TOKEN"):
            self.dropbox_client = dropbox.Dropbox(os.getenv("DROPBOX_ACCESS_TOKEN"))

        if os.getenv("AZURE_STORAGE_CONNECTION_STRING"):
            self.onedrive_client = BlobServiceClient.from_connection_string(
                os.getenv("AZURE_STORAGE_CONNECTION_STRING")
            )

    async def sync_google_drive(self):
        if not self.gcs_client:
            logger.warning("Google Cloud Storage not configured")
            return []

        videos = []
        try:
            bucket = self.gcs_client.bucket(os.getenv("GCS_BUCKET_NAME", "pauli-videos"))
            for blob in bucket.list_blobs():
                if self.is_video_file(blob.name):
                    video_data = {
                        "source": "google_drive",
                        "filename": blob.name,
                        "size": blob.size,
                        "created_at": blob.time_created,
                        "updated_at": blob.updated,
                        "url": blob.public_url,
                        "month": blob.time_created.strftime("%Y-%m") if blob.time_created else None
                    }
                    video = await VideoRepository.create_video(video_data)
                    videos.append(video)
        except Exception as e:
            logger.error(f"Google Drive sync error: {e}")

        return videos

    async def sync_dropbox(self):
        if not self.dropbox_client:
            logger.warning("Dropbox not configured")
            return []

        videos = []
        try:
            result = self.dropbox_client.files_list_folder("/", recursive=True)
            for entry in result.entries:
                if isinstance(entry, dropbox.files.FileMetadata) and self.is_video_file(entry.name):
                    video_data = {
                        "source": "dropbox",
                        "filename": entry.name,
                        "size": entry.size,
                        "created_at": entry.server_modified,
                        "path": entry.path_display,
                        "month": entry.server_modified.strftime("%Y-%m")
                    }
                    video = await VideoRepository.create_video(video_data)
                    videos.append(video)
        except Exception as e:
            logger.error(f"Dropbox sync error: {e}")

        return videos

    async def sync_onedrive(self):
        if not self.onedrive_client:
            logger.warning("OneDrive not configured")
            return []

        videos = []
        try:
            container_client = self.onedrive_client.get_container_client("videos")
            for blob in container_client.list_blobs():
                if self.is_video_file(blob.name):
                    video_data = {
                        "source": "onedrive",
                        "filename": blob.name,
                        "size": blob.size,
                        "created_at": blob.creation_time,
                        "updated_at": blob.last_modified,
                        "month": blob.creation_time.strftime("%Y-%m") if blob.creation_time else None
                    }
                    video = await VideoRepository.create_video(video_data)
                    videos.append(video)
        except Exception as e:
            logger.error(f"OneDrive sync error: {e}")

        return videos

    @staticmethod
    def is_video_file(filename: str) -> bool:
        video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".flv", ".wmv"}
        return any(filename.lower().endswith(ext) for ext in video_extensions)

async def sync_all_clouds():
    manager = CloudSyncManager()
    all_videos = []

    logger.info("Starting cloud sync...")
    all_videos.extend(await manager.sync_google_drive())
    all_videos.extend(await manager.sync_dropbox())
    all_videos.extend(await manager.sync_onedrive())

    logger.info(f"Cloud sync complete: {len(all_videos)} videos found/updated")
    return all_videos

@router.post("/sync/google")
async def sync_google_drive(background_tasks: BackgroundTasks):
    manager = CloudSyncManager()
    background_tasks.add_task(manager.sync_google_drive)
    return {"status": "google_drive_sync_queued"}

@router.post("/sync/dropbox")
async def sync_dropbox(background_tasks: BackgroundTasks):
    manager = CloudSyncManager()
    background_tasks.add_task(manager.sync_dropbox)
    return {"status": "dropbox_sync_queued"}

@router.post("/sync/onedrive")
async def sync_onedrive(background_tasks: BackgroundTasks):
    manager = CloudSyncManager()
    background_tasks.add_task(manager.sync_onedrive)
    return {"status": "onedrive_sync_queued"}

@router.post("/sync/all")
async def sync_all(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_all_clouds)
    return {"status": "all_clouds_sync_queued"}

@router.get("/status")
async def sync_status():
    return {
        "google_drive": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
        "dropbox": bool(os.getenv("DROPBOX_ACCESS_TOKEN")),
        "onedrive": bool(os.getenv("AZURE_STORAGE_CONNECTION_STRING"))
    }
