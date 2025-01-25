# 数据集制作工具

一组将视频注释转换为 COCO 格式数据集、预览和拆分数据集的工具。

## 安装

1. 克隆此存储库
2. 安装依赖项：
```bash
pip install opencv-python numpy tqdm loguru pynput pyyaml
```

## 工具概述

### 1. 视频到 COCO 转换器 (`convert.py`)

从带注释的视频中提取帧并将其转换为 COCO 格式数据集。

```bash
python convert.py
```

### 2. 数据集预览 (`preview.py`)

用于 COCO 格式数据集的可视检查工具，带有边界框可视化。

```bash
# 使用指定的数据集路径
python preview.py <dataset_path>

# 使用配置文件中的 output_root 路径
python preview.py
```

控制：
- 下一张图片：'d' 或右箭头
- 上一张图片：'a' 或左箭头
- 删除当前：'e'
- 退出：'q' 或 ESC

### 3. 数据集拆分 (`split.py`)

将 COCO 数据集拆分为训练/验证/测试集。

```bash
python split.py <dataset_path> --train 0.7 --val 0.2 --test 0.1
```

## 配置

所有工具共享一个公共配置文件 `config.txt`。关键设置包括：

```ini
[paths]
video_root = "path/to/videos"
annotation_root = "path/to/annotations"
output_root = "path/to/output"

[convert]
fps = 3  # 提取的帧率
max_size = 1024  # 最大图像尺寸

[split]
train_ratio = 0.7
val_ratio = 0.2
test_ratio = 0.1
```

## 数据格式

### 输入视频注释格式
```json
{
  "objects": [
    {
      "id": "1",
      "label": "class_name",
      "timeline": {
        "0.00134": {
          "sx": 0.44139,  // 起始 x（归一化）
          "sy": 0.30479,  // 起始 y（归一化）
          "w": 0.07970,   // 宽度（归一化）
          "h": 0.32510    // 高度（归一化）
        }
      }
    }
  ]
}
```

### 输出 COCO 格式
- 图像：在 `images/` 目录中的 JPG 格式
- 标签：每个图像一个文本文件在 `labels/` 目录中
- 格式：`class_id x_center y_center width height`（均为归一化）

## 日志记录

所有工具使用 loguru 进行一致的日志记录。在 `config.txt` 中配置日志记录：

```ini
[logging]
level = "INFO"
format = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
```

## 示例工作流程

1. 准备视频文件和注释
2. 在 `config.txt` 中配置路径
3. 将视频转换为 COCO 格式：
   ```bash
   python convert.py
   ```
4. 预览数据集：
   ```bash
   python preview.py output_root
   ```
5. 拆分为训练/验证/测试集：
   ```bash
   python split.py output_root --train 0.7 --val 0.2 --test 0.1
   ```

下载 coco8 示例： https://github.com/ultralytics/assets/releases/download/v0.0.0/coco8.zip
`
标签中的一行是 `class x_center y_center width height`


可以通过以下方式使用这些工具：

直接运行脚本：
```
python convert.py
python preview.py
python split.py
```

安装为包后运行：
```
cd ..
pip install -e .  # 在项目根目录下安装包
ds-convert  # 运行转换工具
ds-preview  # 运行预览工具
ds-split    # 运行拆分工具
```