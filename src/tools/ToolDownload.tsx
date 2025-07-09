import { useAtom } from "jotai";
import { StateRefAtom } from "../atoms";
import { useRef } from "react";
import { getBoxBoundsFromBlocks } from "../utils";
import { ToolButton } from "./ToolButton";

export function ToolDownload({ mode = "all" }: { mode: "selected" | "all" }) {
  const [stateRef] = useAtom(StateRefAtom);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <ToolButton
      onClick={() => {
        bufferCanvasRef.current =
          bufferCanvasRef.current || document.createElement("canvas");
        finalCanvasRef.current =
          finalCanvasRef.current || document.createElement("canvas");

        let targetBlockIds = [];
        if (mode === "selected") {
          targetBlockIds = stateRef.selectedBlockIds;
        } else {
          targetBlockIds = stateRef.blockIds;
        }

        const currentBlocks = targetBlockIds.map((id) => {
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

        let { x, y, width, height } = getBoxBoundsFromBlocks(currentBlocks);

        const maxSize = 4096;
        let scale = 1;
        const aspectRatio = width / height;
        if (width > maxSize || height > maxSize) {
          if (aspectRatio > 1) {
            scale = maxSize / width;
          } else {
            scale = maxSize / height;
          }
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
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
          if (block.type === "image") {
            ctx.drawImage(
              document.getElementById("image-" + block.id) as HTMLImageElement,
              (block.x - x) * scale,
              (block.y - y) * scale,
              block.width * scale,
              block.height * scale,
            );
          } else {
            ctx.drawImage(
              document.getElementById(
                "canvas-" + block.id,
              ) as HTMLCanvasElement,
              (block.x - x) * scale,
              (block.y - y) * scale,
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
        a.download = "sampler-" + timestamp + ".jpg";
        a.click();
        a.remove();
      }}
    >
      Download as JPEG
    </ToolButton>
  );
}
