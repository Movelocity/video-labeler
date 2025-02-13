from pathlib import Path
import os
import yaml
import argparse
from tqdm import tqdm
from loguru import logger

def load_yaml(yaml_path: Path) -> dict:
    """加载YAML文件"""
    try:
        with open(yaml_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"读取YAML文件失败: {str(e)}")
        return {}

def save_yaml(yaml_path: Path, data: dict):
    """保存YAML文件"""
    try:
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, allow_unicode=True)
    except Exception as e:
        logger.error(f"保存YAML文件失败: {str(e)}")

def get_label_id(yaml_path: Path, target_label: str) -> str:
    """从data.yaml中获取标签对应的ID"""
    data = load_yaml(yaml_path)
    names = data.get('names', {})
    
    # 反转字典以通过标签名查找ID
    id_map = {v: k for k, v in names.items()}
    return str(id_map.get(target_label))

def update_yaml(yaml_path: Path, removed_label: str):
    """更新data.yaml，移除指定的标签"""
    data = load_yaml(yaml_path)
    names = data.get('names', {})
    
    # 找到要删除的标签ID
    label_id = None
    for id_, name in names.items():
        if name == removed_label:
            label_id = id_
            break
    
    if label_id is not None:
        # 删除该标签
        del names[label_id]
        
        # 重新排序剩余的标签ID
        new_names = {}
        for i, (_, name) in enumerate(sorted(names.items(), key=lambda x: int(x[0]))):
            new_names[i] = name
        
        data['names'] = new_names
        save_yaml(yaml_path, data)
        logger.info(f"已更新 {yaml_path}")

def clean_dataset(output_root: str | Path, target_label: str):
    """
    清理数据集中指定标签的数据
    
    Args:
        output_root: COCO数据集的根目录
        target_label: 要删除的标签名称
    """
    output_root = Path(output_root)
    images_dir = output_root / "images"
    labels_dir = output_root / "labels"
    yaml_path = output_root / "data.yaml"
    
    if not all(p.exists() for p in [images_dir, labels_dir, yaml_path]):
        logger.error(f"目录或data.yaml不存在")
        return
    
    # 获取标签ID
    label_id = get_label_id(yaml_path, target_label)
    if not label_id:
        logger.error(f"在data.yaml中未找到标签: {target_label}")
        return
    
    logger.info(f"开始扫描标签 '{target_label}' (ID: {label_id}) 的文件...")
    
    # 首先扫描需要删除的文件
    files_to_remove = []
    for label_file in tqdm(list(labels_dir.glob("*.txt")), desc="扫描文件"):
        try:
            with open(label_file, 'r') as f:
                lines = f.readlines()
                if any(line.strip().startswith(label_id + " ") for line in lines):
                    image_file = images_dir / f"{label_file.stem}.jpg"
                    files_to_remove.append((label_file, image_file))
        except Exception as e:
            logger.error(f"读取文件失败 {label_file}: {str(e)}")
    
    if not files_to_remove:
        logger.info(f"未找到包含标签 '{target_label}' 的文件")
        return
    
    # 显示将要删除的文件并请求确认
    logger.info(f"将要删除 {len(files_to_remove)} 对文件:")
    for label_file, image_file in files_to_remove[:5]:
        logger.info(f"- {label_file.name} 和 {image_file.name}")
    if len(files_to_remove) > 5:
        logger.info("... 等")
    
    confirm = input(f"\n确认删除这些文件吗? [y/N]: ").lower().strip()
    if confirm != 'y':
        logger.info("操作已取消")
        return
    
    # 执行删除
    removed_count = 0
    for label_file, image_file in tqdm(files_to_remove, desc="删除文件"):
        try:
            if label_file.exists():
                os.remove(label_file)
            if image_file.exists():
                os.remove(image_file)
            removed_count += 1
        except Exception as e:
            logger.error(f"删除文件失败: {str(e)}")
    
    # 更新data.yaml
    update_yaml(yaml_path, target_label)
    
    logger.success(f"清理完成! 共删除 {removed_count} 对文件")

def main():
    parser = argparse.ArgumentParser(description="清理数据集中指定标签的数据")
    parser.add_argument("output_root", help="数据集根目录，包含images和labels子目录")
    parser.add_argument("label", help="要删除的标签名称，必须与data.yaml中的标签一致")
    args = parser.parse_args()
    
    clean_dataset(args.output_root, args.label)

if __name__ == "__main__":
    main() 