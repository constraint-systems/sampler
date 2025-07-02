import { useAtom } from "jotai";
import { BlockIdsAtom, BlockMapAtom, SelectedBlockIdsAtom, StateRefAtom } from "../atoms";

export function useApplyHistoryState()  {
  const [stateRef] = useAtom(StateRefAtom);
  const [, setBlockMap] = useAtom(BlockMapAtom);
  const [, setBlockIds] = useAtom(BlockIdsAtom);
  const [, setSelectedBlockIds] = useAtom(SelectedBlockIdsAtom);

  return function applyHistoryState(historyState: Record<string, any>) {
    if (historyState.blockMap) {
      stateRef.blockMap = historyState.blockMap;
      setBlockMap(historyState.blockMap);
    }
    if (historyState.blockIds) {
      stateRef.blockIds = historyState.blockIds;
      setBlockIds(historyState.blockIds);
    }
    if (historyState.selectedBlockIds) {
      stateRef.selectedBlockIds = historyState.selectedBlockIds;
      setSelectedBlockIds(historyState.selectedBlockIds);
    }
  }
}
