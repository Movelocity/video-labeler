"""
Split a COCO dataset into train/val/test sets according to provided ratios.
Usage: python split.py <dataset_root> [--config config.txt]

examples:
# Split into 70% train, 20% val, 10% test
python split.py /path/to/dataset --train 0.7 --val 0.2 --test 0.1

# Split into 80% train, 20% val (no test set)
python split.py /path/to/dataset --train 0.8 --val 0.2
"""

import argparse
import random
import shutil
import yaml
from pathlib import Path
from loguru import logger

# Try relative import for package usage, fall back to absolute import for direct script usage
try:
    from .config import load_config, setup_logging
except ImportError:
    from config import load_config, setup_logging

def parse_args():
    parser = argparse.ArgumentParser(description='Split COCO dataset into train/val/test sets')
    parser.add_argument('dataset_root', type=str, help='Root directory of COCO dataset')
    parser.add_argument('--config', default='config.txt', help='Path to config file')
    parser.add_argument('--train', type=float, help='Training set ratio (e.g., 0.7)')
    parser.add_argument('--val', type=float, help='Validation set ratio (e.g., 0.2)')
    parser.add_argument('--test', type=float, help='Test set ratio (e.g., 0.1)')
    return parser.parse_args()

def validate_ratios(train_ratio, val_ratio, test_ratio):
    total = train_ratio + val_ratio + test_ratio
    if not (0.99 <= total <= 1.01):  # Allow small floating point errors
        raise ValueError(f"Ratios must sum to 1.0, got {total}")
    if any(r < 0 for r in [train_ratio, val_ratio, test_ratio]):
        raise ValueError("Ratios must be non-negative")

def create_split_dirs(root_dir):
    # Create directory structure if it doesn't exist
    for split in ['train', 'val', 'test']:
        for subdir in ['images', 'labels']:
            Path(root_dir, subdir, split).mkdir(parents=True, exist_ok=True)

def safe_move(src, dst):
    try:
        shutil.move(str(src), str(dst))
        return True
    except (PermissionError, OSError) as e:
        print(f"Warning: Could not move {src.name}: {str(e)}")
        return False

def split_dataset(args):
    root_dir = Path(args.dataset_root)
    validate_ratios(args.train, args.val, args.test)
    
    # Read existing data.yaml if it exists
    yaml_path = root_dir / 'data.yaml'
    if yaml_path.exists():
        with open(yaml_path) as f:
            data_yaml = yaml.safe_load(f)
    else:
        data_yaml = {'names': {}}  # Initialize with empty names dict
    
    # Get all image files
    image_dir = root_dir / 'images'
    label_dir = root_dir / 'labels'
    
    if not image_dir.exists() or not label_dir.exists():
        raise FileNotFoundError(f"Images or labels directory not found in {root_dir}")
        
    image_files = []
    for ext in ['.jpg', '.jpeg', '.png']:
        image_files.extend(list(image_dir.glob(f'*{ext}')))
    
    if not image_files:
        raise FileNotFoundError(f"No image files found in {image_dir}")
    
    # Shuffle files
    random.shuffle(image_files)
    
    # Calculate split indices
    n_files = len(image_files)
    n_train = int(n_files * args.train)
    n_val = int(n_files * args.val)
    
    # Split files
    train_files = image_files[:n_train]
    val_files = image_files[n_train:n_train + n_val]
    test_files = image_files[n_train + n_val:]
    
    # Create directories
    create_split_dirs(root_dir)
    
    # Move files to respective directories
    splits = {
        'train': train_files,
        'val': val_files,
        'test': test_files
    }
    
    moved_counts = {'train': 0, 'val': 0, 'test': 0}
    
    for split_name, files in splits.items():
        if not files and split_name == 'test':
            continue
            
        for img_path in files:
            # Move image
            new_img_path = root_dir / 'images' / split_name / img_path.name
            if safe_move(img_path, new_img_path):
                moved_counts[split_name] += 1
                
                # Move corresponding label if exists
                label_path = label_dir / f"{img_path.stem}.txt"
                if label_path.exists():
                    new_label_path = root_dir / 'labels' / split_name / label_path.name
                    safe_move(label_path, new_label_path)
    
    # Update data.yaml
    data_yaml.update({
        'path': str(root_dir),
        'train': f'images/train',
        'val': f'images/val',
    })
    
    if test_files:
        data_yaml['test'] = f'images/test'
    
    # Write updated data.yaml
    with open(yaml_path, 'w') as f:
        yaml.safe_dump(data_yaml, f, sort_keys=False)
    
    # Print summary
    print(f"\nDataset split complete:")
    print(f"Train: {moved_counts['train']} images moved")
    print(f"Val: {moved_counts['val']} images moved")
    if test_files:
        print(f"Test: {moved_counts['test']} images moved")
    
    # Print warning if some files couldn't be moved
    for split_name, files in splits.items():
        if len(files) != moved_counts[split_name]:
            print(f"\nWarning: Could not move {len(files) - moved_counts[split_name]} files in {split_name} set")

def main():
    args = parse_args()
    
    # Load config
    config = load_config(args.config)
    setup_logging(config)
    
    # Get split ratios from config if not provided in args
    split_config = config["split"]
    if args.train is None:
        args.train = float(split_config["train_ratio"])
    if args.val is None:
        args.val = float(split_config["val_ratio"])
    if args.test is None:
        args.test = float(split_config["test_ratio"])
    
    try:
        split_dataset(args)
        logger.success("Dataset split complete")
    except Exception as e:
        logger.error(f"Error splitting dataset: {str(e)}")

if __name__ == '__main__':
    main()