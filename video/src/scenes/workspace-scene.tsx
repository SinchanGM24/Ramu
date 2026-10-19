import { interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../components/animated-text";
import { BrandMark } from "../components/brand-mark";
import { DeviceFrame } from "../components/device-frame";
import { SceneLayout } from "../components/scene-layout";

const studentRows = [
  ["Alya Putri", "Kelas Apel", "82%"],
  ["Bima Pratama", "Kelas Melati", "Lengkap"],
  ["Citra Lestari", "Kelas Merpati", "45%"],
];

export function WorkspaceScene({
  assessment = false,
}: {
  assessment?: boolean;
}) {
  const frame = useCurrentFrame();
  const offset = interpolate(frame, [0, 165], [38, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <SceneLayout>
      <div
        style={{
          display: "flex",
          gap: 72,
          height: "100%",
          padding: "96px 120px",
          position: "relative",
        }}
      >
        <div style={{ alignSelf: "center", flex: "0 0 38%" }}>
          <BrandMark compact />
          <AnimatedText delay={8} style={{ marginTop: 32 }}>
            <p
              style={{
                color: "#2f6b45",
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: 2.1,
                margin: 0,
              }}
            >
              {assessment ? "RUANG KERJA GURU" : "ADMINISTRASI SEKOLAH"}
            </p>
          </AnimatedText>
          <AnimatedText delay={18} style={{ marginTop: 18 }}>
            <h2
              style={{
                fontSize: 62,
                letterSpacing: -3,
                lineHeight: 1.06,
                margin: 0,
              }}
            >
              {assessment
                ? "Setiap murid, diperhatikan."
                : "Semua data sekolah, terhubung."}
            </h2>
          </AnimatedText>
          <AnimatedText delay={28} style={{ marginTop: 24 }}>
            <p
              style={{
                color: "#5e6c61",
                fontSize: 26,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {assessment
                ? "Guru mengisi indikator, narasi, dan data akhir semester secara individual."
                : "Kelola murid, kelas, guru, dan tahun ajaran dari satu tempat yang rapi."}
            </p>
          </AnimatedText>
          <AnimatedText delay={45} style={{ marginTop: 40 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 14 }}>
              <span
                style={{
                  background: "#ddecda",
                  borderRadius: 99,
                  height: 14,
                  width: 14,
                }}
              />
              <span style={{ color: "#34553f", fontSize: 19, fontWeight: 700 }}>
                {assessment
                  ? "Penilaian individual dan narasi perkembangan"
                  : "Riwayat akademik tetap tersimpan"}
              </span>
            </div>
          </AnimatedText>
        </div>
        <div
          style={{
            alignSelf: "center",
            flex: 1,
            transform: `translateY(${offset}px)`,
          }}
        >
          <DeviceFrame
            label={
              assessment
                ? "Pengisian raport · Alya Putri"
                : "Data akademik · 2026"
            }
          >
            {assessment ? <AssessmentMockup /> : <DashboardMockup />}
          </DeviceFrame>
        </div>
      </div>
    </SceneLayout>
  );
}

function DashboardMockup() {
  return (
    <div style={{ display: "flex", minHeight: 370 }}>
      <aside
        style={{
          background: "#2f6b45",
          color: "#f7f4e9",
          padding: "24px 18px",
          width: 122,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800 }}>RAMU</div>
        {["Dashboard", "Akademik", "Murid", "Raport"].map((item, index) => (
          <div
            key={item}
            style={{
              background: index === 1 ? "rgba(255,255,255,.18)" : "transparent",
              borderRadius: 8,
              fontSize: 10,
              marginTop: index === 0 ? 34 : 12,
              padding: "9px 8px",
            }}
          >
            {item}
          </div>
        ))}
      </aside>
      <main style={{ padding: "24px 28px", width: "100%" }}>
        <p
          style={{ color: "#78907d", fontSize: 12, fontWeight: 700, margin: 0 }}
        >
          TAHUN AJARAN AKTIF
        </p>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            marginTop: 7,
          }}
        >
          <strong style={{ color: "#193323", fontSize: 26 }}>
            2026 · Semester I
          </strong>
          <span
            style={{
              background: "#e9f1e6",
              borderRadius: 99,
              color: "#2f6b45",
              fontSize: 11,
              fontWeight: 800,
              padding: "7px 10px",
            }}
          >
            Aktif
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
          {[
            ["60", "Murid aktif"],
            ["3", "Kelas aktif"],
            ["42", "Raport berjalan"],
          ].map(([value, label]) => (
            <div
              key={label}
              style={{
                background: "#f7f8f2",
                border: "1px solid #e4e9df",
                borderRadius: 14,
                flex: 1,
                padding: 14,
              }}
            >
              <div style={{ color: "#234b34", fontSize: 24, fontWeight: 800 }}>
                {value}
              </div>
              <div style={{ color: "#718072", fontSize: 10, marginTop: 5 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          {studentRows.map(([name, group, status]) => (
            <div
              key={name}
              style={{
                alignItems: "center",
                borderTop: "1px solid #edf0e9",
                display: "flex",
                fontSize: 11,
                justifyContent: "space-between",
                padding: "11px 0",
              }}
            >
              <strong style={{ color: "#243c2a" }}>{name}</strong>
              <span style={{ color: "#718072" }}>{group}</span>
              <span style={{ color: "#2f6b45", fontWeight: 700 }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function AssessmentMockup() {
  return (
    <div style={{ padding: "24px 30px" }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              color: "#718072",
              fontSize: 11,
              fontWeight: 700,
              margin: 0,
            }}
          >
            EDITOR RAPORT
          </p>
          <strong style={{ color: "#193323", fontSize: 24 }}>Alya Putri</strong>
        </div>
        <span
          style={{
            background: "#f7edce",
            borderRadius: 99,
            color: "#795b17",
            fontSize: 10,
            fontWeight: 800,
            padding: "8px 10px",
          }}
        >
          82% terisi
        </span>
      </div>
      {["Nilai-Nilai Agama dan Moral", "Fisik Motorik", "Kognitif"].map(
        (area, index) => (
          <div
            key={area}
            style={{
              border: "1px solid #e4e9df",
              borderRadius: 13,
              marginTop: 14,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <strong style={{ color: "#243c2a", fontSize: 13 }}>{area}</strong>
              <span style={{ color: "#4e875b", fontSize: 11, fontWeight: 800 }}>
                {index === 1 ? "Sebagian terisi" : "Lengkap"}
              </span>
            </div>
            <div
              style={{
                background: "#ecf1e8",
                borderRadius: 99,
                height: 6,
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#4f8a5f",
                  borderRadius: 99,
                  height: "100%",
                  width: `${index === 1 ? 55 : 100}%`,
                }}
              />
            </div>
          </div>
        ),
      )}
      <div
        style={{
          background: "#2f6b45",
          borderRadius: 12,
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
          marginLeft: "auto",
          marginTop: 18,
          padding: "11px 15px",
          width: "fit-content",
        }}
      >
        Kirim untuk ditinjau
      </div>
    </div>
  );
}
