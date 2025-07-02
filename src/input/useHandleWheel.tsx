import { panCamera, zoomCamera } from "../Camera";
import { useAtom } from "jotai";
import { CameraAtom, StateRefAtom } from "../atoms";

export function useHandleWheel() {
  const [, setCamera] = useAtom(CameraAtom);
  const [stateRef] = useAtom(StateRefAtom);
  const {  zoomContainer } = stateRef;

  const handleWheel = (event: WheelEvent) => {
    // if current target is input or textarea, do nothing
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")
    ) {
      return;
    }

    const { clientX: x, clientY: y, deltaX, deltaY, ctrlKey } = event;

    if (ctrlKey) {
      setCamera((camera) =>
        zoomCamera(camera, { x, y }, deltaY / 400, stateRef.zoomContainer!),
      );
    } else {
      setCamera((camera) => panCamera(camera, deltaX, deltaY));
    }
  };
  return handleWheel;
}
