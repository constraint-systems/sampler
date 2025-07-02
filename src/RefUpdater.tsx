import { useAtom } from "jotai";
import {
    activeStreamsAtom,
  BlockIdsAtom,
  BlockMapAtom,
  CameraAtom,
  ModeAtom,
  RedoStackAtom,
  SelectedBlockIdsAtom,
  StampDirectionAtom,
  stampMoveOffsetAtom,
  StateRefAtom,
  UndoStackAtom,
  ZoomContainerAtom,
} from "./atoms";
import { useEffect } from "react";

export function RefUpdater() {
  const [stateRef] = useAtom(StateRefAtom);
  const [camera] = useAtom(CameraAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [undoStack] = useAtom(UndoStackAtom);
  const [redoStack] = useAtom(RedoStackAtom);
  const [activeStreams] = useAtom(activeStreamsAtom);
  const [stampDirection] = useAtom(StampDirectionAtom);

  // If you add a new entry make sure you add it to the dependency array
  useEffect(() => {
    stateRef.camera = camera;
    stateRef.zoomContainer = zoomContainer;
    stateRef.blockIds = blockIds;
    stateRef.blockMap = blockMap;
    stateRef.selectedBlockIds = selectedBlockIds;
    stateRef.undoStack = undoStack;
    stateRef.redoStack = redoStack;
    stateRef.activeStreams = activeStreams;
    stateRef.stampDirection = stampDirection;
  }, [camera, zoomContainer, blockIds, blockMap, selectedBlockIds, undoStack, redoStack
, activeStreams]);


  return null;
}
