"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", label: "홈", short: "홈" },
  { href: "/found", label: "주웠어요", short: "주웠어요" },
  { href: "/lost", label: "잃어버렸어요", short: "잃었어요" },
  { href: "/list", label: "게시글 목록", short: "목록" },
];

function clockText() {
  const d = new Date();
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 다이어리 겉모습 + 오른쪽 탭(휴대폰에서는 아래 작업 표시줄). 글 수는 DB를 붙이는 3단계에서 실제 값으로 바뀜.
export default function DiaryShell({
  children,
  today = 0,
  total = 0,
  auth,
}: {
  children: React.ReactNode;
  auth?: React.ReactNode;
  today?: number;
  total?: number;
}) {
  const path = usePathname();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(clockText());
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div id="desk">
      <div id="diary" className={path === "/" ? "spread" : "single"}>
        <div className="topbar">
          <span id="counter">
            TODAY <b>{today}</b> | TOTAL <b>{total}</b>
          </span>
          <h1 className="svc">✏️ 찾아zoom</h1>
          <div className="topright">
            <span id="badge">⚠ 시제품 · 가짜 데이터</span>
            {auth}
          </div>
        </div>
        <div className="rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div id="app">{children}</div>
      </div>
      <nav id="tabs" aria-label="메뉴">
        <Link className="start" href="/">
          🔍 시작
        </Link>
        <div className="tablist">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={`tab${isActive(t.href) ? " on" : ""}`}>
              <b className="f">{t.label}</b>
              <b className="s">{t.short}</b>
            </Link>
          ))}
        </div>
        <span id="clock">{clock}</span>
      </nav>
    </div>
  );
}
