// =====================================================================
// CanvasFlowTldraw.tsx — 大脉画布 v3 (tldraw 底座) 阶段 1 验证
// 07-08: 选 X 之后开做
// - 目的: 验证 tldraw 能撑住 Hermes 节点编辑器
// - 范围: 1 个 demo, Tldraw 画布 + 1 个自定义 HermesNode shape + arrow 演示
// - 不接 production API, 不存 localStorage
// - 5 天踩坑教训: 严守 CLAUDE.md, 画布核心不乱改, 自研只在外围
// =====================================================================

'use client';

import { useCallback, useState } from 'react';
import {
  Tldraw,
  BaseBoxShapeUtil,
  type TLEditor,
  type TLUiOverrides,
  type TLBaseShape,
  type TLShapeUtilCtor,
  type RecordPropsType,
  T,
  HTMLContainer,
  RecordId,
  createShapeId,
  defaultShapeUtils,
} from 'tldraw';
import 'tldraw/tldraw.css';

// =====================================================================
// 自定义 HermesNode shape (tldraw BaseBoxShapeUtil)
// 仿 React Flow NodeScaffold: header + main 区域
// 跟 prototype 视觉一致: 蓝紫边框 + 节点 header
// =====================================================================

type HermesNodeProps = {
  text: string;
  w: number;
  h: number;
};

type HermesNodeShape = TLBaseShape<'hermes-node', HermesNodeProps>;

class HermesNodeUtil extends BaseBoxShapeUtil<HermesNodeShape> {
  static override type = 'hermes-node' as const;

  static override props: RecordPropsType<HermesNodeShape> = {
    text: T.string,
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): HermesNodeShape['props'] {
    return { text: '新节点', w: 240, h: 120 };
  }

