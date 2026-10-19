export function BrandMark({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div
      style={{ alignItems: "center", display: "flex", gap: compact ? 10 : 14 }}
    >
      <div
        style={{
          alignItems: "center",
          background: light ? "#d9ead4" : "#2f6b45",
          borderRadius: compact ? 14 : 18,
          display: "flex",
          height: compact ? 42 : 56,
          justifyContent: "center",
          width: compact ? 42 : 56,
        }}
      >
        <span
          style={{
            color: light ? "#2f6b45" : "#fffdf7",
            fontFamily: "Georgia, serif",
            fontSize: compact ? 25 : 33,
          }}
        >
          R
        </span>
      </div>
      <div>
        <div
          style={{
            color: light ? "#fffdf7" : "#183725",
            fontSize: compact ? 24 : 32,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          RAMU
        </div>
        {!compact ? (
          <div
            style={{
              color: light ? "#d9ead4" : "#657267",
              fontSize: 14,
              fontWeight: 650,
              letterSpacing: 1.2,
              marginTop: 2,
            }}
          >
            RAPORT MURID
          </div>
        ) : null}
      </div>
    </div>
  );
}
