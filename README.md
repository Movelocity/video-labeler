# 视频目标检测标注工具

![](./doc/main.jpg)

## 1. Instalation
如果没有安装 NodeJS 和 Yarn ，请先安装。
- NodeJS: https://nodejs.org/en/download/prebuilt-installer
- Yarn: `npm install -g yarn`

运行 `install.bat`

## 2. Usage
将 `web` 路径下的 `.env.template` 复制一份，重命名为`.env.local` 并且把改配置文件中的文件夹路径为你的视频文件夹路径。

运行 `run_web.bat` 打开前端服务

## 3. 编译打包 (可选)
```shell
yarn run build  # 打包的结果保存在 web/.next 中
yarn run start  # 这样运行的服务进程，速度会快很多
```

## 3. TODO
- [x] 视频路径浏览
- [x] 标注文件保存
- [x] 标注信息浏览
- [x] 删除标注
- [x] 标注框缩放拖动体验优化
- [x] 多级文件路径支持
- [ ] 标签管理和视频文件预览优化
