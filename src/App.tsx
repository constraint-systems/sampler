import { Keyboard } from "./Keyboard";
import { RefUpdater } from "./RefUpdater";
import { Toolbar } from "./Toolbar";
import { useStream } from "./streams/useStream";
import { Zoom } from "./Zoom";
import { useDevices } from "./useDevices";
import { useAtom } from "jotai";
import { showCropModalAtom } from "./atoms";
import { CropModal } from "./CropModal";

export function App() {
  useDevices();
  useStream();
  const [showCropModal, setShowCropModal] = useAtom(showCropModalAtom);

  return (
    <div className="w-full relative h-[100dvh] overflow-hidden">
      <Zoom />
      <Keyboard />
      <RefUpdater />
      {showCropModal && <CropModal />}
    </div>
  );
}

export default App;


