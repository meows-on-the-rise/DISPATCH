import React, { useRef, useState, ReactNode } from "react";

export default function PullToRefresh({
  onRefresh, children,
}: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);

  return (
    <div
      onTouchStart={e => {
        if (window.scrollY === 0) startY.current = e.touches[0].clientY;
      }}
      onTouchEnd={async e => {
        const delta = e.changedTouches[0].clientY - startY.current;
        if (delta > 80) {
          setPulling(true);
          await onRefresh();
          setPulling(false);
        }
      }}
      style={{ position: "relative" }}
    >
      {pulling && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", justifyContent: "center", padding: 12, zIndex: 10,
        }}>
          <span className="spinner" />
        </div>
      )}
      {children}
    </div>
  );
}
