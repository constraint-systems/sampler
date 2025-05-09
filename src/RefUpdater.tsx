import { useAtom } from "jotai";
import { BlockIdsAtom, BlockMapAtom, CameraAtom, ModeAtom, SelectedBlockIdsAtom, SelectedBoxAtom, stampMoveDirectionAtom, stampMoveOffsetAtom, StateRefAtom, ZoomContainerAtom } from "./atoms";
import { useEffect } from "react";

export function RefUpdater() {
  const [stateRef] = useAtom(StateRefAtom);
  const [camera] = useAtom(CameraAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);
  const [mode] = useAtom(ModeAtom);
  const [zoomContainer] = useAtom(ZoomContainerAtom);
  const [selectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [selectedBox] = useAtom(SelectedBoxAtom);
  const [stampMoveOffset] = useAtom(stampMoveOffsetAtom);
  const [stampMoveDirection] = useAtom(stampMoveDirectionAtom);

  // If you add a new entry make sure you add it to the dependency array
  useEffect(() => {
    stateRef.camera = camera;
    stateRef.blockIds = blockIds;
    stateRef.blockMap = blockMap;
    stateRef.mode = mode;
    stateRef.zoomContainer = zoomContainer;
    stateRef.selectedBlockIds = selectedBlockIds;
    stateRef.selectedBox = selectedBox;
    stateRef.stampMoveOffset = stampMoveOffset;
    stateRef.stampMoveDirection = stampMoveDirection;
  }, [camera, blockIds, blockMap, mode, selectedBox, zoomContainer, selectedBlockIds, stampMoveOffset, stampMoveDirection]);

  return null
}
