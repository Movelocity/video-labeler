import path from "path"


export const VIDEO_ROOT = process.env.VIDEO_ROOT?? path.join(process.env.USERPROFILE as string, "videos")