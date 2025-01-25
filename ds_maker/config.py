"""
Shared configuration loader for dataset maker tools
"""

import configparser
from pathlib import Path
from loguru import logger

def load_config(config_path: str | Path = "config.txt") -> configparser.ConfigParser:
    """
    Load configuration from config.txt file
    
    Args:
        config_path: Path to config file (default: config.txt)
        
    Returns:
        ConfigParser object with loaded configuration
    """
    config = configparser.ConfigParser()
    config_path = Path(config_path)
    
    if not config_path.exists():
        logger.warning(f"Config file not found at {config_path}, using defaults")
        # Set defaults
        config["paths"] = {
            "video_root": "C:/datasets/sample",
            "annotation_root": "C:/datasets/sample", 
            "output_root": "C:/datasets/sample/export"
        }
        config["convert"] = {
            "fps": "3",
            "max_size": "1024"
        }
        config["split"] = {
            "train_ratio": "0.7",
            "val_ratio": "0.2",
            "test_ratio": "0.1"
        }
        config["preview"] = {
            "window_title": "Dataset Preview",
            "window_width": "1280",
            "window_height": "720"
        }
        config["logging"] = {
            "level": "INFO",
            "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
        }
    else:
        config.read(config_path)
        
    return config

def setup_logging(config: configparser.ConfigParser) -> None:
    """
    Setup loguru logger based on config
    
    Args:
        config: ConfigParser object with logging configuration
    """
    logger.remove()  # Remove default handler
    
    log_config = config["logging"]
    logger.add(
        sink=lambda msg: print(msg, flush=True),
        format=log_config["format"],
        level=log_config["level"],
        colorize=True
    ) 