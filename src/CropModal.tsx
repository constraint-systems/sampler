import { useAtom } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  activeStreamsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
  showCropModalAtom,
  StateRefAtom,
} from "./atoms";
import { BoxType, DragEventType, PointType } from "./types";
import { useUpdateBlocks } from "./hooks";
import { ToolValue } from "./tools/ToolValue";
import { TwoUp } from "./tools/TwoUp";
import { ToolSlot } from "./tools/ToolSlot";
import { ToolButton } from "./tools/ToolButton";
import { ArrowUp01 } from "lucide-react";

export function CropModal() {
  const minCropSize = 8;
  const [blockMap] = useAtom(BlockMapAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const updateBlocks = useUpdateBlocks();
  const [, setCamera] = useAtom(CameraAtom);
  const block = blockMap[selectedBlockIds[0]];
  const [, showCropModal] = useAtom(showCropModalAtom);

  if (!block) return null;

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
  const [tempCrop, setTempCrop] = useState<BoxType | null>(block.crop || null);

  console.log(tempCrop);

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
          ctx.drawImage(video!, 0, 0);
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
    mode: "draw" | "move" | "resize";
    startingCrop?: BoxType;
    handle?: string;
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

  function handleResizeCrop(dragEvent: DragEventType, handle: string) {
    const event = dragEvent.event;
    const scale = block.originalMediaSize!.width / imagePlace!.width;
    const x = (event.clientX - imagePlace!.x - imagePlace!.parentX) * scale;
    const y = (event.clientY - imagePlace!.y - imagePlace!.parentY) * scale;

    if (dragEvent.type === "first") {
      if (dragEvent.event.button !== 0) return;
      dragEvent.event.preventDefault();
      dragEvent.event.stopPropagation();
      dragRef.current = {
        start: { x, y },
        current: { x, y },
        mode: "resize",
        startingCrop: { ...tempCrop! },
        handle,
      };
    }
    if (dragRef.current?.mode !== "resize") return;
    dragRef.current.current = { x, y };

    const startCrop = dragRef.current.startingCrop!;

    let newCrop: BoxType = { ...startCrop };

    switch (handle) {
      case "nw":
        {
          const offsetX = dragRef.current.start.x - startCrop.x;
          const offsetY = dragRef.current.start.y - startCrop.y;
          const adjustedX = x - offsetX;
          const adjustedY = y - offsetY;
          const pinnedX = startCrop.x + startCrop.width;
          const pinnedY = startCrop.y + startCrop.height;
          const newX = Math.max(Math.min(adjustedX, pinnedX - minCropSize), 0);
          const newY = Math.max(Math.min(adjustedY, pinnedY - minCropSize), 0);
          newCrop = {
            x: newX,
            y: newY,
            width: pinnedX - newX,
            height: pinnedY - newY,
          };
        }
        break;
      case "n":
        {
          const offsetY = dragRef.current.start.y - startCrop.y;
          const adjustedY = y - offsetY;
          const pinnedY = startCrop.y + startCrop.height;
          const newY = Math.max(Math.min(adjustedY, pinnedY - minCropSize), 0);
          newCrop = {
            x: startCrop.x,
            y: newY,
            width: startCrop.width,
            height: pinnedY - newY,
          };
        }
        break;
      case "ne":
        {
          const offsetX =
            dragRef.current.start.x - (startCrop.x + startCrop.width);
          const offsetY = dragRef.current.start.y - startCrop.y;
          const adjustedX = x - offsetX;
          const adjustedY = y - offsetY;
          const pinnedX = startCrop.x;
          const pinnedY = startCrop.y + startCrop.height;
          const newX = Math.min(
            Math.max(adjustedX, pinnedX + minCropSize),
            block.originalMediaSize!.width,
          );
          const newY = Math.max(Math.min(adjustedY, pinnedY - minCropSize), 0);
          newCrop = {
            x: pinnedX,
            y: newY,
            width: newX - pinnedX,
            height: pinnedY - newY,
          };
        }
        break;
      case "e":
        {
          const offsetX =
            dragRef.current.start.x - (startCrop.x + startCrop.width);
          const adjustedX = x - offsetX;
          const pinnedX = startCrop.x;
          const newX = Math.min(
            Math.max(adjustedX, pinnedX + minCropSize),
            block.originalMediaSize!.width,
          );
          newCrop = {
            x: pinnedX,
            y: startCrop.y,
            width: newX - pinnedX,
            height: startCrop.height,
          };
        }
        break;
      case "se":
        {
          const offsetX =
            dragRef.current.start.x - (startCrop.x + startCrop.width);
          const offsetY =
            dragRef.current.start.y - (startCrop.y + startCrop.height);
          const adjustedX = x - offsetX;
          const adjustedY = y - offsetY;
          const pinnedX = startCrop.x;
          const pinnedY = startCrop.y;
          const newX = Math.min(
            Math.max(adjustedX, pinnedX + minCropSize),
            block.originalMediaSize!.width,
          );
          const newY = Math.min(
            Math.max(adjustedY, pinnedY + minCropSize),
            block.originalMediaSize!.height,
          );
          newCrop = {
            x: pinnedX,
            y: pinnedY,
            width: newX - pinnedX,
            height: newY - pinnedY,
          };
        }
        break;
      case "s":
        {
          const offsetY =
            dragRef.current.start.y - (startCrop.y + startCrop.height);
          const adjustedY = y - offsetY;
          const pinnedY = startCrop.y;
          const newY = Math.min(
            Math.max(adjustedY, pinnedY + minCropSize),
            block.originalMediaSize!.height,
          );
          newCrop = {
            x: startCrop.x,
            y: pinnedY,
            width: startCrop.width,
            height: newY - pinnedY,
          };
        }
        break;
      case "sw":
        {
          const offsetX = dragRef.current.start.x - startCrop.x;
          const offsetY =
            dragRef.current.start.y - (startCrop.y + startCrop.height);
          const adjustedX = x - offsetX;
          const adjustedY = y - offsetY;
          const pinnedX = startCrop.x + startCrop.width;
          const pinnedY = startCrop.y;
          const newX = Math.max(Math.min(adjustedX, pinnedX - minCropSize), 0);
          const newY = Math.min(
            Math.max(adjustedY, pinnedY + minCropSize),
            block.originalMediaSize!.height,
          );
          newCrop = {
            x: newX,
            y: pinnedY,
            width: pinnedX - newX,
            height: newY - pinnedY,
          };
        }
        break;
      case "w":
        {
          const offsetX = dragRef.current.start.x - startCrop.x;
          const adjustedX = x - offsetX;
          const pinnedX = startCrop.x + startCrop.width;
          const newX = Math.max(Math.min(adjustedX, pinnedX - minCropSize), 0);
          newCrop = {
            x: newX,
            y: startCrop.y,
            width: pinnedX - newX,
            height: startCrop.height,
          };
        }
        break;
    }

    setTempCrop(newCrop);

    if (dragEvent.type === "last") {
      (event.target as HTMLDivElement).releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  }

  function handleApplyCrop() {
    if (tempCrop) {
      let newX, newY, newWidth, newHeight;
      if (block.crop) {
        const scaleX = block.width / block.crop.width;
        const scaleY = block.height / block.crop.height;
        const xDiff = tempCrop.x - block.crop.x;
        const yDiff = tempCrop.y - block.crop.y;
        newX = block.x + xDiff / scaleX;
        newY = block.y + yDiff / scaleY;
        newWidth = tempCrop.width / scaleX;
        newHeight = tempCrop.height / scaleY;
      } else {
        // new one
        const scaleX = block.width / block.originalMediaSize!.width;
        const scaleY = block.height / block.originalMediaSize!.height;
        newX = block.x + tempCrop.x / scaleX;
        newY = block.y + tempCrop.y / scaleY;
        newWidth = tempCrop.width / scaleX;
        newHeight = tempCrop.height / scaleY;
      }
      updateBlocks([
        {
          id: block.id,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          crop: {
            x: Math.round(tempCrop.x),
            y: Math.round(tempCrop.y),
            width: Math.round(tempCrop.width),
            height: Math.round(tempCrop.height),
          },
        },
      ]);
      setCamera({
        x: -(newX + newWidth / 2),
        y: -(newY + newHeight / 2),
        z: stateRef.camera.z,
      });
      showCropModal(false);
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
        {tempCrop && imagePlace ? (
          <div
            className="absolute cursor-move outline outline-2 outline-blue-500"
            style={{
              left:
                (tempCrop.x / block.originalMediaSize!.width) *
                imagePlace.width +
                imagePlace.x,
              top:
                (tempCrop.y / block.originalMediaSize!.height) *
                imagePlace.height +
                imagePlace.y,
              width:
                (tempCrop.width / block.originalMediaSize!.width) *
                imagePlace.width,
              height:
                (tempCrop.height / block.originalMediaSize!.height) *
                imagePlace.height,
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
          >
            {/* Northwest corner */}
            <div
              className="absolute cursor-nw-resize w-2 h-2 -left-1 -top-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "nw",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "nw",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "nw",
                );
              }}
            />
            {/* North side */}
            <div
              className="absolute cursor-n-resize h-2 -top-1 left-1 right-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "n",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "n",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "n",
                );
              }}
            />
            {/* Northeast corner */}
            <div
              className="absolute cursor-ne-resize w-2 h-2 -right-1 -top-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "ne",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "ne",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "ne",
                );
              }}
            />
            {/* East side */}
            <div
              className="absolute cursor-e-resize w-2 -right-1 top-1 bottom-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "e",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "e",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "e",
                );
              }}
            />
            {/* Southeast corner */}
            <div
              className="absolute cursor-se-resize w-2 h-2 -right-1 -bottom-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "se",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "se",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "se",
                );
              }}
            />
            {/* South side */}
            <div
              className="absolute cursor-s-resize h-2 -bottom-1 left-1 right-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "s",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "s",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "s",
                );
              }}
            />
            {/* Southwest corner */}
            <div
              className="absolute cursor-sw-resize w-2 h-2 -left-1 -bottom-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "sw",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "sw",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "sw",
                );
              }}
            />
            {/* West side */}
            <div
              className="absolute cursor-w-resize w-2 -left-1 top-1 bottom-1"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "first",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "w",
                );
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                event.stopPropagation();
                (event.target as HTMLDivElement).setPointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "move",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "w",
                );
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                (event.target as HTMLDivElement).releasePointerCapture(
                  event.pointerId,
                );
                handleResizeCrop(
                  {
                    id: event.pointerId,
                    type: "last",
                    event: event,
                    targetEl: event.target as HTMLDivElement,
                  },
                  "w",
                );
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="flex py-2 justify-between">
        <div className="gap-[0.5ch] w-1/2 max-w-[60ch] flex flex-col px-[1.0ch] text-blue-500">
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
              <ToolSlot
                textColor={
                  block.type === "image" ? "text-yellow-500" : "text-green-500"
                }
              >
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
        <div className="gap-[1.5ch] px-[1ch] w-1/2 max-w-[60ch] flex text-blue-500">
          <div className="w-1/2 flex">
            <ToolSlot textColor="text-blue-500">
              <ToolButton onClick={handleApplyCrop}>Save</ToolButton>
            </ToolSlot>
          </div>
          <div className="w-1/4 flex">
            <ToolSlot textColor="text-red-500">
              <ToolButton
                onClick={() => {
                  setTempCrop(null);
                }}
              >
                Clear
              </ToolButton>
            </ToolSlot>
          </div>
          <div className="w-1/4 flex">
            <ToolSlot textColor="text-white">
              <ToolButton
                onClick={() => {
                  showCropModal(false);
                }}
              >
                Cancel
              </ToolButton>
            </ToolSlot>
          </div>
        </div>
      </div>
    </div>
  );
}
