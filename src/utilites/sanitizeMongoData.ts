export function sanitizeMongoDoc(doc: any, seen = new WeakMap()): any {
  if (Array.isArray(doc)) {
    return doc.map((item) => sanitizeMongoDoc(item, seen));
  }

  if (doc && typeof doc === "object") {
    if (seen.has(doc)) return seen.get(doc); // 🛠 return cached version

    if (isObjectId(doc)) return doc.toString();
    if (doc instanceof Date) return doc.toISOString();

    const result: Record<string, any> = {};
    seen.set(doc, result); // 🛠 store placeholder early to prevent recursion loops

    for (const key in doc) {
      result[key] = sanitizeMongoDoc(doc[key], seen);
    }

    return result;
  }

  return doc;
}

function isObjectId(value: any): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.toHexString === "function"
  );
}
