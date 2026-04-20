from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging
import xml.etree.ElementTree as ET
from datetime import timedelta
from database import VideoRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrate", tags=["integrations"])

class PremiereDVEGenerator:
    @staticmethod
    async def generate_edl(video_ids: List[str]) -> str:
        videos = []
        for vid in video_ids:
            video = await VideoRepository.get_video(vid)
            if video:
                videos.append(video)

        edl_lines = ["TITLE: Pauli Studio Project\n"]
        edl_lines.append("001  AX       V     C        00:00:00:00        00:00:05:00        00:00:00:00        00:00:05:00\n")

        event_num = 1
        for idx, video in enumerate(videos):
            duration_sec = video.get("duration", 5)
            frames = int(duration_sec * 30)

            start_tc = f"00:00:{(idx * 5):02d}:00"
            end_tc = f"00:00:{(idx * 5 + 5):02d}:00"

            line = f"{event_num:03d}  AX       V     C        {start_tc}        {end_tc}        00:00:00:00        00:00:05:00\n"
            edl_lines.append(line)
            edl_lines.append(f"* FROM CLIP NAME: {video.get('filename', 'clip')}\n")

            event_num += 1

        return "".join(edl_lines)

    @staticmethod
    async def generate_xml(video_ids: List[str]) -> str:
        videos = []
        for vid in video_ids:
            video = await VideoRepository.get_video(vid)
            if video:
                videos.append(video)

        root = ET.Element("xmeml")
        root.set("version", "5")

        project = ET.SubElement(root, "project")
        name = ET.SubElement(project, "name")
        name.text = "Pauli Video Studio"

        sequences = ET.SubElement(project, "sequences")
        sequence = ET.SubElement(sequences, "sequence")

        seq_name = ET.SubElement(sequence, "name")
        seq_name.text = "Timeline 1"

        media = ET.SubElement(sequence, "media")
        video_elem = ET.SubElement(media, "video")

        track = ET.SubElement(video_elem, "track")
        track_num = 1

        for video in videos:
            clip = ET.SubElement(track, "clipitem")
            clip_id = ET.SubElement(clip, "name")
            clip_id.text = video.get("filename", f"clip_{track_num}")

            file_elem = ET.SubElement(clip, "file")
            file_path = ET.SubElement(file_elem, "pathurl")
            file_path.text = video.get("url", "")

            duration = ET.SubElement(clip, "duration")
            duration.text = str(int(video.get("duration", 5) * 30))

            track_num += 1

        return ET.tostring(root, encoding="unicode")

class DaVinciDRXGenerator:
    @staticmethod
    async def generate_drx(video_ids: List[str]) -> Dict[str, Any]:
        videos = []
        for vid in video_ids:
            video = await VideoRepository.get_video(vid)
            if video:
                videos.append(video)

        timeline = {
            "name": "Pauli Timeline",
            "frame_rate": 30,
            "resolution": "1920x1080",
            "clips": []
        }

        for idx, video in enumerate(videos):
            clip = {
                "id": f"clip_{idx}",
                "name": video.get("filename", f"clip_{idx}"),
                "source_file": video.get("url", ""),
                "start_time": idx * 5 * 30,
                "duration": int(video.get("duration", 5) * 30),
                "video_track": 1,
                "properties": {
                    "opacity": 100,
                    "position": {
                        "x": 0,
                        "y": 0
                    }
                }
            }
            timeline["clips"].append(clip)

        return timeline

async def export_premiere_edl(video_ids: List[str]) -> Dict[str, Any]:
    edl_content = await PremiereDVEGenerator.generate_edl(video_ids)
    return {
        "format": "edl",
        "software": "adobe_premiere",
        "content": edl_content,
        "file_name": "pauli_studio_export.edl"
    }

async def export_premiere_xml(video_ids: List[str]) -> Dict[str, Any]:
    xml_content = await PremiereDVEGenerator.generate_xml(video_ids)
    return {
        "format": "xmeml",
        "software": "adobe_premiere",
        "content": xml_content,
        "file_name": "pauli_studio_export.xml"
    }

async def export_davinci_xml(video_ids: List[str]) -> Dict[str, Any]:
    timeline = await DaVinciDRXGenerator.generate_drx(video_ids)
    return {
        "format": "davinci_timeline",
        "software": "davinci_resolve",
        "timeline": timeline,
        "file_name": "pauli_studio_export.drx"
    }

@router.post("/premiere/edl")
async def export_to_premiere_edl(video_ids: List[str]):
    return await export_premiere_edl(video_ids)

@router.post("/premiere/xml")
async def export_to_premiere_xml(video_ids: List[str]):
    return await export_premiere_xml(video_ids)

@router.post("/davinci/timeline")
async def export_to_davinci(video_ids: List[str]):
    return await export_davinci_xml(video_ids)

@router.get("/integrations/available")
async def list_integrations():
    return {
        "video_editors": [
            {
                "name": "Adobe Premiere Pro",
                "formats": ["edl", "xmeml"],
                "endpoints": ["/premiere/edl", "/premiere/xml"]
            },
            {
                "name": "DaVinci Resolve",
                "formats": ["drx", "timeline"],
                "endpoints": ["/davinci/timeline"]
            }
        ],
        "asset_generators": [
            {
                "name": "Hyperframe",
                "capabilities": ["thumbnails", "clips", "captions"]
            },
            {
                "name": "SeedDance",
                "capabilities": ["video_generation"]
            },
            {
                "name": "cdance",
                "capabilities": ["intro_generation"]
            }
        ],
        "voice_providers": [
            {
                "name": "Mercury 2",
                "capabilities": ["voice_generation", "avatar_composition"]
            }
        ]
    }
