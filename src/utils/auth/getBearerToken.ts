export const getBearerToken = (req: Request): string | null => {
  const authorization = req.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const authToken = authorization.slice("Bearer ".length).trim();

  if (!authToken || authToken === "null" || authToken === "undefined") {
    return null;
  }

  return authToken;
}
