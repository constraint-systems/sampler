import { useAtom } from "jotai";
import { CameraAtom, SelectedBoxAtom } from "./atoms";
import { SingleBlockResizer } from "./SingleBlockResizer";
import { MultipleBlockResizer } from "./MultipleBlockResizer";

export function BlockSelected() {
  const [blockSelector] = useAtom(SelectedBoxAtom);
  const [camera] = useAtom(CameraAtom);

  return blockSelector ? (
    <div
      className="absolute border-blue-500 pointer-events-none"
      style={{
        left: 0,
        top: 0,
        borderWidth: Math.max(2, 2 / camera.z),
        width: blockSelector.width,
        height: blockSelector.height,
        transform: `translate(${blockSelector.x}px, ${blockSelector.y}px)`,
      }}
    >
      {blockSelector.length === 1 ? (
        <SingleBlockResizer />
      ) : (
        <MultipleBlockResizer blockSelector={blockSelector} />
      )}
    </div>
  ) : null;
}
