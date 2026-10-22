import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BrandMark } from "./components/brand-mark";
import {
  FPS,
  TOTAL_DURATION_SECONDS,
  type WorkflowScene,
  type WorkflowSceneId,
  workflowScenes,
} from "./data/workflow-script";

const colors = {
  cream: "#f7f2e7",
  paper: "#fffdf8",
  forest: "#123f2d",
  green: "#2f7650",
  leaf: "#d8e8c9",
  mint: "#bcd9ca",
  sun: "#f3cc52",
  coral: "#ef8067",
  ink: "#10261b",
  white: "#fffdf8",
};

const sceneFields: Record<WorkflowSceneId, string> = {
  landing: colors.cream,
  dashboard: colors.sun,
  students: colors.cream,
  assessment: colors.forest,
  narrative: colors.leaf,
  review: colors.coral,
  delivery: colors.cream,
  "parent-pin": colors.forest,
  "parent-report": colors.sun,
  closing: colors.green,
};

const railStages = [
  "Persiapan",
  "Data murid",
  "Penilaian",
  "Tinjauan",
  "Publikasi",
  "Wali",
] as const;

const stageByScene: Partial<Record<WorkflowSceneId, number>> = {
  dashboard: 0,
  students: 1,
  assessment: 2,
  narrative: 2,
  review: 3,
  delivery: 4,
  "parent-pin": 5,
  "parent-report": 5,
};

type Camera = {
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
};

