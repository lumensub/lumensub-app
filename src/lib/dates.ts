const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function parse(value: string | number | bigint | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "bigint" || typeof value === "number") return new Date(Number(value) * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format an ISO string or unix seconds as a date. Missing values render as "-". */
export function formatDate(value: string | number | bigint | null | undefined): string {
  const date = parse(value);
  return date ? dateFormat.format(date) : "-";
}

export function formatDateTime(value: string | number | bigint | null | undefined): string {
  const date = parse(value);
  return date ? dateTimeFormat.format(date) : "-";
}
