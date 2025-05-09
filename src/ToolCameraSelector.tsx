import { useAtom } from "jotai";
import { useDevices } from "./useDevices";
import { BlockMapAtom, devicesAtom } from "./atoms";
import { WebcamBlockType } from "./types";

export function ToolCameraSelector({
  webcamBlocks,
}: {
  webcamBlocks: WebcamBlockType[];
}) {
  const {  startStream } = useDevices();
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [devices] = useAtom(devicesAtom);

  const camerasSelectected = new Set(webcamBlocks.map((block) => block.src));

  let selection = "multiple";
  if (camerasSelectected.size === 1) {
    selection = camerasSelectected.values().next().value!;
  }

  return (
    <div className="flex items-center">
      <div className="flex flex-col">
        {devices.map((device, index) => (
          <button
            className={`px-3 text-left py-1 pointer-events-auto ${
              selection === device.deviceId
                ? "bg-neutral-700"
                : "bg-neutral-800"
            }`}
            value={index}
            key={device.deviceId}
            onClick={(e) => {
              e.stopPropagation();
              startStream(device.deviceId);
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
            {device.label.split("(")[0].trim() || `Camera ${index}`}
          </button>
        ))}
      </div>
    </div>
  );
}
