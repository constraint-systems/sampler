import { useAtom } from "jotai";
import { stampMoveDirectionAtom, stampMoveOffsetAtom } from "./atoms";
import {
  StampMoveDirectionType,
  StampMoveOffsetType,
} from "./types";
import { offsets } from "./consts";

export function ToolDirection() {
  const [stampMoveDirection, setStampMoveDirection] = useAtom(
    stampMoveDirectionAtom,
  );
  const [stampMoveOffset, setStampMoveOffset] = useAtom(stampMoveOffsetAtom);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="grid grid-cols-3">
        {["↖", "↑", "↗", "←", "•", "→", "↙", "↓", "↘"].map((value) => (
          <button
            key={value}
            className={`px-2 pointer-events-auto ${
              stampMoveDirection === value ? "bg-neutral-700" : "bg-neutral-800"
            } hover:bg-neutral-700 flex justify-center items-center`}
            onClick={(e) => {
              e.stopPropagation();
              setStampMoveDirection(value as StampMoveDirectionType);
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid pointer-events-auto grid-cols-2 grid-flow-row">
        {offsets.map((offset) => {
          return (
            <button
              key={offset}
              className={`px-3 ${
                stampMoveOffset === offset ? "bg-neutral-700" : "bg-neutral-800"
              } hover:bg-neutral-700 flex justify-center items-center`}
              onClick={(e) => {
                e.stopPropagation();
                setStampMoveOffset(offset as StampMoveOffsetType);
              }}
              value={offset}
            >
              {offset}
            </button>
          );
        })}
      </div>
    </div>
  );
}
