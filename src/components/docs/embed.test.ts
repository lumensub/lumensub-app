import { describe, expect, it } from "vitest";
import { subscribeButtonHtml } from "./embed";

describe("subscribeButtonHtml", () => {
  it("links to the hosted checkout for the plan", () => {
    const html = subscribeButtonHtml("https://pay.example.com/", "42");
    expect(html).toContain('href="https://pay.example.com/pay/42"');
    expect(html).toContain('rel="noopener"');
    expect(html).toContain(">Subscribe with Stellar</a>");
  });

  it("escapes a custom label", () => {
    const html = subscribeButtonHtml("https://x.test", "1", '<b>"Join"</b> & save');
    expect(html).toContain("&lt;b&gt;&quot;Join&quot;&lt;/b&gt; &amp; save");
    expect(html).not.toContain("<b>");
  });

  it("encodes the plan id", () => {
    expect(subscribeButtonHtml("https://x.test", "1 2")).toContain("/pay/1%202");
  });
});
