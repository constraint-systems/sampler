export function ToolSelect({
  children,
  onChange,
}: {
  children: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      data-target="tool-select"
      className="grow pointer-events-auto active block pt-[3px] pb-[4px] -mx-[0.5ch] px-[0.5ch] text-inherit capitalize bg-transparent"
      onChange={onChange}
      style={{
        outline: "solid 1px currentColor",
      }}
    >
      {children}
    </select>
  );
}

export function ToolSelectOption({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <option className={`px-[0.5ch] bg-neutral-900 hover:bg-current hover:text-black capitalize text-left pt-[3px] pb-[4px]`} value={value}>
      {label}
    </option>
  );
}
