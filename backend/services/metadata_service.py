from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from pathlib import Path
from datetime import datetime

def _convert_to_degrees(value):
    """Helper to convert the GPS coordinates stored in EXIF to decimal degrees."""
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)

def extract_exif_metadata(image_path: str):
    """
    Extracts GPS latitude, longitude, and capture timestamp from an image file.
    Returns: dict with 'latitude', 'longitude', 'timestamp', and 'has_gps' (boolean).
    """
    meta = {
        "latitude": None,
        "longitude": None,
        "timestamp": None,
        "has_gps": False
    }

    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif()
            if not exif_data:
                return meta

            gps_info = {}
            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, tag_id)
                if tag_name == "DateTimeOriginal" or tag_name == "DateTime":
                    try:
                        meta["timestamp"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S").isoformat()
                    except Exception:
                        meta["timestamp"] = str(value)
                elif tag_name == "GPSInfo":
                    for gps_tag_id in value:
                        sub_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                        gps_info[sub_tag] = value[gps_tag_id]

            if "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
                lat = _convert_to_degrees(gps_info["GPSLatitude"])
                if gps_info.get("GPSLatitudeRef", "N") != "N":
                    lat = -lat

                lon = _convert_to_degrees(gps_info["GPSLongitude"])
                if gps_info.get("GPSLongitudeRef", "E") != "E":
                    lon = -lon

                meta["latitude"] = round(lat, 6)
                meta["longitude"] = round(lon, 6)
                meta["has_gps"] = True

    except Exception as e:
        print(f"⚠️ [MetadataService] Error reading EXIF: {e}")

    return meta
