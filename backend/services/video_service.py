import cv2
import os
from pathlib import Path

def process_video_frames(video_path: str, output_frames_dir: Path, sample_interval_sec: float = 1.0):
    """
    Extracts frames from an uploaded road video at a configured time interval (default 1 FPS).
    Returns list of dicts with: frame_index, timestamp_sec, timestamp_str ('hh:mm:ss'), and frame_path.
    """
    output_frames_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(1, int(fps * sample_interval_sec))
    
    extracted_frames = []
    frame_count = 0
    saved_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            timestamp_sec = round(frame_count / fps, 2)
            mins = int(timestamp_sec // 60)
            secs = int(timestamp_sec % 60)
            timestamp_str = f"{mins:02d}:{secs:02d}"

            frame_filename = f"frame_{saved_index:04d}_{mins:02d}m{secs:02d}s.jpg"
            frame_filepath = output_frames_dir / frame_filename
            cv2.imwrite(str(frame_filepath), frame)

            extracted_frames.append({
                "frame_index": saved_index,
                "timestamp_sec": timestamp_sec,
                "timestamp_str": timestamp_str,
                "frame_path": str(frame_filepath)
            })
            saved_index += 1

        frame_count += 1

    cap.release()
    return extracted_frames
