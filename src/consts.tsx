export const maxSize = 1080;

export const defaultCameraSettings = {
  deviceId: '',
  flipHorizontal: false,
  flipVertical: false,
  videoSize: { width: 0, height: 0 },
  cropBox: null,
  showCrop: false
};

export const idealResolution = {
  width: 3840,
  height: 2160
}

export const blendOptions = [
  "darken",
  "lighten",
  "multiply",
  "screen",
  "normal",
  "difference",
];

export const offsetLookup = {
  "1/8": 0.125,
  "1/4": 0.25,
  "1/2": 0.5,
  "3/4": 0.75,
  "1": 1,
  "1.25": 1.25,
}

export const offsets = ["1/8", "1/4", "1/2", "3/4", "1", "1.25"];
