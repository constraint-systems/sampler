export function ToolCheckbox({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="grow pointer-events-auto flex items-center pl-[0.75ch] gap-[1ch] active hover:bg-current group -mx-[0.5ch] px-[0.5ch]"
      data-target="tool-button"
      onPointerDown={onClick}
      style={{
        outline: "solid 1px currentColor",
      }}
    >
      <div className="text-inherit group-hover:text-black">{checked ? "■" : "□"} {label}</div>
    </button>
  );
}
