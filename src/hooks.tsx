import { useAtom } from "jotai";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
  UndoStackAtom,
} from "./atoms";
import { BlockType } from "./types";
import { useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { screenToCanvas } from "./Camera";
import { getBoxBoundsFromBlocks, loadImage, makeZIndex } from "./utils";
import { maxSize } from "./consts";

export function useCreateBlock() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);

  // TODO Add undo
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
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

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
        let scale = 1;
        if (image.width > maxSize || image.height > maxSize) {
          scale = Math.min(maxSize / image.width, maxSize / image.height);
        }
        const canvasPoint = screenToCanvas(
          { x: event.clientX, y: event.clientY },
          stateRef.camera!,
          stateRef.zoomContainer!,
        );
        const canvas = document.createElement("canvas");
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
        const newId = uuid();
        createBlock({
          id: newId,
          type: "image",
          src,
          canvas,
          x: canvasPoint.x - (image.width * scale) / 2,
          y: canvasPoint.y - (image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
          flippedHorizontally: false,
          flippedVertically: false,
          blend: "darken",
          originalMediaSize: {
            width: image.width,
            height: image.height,
          },
          crop: null,
          zIndex: makeZIndex(),
        });
        setSelectedBlockIds([newId]);
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

export function useHandlePasteImage() {
  const createBlock = useCreateBlock();
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  function handlePasteImage(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
              const src = reader.result as string;
              const image = await loadImage(src);
              const scale = Math.min(
                maxSize / image.width,
                maxSize / image.height,
              );
              const canvasPoint = screenToCanvas(
                { x: window.innerWidth / 2, y: window.innerHeight / 2 },
                stateRef.camera!,
                stateRef.zoomContainer!,
              );
              const newId = uuid();
              createBlock({
                id: newId,
                type: "image",
                src,
                x: canvasPoint.x - (image.width * scale) / 2,
                y: canvasPoint.y - (image.height * scale) / 2,
                width: image.width * scale,
                height: image.height * scale,
                flippedHorizontally: false,
                flippedVertically: false,
                blend: "darken",
                crop: null,
                zIndex: makeZIndex(),
              });
              setSelectedBlockIds([newId]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  }

  useEffect(() => {
    window.addEventListener("paste", handlePasteImage);
    return () => {
      window.removeEventListener("paste", handlePasteImage);
    };
  }, []);
}

export function useHandleUploadImage() {
  const createBlock = useCreateBlock();
  const [stateRef] = useAtom(StateRefAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        const image = await loadImage(src);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        const canvasPoint = screenToCanvas(
          { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          stateRef.camera!,
          stateRef.zoomContainer!,
        );
        const newId = uuid();
        createBlock({
          id: newId,
          type: "image",
          src,
          x: canvasPoint.x - (image.width * scale) / 2,
          y: canvasPoint.y - (image.height * scale) / 2,
          width: image.width * scale,
          height: image.height * scale,
          flippedHorizontally: false,
          canvas: null,
          flippedVertically: false,
          originalMediaSize: null,
          blend: "darken",
          crop: null,
          zIndex: makeZIndex(),
        });
        setSelectedBlockIds([newId]);
      };
      reader.readAsDataURL(file);
    }
  }

  return { handleFileChange, imageUploadInputRef: inputRef };
}

export function useDeleteSelectedBlocks() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(UndoStackAtom);

  return () => {
    if (stateRef.selectedBlockIds.length > 0) {
      const undoState = {
        blockMap: { ...stateRef.blockMap },
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };
      setBlockIds((prev) => {
        const updatedBlockIds = prev.filter(
          (id) => !stateRef.selectedBlockIds.includes(id),
        );
        stateRef.blockIds = updatedBlockIds;
        return updatedBlockIds;
      });
      setBlockMap((prev) => {
        const newMap = { ...prev };
        stateRef.selectedBlockIds.forEach((id) => {
          delete newMap[id];
        });
        stateRef.blockMap = newMap;
        return newMap;
      });
      stateRef.selectedBlockIds = [];
      setSelectedBlockIds([]);
      setUndoStack((prev) => [
        ...prev,
        {
          undo: undoState,
          redo: {
            blockMap: { ...stateRef.blockMap },
            blockIds: [...stateRef.blockIds],
            selectedBlockIds: [...stateRef.selectedBlockIds],
          },
        },
      ]);
      setRedoStack([]);
    }
  };
}

