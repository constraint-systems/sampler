import { useAtom } from "jotai";
import { CameraAtom, ControlDownAtom, SelectedBoxAtom } from "./atoms";
import { SingleBlockResizer } from "./SingleBlockResizer";
import { MultipleBlockResizer } from "./MultipleBlockResizer";

export function BlockSelected() {
  const [blockSelector] = useAtom(SelectedBoxAtom);
  const [camera] = useAtom(CameraAtom);
  const [controlDown] = useAtom(ControlDownAtom);

  const singleBlockSelected = blockSelector && blockSelector.length === 1;

  return blockSelector ? (
    <div
      className="absolute border-blue-500 pointer-events-none"
      style={{
        left: 0,
        top: 0,
        borderColor:
          singleBlockSelected && controlDown
            ? "rgb(34, 197, 94)"
            : "rgb(59, 130, 246)",
        borderWidth: Math.max(2, 2 / camera.z),
        width: blockSelector.width,
        height: blockSelector.height,
        transform: `translate(${blockSelector.x}px, ${blockSelector.y}px)`,
      }}
    >
      {blockSelector.length === 1 ? (
        controlDown ? (
          <SingleCropResizer />
        ) : (
          <SingleBlockResizer />
        )
      ) : (
        <MultipleBlockResizer blockSelector={blockSelector} />
      )}
    </div>
  ) : null;
}

function SingleCropResizer() {
  const [camera] = useAtom(CameraAtom);
  const sides = ["left", "top", "right", "bottom"];
  const cursorMap = {
    left: "ew-resize",
    top: "ns-resize",
    right: "ew-resize",
    bottom: "ns-resize",
  };

  const size = 8 / camera.z;

  return (
    <>
      {sides.map((side) => (
        <div
          key={side}
          className={`absolute touch-none pointer-events-auto border-blue-500`}
          style={{
            width: side === "left" || side === "right" ? size : "100%",
            height: side === "top" || side === "bottom" ? size : "100%",
            left: side === "left" ? -size / 2 : side === "right" ? "100%" : 0,
            top: side === "top" ? -size / 2 : side === "bottom" ? "100%" : 0,
            right: side === "right" ? -size / 2 : 0,
            bottom: side === "bottom" ? -size / 2 : 0,
            cursor: cursorMap[side as keyof typeof cursorMap],
          }}
        />
      ))}
    </>
  );
}
