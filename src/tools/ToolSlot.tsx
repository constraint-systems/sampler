export function ToolSlot({
  children,
  textColor,
}: {
  children: React.ReactNode;
  textColor?: string;
}) {
  return (
    <div className={`flex grow -mx-[0.5ch] px-[0.5ch] ${textColor || ""}`}>
      {children}
    </div>
  );
}
