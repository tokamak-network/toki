// Central seasonal-campaign config.
//
// To reskin the seasonal surfaces (currently: the first-visit promo popup) for a
// new season, do THREE things in one place each:
//   1. add a SeasonKey + SEASONS entry below, then flip CURRENT_SEASON
//   2. drop the new portrait poster into /public and point `poster` at it
//   3. update the `seasonalPromo` copy block in src/locales/en.ts + ko.ts
//
// The `dismissKey` is season-scoped on purpose: changing the season changes the
// key, so a returning user who dismissed last season's popup sees the new one
// once. (Mirrors the existing "toki-intro-seen" localStorage pattern.)

export type SeasonKey = "summer-2026";

export type SeasonConfig = {
  /** localStorage key used to suppress the promo popup for this season. */
  dismissKey: string;
  /** Portrait promo poster shown inside the popup (served from /public). */
  poster: string;
};

export const SEASONS: Record<SeasonKey, SeasonConfig> = {
  "summer-2026": {
    dismissKey: "toki-promo-seen:summer-2026",
    poster: "/toki-promo-mag.png",
  },
};

export const CURRENT_SEASON: SeasonKey = "summer-2026";

export const currentSeason: SeasonConfig = SEASONS[CURRENT_SEASON];
