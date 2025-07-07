import { atom } from "jotai";
import {
  ActiveStreamType,
  BlockType,
  BoxType,
  HistoryEntryType,
  StampDirectionType,
  StateRefType,
} from "./types";
import { starterBlocks } from "./starterBlocks";

export const CameraAtom = atom({
  x: 0,
  y: 0,
  z: 0.375,
});

export const ZoomContainerAtom = atom<HTMLDivElement | null>(null);

export const ControlDownAtom = atom(false);

export const BlockIdsAtom = atom<string[]>(
  starterBlocks.map((block) => block.id),
);
let starterBlockMap: Record<string, BlockType> = {};
for (const block of starterBlocks) {
  starterBlockMap[block.id] = block as BlockType;
}
export const BlockMapAtom = atom<Record<string, BlockType>>(starterBlockMap);

// assume camera is block 1 won't always be true
export const SelectedBlockIdsAtom = atom<string[]>(
  starterBlocks.length > 0 ? [starterBlocks[0].id] : [],
);

export const InitialDeviceLoadedAtom = atom(false);

export const StateRefAtom = atom<StateRefType>({
  camera: { x: 0, y: 0, z: 1 },
  blockIds: [],
  blockMap: {},
  mode: "move",
  zoomContainer: null,
  selectedBlockIds: [],
  blockSelector: null,
  selectedBox: null,
  stampMoveDirection: null,
  stampMoveOffset: null,
  activePointers: new Map(),
});

// how do we clean up streams? effectively we'll do garbage collection
export const activeStreamsAtom = atom<Record<string, ActiveStreamType>>({});

export const videoCanvasRefAtom = atom<{ current: HTMLCanvasElement }>({
  current: document.createElement("canvas"),
});

export const isDraggingAtom = atom(false);

export const StampDirectionAtom = atom<StampDirectionType>("↓");

export const devicesAtom = atom<MediaDeviceInfo[]>([]);

export const DragSelectBoxAtom = atom<BoxType | null>(null);

export const UndoStackAtom = atom<HistoryEntryType[]>([]);
export const RedoStackAtom = atom<HistoryEntryType[]>([]);

export const CropTempAtom = atom<BoxType | null>(null);

export const showCropModalAtom = atom(false);