export function useDuplicateSelectedBlocks() {
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(UndoStackAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  return () => {
    if (stateRef.selectedBlockIds.length > 0) {
      const undoState = {
        blockMap: { ...stateRef.blockMap },
        blockIds: [...stateRef.blockIds],
        selectedBlockIds: [...stateRef.selectedBlockIds],
      };
      const newBlocks: BlockType[] = stateRef.selectedBlockIds.map((id) => {
        const block = stateRef.blockMap[id];
        return {
          ...block,
          id: uuid(),
          x: block.x + Math.round(block.width / 8),
          y: block.y + Math.round(block.height / 8),
          zIndex: makeZIndex(),
        };
      });
      setBlockIds((prev) => [...prev, ...newBlocks.map((b) => b.id)]);
      setBlockMap((prev) => ({
        ...prev,
        ...Object.fromEntries(newBlocks.map((b) => [b.id, b])),
      }));
      setSelectedBlockIds(newBlocks.map((b) => b.id));

      stateRef.blockMap = {
        ...stateRef.blockMap,
        ...Object.fromEntries(newBlocks.map((b) => [b.id, b])),
      };
      stateRef.blockIds = [...stateRef.blockIds, ...newBlocks.map((b) => b.id)];
      setUndoStack((prev) => [
        ...prev,
        {
          undo: undoState,
          redo: {
            blockMap: { ...stateRef.blockMap },
            blockIds: [...stateRef.blockIds],
            selectedBlockIds: [...stateRef.selectedBlockIds],
          },
        },
      ]);
      setRedoStack([]);
    }
  };
}

export function useHandleStampBlocks() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const startCameraRef = useRef(stateRef.camera);
  const intervalRef = useRef<number | null>(null);

  return function handleStampBlocks() {
    let newIds = [];
    const newBlockMap = { ...stateRef.blockMap };
    const newZIndex = makeZIndex();
    let i = 0;
    const selectedBlocks = stateRef.selectedBlockIds.map(
      (id) => stateRef.blockMap[id],
    );
    const webcamSelected = selectedBlocks.filter(
      (block) => block.type === "webcam",
    );
    if (!webcamSelected) return;
    stateRef.selectedBlockIds = webcamSelected.map((block) => block.id);
    setSelectedBlockIds(stateRef.selectedBlockIds);
    const startingSelectedBox = getBoxBoundsFromBlocks(webcamSelected);
    for (const blockId of stateRef.selectedBlockIds) {
      const block = stateRef.blockMap[blockId];
      if (block.type !== "webcam") continue;

      const newId = crypto.randomUUID();
      newIds.push(newId);

      // async image creation
      const canvas = document.createElement("canvas");
      const activeStream = stateRef.activeStreams[block.src!];
      canvas.width = activeStream!.videoSize!.width;
      canvas.height = activeStream!.videoSize!.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        activeStream!.refs.video!,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      if (block.type === "webcam") {
        newBlockMap[newId] = {
          ...block,
          type: "image",
          srcType: "canvas",
          canvas: canvas,
          id: newId,
          x: block.x,
          y: block.y,
          zIndex: newZIndex + i,
        };
      } else {
        newBlockMap[newId] = {
          ...block,
          id: newId,
          x: block.x,
          y: block.y,
          zIndex: newZIndex + i,
        };
      }

      if (stateRef.stampDirection === "→") {
        newBlockMap[blockId].x = block.x + block.width + 24;
      } else if (stateRef.stampDirection === "←") {
        newBlockMap[blockId].x = block.x - block.width - 24;
      } else if (stateRef.stampDirection === "↑") {
        newBlockMap[blockId].y = block.y - block.height - 24;
      } else if (stateRef.stampDirection === "↓") {
        newBlockMap[blockId].y = block.y + block.height + 24;
      }

      i++;
    }
    stateRef.blockMap = newBlockMap;
    setBlockMap(stateRef.blockMap);
    stateRef.blockIds = [...stateRef.blockIds, ...newIds];
    setBlockIds(stateRef.blockIds);
    const newSelectedBlocks = stateRef.selectedBlockIds.map(
      (id) => stateRef.blockMap[id],
    );
    const newSelectedBox = getBoxBoundsFromBlocks(newSelectedBlocks);
    const moveX =
      newSelectedBox.x +
      newSelectedBox.width / 2 -
      (startingSelectedBox.x + startingSelectedBox.width / 2);
    const moveY =
      newSelectedBox.y +
      newSelectedBox.height / 2 -
      (startingSelectedBox.y + startingSelectedBox.height / 2);
    const steps = 12;
    let step = 0;
    startCameraRef.current = { ...stateRef.camera };
    intervalRef.current = window.setInterval(() => {
      setCamera((prev) => ({
        x: startCameraRef.current.x - moveX * (step / steps),
        y: startCameraRef.current.y - moveY * (step / steps),
        z: prev.z,
      }));
      if (step >= steps) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      step++;
    }, 8);
  };
}

export function useUpdateBlocks() {
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [stateRef] = useAtom(StateRefAtom);

  return (updates: Partial<BlockType>[]) => {
    setBlockMap((prev) => {
      const newMap = { ...prev };
      updates.forEach((update) => {
        if (update.id && newMap[update.id]) {
          newMap[update.id] = { ...newMap[update.id], ...update } as BlockType;
        }
      });
      stateRef.blockMap = newMap;
      return newMap;
    });
  };
}
