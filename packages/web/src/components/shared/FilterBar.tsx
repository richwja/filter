interface FilterBarProps {
  left?: React.ReactNode;
  middle?: React.ReactNode;
  right?: React.ReactNode;
}

export function FilterBar({ left, middle, right }: FilterBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>{left}</div>
      {middle && <div className="flex items-center gap-3">{middle}</div>}
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
