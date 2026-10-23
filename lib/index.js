// src/index.ts
import Schema from "@deepseek-ai/schemastery";

// src/preferences.ts
var SETTINGS_NAMESPACE = "ui-skin-asuka-p01";
var INTENSITY_RANGE = { min: 0, max: 100 };
var ART_SCALE_RANGE = { min: 60, max: 120 };
var DEFAULT_PREFERENCES = Object.freeze({
  presentation: "character",
  background: true,
  side: "left",
  intensity: 55,
  artScale: 100
});

// src/index.ts
var name = SETTINGS_NAMESPACE;
var Config = Schema.object({
  presentation: Schema.union(["character", "focus"]).default(DEFAULT_PREFERENCES.presentation).volatile(),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background).volatile(),
  side: Schema.union(["left", "right"]).default(DEFAULT_PREFERENCES.side).volatile(),
  intensity: Schema.number().step(1).min(INTENSITY_RANGE.min).max(INTENSITY_RANGE.max).default(DEFAULT_PREFERENCES.intensity).volatile(),
  artScale: Schema.number().step(1).min(ART_SCALE_RANGE.min).max(ART_SCALE_RANGE.max).default(DEFAULT_PREFERENCES.artScale).volatile()
});
function apply(ctx) {
  ctx.inject(["settings"], (scope) => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber));
  });
}
export {
  Config,
  apply,
  name
};
