// 2단계에서 모은 정보 → 3단계(AI 글 작성)로 넘기는 임시 보관함 (브라우저 sessionStorage)
export type FoundDraft = {
  photo: string; // JPEG data URL (긴 변 1280px)
  takenAt: string; // 촬영 시각 (ISO)
  lat: number;
  lng: number;
  accuracy: number | null; // GPS 오차(m). 사람이 직접 고른 위치면 null
  address: string;
  building: string;
  floor: string;
  room: string;
  note: string;
};

const KEY = "found-draft";

export const saveDraft = (d: FoundDraft) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* 저장 공간이 부족해도 화면은 계속 진행 */
  }
};

export const loadDraft = (): FoundDraft | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FoundDraft) : null;
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
