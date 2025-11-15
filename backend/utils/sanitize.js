import xss from "xss";

// Options for the XSS filter
const options = {
  whiteList: {}, // Empty whitelist means all tags will be stripped
  stripIgnoreTag: true, // Strip all tags, not just the ones in whitelist
  stripIgnoreTagBody: ["script"], // Strip tags like <script> and their content
  css: false, // Strip all CSS
};

const sanitizer = new xss.FilterXSS(options);

/**
 * Sanitizes a string, removing all HTML tags and potential XSS vectors.
 * @param {string} input The string to sanitize.
 * @returns {string} The sanitized string.
 */
export const sanitize = (input) => {
  if (typeof input !== "string") {
    return input;
  }
  return sanitizer.process(input);
};

/**
 * Sanitizes all string values in an object.
 * @param {Object} obj The object to sanitize.
 * @returns {Object} The object with sanitized string values.
 */
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
        sanitizedObj[key] = sanitizeObject(value); // Recursively sanitize
      } else {
        sanitizedObj[key] = value;
      }
    }
  }
  return sanitizedObj;
};
