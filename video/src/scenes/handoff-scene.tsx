import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { SceneLayout } from "../components/scene-layout";

export function HandoffScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reportProgress = spring({
    config: { damping: 150, stiffness: 90 },
    fps,
    frame: frame - 42,
  });
  const travel = interpolate(reportProgress, [0, 1], [-70, 0]);

  return (
    <SceneLayout>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 82,
          height: "100%",
          padding: "92px 132px",
          position: "relative",
        }}
      >
        <div style={{ flex: "0 0 40%" }}>
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
              ALUR RAPORT
            </p>
          </AnimatedText>
          <AnimatedText delay={18} style={{ marginTop: 17 }}>
            <h2
              style={{
                fontSize: 60,
                letterSpacing: -3,
                lineHeight: 1.06,
                margin: 0,
              }}
            >
              Siap ditinjau.
            </h2>
          </AnimatedText>
          <AnimatedText delay={29} style={{ marginTop: 23 }}>
            <p
              style={{
                color: "#5e6c61",
                fontSize: 25,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              Setelah isian lengkap, guru mengirim satu raport untuk ditinjau.
              Tidak ada perubahan akademik yang berjalan diam-diam.
            </p>
          </AnimatedText>
        </div>

        <div
          style={{
            flex: 1,
            opacity: reportProgress,
            transform: `translateX(${travel}px)`,
          }}
        >
          <div
            style={{
              background: "#fffdf8",
              border: "1px solid #dde7d9",
              borderRadius: 26,
              boxShadow: "0 30px 70px rgba(23,55,35,.15)",
              padding: 32,
            }}
          >
            <div
              style={{
                alignItems: "flex-start",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    color: "#718072",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    margin: 0,
                  }}
                >
                  RAPORT PERKEMBANGAN
                </p>
                <h3
                  style={{
                    color: "#193323",
                    fontSize: 31,
                    margin: "9px 0 0",
                  }}
                >
                  Alya Putri
                </h3>
                <p
                  style={{ color: "#718072", fontSize: 15, margin: "7px 0 0" }}
                >
                  Kelas Apel - Semester I - 2026
                </p>
              </div>
              <span
                style={{
                  background: "#ddecda",
                  borderRadius: 99,
                  color: "#2e6942",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "9px 12px",
                }}
              >
                Lengkap
              </span>
            </div>

            {[
              "Indikator perkembangan",
              "Narasi perkembangan",
              "Data akhir semester",
            ].map((item) => (
              <div
                key={item}
                style={{
                  alignItems: "center",
                  borderBottom: "1px solid #edf0e9",
                  display: "flex",
                  fontSize: 16,
                  justifyContent: "space-between",
                  padding: "17px 0",
                }}
              >
                <span style={{ color: "#314137" }}>{item}</span>
                <span
                  style={{
                    background: "#e9f1e6",
                    borderRadius: 99,
                    color: "#327044",
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "7px 10px",
                  }}
                >
                  ✓ Selesai
                </span>
              </div>
            ))}

            <div
              style={{
                background: "#2f6b45",
                borderRadius: 14,
                color: "#fffdf7",
                fontSize: 16,
                fontWeight: 800,
                marginLeft: "auto",
                marginTop: 24,
                padding: "15px 18px",
                textAlign: "center",
                width: 230,
              }}
            >
              Kirim untuk ditinjau
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              background: "#e7f0e5",
              borderRadius: 16,
              color: "#2f6b45",
              display: "flex",
              fontSize: 16,
              fontWeight: 800,
              gap: 12,
              margin: "-4px 28px 0 auto",
              padding: "15px 18px",
              position: "relative",
              width: 275,
            }}
          >
            <span style={{ fontSize: 22 }}>✓</span>
            Menunggu tinjauan
          </div>
        </div>
      </div>
    </SceneLayout>
  );
}
