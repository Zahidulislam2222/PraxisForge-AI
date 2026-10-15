import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MotionProvider,
  useSiteMotion,
} from "../../src/components/motion-provider";

function PreferenceProbe() {
  const motion = useSiteMotion();
  return createElement(
    "button",
    { disabled: motion.reduced },
    motion.enabled ? "playing" : "paused",
  );
}

afterEach(() => vi.unstubAllGlobals());
describe("motion static hydration boundary", () => {
  it("renders stable server HTML without a browser media API", () => {
    expect(
      renderToString(
        createElement(MotionProvider, null, createElement(PreferenceProbe)),
      ),
    ).toContain(">playing</button>");
  });
  it("keeps the server snapshot unchanged even when the client browser prefers reduced motion", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    const html = renderToString(
      createElement(MotionProvider, null, createElement(PreferenceProbe)),
    );
    expect(html).toContain(">playing</button>");
    expect(html).not.toContain("disabled");
  });
});
