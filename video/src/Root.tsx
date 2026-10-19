import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

const durationInFrames = 60 * 30;

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="RamuPromoDesktop"
        component={PromoVideo}
        durationInFrames={durationInFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ format: "desktop" as const }}
      />
      <Composition
        id="RamuPromoReels"
        component={PromoVideo}
        durationInFrames={durationInFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ format: "reels" as const }}
      />
    </>
  );
}
