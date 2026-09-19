// src/index.ts
import Schema from "@deepseek-ai/schemastery";

// src/preferences.ts
var SETTINGS_NAMESPACE = "asuka-p01";
var DEFAULT_PREFERENCES = Object.freeze({
  presentation: "character",
  background: true,
  side: "left",
  intensity: 55,
  artScale: 100
});

// src/index.ts
var name = "ui-skin-asuka-p01";
var PreferenceSchema = Schema.object({
  presentation: Schema.union(["character", "focus"]).default(DEFAULT_PREFERENCES.presentation),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background),
  side: Schema.union(["left", "right"]).default(DEFAULT_PREFERENCES.side),
  intensity: Schema.number().step(1).min(0).max(100).default(DEFAULT_PREFERENCES.intensity),
  artScale: Schema.number().step(1).min(60).max(120).default(DEFAULT_PREFERENCES.artScale)
});
function apply(ctx) {
  ctx.inject(["settings"], (scope) => {
    scope.settings.register(SETTINGS_NAMESPACE, PreferenceSchema);
  });
}
export {
  PreferenceSchema,
  apply,
  name
};
