import axios from 'axios';

// Basic axios logging for development. This prints request URL, method,
// and response status. It redacts request data for passwords to avoid
// accidentally printing credentials in logs. Only used in dev builds.
export default function setupAxiosLogging() {
  if (!(globalThis as any).__DEV__) return;

  axios.interceptors.request.use((req) => {
    try {
      // Defensive: if an Authorization header is present but the token does
      // not look like a JWT (three dot-separated parts), strip it so we do
      // not accidentally send malformed tokens to the backend.
      const hdrs: any = req.headers || {};
      const authHeader = hdrs.Authorization || hdrs.authorization || (hdrs.common && (hdrs.common.Authorization || hdrs.common.authorization));
      if (authHeader && typeof authHeader === 'string') {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length !== 3) {
          try {
            // eslint-disable-next-line no-console
            console.warn('[axios] stripping non-JWT Authorization header for request', req.method?.toUpperCase(), req.url);
          } catch (e) {}
          // remove possible locations
          delete hdrs.Authorization;
          delete hdrs.authorization;
          if (hdrs.common) {
            delete hdrs.common.Authorization;
            delete hdrs.common.authorization;
          }
          req.headers = hdrs;
        }
      }

      const safeData = req.data && typeof req.data === 'object'
        ? Object.assign({}, req.data, { password: req.data.password ? '[REDACTED]' : undefined })
        : req.data;
      // eslint-disable-next-line no-console
      console.log('[axios] request', req.method?.toUpperCase(), req.url, safeData || '');
    } catch (e) {}
    return req;
  });

  axios.interceptors.response.use(
    (res) => {
      try {
        // eslint-disable-next-line no-console
        console.log('[axios] response', res.status, res.config.url);
      } catch (e) {}
      return res;
    },
    async (err) => {
      try {
        // eslint-disable-next-line no-console
        console.error('[axios] response error', err?.response?.status, err?.config?.url, (err as any)?.message);
      } catch (e) {}

      // If server returned 429 (rate limit), implement a small retry with
      // exponential backoff (client-side best-effort). Don't retry more
      // than 3 times to avoid creating request storms.
      const config = err?.config;
      if (config && err?.response && err.response.status === 429) {
        config.__retryCount = config.__retryCount || 0;
        const MAX_RETRIES = 3;
        if (config.__retryCount < MAX_RETRIES) {
          config.__retryCount += 1;
          const delay = Math.pow(2, config.__retryCount) * 250; // 250ms, 500ms, 1000ms
          await new Promise((res) => setTimeout(res, delay));
          return axios(config);
        }
      }

      return Promise.reject(err);
    }
  );
}
