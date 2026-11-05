"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 장난스러운 알림 팝업. 한 번 닫으면 이 탭에서는 다시 뜨지 않음.
export default function HomePopup() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(sessionStorage.getItem("popupClosed") !== "1");
  }, []);

  const close = () => {
    sessionStorage.setItem("popupClosed", "1");
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="win pop" role="dialog" aria-label="알림">
      <div className="tb">
        <span className="t">알림</span>
        <button className="x" onClick={close} aria-label="닫기">닫기</button>
      </div>
      <div className="dlg">
        <span className="ico" />
        <div className="dm">
          <b>지갑.exe</b>를 찾을 수 없습니다.
          <br />
          분실물 게시판에서 찾아볼까요?
        </div>
      </div>
      <div className="btns">
        <button
          className="pill"
          onClick={() => {
            close();
            router.push("/lost");
          }}
        >
          예
        </button>
        <button className="pill light" onClick={close}>닫기</button>
      </div>
    </div>
  );
}
