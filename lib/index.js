// src/index.ts
import Schema from "@deepseek-ai/schemastery";

// src/preferences.ts
var DEFAULT_PREFERENCES = Object.freeze({
  presentation: "character",
  background: true,
  side: "left",
  intensity: 55,
  artScale: 100
});

// src/index.ts
var name = "ui-skin-asuka-p01";
var Config = Schema.object({
  presentation: Schema.union(["character", "focus"]).default(DEFAULT_PREFERENCES.presentation).volatile(),
  background: Schema.boolean().default(DEFAULT_PREFERENCES.background).volatile(),
  side: Schema.union(["left", "right"]).default(DEFAULT_PREFERENCES.side).volatile(),
  intensity: Schema.number().step(1).min(0).max(100).default(DEFAULT_PREFERENCES.intensity).volatile(),
  artScale: Schema.number().step(1).min(60).max(120).default(DEFAULT_PREFERENCES.artScale).volatile()
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
