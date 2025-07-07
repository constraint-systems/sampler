export function TwoUp({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 grow gap-[1.5ch] -mx-[0.5ch] px-[0.5ch]">
      {children}
    </div>
  );
}
