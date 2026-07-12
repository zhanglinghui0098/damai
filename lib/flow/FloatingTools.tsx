import { useState } from "react";
import { NODE_KINDS, type NodeKind } from "./types";

type Props = {
  /**
   * 菜单项被点击时调用, 第二个参数是点击事件, 父组件用 React Flow 的
   * screenToFlowPosition 把 client 坐标转成画布世界坐标。
   * 这样新建节点就出现在鼠标点菜单时的位置, 不会跑偏。
   */
  onAdd: (kind: NodeKind, e: React.MouseEvent) => void;
};

export function FloatingTools({ onAdd }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dm-tools" data-floating-tools="1">
      <div style={{ position: "relative" }}>
        <button
          className={`dm-tools-btn ${open ? "active" : ""}`}
          onClick={() => setOpen((o) => !o)}
          data-floating-tools="1"
          title="添加节点"
        >
          +
        </button>
        {open && (
          <div className="dm-tools-menu" data-floating-tools="1">
            {NODE_KINDS.map((k) => (
              <button
                key={k.kind}
                className="dm-tools-item"
                onClick={(e) => {
                  onAdd(k.kind, e);
                  setOpen(false);
                }}
                data-floating-tools="1"
              >
                <div className="dm-tools-item-dot" />
                <div className="dm-tools-item-info">
                  <div className="dm-tools-item-name">{k.title}</div>
                  <div className="dm-tools-item-desc">{k.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
