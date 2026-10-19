import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { SceneLayout } from "../components/scene-layout";

const stages = [
  ["1", "Guru", "Mengisi raport", "#eaf3e8"],
  ["2", "Kepala Sekolah", "Meninjau & menyetujui", "#f8efd6"],
  ["3", "Admin Sekolah", "Menerbitkan raport", "#e8f0e7"],
];

export function WorkflowScene() {
  return (
    <SceneLayout dark>
      <div style={{ padding: "92px 120px", position: "relative" }}>
        <BrandMark compact light />
        <AnimatedText delay={7} style={{ marginTop: 34 }}>
          <p
            style={{
              color: "#bfd8bf",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 2,
              margin: 0,
            }}
          >
            ALUR KERJA YANG JELAS
          </p>
        </AnimatedText>
        <AnimatedText delay={15} style={{ marginTop: 16 }}>
          <h2
            style={{
              color: "#fffdf7",
              fontSize: 63,
              letterSpacing: -3,
              lineHeight: 1.06,
              margin: 0,
              maxWidth: 980,
            }}
          >
            Setiap peran tahu apa yang perlu dilakukan.
          </h2>
        </AnimatedText>
        <div
          style={{
            alignItems: "stretch",
            display: "flex",
            gap: 26,
            marginTop: 64,
          }}
        >
          {stages.map(([number, role, action, color], index) => (
            <AnimatedText
              key={role}
              delay={28 + index * 12}
              style={{ flex: 1 }}
            >
              <div
                style={{
                  background: "#fffdf7",
                  borderRadius: 24,
                  color: "#193323",
                  minHeight: 236,
                  padding: 28,
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    background: color,
                    borderRadius: 99,
                    color: "#2f6b45",
                    display: "flex",
                    fontSize: 20,
                    fontWeight: 800,
                    height: 42,
                    justifyContent: "center",
                    width: 42,
                  }}
                >
                  {number}
                </div>
                <p
                  style={{
                    color: "#617064",
                    fontSize: 17,
                    fontWeight: 700,
                    margin: "26px 0 6px",
                  }}
                >
                  {role}
                </p>
                <h3
                  style={{
                    fontSize: 29,
                    letterSpacing: -1,
                    lineHeight: 1.13,
                    margin: 0,
                  }}
                >
                  {action}
                </h3>
              </div>
            </AnimatedText>
          ))}
        </div>
        <AnimatedText delay={72} style={{ marginTop: 42 }}>
          <p style={{ color: "#dcebd9", fontSize: 25, margin: 0 }}>
            Tidak ada perpindahan status yang diam-diam. Semua proses tetap
            berada dalam kendali sekolah.
          </p>
        </AnimatedText>
      </div>
    </SceneLayout>
  );
}
