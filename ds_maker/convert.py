import json
import cv2
from pathlib import Path
import numpy as np
from typing import Dict, Optional, Union
from tqdm import tqdm
from loguru import logger

# Try relative import for package usage, fall back to absolute import for direct script usage
try:
    from .config import load_config, setup_logging
except ImportError:
    from config import load_config, setup_logging

"""
根据标注文件，从标注视频提取对应图片，保存到指定路径
"""

# Helper function to format time as a string key with 7 characters
def extract_keyframe(timeline: dict, time_key :Optional[str|float]):
    if type(time_key) is float:
        key = f"{time_key:.5f}".ljust(7, '0')
    if type(time_key) is str:
        key = time_key.ljust(7, '0')
    return timeline.get(key, None)

class VideoToCOCOConverter:
    def __init__(
        self, video_root: Union[str, Path], 
        annotation_root: Union[str, Path], 
        output_root: Union[str, Path], 
        fps: int = 10
    ):
        """
        初始化视频转COCO格式转换器
        
        参数:
            video_root: 视频文件根目录
            annotation_root: 标注文件根目录
            output_root: COCO数据集输出目录
            fps: 提取帧率 (默认: 10)
        """
        self.video_root = Path(video_root)
        self.annotation_root = Path(annotation_root)
        self.output_root = Path(output_root)
        self.fps = fps
        
        # 创建输出目录
        self.images_dir = self.output_root / "images"
        self.labels_dir = self.output_root / "labels"
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.labels_dir.mkdir(parents=True, exist_ok=True)
        
        # 标签映射
        self.label_map: Dict[str, int] = {}
        self.next_label_id: int = 0
        
        logger.info(f"初始化完成. 输出目录: {self.output_root}")
    
    def find_annotation_file(self, video_path: Path) -> Optional[Path]:
        """查找视频对应的标注文件"""
        video_name = video_path.name
        
        # 首先尝试递归搜索
        for json_path in self.annotation_root.rglob(f"{video_name}.json"):
            logger.debug(f"找到标注文件: {json_path}")
            return json_path
            
        # 尝试.cache文件夹作为备选
        cache_path = self.annotation_root / ".cache" / f"{video_name}.json"
        if cache_path.exists():
            logger.debug(f"在cache中找到标注文件: {cache_path}")
            return cache_path
            
        logger.warning(f"未找到视频 {video_path} 的标注文件")
        return None
    
    def get_label_id(self, label_name):
        """Get numeric ID for a label, creating new mapping if needed"""
        if label_name not in self.label_map:
            self.label_map[label_name] = self.next_label_id
            self.next_label_id += 1
        return self.label_map[label_name]

    def interpolate_bbox(self, timeline, frame_time):
        """Interpolate bounding box for a given frame time"""
        times = sorted([float(t) for t in timeline.keys()])
        
        # 没有对应的标注区间，返回空
        if frame_time <= times[0] or frame_time >= times[-1]:
            return None

        for i in range(len(times)-1):
            if times[i] <= frame_time <= times[i+1]:
                t1, t2 = times[i], times[i+1]
                box1 = extract_keyframe(timeline, t1)
                box2 = extract_keyframe(timeline, t2)
                
                # Linear interpolation
                alpha = (frame_time - t1) / (t2 - t1)
                return {
                    'sx': box1['sx'] + alpha * (box2['sx'] - box1['sx']),
                    'sy': box1['sy'] + alpha * (box2['sy'] - box1['sy']),
                    'w': box1['w'] + alpha * (box2['w'] - box1['w']),
                    'h': box1['h'] + alpha * (box2['h'] - box1['h']),
                }
        
        return None
    
    def convert_video(self, video_path: Path) -> None:
        """转换单个视频到COCO格式"""
        video_path = Path(video_path)
        logger.info(f"开始处理视频: {video_path}")
        
        annotation_path = self.find_annotation_file(video_path)
        if not annotation_path:
            logger.error(f"未找到标注文件: {video_path}")
            return
        logger.info(f"标注文件: {annotation_path.name}")
            
        # 加载标注
        with open(annotation_path, encoding="utf-8") as f:
            annotation = json.load(f)
            
        # 打开视频
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = int(fps / self.fps)
        
        # 使用tqdm创建进度条
        with tqdm(total=total_frames, desc=f"处理 {video_path.name}") as pbar:
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                if frame_idx % frame_interval == 0:
                    self._process_frame(frame, frame_idx, total_frames, video_path, annotation)
                
                frame_idx += 1
                pbar.update(1)
        
        cap.release()
        logger.info(f"视频处理完成: {video_path}")

    def _process_frame(self, frame: np.ndarray, frame_idx: int, 
                      total_frames: int, video_path: Path, 
                      annotation: Dict) -> None:
        """处理单个视频帧"""
        current_time = frame_idx / total_frames
        frame_name = f"{video_path.stem}_{frame_idx:06d}"
        
        # 调整图像大小
        frame = self._resize_frame(frame)
        
        # 先生成标签
        labels = self._generate_labels(annotation, current_time, frame_name)
        
        # 只有当有标签时才保存图片
        if labels:
            cv2.imwrite(str(self.images_dir / f"{frame_name}.jpg"), frame)

    def _resize_frame(self, frame: np.ndarray) -> np.ndarray:
        """调整帧大小，确保不超过1024像素"""
        height, width = frame.shape[:2]
        if width > 1024:
            scale = 1024 / width
            new_width = 1024
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height))
            
            if new_height > 1024:
                scale = 1024 / new_height
                new_height = 1024
                new_width = int(new_width * scale)
                frame = cv2.resize(frame, (new_width, new_height))
        
        return frame

    def save_label_map(self):
        """Save the label mapping to a YAML file"""
        yaml_content = "names:\n"
        for label, idx in sorted(self.label_map.items(), key=lambda x: x[1]):
            yaml_content += f"  {idx}: {label}\n"
            
        with open(self.output_root / "data.yaml", 'w') as f:
            f.write(yaml_content)
    
    def convert_all(self) -> None:
        """转换视频根目录下的所有视频"""
        video_files = list(self.video_root.glob("**/*.mp4"))
        logger.info(f"找到 {len(video_files)} 个视频文件")
        
        for video_path in tqdm(video_files, desc="处理视频"):
            self.convert_video(video_path)
        
        self.save_label_map()
        logger.success("所有视频处理完成")

    def _generate_labels(self, annotation: Dict, current_time: float, frame_name: str) -> list:
        """
        生成COCO格式的标签文件
        
        Args:
            annotation: 标注数据字典
            current_time: 当前帧的归一化时间 (0-1)
            frame_name: 帧文件名
        
        Returns:
            list: 标签列表，如果没有标签则为空列表
        """
        labels = []
        
        for obj in annotation['objects']:
            bbox = self.interpolate_bbox(obj['timeline'], current_time)
            if bbox:
                # 获取标签ID
                label_id = self.get_label_id(obj['label'])
                
                # 转换为YOLO格式 (x_center, y_center, width, height)
                x_center = bbox['sx'] + bbox['w']/2
                y_center = bbox['sy'] + bbox['h']/2
                width = bbox['w']
                height = bbox['h']
                
                # 确保所有值都在0-1范围内
                x_center = max(0, min(1, x_center))
                y_center = max(0, min(1, y_center))
                width = max(0, min(1, width))
                height = max(0, min(1, height))
                
                label_str = f"{label_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"
                labels.append(label_str)
        
        # 如果有标签，保存到文件
        if labels:
            label_file = self.labels_dir / f"{frame_name}.txt"
            try:
                with open(label_file, 'w') as f:
                    f.write('\n'.join(labels))
                logger.debug(f"保存标签文件: {label_file}")
            except Exception as e:
                logger.error(f"保存标签文件失败 {label_file}: {str(e)}")
        
        return labels

def main():
    # Load config and setup logging
    config = load_config()
    setup_logging(config)
    
    # Get paths from config
    paths_config = config["paths"]
    video_root = paths_config["video_root"]
    annotation_root = paths_config["annotation_root"]
    output_root = paths_config["output_root"]
    
    # Get conversion settings
    convert_config = config["convert"]
    fps = int(convert_config["fps"])
    
    converter = VideoToCOCOConverter(
        video_root=video_root,
        annotation_root=annotation_root,
        output_root=output_root,
        fps=fps
    )
    
    # 转换所有视频
    converter.convert_all()
    
    print("\nLabel mapping:")
    print(converter.label_map)

if __name__ == "__main__":
    main()
