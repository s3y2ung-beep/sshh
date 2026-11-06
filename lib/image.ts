// 사진을 긴 변 1280px JPEG로 줄여요 (업로드가 빠르고 AI 분석에도 충분해요).
const MAX_SIDE = 1280;

function toJpeg(source: CanvasImageSource, w: number, h: number): string {
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(source, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function videoToJpeg(video: HTMLVideoElement): string {
  return toJpeg(video, video.videoWidth, video.videoHeight);
}

export async function fileToJpeg(file: File): Promise<string> {
  // imageOrientation: 휴대폰 사진의 회전 정보를 반영
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return toJpeg(bmp, bmp.width, bmp.height);
  } finally {
    bmp.close();
  }
}
