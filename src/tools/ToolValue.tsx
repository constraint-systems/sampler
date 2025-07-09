import { useEffect, useRef, useState } from "react";

export function ToolValue({
  label,
  value,
  min = -Infinity,
  isInteractive = false,
  step = 1,
  shiftStep = 10,
  formatter = (v: number) => v.toString(),
  updater = (newValue: number) =>
    console.warn("No updater provided for ToolValue", newValue),
}: {
  label: string;
  value: number;
  isInteractive?: boolean;
  min?: number;
  step?: number;
  shiftStep?: number;
  formatter?: (v: number) => string;
  updater?: (newValue: number) => void;
}) {
  const [stateValue, setStateValue] = useState(value.toString());
  const [prevValue, setPrevValue] = useState(value);

  function handleFinalize() {
    if (parseFloat(stateValue) === prevValue) {
      return; // No change, do nothing
    }
    const newValue = Math.max(parseFloat(stateValue), min);
    if (isNaN(newValue)) {
      console.warn("Invalid value for ToolValue:", stateValue);
      setStateValue(prevValue.toString());
      return;
    }
    updater(newValue);
    setPrevValue(newValue);
  }

  // Get updates from outside
  useEffect(() => {
    if (prevValue !== value) {
      setStateValue(value.toString());
      setPrevValue(value);
    }
  }, [value, prevValue]);

  return (
    <label
      className={`text-center active grow flex -mx-[0.5ch] px-[0.5ch] ${isInteractive ? "pointer-events-auto" : ""}`}
      data-target="tool-value"
      style={{
        outline: isInteractive ? "solid 1px currentColor" : "none",
      }}
    >
      <div>{label}:</div>
      <input
        type="text"
        className="grow bg-transparent text-right w-full text-inherit focus:outline-none"
        value={formatter(parseFloat(stateValue))}
        readOnly={!isInteractive}
        onChange={(e) => {
          if (isInteractive) {
            setStateValue(e.target.value);
          }
        }}
        onBlur={() => {
          handleFinalize();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && isInteractive) {
            handleFinalize();
            (e.target as HTMLInputElement).blur(); // Remove focus after Enter
          }
          if (e.key === "Escape" && isInteractive) {
            setStateValue(prevValue.toString());
          }
          if (e.key === "ArrowUp" && isInteractive) {
            e.preventDefault(); // Prevent default scrolling behavior
            const offset = e.shiftKey ? shiftStep : step; // Shift + ArrowUp increases by 10
            const newValue = parseFloat(stateValue) + offset;
            setStateValue(newValue.toString());
            updater(newValue);
          }
          if (e.key === "ArrowDown" && isInteractive) {
            e.preventDefault(); // Prevent default scrolling behavior
            const offset = e.shiftKey ? shiftStep : step; // Shift + ArrowDown decreases by 10
            const newValue = parseFloat(stateValue) - offset;
            setStateValue(newValue.toString());
            updater(newValue);
          }
        }}
        onWheel={(e) => {
          if (isInteractive) {
            e.preventDefault(); // Prevent default scrolling behavior
            const offset = e.shiftKey ? shiftStep : step; // Shift + Wheel increases/decreases by 10
            const newValue =
              parseFloat(stateValue) + (e.deltaY < 0 ? offset : -offset);
            setStateValue(newValue.toString());
            updater(newValue);
          }
        }}
      />
    </label>
  );
}
