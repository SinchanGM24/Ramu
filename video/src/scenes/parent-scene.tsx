import { interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { SceneLayout } from "../components/scene-layout";

export function ParentScene() {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 240], [46, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <SceneLayout>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 78,
          height: "100%",
          padding: "88px 140px",
          position: "relative",
        }}
      >
        <div style={{ flex: "0 0 44%" }}>
          <BrandMark compact />
          <AnimatedText delay={8} style={{ marginTop: 34 }}>
            <p
              style={{
                color: "#2f6b45",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2,
                margin: 0,
              }}
            >
              UNTUK WALI MURID
            </p>
          </AnimatedText>
          <AnimatedText delay={18} style={{ marginTop: 17 }}>
            <h2
              style={{
                fontSize: 62,
                letterSpacing: -3.2,
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Raport siap dilihat dengan aman.
            </h2>
          </AnimatedText>
          <AnimatedText delay={30} style={{ marginTop: 25 }}>
            <p
              style={{
                color: "#5e6c61",
                fontSize: 25,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              Tautan dan PIN memberi wali akses khusus untuk melihat, mengunduh,
              atau mencetak raport anaknya.
            </p>
          </AnimatedText>
          <AnimatedText delay={40} style={{ marginTop: 36 }}>
            <div
              style={{
                alignItems: "center",
                background: "#e9f1e6",
                borderRadius: 18,
                color: "#2d6542",
                display: "flex",
                fontSize: 18,
                fontWeight: 800,
                gap: 12,
                padding: "16px 18px",
                width: "fit-content",
              }}
            >
              <span
                style={{
                  background: "#4e875b",
                  borderRadius: 99,
                  height: 12,
                  width: 12,
                }}
              />
              Tautan pribadi + PIN enam digit
            </div>
          </AnimatedText>
        </div>
        <div style={{ transform: `translateY(${shift}px)`, width: 440 }}>
          <div
            style={{
              background: "#243a2d",
              border: "12px solid #243a2d",
              borderRadius: 52,
              boxShadow: "0 45px 90px rgba(19,47,29,.25)",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "#fffdf8", minHeight: 650, padding: 28 }}>
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong style={{ color: "#2f6b45", fontSize: 17 }}>RAMU</strong>
                <span style={{ color: "#78857b", fontSize: 11 }}>
                  Akses wali
                </span>
              </div>
              <div
                style={{
                  background: "#edf4ea",
                  borderRadius: 18,
                  marginTop: 24,
                  padding: 18,
                }}
              >
                <p style={{ color: "#617064", fontSize: 12, margin: 0 }}>
                  Raport perkembangan
                </p>
                <h3
                  style={{ color: "#193323", fontSize: 24, margin: "7px 0 0" }}
                >
                  Alya Putri
                </h3>
                <p
                  style={{ color: "#617064", fontSize: 13, margin: "7px 0 0" }}
                >
                  Semester I · 2026
                </p>
              </div>
              <p
                style={{
                  color: "#657267",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: "27px 0 11px",
                }}
              >
                Perkembangan Ananda
              </p>
              {[
                "Nilai Agama dan Moral",
                "Fisik Motorik",
                "Kognitif",
                "Bahasa",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    alignItems: "center",
                    borderBottom: "1px solid #edf0e9",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "13px 0",
                  }}
                >
                  <span style={{ color: "#314137", fontSize: 13 }}>{item}</span>
                  <span
                    style={{
                      background: index === 1 ? "#f7edce" : "#e9f1e6",
                      borderRadius: 99,
                      color: "#426f4c",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "6px 8px",
                    }}
                  >
                    {index === 1 ? "BSH" : "BSB"}
                  </span>
                </div>
              ))}
              <div
                style={{
                  background: "#2f6b45",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  marginTop: 24,
                  padding: "13px",
                  textAlign: "center",
                }}
              >
                Unduh PDF raport
              </div>
            </div>
          </div>
        </div>
      </div>
    </SceneLayout>
  );
}
