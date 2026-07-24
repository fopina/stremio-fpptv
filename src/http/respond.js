export const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "*"
};

export function sendResponse(
  response,
  statusCode,
  body = "",
  { contentType = "text/plain; charset=utf-8", cacheMaxAge = null, headers = {} } = {}
) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    ...(Number.isInteger(cacheMaxAge) ? { "cache-control": `public, max-age=${cacheMaxAge}` } : {}),
    "content-type": contentType,
    ...headers
  });
  response.end(body);
}

export function sendJson(response, statusCode, body, options = {}) {
  const cacheMaxAge = Number.isInteger(body.cacheMaxAge) ? body.cacheMaxAge : options.cacheMaxAge;
  sendResponse(response, statusCode, JSON.stringify(body, null, 2), {
    ...options,
    cacheMaxAge,
    contentType: "application/json; charset=utf-8"
  });
}

export function sendError(response, statusCode, message, options = {}) {
  sendJson(response, statusCode, { error: message }, options);
}
