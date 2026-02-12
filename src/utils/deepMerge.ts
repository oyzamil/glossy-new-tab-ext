type PlainObject = Record<string, any>;

const isPlainObject = (value: unknown): value is PlainObject =>
  Object.prototype.toString.call(value) === '[object Object]';

/**
 * Deeply merges objects from left → right
 * - Does NOT mutate inputs
 * - Arrays are replaced, not merged
 * - Later values override earlier ones
 */
export function deepMerge<T>(...sources: Partial<T>[]): T {
  const result: any = {};

  for (const source of sources) {
    if (!source) continue;

    for (const key of Object.keys(source)) {
      const sourceValue = (source as any)[key];
      const targetValue = result[key];

      // If both are plain objects → recurse
      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      }
      // Arrays → replace completely
      else if (Array.isArray(sourceValue)) {
        result[key] = sourceValue.slice();
      }
      // Objects → clone
      else if (isPlainObject(sourceValue)) {
        result[key] = deepMerge({}, sourceValue);
      }
      // Primitives → assign
      else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T;
}
