"""
Shared configuration loader for dataset maker tools
"""

import json
from pathlib import Path
from loguru import logger

def load_config(config_path: str | Path = "config.json") -> dict:
    """
    Load configuration from config.json file
    
    Args:
        config_path: Path to config file (default: config.json)
        
    Returns:
        Dict with loaded configuration
    """
    config_path = Path(config_path)

    if not config_path.exists():
        logger.warning(f"Config file not found at {config_path}, using defaults")
        # Set defaults
        config = {
            "paths": {
                "video_root": "C:/datasets/sample",
                "annotation_root": "C:/datasets/sample",
                "output_root": "C:/datasets/sample/export"
            },
            "convert": {
                "fps": 3,
                "max_size": 1024,
                "mode": "normal",
                "fusion": {
                    "enabled": False,
                    "window_seconds": 0.5,
                    "weights": [0.2, 0.6, 0.2]
                }
            },
            "split": {
                "train_ratio": 0.7,
                "val_ratio": 0.2,
                "test_ratio": 0.1
            },
            "preview": {
                "window_title": "Dataset Preview",
                "window_width": 1280,
                "window_height": 720
            },
            "logging": {
                "level": "INFO",
                "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
            }
        }
    else:
        logger.info(f"config_path: {config_path.absolute()}")
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
    return config

def setup_logging(config: dict) -> None:
    """
    Setup loguru logger based on config
    
    Args:
        config: Dict with logging configuration
    """
    logger.remove()  # Remove default handler
    
    log_config = config["logging"]
    # Strip quotes from level if present
    level = str(log_config["level"]).strip('"').strip("'")
    
    logger.add(
        sink=lambda msg: print(msg, flush=True),
        format=log_config["format"],
        level=level,
        colorize=True
    ) 