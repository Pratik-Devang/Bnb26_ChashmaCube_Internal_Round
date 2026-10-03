export function ProgressRing({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties} aria-label={`${value}% complete`}>
      <div className="progress-ring__inside">
        <strong>{value}%</strong>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}