type Highlight = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function PromoVideo() {
  const fadeAudio = (frame: number, level: number) =>
    level *
    interpolate(
      frame,
      [(TOTAL_DURATION_SECONDS - 2) * FPS, TOTAL_DURATION_SECONDS * FPS - 1],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  return (
    <AbsoluteFill
      style={{
        background: colors.forest,
        color: colors.ink,
        fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
        overflow: "hidden",
      }}
    >
      <Audio
        src={staticFile("audio/music-warm-paud.wav")}
        volume={(frame) => fadeAudio(frame, 0.68)}
      />
      <Audio
        src={staticFile("audio/sfx-premium-motion.wav")}
        volume={(frame) => fadeAudio(frame, 0.56)}
      />
      {workflowScenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={scene.from}
          durationInFrames={
            scene.duration + (index === workflowScenes.length - 1 ? 0 : 24)
          }
          style={{ zIndex: index }}
        >
          <Scene scene={scene} first={index === 0} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function Scene({
  first,
  index,
  scene,
}: {
  first: boolean;
  index: number;
  scene: WorkflowScene;
}) {
  const body = (() => {
    switch (scene.id) {
      case "landing":
        return <LandingScene scene={scene} />;
      case "dashboard":
        return <DashboardScene scene={scene} />;
      case "students":
        return <StudentsScene scene={scene} />;
      case "assessment":
        return <AssessmentScene scene={scene} />;
      case "narrative":
        return <NarrativeScene scene={scene} />;
      case "review":
        return <ReviewScene scene={scene} />;
      case "delivery":
        return <DeliveryScene scene={scene} />;
      case "parent-pin":
        return <ParentPinScene scene={scene} />;
      case "parent-report":
        return <ParentReportScene scene={scene} />;
      case "closing":
        return <ClosingScene scene={scene} />;
    }
  })();

  return (
    <SceneReveal first={first} index={index}>
      {body}
    </SceneReveal>
  );
}

function SceneReveal({
  children,
  first,
  index,
}: {
  children: ReactNode;
  first: boolean;
  index: number;
}) {
  const frame = useCurrentFrame();
  const progress = first
    ? 1
    : interpolate(frame, [0, 24], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const origins = ["85% 20%", "18% 78%", "72% 84%", "20% 25%"];
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${progress * 155}% at ${origins[index % origins.length]})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function LandingScene({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const entrance = interpolate(frame, [0, 46], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleIn = spring({
    fps: FPS,
    frame: frame - 10,
    config: { damping: 200, mass: 0.8 },
  });

  return (
    <Chapter field={sceneFields.landing}>
      <div
        style={{
          background: colors.forest,
          height: "100%",
          left: 0,
          position: "absolute",
          top: 0,
          width: "41%",
        }}
      />
      <div
        style={{
          color: colors.white,
          left: 78,
          opacity: titleIn,
          position: "absolute",
          top: 248,
          transform: `translateY(${interpolate(titleIn, [0, 1], [38, 0])}px)`,
          width: 620,
        }}
      >
        <BrandMark compact light />
        <KineticTitle
          color={colors.white}
          size={88}
          text={scene.title}
          width={620}
        />
        <p style={leadStyle(colors.leaf)}>{scene.caption}</p>
      </div>
      <BrowserFrame
        camera={{
          fromScale: 1,
          toScale: 1,
          fromX: 0,
          toX: 0,
          fromY: 0,
          toY: 0,
        }}
        id="landing"
        imagePosition="center top"
        showChrome
        style={{
          height: 790,
          left: 85,
          position: "absolute",
          top: 48,
          transform: `translateX(${entrance * 720}px) scale(${1 - entrance * 0.38})`,
          transformOrigin: "left top",
          width: 1750,
        }}
      />
      <BrowserFrame
        camera={{
          fromScale: 1.15,
          toScale: 1.15,
          fromX: 0,
          toX: 0,
          fromY: 170,
          toY: 170,
        }}
        id="landing-flow"
        imagePosition="center center"
        showChrome
        style={{
          height: 790,
          left: 85,
          position: "absolute",
          top: 570,
          transform: `translateX(${entrance * 720}px) scale(${1 - entrance * 0.38})`,
          transformOrigin: "left top",
          width: 1750,
        }}
      />
    </Chapter>
  );
}

function DashboardScene({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const slide =
    frame < 28
      ? 0
      : interpolate(frame, [28, 52], [0, 1], {
          easing: Easing.inOut(Easing.exp),
          extrapolateRight: "clamp",
        });
  const active = Math.round(slide);
  return (
    <Chapter field={sceneFields.dashboard}>
      <PosterHeader caption={scene.caption} dark scene={scene} width={900} />
      <CaptureCarousel
        ids={["dashboard", "semester"]}
        slide={slide}
        style={{
          height: 720,
          left: 128,
          position: "absolute",
          top: 264,
          width: 1664,
        }}
      />
      <ModuleTabs active={active} labels={["Dashboard", "Semester aktif"]} />
      <WorkflowRail active={0} />
    </Chapter>
  );
}

function StudentsScene({ scene }: { scene: WorkflowScene }) {
  return (
    <Chapter field={sceneFields.students}>
      <div style={{ left: 82, position: "absolute", top: 92, width: 650 }}>
        <KineticTitle size={76} text={scene.title} width={650} />
        <p style={leadStyle(colors.ink)}>{scene.caption}</p>
      </div>
      <BrowserFrame
        camera={{
          fromScale: 1.04,
          toScale: 1.18,
          fromX: 16,
          toX: -70,
          fromY: 12,
          toY: 18,
        }}
        highlight={{ x: 60.6, y: 23, width: 8, height: 7 }}
        id="students"
        style={{
          height: 675,
          left: 80,
          position: "absolute",
          top: 330,
          width: 1460,
        }}
      />
      <GuideCharacter
        image="teacher-guide.png"
        label="Guru"
        style={{ bottom: 60, height: 520, right: -24 }}
      />
      <ActionCopy
        color={colors.forest}
        style={{ right: 86, top: 210 }}
        text="Isi sekali."
      />
      <WorkflowRail active={1} />
    </Chapter>
  );
}

function AssessmentScene({ scene }: { scene: WorkflowScene }) {
  return (
    <Chapter field={sceneFields.assessment} light>
      <PosterHeader caption={scene.caption} scene={scene} width={810} />
      <BrowserFrame
        camera={{
          fromScale: 1.04,
          toScale: 1.22,
          fromX: 0,
          toX: -104,
          fromY: -12,
          toY: -70,
        }}
        highlight={{ x: 79.1, y: 50, width: 5, height: 7 }}
        id="assessment"
        style={{
          height: 735,
          left: 236,
          position: "absolute",
          top: 272,
          width: 1530,
        }}
      />
      <GuideCharacter
        image="teacher-guide.png"
        label="Guru menilai"
        light
        style={{ bottom: 52, height: 450, left: -38 }}
      />
      <ActionCopy
        color={colors.sun}
        light
        style={{ right: 92, top: 205 }}
        text="Pilih MB"
      />
      <WorkflowRail active={2} light />
    </Chapter>
  );
}

function NarrativeScene({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const generated = frame >= 90 ? 1 : 0;
  const buttonFocus = interpolate(frame, [36, 58], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resultFocus = interpolate(frame, [92, 118], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const focusedScale = interpolate(buttonFocus, [0, 1], [1, 1.18]);
  const focusedX = interpolate(buttonFocus, [0, 1], [0, -40]);
  const focusedY = interpolate(buttonFocus, [0, 1], [0, -25]);
  const cameraScale = interpolate(resultFocus, [0, 1], [focusedScale, 1.22]);
  const cameraX = interpolate(resultFocus, [0, 1], [focusedX, -10]);
  const cameraY = interpolate(resultFocus, [0, 1], [focusedY, -50]);
  const highlight: Highlight | undefined =
    frame < 36
      ? undefined
      : frame < 102
        ? { x: 84.8, y: 50, width: 11, height: 5.5 }
        : { x: 57.5, y: 58.5, width: 66, height: 13.5 };
  return (
    <Chapter field={sceneFields.narrative}>
      <BrowserFrame
        camera={{
          fromScale: cameraScale,
          toScale: cameraScale,
          fromX: cameraX,
          toX: cameraX,
          fromY: cameraY,
          toY: cameraY,
        }}
        highlight={highlight}
        id="narrative"
        overlay={<NarrativeBlankState opacity={1 - generated} />}
        showChrome={false}
        style={{
          height: 686,
          left: 0,
          position: "absolute",
          top: 245,
          width: 1220,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 210,
          width: 560,
        }}
      >
        <KineticTitle size={82} text={scene.title} width={560} />
        <p style={leadStyle(colors.ink)}>{scene.caption}</p>
        <div style={{ height: 62, marginTop: 56, position: "relative" }}>
          <NarrativeCue
            opacity={1}
            text={
              generated ? "Draf siap disunting guru" : "Buat draf dari nilai"
            }
          />
        </div>
      </div>
      <WorkflowRail active={2} />
    </Chapter>
  );
}

function ReviewScene({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const cardProgress = interpolate(frame, [12, 54], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Chapter field={sceneFields.review}>
      <div style={{ left: 400, position: "absolute", top: 68, width: 980 }}>
        <KineticTitle size={76} text={scene.title} width={980} />
        <p style={leadStyle(colors.ink)}>{scene.caption}</p>
      </div>
      <GuideCharacter
        image="principal-guide.png"
        label="Kepala Sekolah"
        style={{ bottom: 44, height: 565, left: -18 }}
      />
      <BrowserFrame
        camera={{
          fromScale: 1.45,
          toScale: 1.78,
          fromX: 0,
          toX: 0,
          fromY: 140,
          toY: 185,
        }}
        id="review"
        showChrome={false}
        style={{
          height: 560,
          left: 360,
          position: "absolute",
          top: 360,
          transform: `translateX(${interpolate(cardProgress, [0, 1], [100, 0])}px) rotate(-2deg)`,
          width: 760,
        }}
      />
      <div
        style={{
          alignItems: "center",
          background: colors.forest,
          color: colors.white,
          display: "flex",
          fontSize: 44,
          height: 82,
          justifyContent: "center",
          left: 1050,
          position: "absolute",
          top: 580,
          transform: `scale(${0.72 + cardProgress * 0.28})`,
          width: 82,
          zIndex: 20,
        }}
      >
        →
      </div>
      <BrowserFrame
        camera={{
          fromScale: 1.03,
          toScale: 1.13,
          fromX: 0,
          toX: -30,
          fromY: 0,
          toY: -20,
        }}
        id="publish"
        style={{
          height: 540,
          position: "absolute",
          right: 78,
          top: 330,
          transform: `translateX(${interpolate(cardProgress, [0, 1], [150, 0])}px) rotate(1.5deg)`,
          width: 740,
        }}
      />
      <WorkflowRail active={3} />
    </Chapter>
  );
}

function DeliveryScene({ scene }: { scene: WorkflowScene }) {
  return (
    <Chapter field={sceneFields.delivery}>
      <PosterHeader caption={scene.caption} dark scene={scene} width={860} />
      <StatusPipeline />
      <BrowserFrame
        camera={{
          fromScale: 1.02,
          toScale: 1.12,
          fromX: 0,
          toX: -48,
          fromY: 0,
          toY: -25,
        }}
        highlight={{ x: 85.3, y: 44.6, width: 9.2, height: 5.6 }}
        id="delivery"
        style={{
          bottom: 104,
          height: 650,
          left: 172,
          position: "absolute",
          width: 1576,
        }}
      />
      <WorkflowRail active={4} />
    </Chapter>
  );
}

function ParentPinScene({ scene }: { scene: WorkflowScene }) {
  return (
    <Chapter field={sceneFields["parent-pin"]} light>
      <div style={{ left: 82, position: "absolute", top: 94, width: 520 }}>
        <KineticTitle
          color={colors.white}
          size={82}
          text={scene.title}
          width={520}
        />
        <p style={leadStyle(colors.leaf)}>{scene.caption}</p>
      </div>
      <GuideCharacter
        image="parent-guide-v2.png"
        label="Wali"
        light
        style={{ bottom: 54, height: 610, left: 30 }}
      />
      <BrowserFrame
        camera={{
          fromScale: 1.4,
          toScale: 1.72,
          fromX: 0,
          toX: 0,
          fromY: 10,
          toY: 10,
        }}
        highlight={{ x: 50, y: 51.7, width: 22, height: 8 }}
        id="parent-pin"
        style={{
          height: 710,
          position: "absolute",
          right: 95,
          top: 190,
          width: 1165,
        }}
      />
      <ActionCopy
        color={colors.sun}
        light
        style={{ right: 108, top: 154 }}
        text="Masukkan 6 digit"
      />
      <WorkflowRail active={5} light />
    </Chapter>
  );
}

function ParentReportScene({ scene }: { scene: WorkflowScene }) {
  return (
    <Chapter field={sceneFields["parent-report"]}>
      <PosterHeader caption={scene.caption} dark scene={scene} width={760} />
      <BrowserFrame
        camera={{
          fromScale: 1.02,
          toScale: 1.2,
          fromX: 0,
          toX: -42,
          fromY: 55,
          toY: -130,
        }}
        id="parent-report"
        style={{
          bottom: 90,
          height: 760,
          left: 150,
          position: "absolute",
          width: 1620,
        }}
      />
      <WorkflowRail active={5} />
    </Chapter>
  );
}

function ClosingScene({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const enter = spring({
    fps: FPS,
    frame: frame - 8,
    config: { damping: 180, mass: 0.75 },
  });
  const flow = interpolate(frame, [54, 96], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sheetExit = interpolate(frame, [38, 68], [1, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const supportingCopy = interpolate(frame, [38, 54], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Chapter field={sceneFields.closing} light>
      <EndReportSheet
        color={colors.sun}
        style={{
          left: 116,
          opacity: sheetExit,
          top: 104,
          transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px) rotate(-7deg)`,
        }}
      />
      <EndReportSheet
        color={colors.leaf}
        style={{
          opacity: sheetExit,
          right: 116,
          top: 104,
          transform: `translateY(${interpolate(enter, [0, 1], [-180, 0])}px) rotate(7deg)`,
        }}
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          left: 395,
          opacity: enter,
          position: "absolute",
          textAlign: "center",
          top: 206,
          width: 1120,
        }}
      >
        <BrandMark light />
        <KineticTitle
          color={colors.white}
          delay={6}
          size={92}
          text={scene.caption}
          width={1120}
        />
        <p
          style={{
            color: colors.leaf,
            fontSize: 28,
            fontWeight: 650,
            margin: "30px 0 0",
            opacity: supportingCopy,
            transform: `translateY(${(1 - supportingCopy) * 18}px)`,
          }}
        >
          RAMU · Raport Murid
        </p>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            marginTop: 62,
            position: "relative",
            width: 760,
          }}
        >
          <div
            style={{
              background: colors.sun,
              height: 5,
              left: 74,
              position: "absolute",
              top: 13,
              transform: `scaleX(${flow})`,
              transformOrigin: "left center",
              width: 612,
            }}
          />
          {["Guru", "Sekolah", "Wali"].map((label, index) => {
            const reveal = interpolate(
              flow,
              [index / 3, Math.min(1, index / 3 + 0.3)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return (
              <div
                key={label}
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: reveal,
                  position: "relative",
                  transform: `translateY(${(1 - reveal) * 18}px)`,
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    background: colors.sun,
                    border: `7px solid ${colors.green}`,
                    borderRadius: 99,
                    height: 28,
                    width: 28,
                  }}
                />
                <span style={{ fontSize: 21, fontWeight: 750 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Chapter>
  );
}

function EndReportSheet({
  color,
  style,
}: {
  color: string;
  style: CSSProperties;
}) {
  return (
    <div
      style={{
        background: colors.paper,
        height: 480,
        padding: 42,
        position: "absolute",
        width: 350,
        ...style,
      }}
    >
      <div
        style={{
          background: color,
          height: 22,
          marginBottom: 48,
          width: 154,
        }}
      />
      {[0.84, 0.68, 0.9, 0.58].map((width, index) => (
        <div
          key={width}
          style={{
            alignItems: "center",
            display: "flex",
            gap: 18,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              background: index < 3 ? colors.green : colors.mint,
              borderRadius: 99,
              height: 18,
              width: 18,
            }}
          />
          <span
            style={{
              background: "#d8ded6",
              height: 12,
              width: `${width * 230}px`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function Chapter({
  children,
  field,
  light = false,
}: {
  children: ReactNode;
  field: string;
  light?: boolean;
}) {
  return (
    <AbsoluteFill
      style={{
        background: field,
        color: light ? colors.white : colors.ink,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function PosterHeader({
  caption,
  dark = false,
  scene,
  width,
}: {
  caption: string;
  dark?: boolean;
  scene: WorkflowScene;
  width: number;
}) {
  return (
    <div
      style={{
        alignItems: "flex-start",
        display: "flex",
        justifyContent: "space-between",
        left: 78,
        position: "absolute",
        right: 78,
        top: 62,
      }}
    >
      <KineticTitle
        color={dark ? colors.ink : colors.white}
        size={78}
        text={scene.title}
        width={width}
      />
      <p
        style={{
          color: dark ? colors.ink : colors.white,
          fontSize: 28,
          fontWeight: 620,
          lineHeight: 1.25,
          margin: "20px 0 0",
          maxWidth: 510,
          textAlign: "right",
        }}
      >
        {caption}
      </p>
    </div>
  );
}

function KineticTitle({
  color = colors.ink,
  delay = 0,
  size,
  text,
  width,
}: {
  color?: string;
  delay?: number;
  size: number;
  text: string;
  width: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <h1
      style={{
        color,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.052em",
        lineHeight: 0.94,
        margin: "28px 0 0",
        maxWidth: width,
      }}
    >
      {words.map((word, index) => {
        const progress = interpolate(
          frame,
          [delay + index * 3, delay + index * 3 + 22],
          [0, 1],
          {
            easing: Easing.out(Easing.exp),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              marginRight: "0.22em",
              overflow: "hidden",
              paddingBottom: "0.08em",
              transform: `translateY(${(1 - progress) * size * 0.92}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </h1>
  );
}

function leadStyle(color: string): CSSProperties {
  return {
    color,
    fontSize: 27,
    fontWeight: 560,
    lineHeight: 1.4,
    margin: "30px 0 0",
    maxWidth: 560,
  };
}

function BrowserFrame({
  camera,
  highlight,
  id,
  imagePosition = "center center",
  overlay,
  showChrome = true,
  steadyHighlight = false,
  style,
}: {
  camera?: Camera;
  highlight?: Highlight;
  id: string;
  imagePosition?: string;
  overlay?: ReactNode;
  showChrome?: boolean;
  steadyHighlight?: boolean;
  style: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, 110], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(
    progress,
    [0, 1],
    [camera?.fromScale ?? 1, camera?.toScale ?? 1.08],
  );
  const x = interpolate(
    progress,
    [0, 1],
    [camera?.fromX ?? 0, camera?.toX ?? -24],
  );
  const y = interpolate(
    progress,
    [0, 1],
    [camera?.fromY ?? 0, camera?.toY ?? -18],
  );
  return (
    <div
      style={{
        background: colors.paper,
        borderRadius: 24,
        boxShadow: "0 38px 85px rgba(18, 42, 29, 0.22)",
        overflow: "hidden",
        ...style,
      }}
    >
      {showChrome ? <BrowserChrome /> : null}
      <div
        style={{
          height: showChrome ? "calc(100% - 48px)" : "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            inset: 0,
            position: "absolute",
            transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <Img
            src={staticFile(`captures/main/${id}.png`)}
            style={{
              height: "100%",
              objectFit: "cover",
              objectPosition: imagePosition,
              width: "100%",
            }}
          />
          {overlay}
          {highlight ? (
            <FocusRing highlight={highlight} steady={steadyHighlight} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BrowserChrome() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#153f2f",
        display: "flex",
        gap: 8,
        height: 48,
        padding: "0 18px",
      }}
    >
      {["#ef8067", "#f3cc52", "#bcd9ca"].map((color) => (
        <span
          key={color}
          style={{
            background: color,
            borderRadius: 99,
            height: 10,
            width: 10,
          }}
        />
      ))}
      <span
        style={{
          color: "#dce8d4",
          fontSize: 15,
          fontWeight: 650,
          marginLeft: 10,
        }}
      >
        app.ramu.id
      </span>
    </div>
  );
}

function FocusRing({
  highlight,
  steady = false,
}: {
  highlight: Highlight;
  steady?: boolean;
}) {
  const frame = useCurrentFrame();
  const pulse = steady
    ? 1
    : interpolate(frame % 40, [0, 20, 40], [0.96, 1.03, 0.96], {
        easing: Easing.inOut(Easing.quad),
      });
  return (
    <div
      style={{
        border: `4px solid ${colors.sun}`,
        borderRadius: 18,
        boxSizing: "border-box",
        height: `${highlight.height}%`,
        left: `${highlight.x}%`,
        pointerEvents: "none",
        position: "absolute",
        top: `${highlight.y}%`,
        transform: `translate(-50%, -50%) scale(${pulse})`,
        width: `${highlight.width}%`,
      }}
    />
  );
}

function NarrativeBlankState({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: colors.paper,
        border: "1px solid #d8ded6",
        borderRadius: 10,
        boxSizing: "border-box",
        color: "#738078",
        display: "flex",
        fontSize: 17,
        height: "12%",
        justifyContent: "center",
        left: "25.5%",
        opacity,
        padding: "0 18px",
        position: "absolute",
        top: "52.6%",
        width: "64%",
      }}
    >
      Narasi perkembangan masih kosong.
    </div>
  );
}

function NarrativeCue({ opacity, text }: { opacity: number; text: string }) {
  return (
    <div
      style={{
        background: colors.forest,
        color: colors.white,
        fontSize: 22,
        fontWeight: 800,
        left: 0,
        opacity,
        padding: "15px 20px",
        position: "absolute",
        top: 0,
        transform: `translateY(${(1 - opacity) * 14}px)`,
      }}
    >
      {text}
    </div>
  );
}

function CaptureCarousel({
  ids,
  slide,
  style,
}: {
  ids: readonly string[];
  slide: number;
  style: CSSProperties;
}) {
  return (
    <div
      style={{
        background: colors.paper,
        borderRadius: 24,
        boxShadow: "0 38px 85px rgba(18, 42, 29, 0.2)",
        overflow: "hidden",
        ...style,
      }}
    >
      <BrowserChrome />
      <div
        style={{
          height: "calc(100% - 48px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {ids.map((id, index) => {
          const distance = index - slide;
          return (
            <Img
              key={id}
              src={staticFile(`captures/main/${id}.png`)}
              style={{
                height: "100%",
                left: 0,
                objectFit: "cover",
                opacity: Math.abs(distance) > 1 ? 0 : 1,
                position: "absolute",
                top: 0,
                transform: `translateX(${distance * 100}%) scale(1.05)`,
                width: "100%",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ModuleTabs({
  active,
  labels,
}: {
  active: number;
  labels: readonly string[];
}) {
  return (
    <div
      style={{
        bottom: 94,
        display: "flex",
        gap: 8,
        position: "absolute",
        right: 116,
        zIndex: 4,
      }}
    >
      {labels.map((label, index) => (
        <div
          key={label}
          style={{
            background: index === active ? colors.forest : colors.paper,
            color: index === active ? colors.white : colors.ink,
            fontSize: 18,
            fontWeight: 750,
            padding: "13px 18px",
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function GuideCharacter({
  image,
  label,
  light = false,
  style,
}: {
  image: string;
  label?: string;
  light?: boolean;
  style: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [6, 34], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        transform: `translateY(${(1 - enter) * 70}px)`,
        zIndex: 5,
        ...style,
      }}
    >
      <Img
        src={staticFile(`characters/${image}`)}
        style={{ height: "100%", objectFit: "contain", width: "100%" }}
      />
      {label ? (
        <div
          style={{
            background: light ? colors.sun : colors.forest,
            bottom: 28,
            color: light ? colors.ink : colors.white,
            fontSize: 20,
            fontWeight: 800,
            left: "50%",
            padding: "13px 18px",
            position: "absolute",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}

function ActionCopy({
  color,
  light = false,
  style,
  text,
}: {
  color: string;
  light?: boolean;
  style?: CSSProperties;
  text: string;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [36, 58], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        background: color,
        color: light ? colors.ink : colors.white,
        display: "inline-block",
        fontSize: 24,
        fontWeight: 800,
        opacity: progress,
        padding: "15px 20px",
        position: style?.position ?? "absolute",
        transform: `translateY(${(1 - progress) * 18}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function StatusPipeline() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [10, 104], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labels = ["Draf", "Ditinjau", "Diterbitkan", "Siap dibagikan"];
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 0,
        position: "absolute",
        right: 84,
        top: 196,
        width: 815,
      }}
    >
      {labels.map((label, index) => {
        const reached = progress >= index / (labels.length - 1);
        return (
          <div
            key={label}
            style={{
              alignItems: "center",
              display: "flex",
              flex: index === labels.length - 1 ? "0 0 auto" : 1,
            }}
          >
            <span
              style={{
                background: reached ? colors.green : "#d9d4c8",
                borderRadius: 99,
                height: 18,
                width: 18,
              }}
            />
            <span
              style={{
                fontSize: 17,
                fontWeight: 750,
                marginLeft: 9,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
            {index < labels.length - 1 ? (
              <span
                style={{
                  background: reached ? colors.green : "#d9d4c8",
                  height: 5,
                  margin: "0 12px",
                  width: 78,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function WorkflowRail({
  active,
  light = false,
}: {
  active: number;
  light?: boolean;
}) {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [0, 45], [0, active / 5], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        bottom: 20,
        height: 58,
        left: "50%",
        position: "absolute",
        transform: "translateX(-50%)",
        width: 1180,
        zIndex: 12,
      }}
    >
      <div
        style={{
          background: light ? "rgba(255,253,248,.28)" : "rgba(16,38,27,.18)",
          height: 5,
          left: 12,
          position: "absolute",
          right: 12,
          top: 8,
        }}
      >
        <div
          style={{
            background: light ? colors.sun : colors.forest,
            height: "100%",
            width: `${fill * 100}%`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      >
        {railStages.map((label, index) => (
          <div
            key={label}
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              width: 124,
            }}
          >
            <span
              style={{
                background:
                  index <= active
                    ? light
                      ? colors.sun
                      : colors.forest
                    : light
                      ? "#769583"
                      : "#c6c0b5",
                border: `4px solid ${light ? colors.forest : sceneFields.dashboard}`,
                borderRadius: 99,
                height: 22,
                width: 22,
              }}
            />
            <span
              style={{
                color: light ? colors.white : colors.ink,
                fontSize: 16,
                fontWeight: index === active ? 800 : 620,
                marginTop: 8,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
