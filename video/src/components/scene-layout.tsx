import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

export function SceneLayout({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <AbsoluteFill
      style={{
        background: dark ? "#234b34" : "#f6f2e8",
        color: dark ? "#fffdf7" : "#183725",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: dark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(47, 107, 69, 0.08)",
          borderRadius: 999,
          height: 700,
          position: "absolute",
          right: -260,
          top: -360,
          width: 700,
        }}
      />
      <div
        style={{
          background: dark
            ? "rgba(255, 255, 255, 0.07)"
            : "rgba(132, 169, 107, 0.11)",
          borderRadius: 999,
          bottom: -290,
          height: 560,
          left: -200,
          position: "absolute",
          width: 560,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}
