import { useAtom } from "jotai";
import { Keyboard } from "./Keyboard";
import { RefUpdater } from "./RefUpdater";
import { Toolbar } from "./Toolbar";
import { Zoom } from "./Zoom";
import {
  showCropModalAtom,
} from "./atoms";
import { CropModal } from "./CropModal";

export function App() {
  const [showCropModal] = useAtom(showCropModalAtom);
  return (
    <div className="w-full relative h-[100dvh]">
      <Zoom />
      <Toolbar />
      <Keyboard />
      {showCropModal ? <CropModal /> : null}
      <RefUpdater />
    </div>
  );
}

export default App;


