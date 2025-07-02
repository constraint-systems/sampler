import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ControlDownAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  StampDirectionAtom,
  StateRefAtom,
  UndoStackAtom,
} from "./atoms";
import { v4 as uuid } from "uuid";
import { useApplyHistoryState } from "./history/useApplyHistoryState";
import { getBoxBoundsFromBlocks, makeZIndex } from "./utils";

export function Keyboard() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setControlDown] = useAtom(ControlDownAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);
  const [, setStampDirection] = useAtom(StampDirectionAtom);
  const applyHistoryState = useApplyHistoryState();

  function handleDeleteSelectedBlocks() {
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
  }

  function handleDuplicateBlocks() {
    // update to behave like stamp
    const newBlockMap = { ...stateRef.blockMap };
    const newBlockIds = [...stateRef.blockIds];
    let newSelectedBlockIds: string[] = [];
    stateRef.selectedBlockIds.forEach((id) => {
      const block = stateRef.blockMap[id];
      if (block) {
        const newBlock = {
          ...block,
          id: uuid(),
          x: block.x + 16,
          y: block.y + 16,
        };
        newBlockMap[newBlock.id] = newBlock;
        newBlockIds.push(newBlock.id);
        newSelectedBlockIds.push(newBlock.id);
      }
    });
    setBlockMap(newBlockMap);
    setBlockIds(newBlockIds);
    setSelectedBlockIds(newSelectedBlockIds);
  }

  function handleSelectAllBlocks() {
    const allBlockIds = Object.keys(stateRef.blockMap);
    setSelectedBlockIds(allBlockIds);
  }

  const intervalRef = useRef<number | null>(null);
  const startCameraRef = useRef(stateRef.camera);
  function handleStampBlocks() {
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
      if (block.flippedHorizontally) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      if (block.flippedVertically) {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
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
  }

  // Maybe should all be in a hook
  function handleUndo() {
    const action = stateRef.undoStack[stateRef.undoStack.length - 1];
    if (action) {
      applyHistoryState(action.undo);
      setUndoStack(stateRef.undoStack.slice(0, -1));
      setRedoStack((prev) => [...prev, action]);
    }
  }

  function handleRedo() {
    const action = stateRef.redoStack[stateRef.redoStack.length - 1];
    applyHistoryState(action.redo);
    setRedoStack(stateRef.redoStack.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
  }

  useEffect(() => {
    let isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    function handleKeyDown(event: KeyboardEvent) {
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
      //  TODO switch to command or control
      if (event.ctrlKey) {
        setControlDown(true);
      }
      if (event.key === "Backspace") {
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA")
        ) {
          return;
        }
        handleDeleteSelectedBlocks();
      }
      if (isCmdOrCtrl && event.key === "d") {
        event.preventDefault();
        handleDuplicateBlocks();
      }
      if (isCmdOrCtrl && event.key === "a") {
        event.preventDefault();
        handleSelectAllBlocks();
      }
      if (isCmdOrCtrl && event.key === "z") {
        event.preventDefault();
        handleUndo();
      }
      if (isCmdOrCtrl && event.shiftKey && event.key === "z") {
        event.preventDefault();
        handleRedo();
      }
      if (event.key === " ") {
        event.preventDefault();
        if (stateRef.selectedBlockIds.length > 0) {
          handleStampBlocks();
        }
      }
      if (isCmdOrCtrl && event.key === "ArrowLeft") {
        event.preventDefault();
        stateRef.stampDirection = "←";
        setStampDirection("←");
      } else if (isCmdOrCtrl && event.key === "ArrowRight") {
        event.preventDefault();
        stateRef.stampDirection = "→";
        setStampDirection("→");
      } else if (isCmdOrCtrl && event.key === "ArrowUp") {
        event.preventDefault();
        stateRef.stampDirection = "↑";
        setStampDirection("↑");
      } else if (isCmdOrCtrl && event.key === "ArrowDown") {
        event.preventDefault();
        stateRef.stampDirection = "↓";
        setStampDirection("↓");
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === "Control") {
        setControlDown(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return null;
}
