'use client';

import dynamic from 'next/dynamic';

const CanvasFlowV4 = dynamic(
  () => import('./CanvasFlowV4').then((m) => m.CanvasFlowV4),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 14,
        }}
      >
        Loading canvas v4…
      </div>
    ),
  }
);

export default function CanvasV4Page({
  params,
}: {
  params: { id: string };
}) {
  return <CanvasFlowV4 projectId={params.id} />;
}