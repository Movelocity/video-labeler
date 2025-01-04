# 将某视频标注项目的标签导出为 coco 数据集的工具

## 某视频标注项目的路径逻辑为
- 指定视频文件根路径
- 指定标注文件根路径
- 每个视频对应的标注可能在视频同路径下的 .cache/{{视频文件名带后缀}}.json。如果标注文件根路径未找到对应名字的json文件，就到 .cache 下寻找

对于 video.mp4 视频的标注文件
```json video.mp4.json
{
  "metadata": {
    "nextId": 3
  },
  "objects": [
    {
      "id": "1",
      "label": "player",
      "color": "hsl(133.32864952271945, 70%, 50%)",
      "timeline": {
        "0.00134": {
          "sx": 0.44139549321802524,
          "sy": 0.3047996266313838,
          "w": 0.07970529135967852,
          "h": 0.32510885341074014,
          "label": "player"
        },
        "0.01115": {
          "sx": 0.4646566105081587,
          "sy": 0.31972175372245665,
          "w": 0.098641093024669,
          "h": 0.331957408467708,
          "label": "player"
        },
        "0.02779": {
          "sx": 0.45278196341226506,
          "sy": 0.34398685449785693,
          "w": 0.07769591426657729,
          "h": 0.3468795355587808,
          "label": "player"
        },
        "0.53848": {
          "sx": 0.48225282744441506,
          "sy": 0.3730144306952445,
          "w": 0.05224380442062965,
          "h": 0.3222060957910014,
          "label": "player"
        }
      }
    },
    {
      "id": "2",
      "label": "enermy",
      "color": "hsl(121.07934272201982, 70%, 50%)",
      "timeline": {
        "0.02284": {
          "sx": 0.482252827444415,
          "sy": 0.21046000398987438,
          "w": 0.12056262558606834,
          "h": 0.1494920174165457,
          "label": "enermy"
        },
        "0.00201": {
          "sx": 0.6095133766741538,
          "sy": 0.13934244230627493,
          "w": 0.10582719356999326,
          "h": 0.10885341074020319,
          "label": "enermy"
        },
        "0.00979": {
          "sx": 0.5144214855943465,
          "sy": 0.21670580244473245,
          "w": 0.08236583615683346,
          "h": 0.10405899109521446,
          "label": "enermy"
        }
      }
    }
  ],
  "version": 2
}
```
我们需要关注objects列表里的每个object，
timeline中的key表示了物体对应的关键帧(value )，对于关键帧之间的帧，每个帧都有对应的标注框位置信息 `start_x, start_y, w, h`
多个帧连起来表示时间段，帧之间的标注框平滑移动导出coco数据集时根据工具配置决定每秒导出帧数，默认是每秒10帧
只认object级别的label，不认time级别的label

## coco8 标注数据格式

there is a demo under ./coco8

```yaml
# Train/val/test sets as 1) dir: path/to/imgs, 2) file: path/to/imgs.txt, or 3) list: [path/to/imgs1, path/to/imgs2, ..]
path: ../datasets/coco8 # dataset root dir
train: images/train # train images (relative to 'path') 4 images
val: images/val # val images (relative to 'path') 4 images
test: # test images (optional)

# Classes (80 COCO classes)
names:
    0: person
    1: bicycle
    2: car
    # ...
    77: teddy bear
    78: hair drier
    79: toothbrush
```

a row in label is `class_id x_center y_center width height`