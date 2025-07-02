import { useAtom } from "jotai";
import { CameraAtom } from "./atoms";

const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
const sides = ["top", "right", "bottom", "left"];

export function GeneralizedResizer() {
  const [camera] = useAtom(CameraAtom);

  const sideSize = 12 / camera.z;
  const cornerSize = 24 / camera.z;

  return (
    <>
      {sides.map((side) => {
        return (
          <div
            key={side}
            className={`absolute touch-none bg-green-500 ${side}`}
            style={{
              width: side === "top" || side === "bottom" ? "100%" : sideSize,
              height: side === "left" || side === "right" ? "100%" : sideSize,
              left: side === "left" ? -sideSize / 2 : undefined,
              right: side === "right" ? -sideSize / 2 : undefined,
              top: side === "top" ? -sideSize / 2 : undefined,
              bottom: side === "bottom" ? -sideSize / 2 : undefined,
            }}
          />
        );
      })}
      {corners.map((corner) => {
        return (
          <div
            key={corner}
            className={`absolute bg-red-500 touch-none ${corner}`}
            style={{
              width: cornerSize,
              height: cornerSize,
              left:
                corner === "top-left" || corner === "bottom-left"
                  ? -cornerSize / 2
                  : "auto",
              right:
                corner === "top-right" || corner === "bottom-right"
                  ? -cornerSize / 2
                  : "auto",
              top:
                corner === "top-left" || corner === "top-right"
                  ? -cornerSize / 2
                  : "auto",
              bottom:
                corner === "bottom-left" || corner === "bottom-right"
                  ? -cornerSize / 2
                  : "auto",
            }}
          ></div>
        );
      })}
    </>
  );
}
