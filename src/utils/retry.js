const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (err) => {
  if (!err) return false;
  const status = err.response?.status;
  if (status && status < 500) return false;
  if (status >= 500) return true;
  return ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"].includes(err.code);
};

const withRetry = async (
  fn,
  { retries = 3, baseDelay = 100, maxDelay = 1000 } = {}
) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === retries) throw err;
      const exp = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
      const jitter = Math.random() * exp * 0.5;
      await sleep(exp + jitter);
    }
  }
  throw lastErr;
};

module.exports = { withRetry, isRetryable };
