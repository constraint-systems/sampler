import { useAtom } from "jotai";
import { useDevices } from "../useDevices";
import { BlockMapAtom, devicesAtom } from "../atoms";
import { WebcamBlockType } from "../types";
import { ToolSelect, ToolSelectOption } from "./ToolSelect";

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

  return devices.length > 0 ? (
    <ToolSelect
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
        <ToolSelectOption
          key={device.deviceId + index}
          value={device.deviceId}
          label={device.label.split("(")[0].trim() || `Camera ${index}`}
        />
      ))}
    </ToolSelect>
  ) : null;
}
