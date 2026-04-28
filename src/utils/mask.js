const SENSITIVE_KEYS = new Set([
  "email",
  "phone",
  "line1",
  "address",
  "card",
  "card_number",
  "cardnumber",
  "cvv",
  "pincode",
]);

const maskEmail = (e) => {
  if (typeof e !== "string" || !e.includes("@")) return e;
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  const head = local[0] || "";
  return `${head}***@${domain}`;
};

const maskPhone = (p) => {
  if (typeof p !== "string") return p;
  const digits = p.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
};

const maskValue = (key, value) => {
  if (value === null || value === undefined) return value;
  const k = key.toLowerCase();
  if (k === "email") return maskEmail(value);
  if (k === "phone") return maskPhone(value);
  if (SENSITIVE_KEYS.has(k)) return "***";
  return value;
};

const maskObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(maskObject);
  if (typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = maskValue(k, v);
    } else if (v !== null && typeof v === "object") {
      out[k] = maskObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

module.exports = { maskEmail, maskPhone, maskObject };
