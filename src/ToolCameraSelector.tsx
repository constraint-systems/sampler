import { useAtom } from "jotai";
import { useDevices } from "./useDevices";
import { BlockMapAtom, devicesAtom } from "./atoms";
import { WebcamBlockType } from "./types";

export function ToolCameraSelector({
  webcamBlocks,
}: {
  webcamBlocks: WebcamBlockType[];
}) {
  const { startStream } = useDevices();
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [devices] = useAtom(devicesAtom);

  const camerasSelectected = new Set(webcamBlocks.map((block) => block.src));

  let selection = "multiple";
  if (camerasSelectected.size === 1) {
    selection = camerasSelectected.values().next().value!;
  }

  return devices.length > 1 ? (
    <select
      className="pointer-events-auto px-3 py-1 focus:outline-none bg-neutral-800 w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onChange={(e) => {
        startStream(e.target.value);
        const device = devices.find((d) => d.deviceId === e.target.value)!;
        const webcamSources = webcamBlocks.map((block) => {
          return { id: block.id, src: device.deviceId };
        });
        setBlockMap((prev) => {
          const newMap = { ...prev };
          webcamSources.forEach((webcamSource) => {
            newMap[webcamSource.id] = {
              ...newMap[webcamSource.id],
              src: webcamSource.src,
            };
          });
          return newMap;
        });
      }}
    >
      {devices.map((device, index) => (
        <option
          className={`px-3 text-left py-1 pointer-events-auto ${
            selection === device.deviceId ? "bg-neutral-700" : "bg-neutral-800"
          }`}
          value={device.deviceId}
          key={device.deviceId + index}
          onClick={(e) => {}}
        >
          {device.label.split("(")[0].trim() || `Camera ${index}`}
        </option>
      ))}
    </select>
  ) : null;
}
