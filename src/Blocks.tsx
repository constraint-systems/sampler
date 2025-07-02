import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
} from "./atoms";
import { WebcamBlockRender } from "./WebcamBlock";
import { ImageBlock } from "./ImageBlock";
import { SelectedBox } from "./SelectedBox";

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
        <SelectedBox />
      </div>
      <div className="absolute z-10">
        {blockIds.map((id) => {
          return <BlockUI key={id} id={id} />;
        })}
      </div>
    </div>
  );
}

export function BlockRender({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  if (!block) {
    return null;
  }

  return (
    <div
      className={`absolute touch-none select-none`}
      style={{
        left: 0,
        top: 0,
        transform: `translate(${block.x}px, ${block.y}px)`,
        width: block.width,
        height: block.height,
        zIndex: block.zIndex,
        mixBlendMode: 'darken'
      }}
    >
      <BlockRenderFactory id={id} />
    </div>
  );
}

function BlockRenderFactory({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];

  if (!block) {
    return null;
  }

  switch (block.type) {
    case "webcam":
      return <WebcamBlockRender block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    default:
      return null;
  }
}

export function BlockUI({ id }: { id: string }) {
  const [blockMap] = useAtom(BlockMapAtom);
  const block = blockMap[id];
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [camera] = useAtom(CameraAtom);

  const isSelected = selectedBlockIds.includes(id);

  return (
    <>
      <div
        className={`${isSelected ? `${block.type === "webcam" ? "border-red-500" : "border-yellow-500"} cursor-grab` : "cursor-pointer"} absolute active pointer-events-auto touch-none select-none`}
        data-target={`block-${id}`}
        style={{
          left: 0,
          top: 0,
          borderWidth: isSelected ? 2 / camera.z : 0,
          transform: `translate(${block.x}px, ${block.y}px)`,
          width: block.width,
          height: block.height,
          zIndex: block.zIndex,
        }}
      >
        {isSelected &&  block.crop ? (
          <div
            className="pointer-events-none absolute -inset-3 border-cyan-500 border-2"
            style={{
              borderWidth: 2 / camera.z,
            }}
          />
        ) : null}

      </div>
    </>
  );
}
