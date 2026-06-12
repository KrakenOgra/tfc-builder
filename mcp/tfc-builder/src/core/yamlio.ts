import { parse, stringify } from "yaml";
import { fail, ok, type Result } from "./result.js";
import { readText, writeText } from "./fs.js";

export async function readYaml<T>(p: string): Promise<Result<T>> {
  const textResult = await readText(p);
  if (!textResult.ok) {
    return { ok: false, error: textResult.error };
  }
  try {
    const parsed = parse(textResult.data) as T;
    return ok(parsed);
  } catch (e) {
    return fail("YAML_PARSE_ERROR", `Failed to parse YAML at ${p}: ${String(e)}`);
  }
}

export async function writeYaml(
  p: string,
  data: unknown,
): Promise<Result<undefined>> {
  try {
    const text = stringify(data, { lineWidth: 0 });
    return writeText(p, text);
  } catch (e) {
    return fail("YAML_STRINGIFY_ERROR", `Failed to stringify YAML: ${String(e)}`);
  }
}
