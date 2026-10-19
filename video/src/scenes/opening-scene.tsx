import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BrandMark } from "../components/brand-mark";
import { AnimatedText } from "../components/animated-text";

export function OpeningScene() {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 150], [1, 1.08], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: "#f6f2e8",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
      }}
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
            "linear-gradient(90deg, rgba(25,48,32,.68) 0%, rgba(25,48,32,.32) 38%, rgba(25,48,32,0) 66%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div style={{ left: 120, position: "absolute", top: 118, width: 710 }}>
        <AnimatedText>
          <div
            style={{
              borderRadius: 20,
              display: "inline-block",
              padding: "8px 14px",
              background: "rgba(255,253,247,.88)",
              color: "#2f6b45",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            UNTUK SEKOLAH TK & PAUD
          </div>
        </AnimatedText>
        <AnimatedText delay={12} style={{ marginTop: 30 }}>
          <h1
            style={{
              color: "#fffdf7",
              fontSize: 76,
              letterSpacing: -3.8,
              lineHeight: 1.04,
              margin: 0,
            }}
          >
            Raport PAUD, lebih rapi.
          </h1>
        </AnimatedText>
        <AnimatedText delay={24} style={{ marginTop: 22 }}>
          <p
            style={{
              color: "#f8f4e9",
              fontSize: 28,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Satu ruang kerja yang membantu sekolah menjaga setiap perkembangan
            murid.
          </p>
        </AnimatedText>
        <AnimatedText delay={36} style={{ marginTop: 62 }}>
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
      </div>
    </AbsoluteFill>
  );
}
