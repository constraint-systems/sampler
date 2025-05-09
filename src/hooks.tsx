import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  StateRefAtom,
  ZoomContainerAtom,
} from "./atoms";
import { BlockType } from "./types";
import { useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { screenToCanvas } from "./Camera";
import { loadImage, makeZIndex } from "./utils";
import { maxSize } from "./consts";

export function useCreateBlock() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);

  return (block: BlockType) => {
    setBlockIds((prev) => [...prev, block.id]);
    setBlockMap((prev) => ({ ...prev, [block.id]: block }));
  };
}

export function useUpdateBlock() {
  const [, setBlockMap] = useAtom(BlockMapAtom);

  return (id: string, updates: Partial<BlockType>) => {
    setBlockMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates } as BlockType,
    }));
  };
}

export function useHandleDropImage() {
  const createBlock = useCreateBlock();
  const [stateRef] = useAtom(StateRefAtom );

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDropImage(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    // TODO: handle multiple images but make sure they're an image file (png, jpeg, jpg, webp)
    const file = event.dataTransfer?.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        const image = await loadImage(src);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        const canvasPoint = screenToCanvas(
          { x: event.clientX, y: event.clientY },
          stateRef.camera!,
          stateRef.zoomContainer!,
        );
        createBlock({
          id: uuid(),
          type: "image",
          src,
          x: canvasPoint.x - (image.width * scale) / 2,
          y: canvasPoint.y - (image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
          flippedHorizontally: false,
          flippedVertically: false,
          rotation: 0,
          blend: 'darken',
          crop: null,
          zIndex: makeZIndex(),
        });
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    window.addEventListener("drop", handleDropImage);
    window.addEventListener("dragover", handleDragOver);
    return () => {
      window.removeEventListener("drop", handleDropImage);
      window.removeEventListener("dragover", handleDragOver);
    };
  }, []);
}

// export function useHandlePasteImage() {
//   const createBlock = useCreateBlock();
//   const [camera] = useAtom(CameraAtom);
//   const [zoomContainer] = useAtom(ZoomContainerAtom);
//
//   const cameraRef = useRef(camera);
//   cameraRef.current = camera;
//   const zoomContainerRef = useRef<HTMLDivElement | null>(null);
//   zoomContainerRef.current = zoomContainer;
//
//   function handlePasteImage(event: ClipboardEvent) {
//     const file = event.clipboardData?.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         const src = reader.result as string;
//         const image = await loadImage(src);
//         const scale = Math.min(maxSize / image.width, maxSize / image.height);
//         const canvasPoint = screenToCanvas(
//           {
//             x: zoomContainerRef.current!.clientWidth / 2,
//             y: zoomContainerRef.current!.clientHeight / 2,
//           },
//           cameraRef.current,
//           zoomContainerRef.current!,
//         );
//         createBlock({
//           id: uuid(),
//           type: "image",
//           src,
//           x: canvasPoint.x - (image.width * scale) / 2,
//           y: canvasPoint.y - (image.height * scale) / 2,
//           width: image.width * scale,
//           height: image.height * scale,
//           zIndex: makeZIndex(),
//         });
//       };
//       reader.readAsDataURL(file);
//     }
//   }
//
//   useEffect(() => {
//     window.addEventListener("paste", handlePasteImage);
//     return () => {
//       window.removeEventListener("paste", handlePasteImage);
//     };
//   }, []);
// }

// export function useHandleUploadImage() {
//   const createBlock = useCreateBlock();
//   const [camera] = useAtom(CameraAtom);
//   const [zoomContainer] = useAtom(ZoomContainerAtom);
//
//   const cameraRef = useRef(camera);
//   cameraRef.current = camera;
//   const zoomContainerRef = useRef<HTMLDivElement | null>(null);
//   zoomContainerRef.current = zoomContainer;
//
//   function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         const src = reader.result as string;
//         const image = await loadImage(src);
//         const scale = Math.min(maxSize / image.width, maxSize / image.height);
//         const canvasPoint = screenToCanvas(
//           { x: window.innerWidth / 2, y: window.innerHeight / 2 },
//           cameraRef.current,
//           zoomContainerRef.current!,
//         );
//         createBlock({
//           id: uuid(),
//           type: "image",
//           src,
//           x: canvasPoint.x - (image.width * scale) / 2,
//           y: canvasPoint.y - (image.height * scale) / 2,
//           width: image.width * scale,
//           height: image.height * scale,
//           zIndex: makeZIndex(),
//         });
//       };
//       reader.readAsDataURL(file);
//     }
//   }
//
//   return handleUploadImage;
// }
//

