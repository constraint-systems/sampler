import { useAtom } from "jotai";
import { activeStreamsAtom, BlockIdsAtom, BlockMapAtom, SelectedBlockIdsAtom, StateRefAtom } from "./atoms";
import { v4 as uuid } from "uuid";
import { screenToCanvas } from "./Camera";
import { makeZIndex } from "./utils";
import { WebcamBlockType } from "./types";

export function ToolAddCamera() {
  const [stateRef] = useAtom(StateRefAtom)
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);
  const [activeStreams] = useAtom(activeStreamsAtom);

  return (
      <button
        className={`py-1 w-1/2 text-center pointer-events-auto bg-neutral-800 hover:bg-neutral-700`}
        onClick={() => {
          const newId = uuid();
          const centerPoint = screenToCanvas({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, stateRef.camera!, stateRef.zoomContainer!);
          const starterWidth = 1280;
          const starterHeight = 720;

          const activeStreamKeys = Object.keys(activeStreams);
          const newBlock = {
            id: newId,
            x: centerPoint.x - starterWidth / 2,
            y: centerPoint.y - starterHeight / 2,
            width: starterWidth,
            height: starterHeight,
            rotation: 0,
            flippedHorizontally: true,
            flippedVertically: false,
            src: activeStreamKeys[0] || null,
            blend: "darken",
            type: "webcam",
            zIndex: makeZIndex(),
          } as WebcamBlockType;
          setBlockMap(prev => {
            return {
              ...prev,
              [newId]: newBlock
            }
          })
          setBlockIds(prev => [...prev, newId])
          setSelectedBlockIds([newId])
        }}
      >
        +camera
      </button>
  );
}
