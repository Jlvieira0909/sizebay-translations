const MARKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export function TapeBand() {
  return (
    <div className="sb-tape" aria-hidden="true">
      <div className="sb-tape__numbers">
        {MARKS.map((mark) => (
          <span key={mark}>{mark}</span>
        ))}
      </div>
      <div className="sb-tape__ticks" />
    </div>
  );
}
