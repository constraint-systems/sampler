import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
} from "./atoms";
import { ImageBlockType, WebcamBlockType } from "./types";
import { ImageBlock } from "./ImageBlock";
import { WebcamBlockRender, WebcamBlockUI } from "./WebcamBlock";
import { GeneralizedResizer } from "./GeneralizedResizer";

export function Blocks() {
  const [blockIds] = useAtom(BlockIdsAtom);
  return (
    <div className="absolute z-0 select-none">
      <div className="absolute z-0">
        {blockIds.map((id) => {
          return <BlockRender key={id} id={id} />;
        })}
      </div>
      <div className="absolute z-5">
        {blockIds.map((id) => {
          return <BlockUI key={id} id={id} />;
        })}
      </div>
    </div>
  );
}

export function BlockUI({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [camera] = useAtom(CameraAtom);
  const isSelected = selectedBlockIds.includes(id);

  const rotation = block.rotation || 0;
  return (
    <>
      <div
        className={`absolute touch-none select-none`}
        style={{
          left: 0,
          top: 0,
          transform: `translate(${block.x}px, ${block.y}px) rotate(${rotation}rad)`,
          width: block.width,
          height: block.height,
          zIndex: block.zIndex,
        }}
      >
        {isSelected && (
          <div
            className="absolute inset-0 border-blue-500"
            style={{
              borderWidth: Math.max(2, 2 / camera.z),
            }}
          />
        )}
        <GeneralizedResizer />
        <BlockUIFactory id={id} isSelected={isSelected} />
      </div>
    </>
  );
}

export function BlockRender({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const isSelected = selectedBlockIds.includes(id);

  const rotation = block.rotation || 0;
  return (
    <div
      className={`absolute touch-none pointer-events-auto`}
      style={{
        left: 0,
        top: 0,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
        transform: `translate(${block.x}px, ${block.y}px) rotate(${rotation}rad)`,
        mixBlendMode: block.blend || "normal",
      }}
    >
      <BlockRenderFactory id={id} isSelected={isSelected} />
    </div>
  );
}

export function BlockUIFactory({ id }: { id: string; isSelected: boolean }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  switch (block.type) {
    case "image":
      return null;
    case "webcam":
      return <WebcamBlockUI />;
    default:
      return null;
  }
}

export function BlockRenderFactory({
  id,
  isSelected,
}: {
  id: string;
  isSelected: boolean;
}) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  switch (block.type) {
    case "image":
      return <ImageBlock block={block as ImageBlockType} />;
    case "webcam":
      return (
        <WebcamBlockRender
          block={block as WebcamBlockType}
          isSelected={isSelected}
        />
      );
    default:
      return null;
  }
}

export function RenderLayer() {}
