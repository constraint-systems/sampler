import { useEffect, useRef, useState } from "react";
import { ImageBlockType } from "./types";
import { useAtom } from "jotai";
import { BlockMapAtom } from "./atoms";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (
      naturalSize.width &&
      naturalSize.height &&
      block.crop &&
      canvasRef.current
    ) {
      const cropAspectRatio = block.crop.width / block.crop.height;
      const blockAspectRatio = block.width / block.height;
      if (blockAspectRatio > cropAspectRatio) {
        const blockWidth = block.height * cropAspectRatio;
        setBlockMap((prev) => ({
          ...prev,
          [block.id]: {
            ...block,
            width: blockWidth,
          },
        }));
      } else {
        const blockHeight = block.width / cropAspectRatio;
        setBlockMap((prev) => ({
          ...prev,
          [block.id]: {
            ...block,
            height: blockHeight,
          },
        }));
      }
      const ctx = canvasRef.current!.getContext("2d")!;
      canvasRef.current.width = block.crop.width;
      canvasRef.current.height = block.crop.height;
      if (block.flippedHorizontally || block.flippedVertically) {
        ctx.save();
      }
      if (block.flippedHorizontally) {
        ctx.scale(-1, 1);
        ctx.translate(-imageRef.current!.naturalWidth, 0);
      }
      if (block.flippedVertically) {
        ctx.scale(1, -1);
        ctx.translate(0, -imageRef.current!.naturalHeight);
      }
      ctx.drawImage(
        imageRef.current!,
        (block.flippedHorizontally ? (imageRef.current!.naturalWidth - block.crop.x - block.crop.width) : block.crop.x),
        (block.flippedVertically ? (imageRef.current!.naturalHeight - block.crop.y - block.crop.height) : block.crop.y),
        block.crop.width,
        block.crop.height,
        0 + (block.flippedHorizontally ? imageRef.current!.naturalWidth - block.crop.width : 0),
        0 + (block.flippedVertically ? imageRef.current!.naturalHeight - block.crop.height : 0),
        block.crop.width,
        block.crop.height,
      );
      if (block.flippedHorizontally || block.flippedVertically) {
        ctx.restore();
      }
    }
  }, [naturalSize, block.crop, block.flippedHorizontally, block.flippedVertically]);

  return (
    <>
      <img
        ref={imageRef}
        draggable={false}
        id={'image-' + block.id}
        src={block.src}
        onLoad={() => {
          if (imageRef.current) {
            setNaturalSize({
              width: imageRef.current.naturalWidth,
              height: imageRef.current.naturalHeight,
            });
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${block.flippedHorizontally ? -1 : 1}, ${block.flippedVertically ? -1 : 1})`,
        }}
      />
      {block.crop && (
        <canvas
          id={"canvas-" + block.id}
          ref={canvasRef}
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
        />
      )}
    </>
  );
}
