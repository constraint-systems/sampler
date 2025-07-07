export function ToolButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="grow pointer-events-auto active hover:bg-current group -mx-[0.5ch] px-[0.5ch]"
      data-target="tool-button"
      onClick={onClick}
      style={{
        outline: "solid 1px currentColor",
      }}
    >
      <span className="text-inherit group-hover:text-black">{children}</span>
    </button>
  );
}
