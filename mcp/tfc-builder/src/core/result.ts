export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; hint?: string } };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: string,
  message: string,
  hint?: string,
): Result<T> {
  if (hint !== undefined) {
    return { ok: false, error: { code, message, hint } };
  }
  return { ok: false, error: { code, message } };
}
