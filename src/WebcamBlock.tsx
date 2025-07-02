import { useEffect, useRef } from "react";
import { WebcamBlockType } from "./types";
import { useAtom } from "jotai";
import { activeStreamsAtom, BlockMapAtom, CameraAtom } from "./atoms";

export function WebcamBlockUI() {
  const [camera] = useAtom(CameraAtom);

  return (
    <div
      className={`absolute opacity-50`}
      style={{
        inset: -Math.max(8, 8 / camera.z),
        // borderWidth: Math.max(2, 2 / camera.z),
      }}
    ></div>
  );
}

export function WebcamBlockRender({ block }: { block: WebcamBlockType }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrame = useRef<number | null>(null);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [activeStreams] = useAtom(activeStreamsAtom);

  const videoSize = block.src ? activeStreams[block.src]?.videoSize : null;

  useEffect(() => {
    if (videoSize) {
      const mediaSize = {
        width: videoSize.width,
        height: videoSize.height,
      };
      setBlockMap((prev) => ({
        ...prev,
        [block.id]: {
          ...prev[block.id],
          originalMediaSize: mediaSize,
        },
      }));
    }
  }, [videoSize]);

  useEffect(() => {
    if (block.src === null) {
      const activeStreamKeys = Object.keys(activeStreams);
      if (activeStreamKeys.length > 0) {
        setBlockMap((prev) => ({
          ...prev,
          [block.id]: {
            ...prev[block.id],
            src: activeStreamKeys[0],
          },
        }));
      }
    }
  }, [block.src, activeStreams]);

  useEffect(() => {
    if (videoSize && canvasRef.current) {
      const targetWidth = block.crop ? block.crop.width : videoSize.width;
      const targetHeight = block.crop ? block.crop.height : videoSize.height;
      canvasRef.current.width = targetWidth;
      canvasRef.current.height = targetHeight;
      // set block size to match aspect ratio
      // const targetAspectRatio = targetWidth / targetHeight;
      // const blockAspectRatio = block.width / block.height;
      // if (blockAspectRatio > targetAspectRatio) {
      //   setBlockMap((prev) => ({
      //     ...prev,
      //     [block.id]: {
      //       ...prev[block.id],
      //       width: block.height * targetAspectRatio,
      //     },
      //   }));
      // } else {
      //   setBlockMap((prev) => ({
      //     ...prev,
      //     [block.id]: {
      //       ...prev[block.id],
      //       height: block.width / targetAspectRatio,
      //     },
      //   }));
      // }
    }
  }, [videoSize, block.crop, block.width, block.height, setBlockMap]);

  useEffect(() => {
    const activeStream = block.src ? activeStreams[block.src] : null;
    if (activeStream && canvasRef.current) {
      const video = activeStream.refs.video;
      const ctx = canvasRef.current.getContext("2d")!;
      function draw() {
        if (block.flippedHorizontally || block.flippedVertically) {
          ctx.save();
        }
        if (block.flippedHorizontally) {
          ctx.scale(-1, 1);
          ctx.translate(-activeStream!.videoSize!.width, 0);
        }
        if (block.flippedVertically) {
          ctx.scale(1, -1);
          ctx.translate(0, -activeStream!.videoSize!.height);
        }
        if (block.crop) {
          ctx.drawImage(
            video,
            block.flippedHorizontally
              ? activeStream!.videoSize!.width - block.crop.x - block.crop.width
              : block.crop.x,
            block.flippedVertically
              ? activeStream!.videoSize!.height -
              block.crop.y -
              block.crop.height
              : block.crop.y,
            block.crop.width,
            block.crop.height,
            0 +
            (block.flippedHorizontally
              ? activeStream!.videoSize!.width - block.crop.width
              : 0),
            0 +
            (block.flippedVertically
              ? activeStream!.videoSize!.height - block.crop.height
              : 0),
            block.crop.width,
            block.crop.height,
          );
        } else {
          ctx.drawImage(video!, 0, 0);
        }
        if (block.flippedHorizontally || block.flippedVertically) {
          ctx.restore();
        }
        animationFrame.current = window.requestAnimationFrame(draw);
      }
      animationFrame.current = window.requestAnimationFrame(draw);
    }
    return () => {
      if (animationFrame.current) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [
    canvasRef,
    videoSize,
    block.crop,
    block.flippedHorizontally,
    block.flippedVertically,
  ]);

  return (
    <div className="absolute pointer-events-none inset-0" draggable={false}>
      <canvas
        id={"canvas-" + block.id}
        ref={canvasRef}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
