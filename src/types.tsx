export type PointType = {
  x: number;
  y: number;
};

export type CameraType = {
  x: number;
  y: number;
  z: number;
};

export type ModeType = "move";

export type BaseBlockType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  blend: BlendTypes;
};

export type BlendTypes =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten";

export type ImageBlockType = BaseBlockType & {
  type: "image";
  srcType: "url" | "canvas";
  src: string;
  crop: CropBoxType;
  canvas: HTMLCanvasElement | null;
  flippedHorizontally: boolean;
  flippedVertically: boolean;
  originalMediaSize: SizeType | null;
};

export type WebcamBlockType = BaseBlockType & {
  type: "webcam";
  crop: CropBoxType;
  flippedHorizontally: boolean;
  flippedVertically: boolean;
  // id that matches camera settings for stream
  originalMediaSize: SizeType | null;
  src: string | null;
};

export type BlockType = ImageBlockType | WebcamBlockType;

export type StateRefType = {
  camera: CameraType;
  blockIds: string[];
  blockMap: Record<string, BlockType>;
  mode: ModeType;
  zoomContainer: HTMLDivElement | null;
  selectedBlockIds: string[];
  blockSelector: { x: number; y: number; width: number; height: number } | null;
  selectedBox: BoxType | null;
  stampDirection: StampDirectionType | null;
  stampMoveOffset: StampMoveOffsetType | null;
  activePointers: Map<number, PointType>;
  undoStack: HistoryEntryType[];
  redoStack: HistoryEntryType[];
  activeStreams: Record<string, ActiveStreamType>;
};

export type ActiveStreamType = {
  stream: MediaStream | null;
  videoSize: SizeType | null;
  refs: {
    video: HTMLVideoElement | null;
  };
};

export type CropBoxType = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type SizeType = {
  width: number;
  height: number;
};

export type BoxType = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BlockSelectorType = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  length: number;
};

export type StampDirectionType =
  | "←"
  | "↖"
  | "↑"
  | "↗"
  | "•"
  | "→"
  | "↘"
  | "↓"
  | "↙";

export type StampMoveOffsetType = "1/4" | "1/2" | "3/4" | "1";

export type DragEventTypeType = "first" | "move" | "last";
export type DragEventType = {
  id: number;
  type: DragEventTypeType;
  event: React.PointerEvent;
  targetEl: HTMLElement;
};

export type HistoryEntryType = {
  undo: Record<string, any>;
  redo: Record<string, any>;
};
