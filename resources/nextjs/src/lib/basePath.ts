export const BASE_PATH = "/softlogic";

export function withBase(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith(`${BASE_PATH}/`)) {
    return clean;
  }
  return `${BASE_PATH}${clean}`;
}
