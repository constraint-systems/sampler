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
  rotation: number;
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
  src: string;
  crop: CropBoxType;
  flippedHorizontally: boolean;
  flippedVertically: boolean;
  blend: BlendTypes;
  originalMediaSize: SizeType | null;
};

export type WebcamBlockType = BaseBlockType & {
  type: "webcam";
  crop: CropBoxType;
  blend: BlendTypes;
  flippedHorizontally: boolean;
  flippedVertically: boolean;
  // id that matches camera settings for stream
  originalMediaSize: SizeType | null;
  src: string | null
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
  stampMoveDirection: StampMoveDirectionType | null;
  stampMoveOffset: StampMoveOffsetType | null;
};

export type ActiveStreamType = {
  stream: MediaStream | null;
  videoSize: SizeType | null;
  refs: {
    video: HTMLVideoElement | null;
    canvas: HTMLCanvasElement | null;
    drawRequest: number | null;
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

export type StampMoveDirectionType =
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
