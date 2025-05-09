import { useAtom } from "jotai";
import { useRef, useState, useMemo, useEffect } from "react";
import {
  BlockMapAtom,
  showCropModalAtom,
  activeStreamsAtom,
  StateRefAtom,
} from "./atoms";
import { WebcamBlockType, CropBoxType } from "./types";
import { pointIntersectsBox } from "./utils";

export function CropModal() {
  const [blockId, setShowCropModal] = useAtom(showCropModalAtom);
  if (!blockId) return null;

  const [originalMediaSize, setOriginalMediaSize] = useState({
    width: 0,
    height: 0,
  });
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);

  const block = blockMap[blockId];
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const [cropState, setCropState] = useState<CropBoxType | null>(block.crop);
  const topSetRef = useRef<HTMLDivElement | null>(null);
  const bottomSetRef = useRef<HTMLDivElement | null>(null);
  const [styleState, setStyleState] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const dragRef = useRef<{
    isCreating: boolean;
    isMoving: boolean;
    start: { x: number; y: number };
    current: { x: number; y: number };
    ref: { x: number; y: number };
  }>({
    isCreating: false,
    isMoving: false,
    start: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    ref: { x: 0, y: 0 },
  });

  function rawCoordsToCropBox() {
    const minX = Math.max(
      0,
      Math.min(dragRef.current.start.x, dragRef.current.current.x),
    );
    const minY = Math.max(
      0,
      Math.min(dragRef.current.start.y, dragRef.current.current.y),
    );
    const maxX = Math.min(
      styleState.width,
      Math.max(dragRef.current.start.x, dragRef.current.current.x),
    );
    const maxY = Math.min(
      styleState.height,
      Math.max(dragRef.current.start.y, dragRef.current.current.y),
    );
    const x = minX;
    const y = minY;
    const width = maxX - minX;
    const height = maxY - minY;
    const cropBox = {
      x: Math.round((x / styleState.width) * originalMediaSize.width),
      y: Math.round((y / styleState.height) * originalMediaSize.height),
      width: Math.round((width / styleState.width) * originalMediaSize.width),
      height: Math.round(
        (height / styleState.height) * originalMediaSize.height,
      ),
    };
    return cropBox;
  }

  function moveCropBox() {
    const dx =
      ((dragRef.current.current.x - dragRef.current.start.x) /
        styleState.width) *
      originalMediaSize.width;
    const dy =
      ((dragRef.current.current.y - dragRef.current.start.y) /
        styleState.height) *
      originalMediaSize.height;
    let newX = Math.round(dragRef.current.ref.x + dx);
    let newY = Math.round(dragRef.current.ref.y + dy);
    const maxX = originalMediaSize.width - cropState!.width;
    const maxY = originalMediaSize.height - cropState!.height;
    const minX = 0;
    const minY = 0;
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    const cropBox = {
      x: newX,
      y: newY,
      width: cropState!.width,
      height: cropState!.height,
    };
    return cropBox;
  }

  function setCropBox(crop: CropBoxType) {
    setBlockMap((prev) => ({
      ...prev,
      [blockId!]: {
        ...prev[blockId!],
        crop: crop,
      },
    }));
  }

  function handleCrop() {
    setCropBox(cropState!);
    setShowCropModal(null);
  }

  useEffect(() => {
    function handleResize() {
      if (topSetRef.current && bottomSetRef.current) {
        const topSet = topSetRef.current.getBoundingClientRect();
        const bottomSet = bottomSetRef.current.getBoundingClientRect();
        const topSetHeight = topSet.height;
        const bottomSetHeight = bottomSet.height;

        const availableHeight =
          window.innerHeight - topSetHeight - bottomSetHeight;
        const availableWidth = window.innerWidth;
        let mediaWidth = availableWidth;
        let mediaHeight = availableHeight;
        const aspectRatio = originalMediaSize.width / originalMediaSize.height;
        if (availableWidth / availableHeight > aspectRatio) {
          mediaWidth = availableHeight * aspectRatio;
        } else {
          mediaHeight = availableWidth / aspectRatio;
        }
        mediaContainerRef.current!.style.height = `${mediaHeight}px`;
        const leftOffset =
          (availableWidth - mediaWidth) / 2 + topSet.left;
        setStyleState({
          left: leftOffset,
          top: 0,
          width: mediaWidth,
          height: mediaHeight,
        });
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [originalMediaSize]);

  const unchangedCrop = useMemo(() => {
    const cropStateCheck = JSON.stringify(cropState);
    const blockCheck = JSON.stringify(block.crop);
    return cropStateCheck === blockCheck;
  }, [cropState, block.crop]);

  return (
    <div className="absolute inset-0 pointer-events-auto flex">
      <div className="m-auto bg-neutral-800 w-full pointer-events-auto">
        <div className="w-full flex flex-col" ref={topSetRef}>
          <div className="flex justify-between">
            <div className="px-2 py-1">Crop</div>
            <button
              className="px-2 py-1 hover:bg-neutral-700"
              onClick={() => setShowCropModal(null)}
            >
              &times;
            </button>
          </div>
        </div>
        <div
          ref={mediaContainerRef}
          className="relative"
          onPointerDown={(e) => {
            if (e.button === 0) {
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = mediaContainerRef.current!.getBoundingClientRect();
              dragRef.current.start.x = e.clientX - (rect?.left || 0) - styleState.left,
              dragRef.current.start.y = e.clientY - (rect?.top || 0);
              dragRef.current.current.x = e.clientX - (rect?.left || 0) - styleState.left,
              dragRef.current.current.y = e.clientY - (rect?.top || 0);
              const isIntersecting =
                cropState &&
                pointIntersectsBox(
                  {
                    x: Math.round(
                      (dragRef.current.start.x / styleState.width) *
                      originalMediaSize.width,
                    ),
                    y: Math.round(
                      (dragRef.current.start.y / styleState.height) *
                      originalMediaSize.height,
                    ),
                  },
                  cropState,
                );
              if (isIntersecting) {
                dragRef.current.isMoving = true;
                dragRef.current.ref.x = cropState.x;
                dragRef.current.ref.y = cropState.y;
              } else {
                dragRef.current.isCreating = true;
                setCropState(rawCoordsToCropBox());
              }
            }
          }}
          onPointerMove={(e) => {
            if (dragRef.current.isCreating || dragRef.current.isMoving) {
              const rect = mediaContainerRef.current?.getBoundingClientRect();
              dragRef.current.current.x = e.clientX - (rect?.left || 0) - styleState.left;
              dragRef.current.current.y = e.clientY - (rect?.top || 0);
              if (dragRef.current.isCreating) {
                setCropState(rawCoordsToCropBox());
              } else if (dragRef.current.isMoving) {
                setCropState(moveCropBox());
              }
            }
          }}
          onPointerUp={(e) => {
            if (dragRef.current.isCreating || dragRef.current.isMoving) {
              e.currentTarget.releasePointerCapture(e.pointerId);
              dragRef.current.isCreating = false;
              dragRef.current.isMoving = false;
            }
          }}
        >
          {block.type === "webcam" ? (
            <CropWebcamDisplay
              block={block}
              originalMediaSize={originalMediaSize}
              setOriginalMediaSize={setOriginalMediaSize}
              styleState={styleState}
            />
          ) : (
            <img
              style={{
                marginLeft: styleState.left,
                width: styleState.width,
                height: styleState.height,
              }}
              src={block.src}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setOriginalMediaSize({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              }}
              className="w-full h-auto"
              alt="Crop preview"
            />
          )}
          {cropState && (
            <div
              className="absolute pointer-events-auto border-2 border-blue-500"
              style={{
                left:
                  (cropState.x / originalMediaSize.width) * styleState.width + styleState.left,
                top:
                  (cropState.y / originalMediaSize.height) * styleState.height,
                width:
                  (cropState.width / originalMediaSize.width) *
                  styleState.width,
                height:
                  (cropState.height / originalMediaSize.height) *
                  styleState.height,
              }}
            />
          )}
        </div>
        <div ref={bottomSetRef}>
          <div className="w-full flex justify-between" ref={bottomSetRef}>
            <div className="px-2 py-1">
              {originalMediaSize.width}x{originalMediaSize.height}
            </div>
            <div className="flex">
              {cropState && (
                <>
                  <div className="px-2 py-1">
                    {cropState.x},{cropState.y} {cropState.width}x
                    {cropState.height}
                  </div>
                  <button
                    className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600"
                    onClick={() => setCropState(null)}
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
            <div className="flex">
              <button
                className={`px-2 py-1 ${unchangedCrop ? "bg-neutral-800" : "bg-neutral-700 hover:bg-neutral-600"}`}
                onClick={() => handleCrop()}
              >
                save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CropWebcamDisplay({
  block,
  originalMediaSize,
  setOriginalMediaSize,
  styleState,
}: {
  block: WebcamBlockType;
  originalMediaSize: { width: number; height: number };
  setOriginalMediaSize: (size: { width: number; height: number }) => void;
  styleState: {
    left: number; top: number;
    width: number; height: number
  };
}) {
  const [activeStreams] = useAtom(activeStreamsAtom);
  if (!block.src) return null;
  const activeStream = activeStreams[block.src];
  const { videoSize } = activeStream;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (
      videoSize &&
      (videoSize.width !== originalMediaSize.width ||
        videoSize.height !== originalMediaSize.height)
    ) {
      setOriginalMediaSize({
        width: videoSize.width,
        height: videoSize.height,
      });
    }
  }, [activeStream, originalMediaSize]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const { width, height } = originalMediaSize;
    canvas.width = width;
    canvas.height = height;

    let animationFrame = 0;
    function drawFrame() {
      if (activeStream.refs.video) {
        ctx.drawImage(activeStream.refs.video, 0, 0, width, height);
      }
      animationFrame = requestAnimationFrame(drawFrame);
    }
    drawFrame();
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [activeStream, originalMediaSize]);

  return (
    <div>
      <canvas
        className="w-full h-auto"
        style={{
          marginLeft: styleState.left,
          width: styleState.width,
          height: styleState.height,
          transform: `scale(${block.flippedHorizontally ? -1 : 1}, ${block.flippedVertically ? -1 : 1
            })`,
        }}
        ref={canvasRef}
        width={originalMediaSize.width}
        height={originalMediaSize.height}
      />
    </div>
  );
}
