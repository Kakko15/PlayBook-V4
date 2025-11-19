import xss from "xss";

const options = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script"],
  css: false,
};

const sanitizer = new xss.FilterXSS(options);

export const sanitize = (input) => {
  if (typeof input !== "string") {
    return input;
  }
  return sanitizer.process(input);
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const sanitizedObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string") {
        sanitizedObj[key] = sanitize(value);
      } else if (typeof value === "object" && value !== null) {
        sanitizedObj[key] = sanitizeObject(value);
      } else {
        sanitizedObj[key] = value;
      }
    }
  }
  return sanitizedObj;
};
