import type { NewsAttachment } from "../types";

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

const SUPPORTED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const isSupportedAttachment = (file: File, maxSizeBytes = MAX_ATTACHMENT_SIZE_BYTES): boolean => {
  if (file.size > maxSizeBytes) {
    return false;
  }

  if (file.type.startsWith("image/")) {
    return true;
  }

  return SUPPORTED_ATTACHMENT_MIME_TYPES.has(file.type);
};

export const toAttachment = (file: File): Promise<NewsAttachment> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Invalid file"));
        return;
      }

      resolve({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
