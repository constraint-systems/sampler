import { atom } from "jotai";
import {
  ActiveStreamType,
  BlockSelectorType,
  BlockType,
  ModeType,
  SizeType,
  StampMoveDirectionType,
  StampMoveOffsetType,
  StateRefType,
} from "./types";
import { starterBlocks } from "./starterBlocks";

export const CameraAtom = atom({
  x: 0,
  y: 0,
  z: 1,
});

export const ZoomContainerAtom = atom<HTMLDivElement | null>(null);

export const ModeAtom = atom<ModeType>("move");

export const BlockIdsAtom = atom<string[]>(
  starterBlocks.map((block) => block.id),
);
let starterBlockMap: Record<string, BlockType> = {};
for (const block of starterBlocks) {
  starterBlockMap[block.id] = block as BlockType;
}
export const BlockMapAtom = atom<Record<string, BlockType>>(starterBlockMap);

// assume camera is block 1 won't always be true
export const SelectedBlockIdsAtom = atom<string[]>(starterBlocks.length > 0 ? [starterBlocks[0].id] : [])

export const InitialDeviceLoadedAtom = atom(false);

export const SelectedBoxAtom = atom<BlockSelectorType | null>((get) => {
  const selectedBlockIds = get(SelectedBlockIdsAtom);
  if (selectedBlockIds.length === 0) {
    return null;
  }
  const blockMap = get(BlockMapAtom);
  if (selectedBlockIds.length === 1) {
    const block = blockMap[selectedBlockIds[0]];
    return {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      rotation: block.rotation || 0,
      length: 1,
    };
  }
  const selectedBlocks = selectedBlockIds.map((id) => blockMap[id]);
  const rotatedBlocks = selectedBlocks.map((block) => {
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    const rotation = block.rotation || 0;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const rotatedTopLeftX =
      centerX - (block.width / 2) * cosine + (block.height / 2) * sine;
    const rotatedTopLeftY =
      centerY - (block.width / 2) * sine - (block.height / 2) * cosine;
    const rotatedTopRightX =
      centerX + (block.width / 2) * cosine + (block.height / 2) * sine;
    const rotatedTopRightY =
      centerY + (block.width / 2) * sine - (block.height / 2) * cosine;
    const rotatedBottomLeftX =
      centerX - (block.width / 2) * cosine - (block.height / 2) * sine;
    const rotatedBottomLeftY =
      centerY - (block.width / 2) * sine + (block.height / 2) * cosine;
    const rotatedBottomRightX =
      centerX + (block.width / 2) * cosine - (block.height / 2) * sine;
    const rotatedBottomRightY =
      centerY + (block.width / 2) * sine + (block.height / 2) * cosine;
    const minX = Math.min(
      rotatedTopLeftX,
      rotatedTopRightX,
      rotatedBottomLeftX,
      rotatedBottomRightX,
    );
    const minY = Math.min(
      rotatedTopLeftY,
      rotatedTopRightY,
      rotatedBottomLeftY,
      rotatedBottomRightY,
    );
    const maxX = Math.max(
      rotatedTopLeftX,
      rotatedTopRightX,
      rotatedBottomLeftX,
      rotatedBottomRightX,
    );
    const maxY = Math.max(
      rotatedTopLeftY,
      rotatedTopRightY,
      rotatedBottomLeftY,
      rotatedBottomRightY,
    );
    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  });
  const minXs = rotatedBlocks.map((block) => block.minX);
  const minYs = rotatedBlocks.map((block) => block.minY);
  const maxXs = rotatedBlocks.map((block) => block.maxX);
  const maxYs = rotatedBlocks.map((block) => block.maxY);
  const minX = Math.min(...minXs);
  const minY = Math.min(...minYs);
  const maxX = Math.max(...maxXs);
  const maxY = Math.max(...maxYs);
  const width = maxX - minX;
  const height = maxY - minY;
  const x = minX;
  const y = minY;
  return { x, y, width, height, rotation: 0, length: selectedBlockIds.length };
});

export const BlockSelectorCreatorAtom = atom<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

export const videoSizeAtom = atom<SizeType>({
  width: 0,
  height: 0,
});

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
});

// how do we clean up streams? effectively we'll do garbage collection
export const activeStreamsAtom = atom<Record<string, ActiveStreamType>>(
  {},
);

export const videoCanvasRefAtom = atom<{ current: HTMLCanvasElement }>({
  current: document.createElement("canvas"),
});

export const isDraggingAtom = atom(false);

// maybe expand to images later
export const showCropModalAtom = atom<string | null>(null);

export const stampMoveDirectionAtom = atom<StampMoveDirectionType>("↘");

export const stampMoveOffsetAtom = atom<StampMoveOffsetType>("1");

export const devicesAtom = atom<MediaDeviceInfo[]>([]);
