import { useAtom } from "jotai";
import { DragEventType } from "../types";
import { SelectedBlockIdsAtom, StateRefAtom } from "../atoms";
import { useHandleSelectedBoxDrag } from "./useHandleSelectedBoxDrag";

export function useHandleBlockDrag() {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const handleSelectBoxDrag = useHandleSelectedBoxDrag();

  return function handleBlockDrag(dragEvent: DragEventType) {
    const id = dragEvent.targetEl
      .getAttribute("data-target")!
      .replace("block-", "");
    if (dragEvent.type === "first") {
      if (!stateRef.selectedBlockIds.includes(id)) {
        stateRef.selectedBlockIds = [id];
        setSelectedBlockIds([id]);
      }
    }
    handleSelectBoxDrag(dragEvent);
  };
}
