import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { SceneLayout } from "../components/scene-layout";

const reports = ["Alya Putri", "Bima Saputra", "Citra Lestari"];

export function PublishScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const published = spring({
    config: { damping: 190, stiffness: 90 },
    fps,
    frame: frame - 105,
  });

  return (
    <SceneLayout>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 80,
          height: "100%",
          padding: "90px 132px",
          position: "relative",
        }}
      >
        <div style={{ flex: "0 0 39%" }}>
          <BrandMark compact />
          <AnimatedText delay={8} style={{ marginTop: 30 }}>
            <p
              style={{
                color: "#2f6b45",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2,
                margin: 0,
              }}
            >
              ADMIN SEKOLAH
            </p>
          </AnimatedText>
          <AnimatedText delay={18} style={{ marginTop: 17 }}>
            <h2
              style={{
                fontSize: 61,
                letterSpacing: -3.1,
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Terbitkan saat siap.
            </h2>
          </AnimatedText>
          <AnimatedText delay={30} style={{ marginTop: 24 }}>
            <p
              style={{
                color: "#5e6c61",
                fontSize: 25,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              Raport yang sudah disetujui dapat diterbitkan satu per satu atau
              sekaligus, dengan akses wali yang disiapkan setelahnya.
            </p>
          </AnimatedText>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              background: "#fffdf8",
              border: "1px solid #dde7d9",
              borderRadius: 27,
              boxShadow: "0 30px 72px rgba(23,55,35,.15)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "26px 30px 19px" }}>
              <p
                style={{
                  color: "#718072",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                  margin: 0,
                }}
              >
                PUBLIKASI & KIRIM RAPORT
              </p>
              <h3 style={{ color: "#193323", fontSize: 27, margin: "9px 0 0" }}>
                3 raport siap diterbitkan
              </h3>
            </div>
            {reports.map((name, index) => (
              <div
                key={name}
                style={{
                  alignItems: "center",
                  borderTop: "1px solid #edf0e9",
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "18px 30px",
                }}
              >
                <div style={{ alignItems: "center", display: "flex", gap: 13 }}>
                  <span
                    style={{
                      background: "#e5f0df",
                      borderRadius: 9,
                      color: "#2f6b45",
                      fontSize: 14,
                      fontWeight: 800,
                      padding: "7px 9px",
                    }}
                  >
                    {index + 1}
                  </span>
                  <strong style={{ color: "#2a402f", fontSize: 16 }}>
                    {name}
                  </strong>
                </div>
                <span
                  style={{
                    background: published > 0.7 ? "#ddecda" : "#f8edce",
                    borderRadius: 99,
                    color: published > 0.7 ? "#2d6a3e" : "#795b17",
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "8px 10px",
                  }}
                >
                  {published > 0.7 ? "Diterbitkan" : "Disetujui"}
                </span>
              </div>
            ))}
            <div
              style={{
                background: "#f8faf7",
                borderTop: "1px solid #edf0e9",
                padding: "19px 30px",
                textAlign: "right",
              }}
            >
              <span
                style={{
                  background: "#2f6b45",
                  borderRadius: 13,
                  color: "#fffdf7",
                  display: "inline-block",
                  fontSize: 15,
                  fontWeight: 800,
                  padding: "14px 17px",
                }}
              >
                Terbitkan 3 raport
              </span>
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: "#e6f0e3",
              borderRadius: 17,
              display: "flex",
              gap: 13,
              margin: "-2px 28px 0 auto",
              opacity: published,
              padding: "15px 18px",
              transform: `translateY(${interpolate(published, [0, 1], [15, 0])}px)`,
              width: 314,
            }}
          >
            <span style={{ fontSize: 23 }}>✓</span>
            <div>
              <strong style={{ color: "#28633a", fontSize: 15 }}>
                Tautan wali siap
              </strong>
              <p style={{ color: "#568061", fontSize: 12, margin: "3px 0 0" }}>
                Tautan pribadi dan PIN dibuat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SceneLayout>
  );
}
