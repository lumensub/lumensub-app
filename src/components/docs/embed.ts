/**
 * HTML for the "Subscribe with Stellar" button. It is a plain link with
 * inline styles so it works on any site, including ones that block scripts.
 */
export function subscribeButtonHtml(origin: string, planId: string, label = "Subscribe with Stellar"): string {
  const href = `${origin.replace(/\/$/, "")}/pay/${encodeURIComponent(planId)}`;
  const style = [
    "display:inline-flex",
    "align-items:center",
    "gap:8px",
    "padding:10px 18px",
    "border-radius:8px",
    "background:#0e7490",
    "color:#ffffff",
    "font:600 14px/1 system-ui,sans-serif",
    "text-decoration:none",
  ].join(";");
  const safeLabel = label.replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]!);
  return `<a href="${href}" target="_blank" rel="noopener" style="${style}">${safeLabel}</a>`;
}
