import { useReactFlow, useStore } from "@xyflow/react";

/**
 * 右下角缩放控制条。-/+ 按钮 + 滑块 + 百分比。
 * 实时反映当前 zoom, 修改时通过 useReactFlow().zoomTo 平滑过渡。
 */
export function ZoomControls() {
  const { zoomTo, getZoom } = useReactFlow();
  // useStore 订阅 zoom 变化, 触发重新渲染
  const zoom = useStore((s) => s.transform[2]);

  function set(z: number) {
    zoomTo(Math.max(0.2, Math.min(2, z)), { duration: 120 });
  }

  const pct = Math.round(getZoom() * 100);

  return (
    <div className="dm-zoom" data-zoom-controls="1">
      <button className="dm-zoom-btn" onClick={() => set(zoom - 0.1)} title="缩小">-</button>
      <input
        className="dm-zoom-slider"
        type="range"
        min={20}
        max={200}
        value={Math.round(zoom * 100)}
        onChange={(e) => set(Number(e.target.value) / 100)}
      />
      <span className="dm-zoom-label">{pct}%</span>
      <button className="dm-zoom-btn" onClick={() => set(zoom + 0.1)} title="放大">+</button>
      <button className="dm-zoom-btn" onClick={() => zoomTo(1, { duration: 120 })} title="重置">1:1</button>
    </div>
  );
}
