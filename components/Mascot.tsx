// 직접 그린 픽셀 마스코트 (돋보기를 든 캐릭터)
export default function Mascot() {
  return (
    <svg viewBox="0 0 21 19" width="132" height="120" shapeRendering="crispEdges" role="img" aria-label="돋보기를 든 캐릭터">
      <g fill="#2b2b3a">
        <rect x="4" y="0" width="10" height="1" /><rect x="3" y="1" width="1" height="3" /><rect x="14" y="1" width="1" height="3" />
        <rect x="4" y="9" width="10" height="1" /><rect x="3" y="4" width="1" height="5" /><rect x="14" y="4" width="1" height="5" />
        <rect x="7" y="5" width="1" height="2" /><rect x="10" y="5" width="1" height="2" /><rect x="8" y="8" width="2" height="1" />
        <rect x="4" y="10" width="1" height="6" /><rect x="13" y="10" width="1" height="6" /><rect x="5" y="16" width="8" height="1" />
        <rect x="6" y="17" width="2" height="2" /><rect x="10" y="17" width="2" height="2" />
      </g>
      <rect x="4" y="1" width="10" height="2" fill="#3a6ea5" /><rect x="10" y="3" width="5" height="1" fill="#0a246a" />
      <rect x="4" y="3" width="10" height="6" fill="#ffd9b0" />
      <rect x="5" y="7" width="2" height="1" fill="#ff9aa8" /><rect x="11" y="7" width="2" height="1" fill="#ff9aa8" />
      <rect x="5" y="10" width="8" height="6" fill="#ffe766" /><rect x="8" y="12" width="2" height="2" fill="#fff" />
      <rect x="13" y="11" width="2" height="2" fill="#ffd9b0" /><rect x="13" y="13" width="1" height="1" fill="#2b2b3a" />
      <rect x="14" y="12" width="1" height="1" fill="#2b2b3a" />
      <g fill="#2b2b3a">
        <rect x="16" y="6" width="3" height="1" /><rect x="15" y="7" width="1" height="4" />
        <rect x="19" y="7" width="1" height="4" /><rect x="16" y="11" width="3" height="1" />
      </g>
      <rect x="16" y="7" width="3" height="4" fill="#bfe6ff" /><rect x="16" y="8" width="1" height="1" fill="#fff" />
    </svg>
  );
}
