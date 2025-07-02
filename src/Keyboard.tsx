import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  BlockIdsAtom,
  BlockMapAtom,
  ControlDownAtom,
  SelectedBlockIdsAtom,
  StateRefAtom,
} from "./atoms";
import { v4 as uuid } from "uuid";
import { useStampBlocks } from "./ToolStamp";

export function Keyboard() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [, setControlDown] = useAtom(ControlDownAtom);
  const stampBlocks = useStampBlocks();

  function handleDeleteSelectedBlocks() {
    if (stateRef.selectedBlockIds.length > 0) {
      setBlockIds((prev) =>
        prev.filter((id) => !stateRef.selectedBlockIds.includes(id)),
      );
      setBlockMap((prev) => {
        const newMap = { ...prev };
        stateRef.selectedBlockIds.forEach((id) => {
          delete newMap[id];
        });
        return newMap;
      });
      setSelectedBlockIds([]);
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
      if (event.key === " ") {
        event.preventDefault();
        if (stateRef.selectedBlockIds.length > 0) {
          stampBlocks();
        }
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
