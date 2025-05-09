import { useAtom } from "jotai";
import { StateRefAtom } from "./atoms";
import { useRef } from "react";

export function ToolDownload() {
  const [stateRef] = useAtom(StateRefAtom);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div className="flex flex-col">
      <button
        className={`px-3 pointer-events-auto py-1 bg-neutral-800 hover:bg-neutral-700`}
        onClick={() => {
          bufferCanvasRef.current =
            bufferCanvasRef.current || document.createElement("canvas");
          finalCanvasRef.current =
            finalCanvasRef.current || document.createElement("canvas");

          const currentBlocks = stateRef.blockIds.map((id) => {
            const block = stateRef.blockMap[id];
            return {
              ...block,
            };
          });

          currentBlocks.sort((a, b) => {
            if (a.zIndex > b.zIndex) {
              return 1;
            } else if (a.zIndex < b.zIndex) {
              return -1;
            }
            return 0;
          });

          const rotatedBlocks = currentBlocks.map((block) => {
            const centerX = block.x + block.width / 2;
            const centerY = block.y + block.height / 2;
            const rotation = block.rotation || 0;
            const cosine = Math.cos(rotation);
            const sine = Math.sin(rotation);
            const rotatedTopLeftX =
              centerX - (block.width / 2) * cosine + (block.height / 2) * sine;
            const rotatedTopLeftY =
              centerY - (block.width / 2) * sine - (block.height / 2) * cosine;
            const rotatedTopRightX =
              centerX + (block.width / 2) * cosine + (block.height / 2) * sine;
            const rotatedTopRightY =
              centerY + (block.width / 2) * sine - (block.height / 2) * cosine;
            const rotatedBottomLeftX =
              centerX - (block.width / 2) * cosine - (block.height / 2) * sine;
            const rotatedBottomLeftY =
              centerY - (block.width / 2) * sine + (block.height / 2) * cosine;
            const rotatedBottomRightX =
              centerX + (block.width / 2) * cosine - (block.height / 2) * sine;
            const rotatedBottomRightY =
              centerY + (block.width / 2) * sine + (block.height / 2) * cosine;
            const minX = Math.min(
              rotatedTopLeftX,
              rotatedTopRightX,
              rotatedBottomLeftX,
              rotatedBottomRightX,
            );
            const minY = Math.min(
              rotatedTopLeftY,
              rotatedTopRightY,
              rotatedBottomLeftY,
              rotatedBottomRightY,
            );
            const maxX = Math.max(
              rotatedTopLeftX,
              rotatedTopRightX,
              rotatedBottomLeftX,
              rotatedBottomRightX,
            );
            const maxY = Math.max(
              rotatedTopLeftY,
              rotatedTopRightY,
              rotatedBottomLeftY,
              rotatedBottomRightY,
            );
            return {
              minX,
              minY,
              maxX,
              maxY,
            };
          });
          const minXs = rotatedBlocks.map((block) => block.minX);
          const minYs = rotatedBlocks.map((block) => block.minY);
          const maxXs = rotatedBlocks.map((block) => block.maxX);
          const maxYs = rotatedBlocks.map((block) => block.maxY);
          const minX = Math.min(...minXs);
          const minY = Math.min(...minYs);
          const maxX = Math.max(...maxXs);
          const maxY = Math.max(...maxYs);
          const proposedWidth = maxX - minX;
          const proposedHeight = maxY - minY;
          let width = proposedWidth;
          let height = proposedHeight;

          const maxSize = 4096;
          let scale = 1;
          const aspectRatio = proposedWidth / proposedHeight;
          if (proposedWidth > maxSize || proposedHeight > maxSize) {
            if (aspectRatio > 1) {
              scale = maxSize / proposedWidth;
            } else {
              scale = maxSize / proposedHeight;
            }
            width = Math.floor(proposedWidth * scale);
            height = Math.floor(proposedHeight * scale);
          }

          bufferCanvasRef.current.width = width;
          bufferCanvasRef.current.height = height;
          finalCanvasRef.current.width = width;
          finalCanvasRef.current.height = height;

          const ctx = bufferCanvasRef.current.getContext("2d")!;
          const ftx = finalCanvasRef.current.getContext("2d")!;

          for (const block of currentBlocks) {
            ctx.save();
            ctx.globalCompositeOperation =
              block.blend === "normal" ? "source-over" : block.blend;
            if (block.rotation) {
              const centerX = (block.x + block.width / 2 - minX) * scale;
              const centerY = (block.y + block.height / 2 - minY) * scale;
              ctx.translate(centerX, centerY);
              ctx.rotate(block.rotation || 0);
              ctx.translate(-centerX, -centerY);
            }
            if (block.type === "image" && !block.crop) {
              ctx.drawImage(
                document.getElementById(
                  "image-" + block.id,
                ) as HTMLImageElement,
                (block.x - minX) * scale,
                (block.y - minY) * scale,
                block.width * scale,
                block.height * scale,
              );
            } else {
              ctx.drawImage(
                document.getElementById(
                  "canvas-" + block.id,
                ) as HTMLCanvasElement,
                (block.x - minX) * scale,
                (block.y - minY) * scale,
                block.width * scale,
                block.height * scale,
              );
            }
            ctx.restore();
          }

          ftx.fillStyle = "black";
          ftx.fillRect(0, 0, width, height);
          ftx.drawImage(
            bufferCanvasRef.current,
            0,
            0,
            width,
            height,
            0,
            0,
            width,
            height,
          );

          const dataUrl = finalCanvasRef.current.toDataURL("image/jpg");
          const a = document.createElement("a");
          a.href = dataUrl;
          const timestamp = new Date().toISOString().replace(/:/g, "-");
          a.download = timestamp + "-sampler.jpg";
          a.click();
          a.remove();
        }}
      >
        download
      </button>
    </div>
  );
}
