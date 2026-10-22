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

const stageLabels = [
  "Persiapan",
  "Murid",
  "Nilai",
  "Tinjau",
  "Bagikan",
  "Wali",
] as const;

type Highlight = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type IllustrationSpec = {
  bottom?: number;
  direction: -1 | 1;
  enterAt?: number;
  left?: number;
  right?: number;
  src: string;
  top?: number;
  width: number;
  zIndex?: number;
};

type ReelsFrameProps = {
  fit?: "contain" | "cover";
  focusX?: number;
  focusY?: number;
  highlight?: Highlight;
  highlights?: Highlight[];
  id: string;
  showChrome?: boolean;
  style: CSSProperties;
  zoom?: number;
};

export function PromoReels() {
  const fadeAudio = (frame: number, level: number) =>
    level *
    interpolate(
      frame,
      [(TOTAL_DURATION_SECONDS - 2) * FPS, TOTAL_DURATION_SECONDS * FPS - 1],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
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
            scene.duration + (index === workflowScenes.length - 1 ? 0 : 20)
          }
          style={{ zIndex: index }}
        >
          <ReelsScene first={index === 0} index={index} scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function ReelsScene({
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
        return <ReelsLanding scene={scene} />;
      case "dashboard":
        return <ReelsDashboard scene={scene} />;
      case "students":
        return (
          <ReelsFeature
            active={1}
            action="Daftarkan murid"
            focusX={50}
            focusY={0}
            highlight={{ height: 4.2, width: 6.8, x: 60.5, y: 29.35 }}
            id="students"
            illustration={{
              bottom: 172,
              direction: 1,
              left: 596,
              src: "illustrations/ramu-reels-playground-v2.png",
              width: 326,
            }}
            scene={scene}
            zoom={1.35}
          />
        );
      case "assessment":
        return (
          <ReelsFeature
            active={2}
            action="Pilih indikator nilai"
            actionTop={1230}
            fit="contain"
            frameHeight={760}
            focusX={76}
            highlights={[
              { height: 4.4, width: 4.4, x: 79.1, y: 50 },
              { height: 4.4, width: 4.4, x: 87.4, y: 54.5 },
              { height: 4.4, width: 4.4, x: 74.9, y: 59 },
              { height: 4.4, width: 4.4, x: 79.1, y: 63.6 },
              { height: 4.4, width: 4.4, x: 83.2, y: 68.3 },
              { height: 4.4, width: 4.4, x: 87.4, y: 72.8 },
            ]}
            id="assessment"
            illustration={{
              direction: -1,
              left: 440,
              src: "illustrations/ramu-reels-blocks-v2.png",
              top: 1100,
              width: 600,
            }}
            light
            scene={scene}
          />
        );
      case "narrative":
        return <ReelsNarrative scene={scene} />;
      case "review":
        return <ReelsReview scene={scene} />;
      case "delivery":
        return (
          <ReelsFeature
            active={4}
            action="Buka WhatsApp"
            actionTop={1230}
            fit="contain"
            frameHeight={760}
            focusX={84}
            highlight={{ height: 5, width: 9.3, x: 85.35, y: 46.95 }}
            id="delivery"
            illustration={{
              direction: 1,
              left: 70,
              src: "illustrations/ramu-reels-delivery-v2.png",
              top: 1280,
              width: 940,
            }}
            scene={scene}
          />
        );
      case "parent-pin":
        return (
          <ReelsFeature
            active={5}
            action="Masukkan 6 digit"
            focusX={50}
            highlight={{ height: 8, width: 22, x: 50, y: 51.7 }}
            id="parent-pin"
            illustration={{
              bottom: 164,
              direction: -1,
              left: 624,
              src: "illustrations/ramu-reels-gate-v2.png",
              width: 296,
            }}
            light
            scene={scene}
          />
        );
      case "parent-report":
        return (
          <ReelsFeature
            active={5}
            focusX={50}
            id="parent-report"
            illustration={{
              bottom: 168,
              direction: 1,
              left: 365,
              src: "illustrations/ramu-reels-parent-v2.png",
              width: 350,
            }}
            scene={scene}
          />
        );
      case "closing":
        return <ReelsClosing scene={scene} />;
    }
  })();

  return (
    <ReelsReveal first={first} index={index}>
      {body}
    </ReelsReveal>
  );
}

