const MARKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/**
 * The one decorative element in the app, and it earns its place: a tailor's tape
 * is the object this whole product is built around. The same tape runs vertically
 * down the editor as the section rail.
 */
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
