import CanvasEditor from "./CanvasEditor";

// 沉浸式整页画布 (CanvasEditor 内部已 position: fixed 全屏)
// 不再需要外层 fixed wrapper, 也不再有顶部 header / 分享按钮 (整合进 TopBar)

export default function CanvasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  return (
    <CanvasEditor
      projectId={params.id}
      template={searchParams?.template}
    />
  );
}
