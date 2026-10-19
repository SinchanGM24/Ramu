import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrandMark } from "./components/brand-mark";
import { promoScript } from "./data/promo-script";
import { ClosingScene } from "./scenes/closing-scene";
import { HandoffScene } from "./scenes/handoff-scene";
import { OpeningScene } from "./scenes/opening-scene";
import { ParentScene } from "./scenes/parent-scene";
import { PublishScene } from "./scenes/publish-scene";
import { ReviewScene } from "./scenes/review-scene";
import { WorkspaceScene } from "./scenes/workspace-scene";

const sceneStarts = [0, 150, 360, 660, 840, 1080, 1320, 1590];

export function PromoVideo({ format }: { format: "desktop" | "reels" }) {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();
  const isReels = format === "reels";
  const scale = isReels ? width / 1920 : 1;
  const scriptIndex = sceneStarts.reduce(
    (activeIndex, start, index) => (frame >= start ? index : activeIndex),
    0,
  );
  const activeScript = promoScript[scriptIndex];
  const presentationStyle = isReels
    ? {
        height: 1080,
        left: 0,
        position: "absolute" as const,
        top: 420,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        width: 1920,
      }
    : { height: "100%", position: "relative" as const, width: "100%" };

  return (
    <AbsoluteFill
      style={{
        background: isReels ? "#234b34" : "#f6f2e8",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {isReels ? (
        <>
          <div
            style={{
              background: "rgba(255,255,255,.06)",
              borderRadius: 999,
              height: 600,
              position: "absolute",
              right: -300,
              top: -310,
              width: 600,
            }}
          />
          <div style={{ left: 74, position: "absolute", right: 74, top: 92 }}>
            <div
              style={{
                background: "#fffdf7",
                borderRadius: 18,
                display: "inline-block",
                padding: "12px 16px",
              }}
            >
              <BrandMark compact />
            </div>
            <p
              style={{
                color: "#cde3ca",
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: 1.6,
                margin: "45px 0 0",
              }}
            >
              RAMU · RAPORT MURID
            </p>
          </div>
          <div
            style={{ bottom: 118, left: 74, position: "absolute", right: 74 }}
          >
            <div
              style={{
                background: "#f7f3e8",
                borderRadius: 28,
                color: "#183725",
                padding: "28px 30px",
              }}
            >
              <p
                style={{
                  color: "#2f6b45",
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  margin: 0,
                }}
              >
                {activeScript.time}
              </p>
              <p
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: -1.25,
                  lineHeight: 1.16,
                  margin: "13px 0 0",
                }}
              >
                {activeScript.caption}
              </p>
            </div>
          </div>
        </>
      ) : null}
      <div style={presentationStyle}>
        <Sequence from={0} durationInFrames={150}>
          <OpeningScene />
        </Sequence>
        <Sequence from={150} durationInFrames={210}>
          <WorkspaceScene />
        </Sequence>
        <Sequence from={360} durationInFrames={300}>
          <WorkspaceScene assessment />
        </Sequence>
        <Sequence from={660} durationInFrames={180}>
          <HandoffScene />
        </Sequence>
        <Sequence from={840} durationInFrames={240}>
          <ReviewScene />
        </Sequence>
        <Sequence from={1080} durationInFrames={240}>
          <PublishScene />
        </Sequence>
        <Sequence from={1320} durationInFrames={270}>
          <ParentScene />
        </Sequence>
        <Sequence from={1590} durationInFrames={210}>
          <ClosingScene />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
}
