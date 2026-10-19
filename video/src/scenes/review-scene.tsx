import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { SceneLayout } from "../components/scene-layout";

export function ReviewScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const approved = spring({
    config: { damping: 180, stiffness: 90 },
    fps,
    frame: frame - 98,
  });
  const lift = interpolate(approved, [0, 1], [16, 0]);

  return (
    <SceneLayout dark>
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
        <div style={{ flex: "0 0 38%" }}>
          <BrandMark compact light />
          <AnimatedText delay={8} style={{ marginTop: 30 }}>
            <p
              style={{
                color: "#cde3ca",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2,
                margin: 0,
              }}
            >
              KEPALA SEKOLAH
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
              Tinjau dengan kendali penuh.
            </h2>
          </AnimatedText>
          <AnimatedText delay={30} style={{ marginTop: 24 }}>
            <p
              style={{
                color: "#d9e7d7",
                fontSize: 25,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              Setujui raport yang sesuai, atau kembalikan ke guru dengan alasan
              revisi yang jelas.
            </p>
          </AnimatedText>
        </div>

        <div style={{ flex: 1, transform: `translateY(${lift}px)` }}>
          <div
            style={{
              background: "#fffdf7",
              borderRadius: 28,
              boxShadow: "0 34px 86px rgba(7,28,15,.28)",
              color: "#193323",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                alignItems: "center",
                borderBottom: "1px solid #e8eee5",
                display: "flex",
                justifyContent: "space-between",
                padding: "24px 30px",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#718072",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    margin: 0,
                  }}
                >
                  TINJAUAN RAPORT
                </p>
                <strong style={{ fontSize: 25 }}>Alya Putri</strong>
              </div>
              <span
                style={{
                  background: "#f8edce",
                  borderRadius: 99,
                  color: "#795b17",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "9px 12px",
                }}
              >
                Menunggu tinjauan
              </span>
            </div>

            <div style={{ display: "flex", gap: 20, padding: 30 }}>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: "#718072",
                    fontSize: 13,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  RINGKASAN PENILAIAN
                </p>
                {[
                  ["Indikator", "Lengkap"],
                  ["Narasi", "Tersedia"],
                  ["Data akhir semester", "Tersedia"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      alignItems: "center",
                      borderBottom: "1px solid #edf0e9",
                      display: "flex",
                      fontSize: 15,
                      justifyContent: "space-between",
                      padding: "15px 0",
                    }}
                  >
                    <span>{label}</span>
                    <strong style={{ color: "#397549" }}>{value}</strong>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: "#f4f7f1",
                  borderRadius: 18,
                  padding: 19,
                  width: 220,
                }}
              >
                <p
                  style={{
                    color: "#718072",
                    fontSize: 12,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  PENANGGUNG JAWAB
                </p>
                <p
                  style={{ fontSize: 16, fontWeight: 800, margin: "12px 0 0" }}
                >
                  Kepala Sekolah
                </p>
                <p style={{ color: "#657267", fontSize: 13, lineHeight: 1.4 }}>
                  Periksa detail sebelum memberi keputusan.
                </p>
              </div>
            </div>

            <div
              style={{
                alignItems: "center",
                background: "#f8faf7",
                borderTop: "1px solid #e8eee5",
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                padding: "20px 30px",
              }}
            >
              <span
                style={{
                  border: "1px solid #b9cbb7",
                  borderRadius: 12,
                  color: "#35593e",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "12px 14px",
                }}
              >
                Minta revisi
              </span>
              <span
                style={{
                  background: "#2f6b45",
                  borderRadius: 12,
                  color: "#fffdf7",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "13px 16px",
                }}
              >
                Setujui raport
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#ddecda",
              borderRadius: 16,
              color: "#28633a",
              fontSize: 16,
              fontWeight: 800,
              margin: "-3px 26px 0 auto",
              opacity: approved,
              padding: "15px 18px",
              transform: `translateY(${interpolate(approved, [0, 1], [14, 0])}px)`,
              width: 180,
            }}
          >
            ✓ Disetujui
          </div>
        </div>
      </div>
    </SceneLayout>
  );
}
