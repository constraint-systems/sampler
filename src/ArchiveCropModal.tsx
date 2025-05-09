import { useAtom } from "jotai";
import { useRef, useState, useMemo, useEffect } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  showCropModalAtom,
  activeStreamsAtom,
} from "./atoms";
import { WebcamBlockType, CropBoxType } from "./types";
import { pointIntersectBox } from "./utils";

export function CropModal() {
  const [blockId, setShowCropModal] = useAtom(showCropModalAtom);
  const [blockMap, setBlockMap] = useAtom(BlockMapAtom);
  const [originalMediaSize, setOriginalMediaSize] = useState({
    width: 0,
    height: 0,
  });

  if (!blockId) return null;

  const block = blockMap[blockId];
  const isImageBlock = block.type === "image";
  const isWebcamBlock = block.type === "webcam";

  const [activeStreams] = useAtom(activeStreamsAtom);
  // const videoSize = activeStreams[block.src].videoSize!;

  const topSetRef = useRef<HTMLDivElement | null>(null);
  const [cropState, setCropState] = useState<CropBoxType | null>(block.crop);
  const bottomSetRef = useRef<HTMLDivElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  // const videoCanvasRef = activeStreams[block.src].refs.video!;
  // const [blockIds] = useAtom(BlockIdsAtom);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const animationFrame = useRef<number | null>(null);

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
  const [videoContainerSize, setVideoContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const displayContainerRef = useRef<HTMLDivElement | null>(null);
  const [displayContainer, setDisplayContainer] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [displayBox, setDisplayBox] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const unchangedCrop = useMemo(() => {
    const cropStateCheck = JSON.stringify(cropState);
    const blockCheck = JSON.stringify(block.crop);
    return cropStateCheck === blockCheck;
  }, [cropState, block.crop]);

  function setCropBoxState(cropBox: CropBoxType) {
    setCropState(cropBox);
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
      displayBox.width,
      Math.max(dragRef.current.start.x, dragRef.current.current.x),
    );
    const maxY = Math.min(
      displayBox.height,
      Math.max(dragRef.current.start.y, dragRef.current.current.y),
    );
    const x = minX;
    const y = minY;
    const width = maxX - minX;
    const height = maxY - minY;
    const cropBox = {
      x: Math.round((x / displayBox.width) * originalMediaSize.width),
      y: Math.round((y / displayBox.height) * originalMediaSize.height),
      width: Math.round((width / displayBox.width) * originalMediaSize.width),
      height: Math.round((height / displayBox.height) * originalMediaSize.height),
    };
    return cropBox;
  }

  function moveCropBox() {
    const dx =
      ((dragRef.current.current.x - dragRef.current.start.x) /
        displayBox.width) *
      originalMediaSize.width;
    const dy =
      ((dragRef.current.current.y - dragRef.current.start.y) /
        displayBox.height) *
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

  useEffect(() => {
    function handleResize() {
      if (topSetRef.current && bottomSetRef.current) {
        const topSet = topSetRef.current.getBoundingClientRect();
        const bottomSet = bottomSetRef.current.getBoundingClientRect();
        const topSetHeight = topSet.height;
        const bottomSetHeight = bottomSet.height;

        const availableHeight =
          window.innerHeight -
          topSetHeight -
          bottomSetHeight 
        const availableWidth = window.innerWidth
        let videoWidth = availableWidth;
        let videoHeight = availableHeight;
        const aspectRatio = originalMediaSize.width / originalMediaSize.height;
        if (availableWidth / availableHeight > aspectRatio) {
          videoWidth = availableHeight * aspectRatio;
        } else {
          videoHeight = availableWidth / aspectRatio;
        }
        // width is always 100%
        const videoContainerHeight = videoHeight;
        videoContainerRef.current!.style.height = `${videoContainerHeight}px`;
        canvasRef.current!.style.width = `${videoWidth}px`;
        canvasRef.current!.style.height = `${videoHeight}px`;
        const sidePadding = (window.innerWidth - videoWidth) / 2;
        setVideoContainerSize({
          width: window.innerWidth,
          height: videoContainerHeight,
        });
        setDisplayBox({
          x: 0,
          y: 0,
          width: videoWidth,
          height: videoHeight,
        });
        // videoContainerRef.current!.style.padding = `${topPadding}px ${sidePadding}px`;
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [originalMediaSize]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")!;
      function draw() {
        ctx.drawImage(videoCanvasRef, 0, 0);
        animationFrame.current = window.requestAnimationFrame(draw);
      }
      animationFrame.current = window.requestAnimationFrame(draw);
    }
    return () => {
      if (animationFrame.current) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [canvasRef]);

  function handleCrop() {
    setCropBox(cropState!);
    setShowCropModal(null);
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex">
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
          ref={videoContainerRef}
          className="relative"
          onPointerDown={(e) => {
            if (e.button === 0) {
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = videoContainerRef.current?.getBoundingClientRect();
              dragRef.current.start.x =
                e.clientX - (rect?.left || 0) - videoPadding;
              dragRef.current.start.y =
                e.clientY - (rect?.top || 0) - videoPadding;
              dragRef.current.current.x =
                e.clientX - (rect?.left || 0) - videoPadding;
              dragRef.current.current.y =
                e.clientY - (rect?.top || 0) - videoPadding;
              const isIntersecting =
                cropState &&
                pointIntersectBox(
                  {
                    x: Math.round(
                      (dragRef.current.start.x / videoDisplayBox.width) *
                        videoSize.width,
                    ),
                    y: Math.round(
                      (dragRef.current.start.y / videoDisplayBox.height) *
                        videoSize.height,
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
                setCropBoxState(rawCoordsToCropBox());
              }
            }
          }}
          onPointerMove={(e) => {
            if (dragRef.current.isCreating || dragRef.current.isMoving) {
              const rect = videoContainerRef.current?.getBoundingClientRect();
              dragRef.current.current.x =
                e.clientX - (rect?.left || 0) - videoPadding;
              dragRef.current.current.y =
                e.clientY - (rect?.top || 0) - videoPadding;
              if (dragRef.current.isCreating) {
                setCropBoxState(rawCoordsToCropBox());
              } else if (dragRef.current.isMoving) {
                setCropBoxState(moveCropBox());
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
          <canvas
            className="w-full h-full pointer-events-none"
            ref={canvasRef}
            width={videoSize.width}
            height={videoSize.height}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: videoDisplayBox.x,
              top: videoDisplayBox.y,
              width: videoDisplayBox.width,
              height: videoDisplayBox.height,
            }}
          >
            {cropState && (
              <div
                className="absolute pointer-events-auto border-2 border-blue-500"
                style={{
                  left: (cropState.x / videoSize.width) * videoDisplayBox.width,
                  top:
                    (cropState.y / videoSize.height) * videoDisplayBox.height,
                  width:
                    (cropState.width / videoSize.width) * videoDisplayBox.width,
                  height:
                    (cropState.height / videoSize.height) *
                    videoDisplayBox.height,
                }}
              />
            )}
          </div>
        </div>
        <div className="w-full flex justify-between" ref={bottomSetRef}>
          <div className="px-2 py-1">
            {videoSize.width}x{videoSize.height}
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
                  onClick={() => setCropBoxState(null)}
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
  );
}