function ReelsReveal({
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
    : interpolate(frame, [0, 18], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const origins = ["80% 12%", "16% 78%", "82% 82%", "18% 20%"];
  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${progress * 160}% at ${origins[index % origins.length]})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function ReelsLanding({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const entrance = interpolate(frame, [0, 46], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleIn = spring({
    config: { damping: 190, mass: 0.8 },
    fps: FPS,
    frame: frame - 8,
  });
  const panelTransform = `translateY(${(1 - entrance) * 132}px) scale(${1.14 - entrance * 0.14})`;

  return (
    <ReelsChapter field={sceneFields.landing}>
      <div
        style={{
          background: colors.forest,
          height: 472,
          left: 0,
          position: "absolute",
          top: 0,
          width: "100%",
        }}
      />
      <div
        style={{
          color: colors.white,
          left: 64,
          opacity: titleIn,
          position: "absolute",
          top: 58,
          transform: `translateY(${(1 - titleIn) * 34}px)`,
          width: 888,
          zIndex: 5,
        }}
      >
        <BrandMark compact light />
        <ReelsTitle color={colors.white} size={70} text={scene.title} />
        <p style={captionStyle(colors.leaf, 27)}>{scene.caption}</p>
      </div>
      <LandingPortraitPanel
        style={{
          left: 56,
          position: "absolute",
          top: 492,
          transform: panelTransform,
          transformOrigin: "center center",
          width: 968,
        }}
      />
      <ReelsRail active={0} dark />
    </ReelsChapter>
  );
}

function ReelsDashboard({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const handoff = interpolate(frame, [12, 54], [0, 1], {
    easing: Easing.inOut(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <ReelsChapter field={sceneFields.dashboard}>
      <ReelsHeader scene={scene} />
      <ReelsFrame
        fit="contain"
        focusX={50}
        id="dashboard"
        style={{
          height: 570,
          left: 48,
          position: "absolute",
          top: 430,
          transform: `translateX(${interpolate(handoff, [0, 1], [-72, 0])}px) rotate(-1.5deg)`,
          width: 984,
        }}
      />
      <ReelsFrame
        fit="contain"
        focusX={50}
        id="semester"
        style={{
          height: 570,
          left: 48,
          position: "absolute",
          top: 1070,
          transform: `translateX(${interpolate(handoff, [0, 1], [72, 0])}px) rotate(1.5deg)`,
          width: 984,
        }}
      />
      <ReelsRail active={0} />
    </ReelsChapter>
  );
}

function ReelsFeature({
  active,
  action,
  actionTop,
  fit = "cover",
  frameHeight = 1000,
  focusX,
  focusY = 50,
  highlight,
  highlights,
  id,
  illustration,
  light = false,
  scene,
  zoom = 1,
}: {
  active: number;
  action?: string;
  actionTop?: number;
  fit?: "contain" | "cover";
  frameHeight?: number;
  focusX: number;
  focusY?: number;
  highlight?: Highlight;
  highlights?: Highlight[];
  id: string;
  illustration?: IllustrationSpec;
  light?: boolean;
  scene: WorkflowScene;
  zoom?: number;
}) {
  return (
    <ReelsChapter field={sceneFields[scene.id]} light={light}>
      <ReelsHeader light={light} scene={scene} />
      <ReelsFrame
        fit={fit}
        focusX={focusX}
        focusY={focusY}
        highlight={highlight}
        highlights={highlights}
        id={id}
        style={{
          height: frameHeight,
          left: 48,
          position: "absolute",
          top: 430,
          width: 984,
        }}
        zoom={zoom}
      />
      {illustration ? (
        <ReelsIllustration scene={scene} {...illustration} />
      ) : null}
      {action ? (
        <ReelsAction light={light} text={action} top={actionTop} />
      ) : null}
      <ReelsRail active={active} dark={light} />
    </ReelsChapter>
  );
}

function ReelsNarrative({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const generated = frame >= 90;
  const highlight =
    frame < 34
      ? undefined
      : frame < 102
        ? { height: 5.5, width: 11, x: 84.8, y: 50 }
        : { height: 13.5, width: 66, x: 57.5, y: 58.5 };
  return (
    <ReelsChapter field={sceneFields.narrative}>
      <ReelsHeader scene={scene} />
      <ReelsFrame
        fit="contain"
        focusX={50}
        highlight={highlight}
        id="narrative"
        showChrome={false}
        style={{
          height: 670,
          left: 48,
          position: "absolute",
          top: 430,
          width: 984,
        }}
      />
      {generated ? <NarrativeCloseUp /> : null}
      <ReelsIllustration
        direction={-1}
        enterAt={92}
        left={352}
        scene={scene}
        src="illustrations/ramu-reels-storybook-v2.png"
        top={1430}
        width={340}
        zIndex={9}
      />
      <ReelsAction
        top={1128}
        text={generated ? "Draf siap disunting guru" : "Buat draf dari nilai"}
      />
      <ReelsRail active={2} />
    </ReelsChapter>
  );
}

function ReelsReview({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const handoff = interpolate(frame, [12, 54], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <ReelsChapter field={sceneFields.review}>
      <ReelsHeader scene={scene} />
      <ReelsFrame
        focusX={54}
        focusY={0}
        id="review"
        showChrome={false}
        style={{
          height: 475,
          left: 48,
          position: "absolute",
          top: 430,
          transform: `translateX(${interpolate(handoff, [0, 1], [-95, 0])}px) rotate(-2deg)`,
          width: 984,
        }}
        zoom={1.85}
      />
      <ReelsDownArrow progress={handoff} top={925} />
      <ReelsFrame
        focusX={52}
        id="publish"
        style={{
          height: 475,
          left: 48,
          position: "absolute",
          top: 1020,
          transform: `translateX(${interpolate(handoff, [0, 1], [95, 0])}px) rotate(1.5deg)`,
          width: 984,
        }}
      />
      <ReelsRail active={3} />
    </ReelsChapter>
  );
}

function ReelsClosing({ scene }: { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const enter = spring({
    config: { damping: 180, mass: 0.75 },
    fps: FPS,
    frame: frame - 8,
  });
  const flow = interpolate(frame, [54, 96], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <ReelsChapter field={sceneFields.closing} light>
      <ReelsSheet
        color={colors.sun}
        style={{
          left: -142,
          top: 154,
          transform: `translateY(${interpolate(enter, [0, 1], [170, 0])}px) rotate(-10deg)`,
        }}
      />
      <ReelsSheet
        color={colors.leaf}
        style={{
          right: -142,
          top: 154,
          transform: `translateY(${interpolate(enter, [0, 1], [-170, 0])}px) rotate(10deg)`,
        }}
      />
      <ReelsIllustration
        bottom={40}
        direction={1}
        left={30}
        scene={scene}
        src="illustrations/ramu-reels-closing-school-v2.png"
        width={1020}
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          left: 70,
          opacity: enter,
          position: "absolute",
          textAlign: "center",
          top: 570,
          width: 940,
          zIndex: 5,
        }}
      >
        <BrandMark light />
        <ReelsTitle color={colors.white} size={88} text={scene.caption} />
        <p style={{ ...captionStyle(colors.leaf, 30), marginTop: 32 }}>
          RAMU · Raport Murid
        </p>
        <div
          style={{
            background: colors.sun,
            height: 6,
            marginTop: 70,
            transform: `scaleX(${flow})`,
            transformOrigin: "left center",
            width: 620,
          }}
        />
        <p style={{ ...captionStyle(colors.white, 29), marginTop: 46 }}>
          Dari catatan guru, hingga sampai ke wali.
        </p>
      </div>
    </ReelsChapter>
  );
}

function ReelsChapter({
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

function ReelsHeader({
  light = false,
  scene,
}: {
  light?: boolean;
  scene: WorkflowScene;
}) {
  const color = light ? colors.white : colors.ink;
  return (
    <div style={{ left: 64, position: "absolute", top: 100, width: 920 }}>
      <ReelsTitle color={color} size={76} text={scene.title} />
      <p style={captionStyle(light ? colors.leaf : colors.ink, 28)}>
        {scene.caption}
      </p>
    </div>
  );
}

function ReelsTitle({
  color,
  size,
  text,
}: {
  color: string;
  size: number;
  text: string;
}) {
  const frame = useCurrentFrame();
  return (
    <h1
      style={{
        color,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.052em",
        lineHeight: 0.94,
        margin: 0,
      }}
    >
      {text.split(" ").map((word, index) => {
        const reveal = interpolate(frame, [index * 3, index * 3 + 22], [0, 1], {
          easing: Easing.out(Easing.exp),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              marginRight: "0.2em",
              overflow: "hidden",
              paddingBottom: "0.08em",
              transform: `translateY(${(1 - reveal) * size * 0.92}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </h1>
  );
}

function LandingPortraitPanel({ style }: { style: CSSProperties }) {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [6, 32], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const { transform: extraTransform, ...panelStyle } = style;
  const segmentHeight = 494;
  const imageHeight = 544.5;

  return (
    <div
      style={{
        background: colors.paper,
        borderRadius: 30,
        boxShadow: "0 36px 82px rgba(18, 42, 29, 0.24)",
        height: 1030,
        opacity: reveal,
        overflow: "hidden",
        ...panelStyle,
        transform: `translateY(${(1 - reveal) * 54}px) ${extraTransform || ""}`,
      }}
    >
      <ReelsChrome />
      {[
        { id: "landing", top: 0 },
        { id: "landing-flow", top: segmentHeight },
      ].map(({ id, top }) => (
        <div
          key={id}
          style={{
            height: segmentHeight,
            overflow: "hidden",
            position: "absolute",
            top: top + 42,
            width: "100%",
          }}
        >
          <Img
            src={staticFile(`captures/main/${id}.png`)}
            style={{
              height: imageHeight,
              left: 0,
              position: "absolute",
              top: id === "landing" ? 0 : -28,
              width: 968,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function NarrativeCloseUp() {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [96, 122], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        background: colors.paper,
        borderRadius: 30,
        boxShadow: "0 24px 58px rgba(18, 42, 29, 0.2)",
        height: 288,
        left: 72,
        opacity: enter,
        overflow: "hidden",
        position: "absolute",
        top: 1210,
        transform: `translateY(${(1 - enter) * 42}px) scale(${0.94 + enter * 0.06})`,
        transformOrigin: "center top",
        width: 936,
        zIndex: 7,
      }}
    >
      <Img
        src={staticFile("captures/main/narrative.png")}
        style={{
          height: 1041,
          left: -455,
          position: "absolute",
          top: -445,
          width: 1850,
        }}
      />
      <div
        style={{
          background: "rgba(18, 63, 45, 0.94)",
          color: colors.white,
          fontSize: 21,
          fontWeight: 800,
          left: 0,
          padding: "12px 18px",
          position: "absolute",
          top: 0,
        }}
      >
        Narasi perkembangan
      </div>
    </div>
  );
}

function ReelsIllustration({
  bottom,
  direction,
  enterAt = 18,
  left,
  right,
  scene,
  src,
  top,
  width,
  zIndex = 4,
}: IllustrationSpec & { scene: WorkflowScene }) {
  const frame = useCurrentFrame();
  const enter = spring({
    config: { damping: 18, mass: 0.72, stiffness: 130 },
    fps: FPS,
    frame: frame - enterAt,
  });
  const leave = interpolate(
    frame,
    [scene.duration - 8, scene.duration + 16],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const float = Math.sin(frame / 12) * 5;

  return (
    <Img
      src={staticFile(src)}
      style={{
        height: "auto",
        opacity: enter * (1 - leave),
        pointerEvents: "none",
        position: "absolute",
        transform: `translate3d(${direction * ((1 - enter) * 86 - leave * 112)}px, ${
          (1 - enter) * 56 + leave * 34 + float
        }px, 0) rotate(${direction * ((1 - enter) * 4 - leave * 5)}deg) scale(${0.9 + enter * 0.1 - leave * 0.04})`,
        transformOrigin: "center bottom",
        width,
        zIndex,
        ...(top === undefined ? { bottom } : { top }),
        ...(left === undefined ? { right } : { left }),
      }}
    />
  );
}

function ReelsFrame({
  fit = "cover",
  focusX = 50,
  focusY = 50,
  highlight,
  highlights,
  id,
  showChrome = true,
  style,
  zoom = 1,
}: ReelsFrameProps) {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [6, 32], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const frameWidth = typeof style.width === "number" ? style.width : 984;
  const frameHeight = typeof style.height === "number" ? style.height : 1000;
  const chromeHeight = showChrome ? 42 : 0;
  const contentHeight = frameHeight - chromeHeight;
  const baseImageWidth =
    fit === "contain" ? frameWidth : contentHeight * (16 / 9);
  const baseImageHeight =
    fit === "contain" ? frameWidth * (9 / 16) : contentHeight;
  const imageWidth = baseImageWidth * zoom;
  const imageHeight = baseImageHeight * zoom;
  const imageLeft = (frameWidth - imageWidth) * (focusX / 100);
  const imageTop = (contentHeight - imageHeight) * (focusY / 100);
  const { transform: extraTransform, ...frameStyle } = style;
  const focusItems = highlights || (highlight ? [highlight] : []);
  const focuses = focusItems.map((item) => ({
    height: (item.height / 100) * imageHeight,
    left: imageLeft + ((item.x - item.width / 2) / 100) * imageWidth,
    top: imageTop + ((item.y - item.height / 2) / 100) * imageHeight,
    width: (item.width / 100) * imageWidth,
  }));

  return (
    <div
      style={{
        background: colors.paper,
        borderRadius: 30,
        boxShadow: "0 36px 82px rgba(18, 42, 29, 0.24)",
        opacity: reveal,
        overflow: "hidden",
        ...frameStyle,
        transform: `translateY(${(1 - reveal) * 54}px) ${extraTransform || ""}`,
      }}
    >
      {showChrome ? <ReelsChrome /> : null}
      <div
        style={{
          height: contentHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Img
          src={staticFile(`captures/main/${id}.png`)}
          style={{
            height: imageHeight,
            left: imageLeft,
            position: "absolute",
            top: imageTop,
            width: imageWidth,
          }}
        />
        {focuses.map((focus, index) => (
          <ReelsFocus key={`focus-${index}`} style={focus} />
        ))}
      </div>
    </div>
  );
}

function ReelsChrome() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#153f2f",
        display: "flex",
        gap: 8,
        height: 42,
        padding: "0 16px",
      }}
    >
      {["#ef8067", "#f3cc52", "#bcd9ca"].map((color) => (
        <span
          key={color}
          style={{ background: color, borderRadius: 99, height: 9, width: 9 }}
        />
      ))}
      <span
        style={{
          color: "#dce8d4",
          fontSize: 14,
          fontWeight: 700,
          marginLeft: 9,
        }}
      >
        app.ramu.id
      </span>
    </div>
  );
}

function ReelsFocus({ style }: { style: CSSProperties }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 40, [0, 20, 40], [0.96, 1.03, 0.96], {
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <div
      style={{
        border: `5px solid ${colors.sun}`,
        borderRadius: 18,
        boxSizing: "border-box",
        pointerEvents: "none",
        position: "absolute",
        transform: `scale(${pulse})`,
        ...style,
      }}
    />
  );
}

function ReelsDownArrow({ progress, top }: { progress: number; top: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: colors.forest,
        color: colors.white,
        display: "flex",
        fontSize: 46,
        fontWeight: 800,
        height: 74,
        justifyContent: "center",
        left: 503,
        position: "absolute",
        top,
        transform: `scale(${0.72 + progress * 0.28})`,
        width: 74,
        zIndex: 5,
      }}
    >
      ↓
    </div>
  );
}

function ReelsAction({
  light = false,
  text,
  top,
}: {
  light?: boolean;
  text: string;
  top?: number;
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
        background: light ? colors.sun : colors.forest,
        color: light ? colors.ink : colors.white,
        fontSize: 29,
        fontWeight: 800,
        left: 64,
        opacity: progress,
        padding: "17px 22px",
        position: "absolute",
        ...(top === undefined ? { bottom: 262 } : { top }),
        transform: `translateY(${(1 - progress) * 18}px)`,
        zIndex: 8,
      }}
    >
      {text}
    </div>
  );
}

function ReelsRail({
  active,
  dark = false,
}: {
  active: number;
  dark?: boolean;
}) {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [0, 45], [0, active / 5], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const color = dark ? colors.white : colors.ink;
  return (
    <div
      style={{
        bottom: 62,
        height: 88,
        left: 64,
        position: "absolute",
        width: 952,
        zIndex: 12,
      }}
    >
      <div
        style={{
          background: dark ? "rgba(255,253,248,.28)" : "rgba(16,38,27,.18)",
          height: 6,
          left: 15,
          position: "absolute",
          right: 15,
          top: 13,
        }}
      >
        <div
          style={{
            background: dark ? colors.sun : colors.forest,
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
        {stageLabels.map((label, index) => (
          <div
            key={label}
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              width: 108,
            }}
          >
            <span
              style={{
                background:
                  index <= active
                    ? dark
                      ? colors.sun
                      : colors.forest
                    : dark
                      ? "#769583"
                      : "#c6c0b5",
                border: `4px solid ${dark ? colors.forest : colors.paper}`,
                borderRadius: 99,
                height: 24,
                width: 24,
              }}
            />
            <span
              style={{
                color,
                fontSize: 16,
                fontWeight: index === active ? 800 : 620,
                marginTop: 9,
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

function ReelsSheet({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.paper,
        height: 510,
        padding: 34,
        position: "absolute",
        width: 340,
        ...style,
      }}
    >
      <div
        style={{ background: color, height: 20, marginBottom: 42, width: 150 }}
      />
      {[0.9, 0.68, 0.82, 0.6].map((width, index) => (
        <div
          key={width}
          style={{
            alignItems: "center",
            display: "flex",
            gap: 16,
            marginBottom: 22,
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
            style={{ background: "#d8ded6", height: 12, width: width * 220 }}
          />
        </div>
      ))}
    </div>
  );
}

function captionStyle(color: string, fontSize: number): CSSProperties {
  return {
    color,
    fontSize,
    fontWeight: 600,
    lineHeight: 1.35,
    margin: "28px 0 0",
    maxWidth: 860,
  };
}
