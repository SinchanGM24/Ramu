import type { ReactNode } from "react";

export function DeviceFrame({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      style={{
        background: "#1d2b21",
        border: "14px solid #1d2b21",
        borderRadius: 34,
        boxShadow: "0 42px 90px rgba(19, 47, 29, 0.23)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 8,
          height: 34,
          padding: "0 8px",
        }}
      >
        {["#ed6c5d", "#efbd4c", "#55b77b"].map((color) => (
          <span
            key={color}
            style={{ background: color, borderRadius: 99, height: 9, width: 9 }}
          />
        ))}
        <span style={{ color: "#bec8bd", fontSize: 11, marginLeft: 8 }}>
          {label}
        </span>
      </div>
      <div
        style={{ background: "#fffdf8", minHeight: 370, overflow: "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
