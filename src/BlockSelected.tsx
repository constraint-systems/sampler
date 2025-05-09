import { useAtom } from "jotai";
import { CameraAtom, SelectedBoxAtom } from "./atoms";
import { SingleBlockResizer } from "./SingleBlockResizer";
import { MultipleBlockResizer } from "./MultipleBlockResizer";
import { SingleBlockRotator } from "./SingleBlockRotator";
import { MultipleBlockRotator } from "./MultipleBlockRotator";

export function BlockSelected() {
  const [blockSelector] = useAtom(SelectedBoxAtom);
  const [camera] = useAtom(CameraAtom);
  const resizerSize = 16 / camera.z;

  return blockSelector ? (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: blockSelector.width,
          height: blockSelector.height,
          transform: `translate(${blockSelector.x}px, ${blockSelector.y}px) rotate(${blockSelector.rotation}rad)`,
        }}
      >
        <div
          className="absolute left-0 bg-blue-500"
          style={{
            width: Math.max(2, 2 / camera.z),
            top: resizerSize/2,
            height: blockSelector.height - resizerSize,
          }}
        ></div>
        <div
          className="absolute top-0 bg-blue-500"
          style={{
            height: Math.max(2, 2 / camera.z),
            left: resizerSize/2,
            width: blockSelector.width - resizerSize,
          }}
        ></div>
        <div
          className="absolute right-0 bg-blue-500"
          style={{
            width: Math.max(2, 2 / camera.z),
            top: resizerSize/2,
            height: blockSelector.height - resizerSize,
          }}
        ></div>
        <div
          className="absolute bottom-0 bg-blue-500"
          style={{
            height: Math.max(2, 2 / camera.z),
            left: resizerSize/2,
            width: blockSelector.width - resizerSize,
          }}
        ></div>
        {blockSelector.length === 1 ? (
          <>
            <SingleBlockResizer />
            <SingleBlockRotator />
          </>
        ) : (
          <>
            <MultipleBlockResizer blockSelector={blockSelector} />
            <MultipleBlockRotator blockSelector={blockSelector} />
          </>
        )}
      </div>
    </>
  ) : null;
}
