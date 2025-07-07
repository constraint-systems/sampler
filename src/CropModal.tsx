import { useAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  activeStreamsAtom,
  BlockMapAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "./atoms";
import { BoxType, DragEventType, PointType } from "./types";
import { useUpdateBlocks } from "./hooks";
import { ToolValue } from "./tools/ToolValue";
import { TwoUp } from "./tools/TwoUp";
import { ToolSlot } from "./tools/ToolSlot";

export function CropModal() {
  const [blockMap] = useAtom(BlockMapAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const updateBlocks = useUpdateBlocks();
  const block = blockMap[selectedBlockIds[0]];

  const imageSectionRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const [imagePlace, setImagePlace] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
    parentX: number;
    parentY: number;
  } | null>(null);
  const [activeStreams] = useAtom(activeStreamsAtom);
  const [tempCrop, setTempCrop] = useState<BoxType | null>(null);

  const videoSize = block.src ? activeStreams[block.src]?.videoSize : null;

  useLayoutEffect(() => {
    function handleResize() {
      if (imageSectionRef.current) {
        const container = imageSectionRef.current.getBoundingClientRect();
        const containerAspectRatio = container.width / container.height;
        const imageAspectRatio =
          block!.originalMediaSize!.width / block!.originalMediaSize!.height;
        if (imageAspectRatio > containerAspectRatio) {
          // Image is wider than container
          const width = container.width;
          const height = width / imageAspectRatio;
          setImagePlace({
            width,
            height,
            x: 0,
            y: (container.height - height) / 2,
            parentX: container.left,
            parentY: container.top,
          });
        } else {
          // Image is taller than container
          const height = container.height;
          const width = height * imageAspectRatio;
          setImagePlace({
            width,
            height,
            x: (container.width - width) / 2,
            y: 0,
            parentX: container.left,
            parentY: container.top,
          });
        }
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // useEffect(() => {
  //   if (block.srcType === "canvas" && block.canvas) {
  //     block.canvas.width = block.originalMediaSize!.width;
  //     block.canvas.height = block.originalMediaSize!.height;
  //     const ctx = block.canvas.getContext("2d");
  //     if (ctx) {
  //       ctx.drawImage(block.canvas, 0, 0);
  //     }
  //   }
  // }, [block.srcType, block.canvas]);

  useEffect(() => {
    const activeStream = block.src ? activeStreams[block.src] : null;
    if (activeStream && canvasRef.current && block.originalMediaSize) {
      const video = activeStream.refs.video;
      if (video) {
        canvasRef.current.width = block.originalMediaSize.width;
        canvasRef.current.height = block.originalMediaSize.height;
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
                ? activeStream!.videoSize!.width -
                    block.crop.x -
                    block.crop.width
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
    }
    return () => {
      if (animationFrame.current) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [
    canvasRef,
    videoSize,
    block.src,
    block.crop,
    activeStreams,
    block.flippedHorizontally,
    block.flippedVertically,
  ]);

  const dragRef = useRef<{
    start: PointType;
    current: PointType;
    mode: "draw" | "move";
    startingCrop?: BoxType;
  } | null>(null);
  function handleDrawCrop(dragEvent: DragEventType) {
    const event = dragEvent.event;
    const scale = block.originalMediaSize!.width / imagePlace!.width;
    const x = (event.clientX - imagePlace!.x - imagePlace!.parentX) * scale;
    const y = (event.clientY - imagePlace!.y - imagePlace!.parentY) * scale;
    if (dragEvent.type === "first") {
      if (event.button !== 0) return;
      (event.target as HTMLDivElement).setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = {
        start: { x, y },
        current: { x, y },
        mode: "draw",
      };
    }
    if (dragRef.current?.mode !== "draw") return;
    dragRef.current.current = { x, y };

    if (
      dragRef.current.start.x !== dragRef.current.current.x ||
      dragRef.current.start.y !== dragRef.current.current.y
    ) {
      const containedStart = {
        x: Math.min(
          Math.max(dragRef.current.start.x, 0),
          block.originalMediaSize!.width,
        ),
        y: Math.min(
          Math.max(dragRef.current.start.y, 0),
          block.originalMediaSize!.height,
        ),
      };
      const containedCurrent = {
        x: Math.min(
          Math.max(dragRef.current.current.x, 0),
          block.originalMediaSize!.width,
        ),
        y: Math.min(
          Math.max(dragRef.current.current.y, 0),
          block.originalMediaSize!.height,
        ),
      };
      const width = Math.abs(containedCurrent.x - containedStart.x);
      const height = Math.abs(containedCurrent.y - containedStart.y);
      const newCrop: BoxType = {
        x: Math.min(containedStart.x, containedCurrent.x),
        y: Math.min(containedStart.y, containedCurrent.y),
        width,
        height,
      };
      setTempCrop(newCrop);
    }
    if (dragEvent.type === "last") {
      (event.target as HTMLDivElement).releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }

  function handleDragMoveCrop(dragEvent: DragEventType) {
    const event = dragEvent.event;
    const scale = block.originalMediaSize!.width / imagePlace!.width;
    const x = (event.clientX - imagePlace!.x - imagePlace!.parentX) * scale;
    const y = (event.clientY - imagePlace!.y - imagePlace!.parentY) * scale;
    if (dragEvent.type === "first") {
      if (dragEvent.event.button !== 0) return;
      dragEvent.event.preventDefault();
      dragEvent.event.stopPropagation();
      dragRef.current = {
        start: {
          x,
          y,
        },
        current: {
          x,
          y,
        },
        mode: "move",
        startingCrop: { ...tempCrop! },
      };
    }
    if (dragRef.current?.mode !== "move") return;
    dragRef.current.current = { x, y };
    const dx = dragRef.current.current.x - dragRef.current.start.x;
    const dy = dragRef.current.current.y - dragRef.current.start.y;
    const newCrop: BoxType = {
      x: Math.min(
        Math.max(dragRef.current.startingCrop!.x + dx, 0),
        block.originalMediaSize!.width - tempCrop!.width,
      ),
      y: Math.min(
        Math.max(dragRef.current.startingCrop!.y + dy, 0),
        block.originalMediaSize!.height - tempCrop!.height,
      ),
      width: tempCrop!.width,
      height: tempCrop!.height,
    };
    setTempCrop(newCrop);
    if (dragEvent.type === "last") {
      (event.target as HTMLDivElement).releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }

  return (
    <div className="fixed pointer-events-auto flex flex-col w-full inset-0 bg-black justify-center z-[100]">
      <div className="px-2 py-2 text-blue-500">
        <div className="">CROP</div>
      </div>

      <div
        className="grow relative cursor-crosshair touch-none select-none"
        ref={imageSectionRef}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          (event.target as HTMLDivElement).setPointerCapture(event.pointerId);
          handleDrawCrop({
            id: event.pointerId,
            type: "first",
            event: event,
            targetEl: event.target as HTMLDivElement,
          });
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return; // Only handle drag when left button is pressed
          (event.target as HTMLDivElement).setPointerCapture(event.pointerId);
          handleDrawCrop({
            id: event.pointerId,
            type: "move",
            event: event,
            targetEl: event.target as HTMLDivElement,
          });
        }}
        onPointerUp={(event) => {
          (event.target as HTMLDivElement).releasePointerCapture(
            event.pointerId,
          );
          handleDrawCrop({
            id: event.pointerId,
            type: "last",
            event: event,
            targetEl: event.target as HTMLDivElement,
          });
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute bg-red-500"
          style={{
            left: imagePlace?.x,
            top: imagePlace?.y,
            width: imagePlace?.width,
            height: imagePlace?.height,
          }}
        />
        {tempCrop ? (
          <div
            className="absolute cursor-move outline outline-2 outline-blue-500"
            style={{
              left:
                (tempCrop.x / block.originalMediaSize!.width) *
                  imagePlace!.width +
                imagePlace!.x,
              top:
                (tempCrop.y / block.originalMediaSize!.height) *
                  imagePlace!.height +
                imagePlace!.y,
              width:
                (tempCrop.width / block.originalMediaSize!.width) *
                imagePlace!.width,
              height:
                (tempCrop.height / block.originalMediaSize!.height) *
                imagePlace!.height,
            }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              (event.target as HTMLDivElement).setPointerCapture(
                event.pointerId,
              );
              handleDragMoveCrop({
                id: event.pointerId,
                type: "first",
                event: event,
                targetEl: event.target as HTMLDivElement,
              });
            }}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return; // Only handle drag when left button is pressed
              (event.target as HTMLDivElement).setPointerCapture(
                event.pointerId,
              );
              handleDragMoveCrop({
                id: event.pointerId,
                type: "move",
                event: event,
                targetEl: event.target as HTMLDivElement,
              });
            }}
            onPointerUp={(event) => {
              (event.target as HTMLDivElement).releasePointerCapture(
                event.pointerId,
              );
              handleDragMoveCrop({
                id: event.pointerId,
                type: "last",
                event: event,
                targetEl: event.target as HTMLDivElement,
              });
            }}
          ></div>
        ) : null}
      </div>
      <div className="gap-[0.25ch] flex flex-col px-[0.5ch] text-blue-500">
        {tempCrop ? (
          <>
            <TwoUp>
              <ToolValue
                label="X"
                value={Math.round(tempCrop.x)}
                isInteractive
                updater={(value) => {
                  const containeX = Math.min(
                    Math.max(value, 0),
                    block.originalMediaSize!.width - tempCrop.width,
                  );
                  setTempCrop((prev) => ({
                    ...prev!,
                    x: containeX,
                  }));
                }}
              />
              <ToolValue
                label="Y"
                value={Math.round(tempCrop.y)}
                isInteractive
                updater={(value) => {
                  const containeY = Math.min(
                    Math.max(value, 0),
                    block.originalMediaSize!.height - tempCrop.height,
                  );
                  setTempCrop((prev) => ({
                    ...prev!,
                    y: containeY,
                  }));
                }}
              />
            </TwoUp>
            <TwoUp>
              <ToolValue
                label="Width"
                value={Math.round(tempCrop.width)}
                isInteractive
                updater={(value) => {
                  const containedWidth = Math.min(
                    Math.max(value, 0),
                    block.originalMediaSize!.width - tempCrop.x,
                  );
                  setTempCrop((prev) => ({
                    ...prev!,
                    width: containedWidth,
                  }));
                }}
              />
              <ToolValue
                label="Height"
                value={Math.round(tempCrop.height)}
                isInteractive
                updater={(value) => {
                  const containedHeight = Math.min(
                    Math.max(value, 0),
                    block.originalMediaSize!.height - tempCrop.y,
                  );
                  setTempCrop((prev) => ({
                    ...prev!,
                    height: containedHeight,
                  }));
                }}
              />
            </TwoUp>
          </>
        ) : (
          <>
            <ToolSlot textColor="text-white">
              Click and drag to draw crop
            </ToolSlot>
            <ToolSlot textColor="text-white">
              <TwoUp>
                <ToolValue
                  label="W"
                  value={Math.round(block.originalMediaSize?.width || 0)}
                />
                <ToolValue
                  label="H"
                  value={Math.round(block.originalMediaSize?.height || 0)}
                />
              </TwoUp>
            </ToolSlot>
          </>
        )}
      </div>
    </div>
  );
}
