import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { PromoReels } from "./PromoReels";
import { VIDEO_CONFIG } from "./config";
import { FPS, TOTAL_DURATION_SECONDS } from "./data/workflow-script";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="RamuPromoDesktop"
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION_SECONDS * FPS}
        fps={FPS}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={{}}
      />
      <Composition
        id="RamuPromoReels"
        component={PromoReels}
        durationInFrames={TOTAL_DURATION_SECONDS * FPS}
        fps={FPS}
        height={1920}
        width={1080}
        defaultProps={{}}
      />
    </>
  );
}