  // 渲染节点 UI
  component(shape: HermesNodeShape) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#1a1a1a',
            border: '1px solid rgba(110, 140, 214, 0.5)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              background: 'rgba(110, 140, 214, 0.15)',
              color: '#6e8cd6',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(110, 140, 214, 0.5)',
            }}
          >
            ▣ Hermes 节点
          </div>
          <div
            style={{
              padding: 10,
              fontSize: 12,
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.85)',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {shape.props.text}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  // 选区指示器 (虚线框)
  indicator(shape: HermesNodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

// 注册自定义 shape (跟 defaultShapeUtils 一起)
const shapeUtils: TLShapeUtilCtor[] = [
  ...defaultShapeUtils,
  HermesNodeUtil,
];

// =====================================================================
// 主应用
// =====================================================================

export default function CanvasFlowTldraw() {
  const [log, setLog] = useState<string[]>([]);
  const [editor, setEditor] = useState<TLEditor | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((l) =>
      [...l.slice(-4), `${new Date().toLocaleTimeString()} ${msg}`].slice(-5),
    );
  }, []);

  // tldraw onMount 回调拿 editor 实例
  const handleMount = useCallback(
    (ed: TLEditor) => {
      setEditor(ed);
      addLog('[tldraw] editor mounted, state 自管 (不依赖 React setState)');
    },
    [addLog],
  );

  // 加 2 个 Hermes 节点 + 1 个 arrow
  const addDemoNodes = useCallback(() => {
    if (!editor) return;
    const id1 = createShapeId();
    const id2 = createShapeId();
    editor.createShapes([
      { id: id1, type: 'hermes-node', x: 200, y: 200, props: { text: '节点 A (text)', w: 240, h: 120 } },
      { id: id2, type: 'hermes-node', x: 600, y: 200, props: { text: '节点 B (image)', w: 240, h: 120 } },
    ]);
    // 内置 arrow 连 2 个节点 (start/end 指向 shape id)
    editor.createShape({
      type: 'arrow',
      x: 0,
      y: 0,
      props: {
        start: { type: 'binding', boundShapeId: id1, normalizedAnchor: { x: 1, y: 0.5 }, isExact: false } as any,
        end: { type: 'binding', boundShapeId: id2, normalizedAnchor: { x: 0, y: 0.5 }, isExact: false } as any,
      } as any,
    });
    addLog('[tldraw] 加 2 节点 + 1 arrow, 验证 state 自管 + 无限画布');
  }, [editor, addLog]);

  // 清空
  const clearAll = useCallback(() => {
    if (!editor) return;
    editor.deleteAllShapes();
    addLog('[tldraw] deleteAllShapes');
  }, [editor, addLog]);

  // tldraw UI 覆盖: 隐藏默认 toolbar, 用我们自己的按钮
  const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
      return tools; // 保留所有 default tools (select, hand, draw, arrow, ...)
    },
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      {/* 顶部状态条 (跟 React Flow prototype 一样) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          zIndex: 10,
        }}
      >
        <div style={{ color: '#6e8cd6', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>大脉</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
          <span style={{ color: '#4ade80' }}>● </span>
          tldraw 5.2.3 sandbox · {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={addDemoNodes}
            disabled={!editor}
            style={{
              background: 'rgba(110, 140, 214, 0.12)',
              border: '1px solid rgba(110, 140, 214, 0.25)',
              color: '#c4b5fd',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 11,
              cursor: editor ? 'pointer' : 'not-allowed',
              opacity: editor ? 1 : 0.5,
            }}
          >
            加 2 节点 + arrow
          </button>
          <button
            onClick={clearAll}
            disabled={!editor}
            style={{
              background: 'rgba(110, 140, 214, 0.12)',
              border: '1px solid rgba(110, 140, 214, 0.25)',
              color: '#c4b5fd',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 11,
              cursor: editor ? 'pointer' : 'not-allowed',
              opacity: editor ? 1 : 0.5,
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* 信息面板 (右上) */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 68,
          width: 320,
          maxHeight: 'calc(100vh - 100px)',
          overflow: 'auto',
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: 12,
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.6,
          zIndex: 9,
        }}
      >
        <h4 style={{ margin: '0 0 6px 0', color: '#6e8cd6', fontSize: 12 }}>
          阶段 1 验证 · tldraw 底座
        </h4>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <b style={{ color: '#fff' }}>状态</b>: {editor ? 'editor ready ✓' : '加载中…'}
          </li>
          <li>
            <b style={{ color: '#fff' }}>画布</b>: 无限画布 + tldraw 自管 state (不依赖 React setState)
          </li>
          <li>
            <b style={{ color: '#fff' }}>节点</b>: 自定义 HermesNode (BaseBoxShapeUtil)
          </li>
          <li>
            <b style={{ color: '#fff' }}>边</b>: tldraw 内置 arrow (双向 binding)
          </li>
          <li>
            <b style={{ color: '#fff' }}>选择</b>: tldraw 内置 select tool, 框选 / 移动 / 缩放
          </li>
        </ul>
        <h4 style={{ margin: '10px 0 6px 0', color: '#6e8cd6', fontSize: 12 }}>操作</h4>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>点 "加 2 节点 + arrow" 验证 state 自管</li>
          <li>滚轮缩放, 中键拖 pan, 双指 (触屏) 平移</li>
          <li>选中节点拖动, 选中 arrow 拖端点</li>
          <li>选中状态下 Delete 删</li>
          <li>tldraw toolbar 底部: select / hand / draw / arrow / text / ...</li>
        </ul>
        <h4 style={{ margin: '10px 0 6px 0', color: '#6e8cd6', fontSize: 12 }}>日志 (最近 5 条)</h4>
        {log.map((l, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}>
            {l}
          </div>
        ))}
      </div>

      {/* tldraw 画布 (填满整个窗口, 但顶部 56px 留出给 status bar) */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}>
        <Tldraw
          shapeUtils={shapeUtils}
          onMount={handleMount}
          hideUi={false}
        />
      </div>
    </div>
  );
}
