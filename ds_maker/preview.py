import os
import cv2
import yaml
import numpy as np
from pathlib import Path
import argparse
from pynput import keyboard
from loguru import logger

# Try relative import for package usage, fall back to absolute import for direct script usage
try:
    from .config import load_config, setup_logging
except ImportError:
    from config import load_config, setup_logging

class DatasetPreviewer:
    def __init__(self, dataset_path: str|Path):
        """
        Initialize the dataset previewer
        
        Args:
            dataset_path: Path to the dataset root directory containing data.yaml
        """
        self.dataset_path = Path(dataset_path)
        self.config = self._load_config()
        self.label_names = self.config.get('names', {})
        self.current_idx = 0
        self.images = []
        self.labels = []
        self.can_delete = True  # Flag to track if deletion is allowed
        
        # Load dataset structure
        self._load_dataset()
        
        # Colors for different classes
        np.random.seed(42)
        self.colors = {
            class_id: tuple(map(int, color)) 
            for class_id, color in enumerate(
                np.random.randint(0, 255, size=(len(self.label_names), 3))
            )
        }
    
    def _load_config(self):
        """Load and parse data.yaml configuration file"""
        config_path = self.dataset_path / 'data.yaml'
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
            
        with open(config_path) as f:
            return yaml.safe_load(f)
    
    def _load_dataset(self):
        """Load dataset structure based on configuration"""
        # Check if train/val paths are specified
        train_path = self.config.get('train')
        val_path = self.config.get('val')
        
        if train_path or val_path:
            # Load specified paths
            if train_path:
                self._load_split_data('train', train_path)
            if val_path:
                self._load_split_data('val', val_path)
        else:
            # Load from root images and labels directories
            self._load_all_data()
    
    def _load_split_data(self, split: str, split_path: str):
        """Load data from a specific train/val split"""
        images_dir = self.dataset_path / split_path
        labels_dir = self.dataset_path / 'labels' / split
        
        if not images_dir.exists() or not labels_dir.exists():
            print(f"Warning: {split} split directories not found")
            return
            
        for img_path in images_dir.glob('*.jpg'):
            label_path = labels_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                self.images.append(img_path)
                self.labels.append(label_path)
    
    def _load_all_data(self):
        """Load all data from images and labels directories"""
        images_dir = self.dataset_path / 'images'
        labels_dir = self.dataset_path / 'labels'
        
        if not images_dir.exists() or not labels_dir.exists():
            raise FileNotFoundError("Images or labels directory not found")
            
        for img_path in images_dir.glob('*.jpg'):
            label_path = labels_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                self.images.append(img_path)
                self.labels.append(label_path)
    
    def delete_current(self):
        """Delete current image and its label file"""
        if not self.images:
            return True
            
        # Get current image and label paths
        img_path = self.images[self.current_idx]
        label_path = self.labels[self.current_idx]
        
        # Delete files
        try:
            os.remove(img_path)
            os.remove(label_path)
            print(f"\nDeleted: {img_path.name} and its label file")
            
            # Remove from lists
            self.images.pop(self.current_idx)
            self.labels.pop(self.current_idx)
            
            # Adjust current index
            if self.images:
                self.current_idx = min(self.current_idx, len(self.images) - 1)
                return True
            else:
                print("\nNo more images to preview")
                return False
                
        except Exception as e:
            print(f"\nError deleting files: {str(e)}")
            return True
    
    def _draw_box(self, img, box, label):
        """Draw a bounding box with label on the image"""
        h, w = img.shape[:2]
        x_center, y_center, width, height = box
        
        # Convert normalized coordinates to pixel coordinates
        x1 = int((x_center - width/2) * w)
        y1 = int((y_center - height/2) * h)
        x2 = int((x_center + width/2) * w)
        y2 = int((y_center + height/2) * h)
        
        # Get color for class
        color = self.colors.get(label, (255, 255, 255))
        
        # Draw box
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label_name = self.label_names.get(label, f"class_{label}")
        cv2.putText(img, label_name, (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    def preview(self):
        """Start the preview window with navigation controls"""
        if not self.images:
            print("No valid image-label pairs found in the dataset")
            return
            
        print("\nControls:")
        print("  Next image: 'd' or Right Arrow")
        print("  Previous image: 'a' or Left Arrow")
        print("  Delete current: 'e' (must release key before next deletion)")
        print("  Quit: 'q' or ESC\n")
        
        # Start threads for keyboard press and release
        self.running = True
        listener = keyboard.Listener(
            on_press=self.on_key_press,
            on_release=self.on_key_release
        )
        listener.start()

        while self.running and self.images:
            # Load current image and labels
            img_path = self.images[self.current_idx]
            label_path = self.labels[self.current_idx]
            
            # Read image
            img = cv2.imread(str(img_path))
            if img is None:
                print(f"Error loading image: {img_path}")
                continue
                
            # Read and draw labels
            with open(label_path) as f:
                for line in f:
                    label, *box = map(float, line.strip().split())
                    self._draw_box(img, box, int(label))
            
            # Show image with info
            title = f"Image {self.current_idx + 1}/{len(self.images)} - {img_path.name}"
            cv2.imshow('Dataset Preview', img)
            print(f"\rViewing: {title}", end='', flush=True)

            # Wait for a short time to allow the window to update
            key = cv2.waitKey(100) & 0xFF
            if key == ord('q'):
                self.running = False
                break
        
        listener.stop()
        cv2.destroyAllWindows()

    def on_key_press(self, key):
        """Handle key press events"""
        try:
            if key.char == 'q':  # Quit
                self.running = False
                return False
            elif key.char == 'd' and self.images:  # Next image
                self.current_idx = (self.current_idx + 1) % len(self.images)
            elif key.char == 'a' and self.images:  # Previous image
                self.current_idx = (self.current_idx - 1) % len(self.images)
            elif key.char == 'e' and self.can_delete:  # Delete current image and label
                self.can_delete = False  # Prevent continuous deletion
                if not self.delete_current():
                    self.running = False
                    return False
        except AttributeError:
            # Handle special keys if needed
            pass

    def on_key_release(self, key):
        """Handle key release events"""
        try:
            if key.char == 'e':
                self.can_delete = True  # Allow next deletion after key is released
        except AttributeError:
            pass

def main():
    parser = argparse.ArgumentParser(description='Preview COCO format dataset with annotations')
    parser.add_argument('dataset_path', nargs='?', help='Path to dataset root directory containing data.yaml')
    args = parser.parse_args()
    logger.info(f"args: {args}")

    try:
        # Load config and setup logging
        config = load_config()
        setup_logging(config)
        logger.info(f"config: {config}")

        # If dataset_path not provided, use output_root from config
        if args.dataset_path is None:
            # Strip any quotes from the path string
            output_root = config["paths"]["output_root"].strip('"').strip("'")
            dataset_path = Path(output_root)
            logger.info(f"No dataset path provided, using output_root from config: {dataset_path}")
        else:
            dataset_path = Path(args.dataset_path).resolve()
        
        logger.info(f"dataset_path: {dataset_path}")
        if not dataset_path.exists():
            raise FileNotFoundError(f"Dataset path does not exist: {dataset_path}")
            
        if not (dataset_path / 'data.yaml').exists():
            raise FileNotFoundError(f"data.yaml not found in dataset path: {dataset_path}")
            
        logger.info(f"Loading dataset from: {dataset_path}")
        previewer = DatasetPreviewer(dataset_path)
        logger.info(f"previewer: {previewer}")
        previewer.preview()
        
    except FileNotFoundError as e:
        logger.error(f"Error: {str(e)}")
        return
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise
        
if __name__ == "__main__":
    main()
