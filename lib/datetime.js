function pad(n, width) {
  return String(n).padStart(width || 2, "0");
}

function formatWithPattern(date, pattern) {
  const h24 = date.getHours();
  const h12 = h24 % 12 || 12;
  const A = h24 >= 12 ? "PM" : "AM";
  const tokens = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(h24),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    h: String(h12),
    A,
    a: A.toLowerCase(),
  };
  return String(pattern || "").replace(/YYYY|YY|MM|DD|HH|mm|ss|h|A|a/g, (tok) => tokens[tok]);
}

function formatDateTime(kind, settings, now) {
  const date = now instanceof Date ? now : new Date();
  const dateStr = formatWithPattern(date, (settings && settings.dateFormat) || "MM/DD/YY");
  const timeStr = formatWithPattern(date, (settings && settings.timeFormat) || "h:mm A");
  if (kind === "date") return dateStr;
  if (kind === "time") return timeStr;
  const combined = (settings && settings.combinedFormat) || "{date} {time}";
  return combined.replace("{date}", dateStr).replace("{time}", timeStr);
}

module.exports = { formatWithPattern, formatDateTime };
