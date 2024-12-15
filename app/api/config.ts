export const runtime = "nodejs"

// 运行时配置状态
const runtimeConfig = {
  VIDEO_ROOT: process.env.VIDEO_ROOT ?? "videos",
  LABELS_ROOT: process.env.LABELS_ROOT ?? (process.env.VIDEO_ROOT ?? "videos")
};

// 获取配置，返回 runtime state
export const getConfig = () => runtimeConfig;

// 更新配置，同时更新运行时状态
export const updateConfig = (newConfig: Partial<typeof runtimeConfig>) => {
  if (newConfig.VIDEO_ROOT) {
    process.env.VIDEO_ROOT = newConfig.VIDEO_ROOT;
    runtimeConfig.VIDEO_ROOT = newConfig.VIDEO_ROOT;
  }
  if (newConfig.LABELS_ROOT) {
    process.env.LABELS_ROOT = newConfig.LABELS_ROOT;
    runtimeConfig.LABELS_ROOT = newConfig.LABELS_ROOT;
  }
};
