import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ControlDownAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  ShowBlockMenuAtom,
  StampDirectionAtom,
  StateRefAtom,
  UndoStackAtom,
} from "./atoms";
import { v4 as uuid } from "uuid";
import { useApplyHistoryState } from "./history/useApplyHistoryState";
import { getBoxBoundsFromBlocks, makeZIndex } from "./utils";
import { useDeleteSelectedBlocks, useDuplicateSelectedBlocks, useHandleStampBlocks } from "./hooks";

export function Keyboard() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setCamera] = useAtom(CameraAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setControlDown] = useAtom(ControlDownAtom);
  const [, setUndoStack] = useAtom(UndoStackAtom);
  const [, setRedoStack] = useAtom(RedoStackAtom);
  const [, setShowBlockMenu] = useAtom(ShowBlockMenuAtom);
  const [, setStampDirection] = useAtom(StampDirectionAtom);
  const applyHistoryState = useApplyHistoryState();
  const deleteSelectedBlocks = useDeleteSelectedBlocks();
  const duplicateSelectedBlocks = useDuplicateSelectedBlocks();
  const handleStampBlocks = useHandleStampBlocks();

  function handleSelectAllBlocks() {
    const allBlockIds = Object.keys(stateRef.blockMap);
    setSelectedBlockIds(allBlockIds);
  }

  const intervalRef = useRef<number | null>(null);
  const startCameraRef = useRef(stateRef.camera);
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
        deleteSelectedBlocks();
      }
      if (isCmdOrCtrl && event.key === "d") {
        event.preventDefault();
        duplicateSelectedBlocks();
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
      if (event.key === "/") {
        setShowBlockMenu((prev) => !prev);
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
