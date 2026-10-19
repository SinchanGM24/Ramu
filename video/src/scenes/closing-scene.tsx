import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";

export function ClosingScene() {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 270], [1.1, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}
    >
      <img
        src={staticFile("illustrations/ramu-promo-school.png")}
        style={{
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          width: "100%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(22,53,34,.88) 0%, rgba(22,53,34,.64) 45%, rgba(22,53,34,.20) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div style={{ left: 140, position: "absolute", top: 158, width: 860 }}>
        <AnimatedText>
          <div
            style={{
              background: "#fffdf7",
              borderRadius: 22,
              display: "inline-block",
              padding: "15px 20px",
            }}
          >
            <BrandMark compact />
          </div>
        </AnimatedText>
        <AnimatedText delay={12} style={{ marginTop: 38 }}>
          <h2
            style={{
              color: "#fffdf7",
              fontSize: 68,
              letterSpacing: -3.5,
              lineHeight: 1.06,
              margin: 0,
            }}
          >
            Satu ruang kerja untuk raport murid.
          </h2>
        </AnimatedText>
        <AnimatedText delay={24} style={{ marginTop: 25 }}>
          <p
            style={{
              color: "#eff4e9",
              fontSize: 29,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Lebih rapi, kolaboratif, dan mudah dipantau.
          </p>
        </AnimatedText>
        <AnimatedText delay={39} style={{ marginTop: 52 }}>
          <div
            style={{
              background: "#b8d6a7",
              borderRadius: 16,
              color: "#183725",
              display: "inline-block",
              fontSize: 22,
              fontWeight: 800,
              padding: "17px 24px",
            }}
          >
            Jadwalkan demo RAMU
          </div>
        </AnimatedText>
      </div>
    </AbsoluteFill>
  );
}
