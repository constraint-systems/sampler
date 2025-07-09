import { Keyboard } from "./Keyboard";
import { RefUpdater } from "./RefUpdater";
import { useStream } from "./streams/useStream";
import { Zoom } from "./Zoom";
import { useDevices } from "./useDevices";
import { useAtom } from "jotai";
import { showCropModalAtom } from "./atoms";
import { CropModal } from "./CropModal";
import { OverlayToolbar } from "./OverlayToolbar";
import { useHandleDropImage } from "./hooks";

export function App() {
  useDevices();
  useStream();
  useHandleDropImage();
  const [showCropModal] = useAtom(showCropModalAtom);

  return (
    <div className="w-full relative h-[100dvh] overflow-hidden">
      <Zoom />
      <Keyboard />
      <RefUpdater />
      <OverlayToolbar />
      {showCropModal && <CropModal />}
    </div>
  );
}

export default App;


