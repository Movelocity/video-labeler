"""
Dataset Maker - A toolkit for converting video annotations to COCO format
"""

from .config import load_config, setup_logging
from .convert import VideoToCOCOConverter
from .preview import DatasetPreviewer
from .split import split_dataset

__version__ = "0.1.0"
