import { Keyboard } from "./Keyboard";
import { RefUpdater } from "./RefUpdater";
import { Toolbar } from "./Toolbar";
import { useStream } from "./streams/useStream";
import { Zoom } from "./Zoom";
import { useDevices } from "./useDevices";

export function App() {
  useDevices();
  useStream();

  return (
    <div className="w-full relative h-[100dvh] overflow-hidden">
      <Zoom />
      <Keyboard />
      <Toolbar />
      <RefUpdater />
    </div>
  );
}

export default App;
