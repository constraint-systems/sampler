import { useEffect, useRef, useState } from "react";
import { ImageBlockType } from "./types";
import { useAtom } from "jotai";
import { BlockMapAtom } from "./atoms";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    bufferCanvasRef.current =
      bufferCanvasRef.current || document.createElement("canvas");
    if (block.canvas && canvasRef.current) {
      bufferCanvasRef.current!.width = block.canvas.width;
      bufferCanvasRef.current!.height = block.canvas.height;
      const bctx = bufferCanvasRef.current!.getContext("2d")!;
      bctx.drawImage(block.canvas, 0, 0);

      const ctx = canvasRef.current!.getContext("2d")!;
      canvasRef.current.width = block.crop?.width || block.canvas.width;
      canvasRef.current.height = block.crop?.height || block.canvas.height;

      if (block.flippedHorizontally || block.flippedVertically) {
        ctx.save();
      }
      if (block.flippedHorizontally || block.flippedVertically) {
        ctx.save();
      }
      if (block.flippedHorizontally) {
        ctx.scale(-1, 1);
        ctx.translate(-bufferCanvasRef!.current!.width, 0);
      }
      if (block.flippedVertically) {
        ctx.scale(1, -1);
        ctx.translate(0, -bufferCanvasRef!.current!.height);
      }
      if (block.crop) {
        ctx.drawImage(
          bufferCanvasRef.current!,
          block.flippedHorizontally
            ? bufferCanvasRef.current!.width - block.crop.x - block.crop.width
            : block.crop.x,
          block.flippedVertically
            ? bufferCanvasRef.current!.height - block.crop.y - block.crop.height
            : block.crop.y,
          block.crop.width,
          block.crop.height,
          0 +
          (block.flippedHorizontally
            ? bufferCanvasRef.current!.width - block.crop.width
            : 0),
          0 +
          (block.flippedVertically
            ? bufferCanvasRef.current!.height - block.crop.height
            : 0),
          block.crop.width,
          block.crop.height,
        );
      } else {
        ctx.drawImage(bufferCanvasRef.current, 0, 0);
      }
      if (block.flippedHorizontally || block.flippedVertically) {
        ctx.restore();
      }
    }
  }, [
    block.canvas,
    block.crop,
    block.flippedHorizontally,
    block.flippedVertically,
  ]);

  return (
    <div className="absolute inset-0 touch-none select-none">
      <canvas
        id={"image-" + block.id}
        ref={canvasRef}
        className="absolute left-0 top-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
