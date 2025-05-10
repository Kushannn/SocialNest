// utils/sanitizeMongoDoc.ts

export function sanitizeMongoDoc(doc: any): any {
  if (Array.isArray(doc)) {
    return doc.map(sanitizeMongoDoc);
  }

  if (doc && typeof doc === "object") {
    const newObj: Record<string, any> = {};
    for (const key in doc) {
      const value = doc[key];

      // Handle _id or any ObjectId
      if ((key === "_id" || key.endsWith("Id")) && isObjectId(value)) {
        newObj[key] = value.toString();
      } else if (Array.isArray(value)) {
        newObj[key] = value.map(sanitizeMongoDoc);
      } else if (typeof value === "object" && value !== null) {
        newObj[key] = sanitizeMongoDoc(value);
      } else {
        newObj[key] = value;
      }
    }
    return newObj;
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
