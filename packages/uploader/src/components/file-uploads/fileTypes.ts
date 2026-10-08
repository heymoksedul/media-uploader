/**
 * What a picker accepts.
 *  - "image" / "video": that kind only.
 *  - "all": images and videos (media) — the original default.
 *  - "document": documents only (PDF, Word, Excel, PowerPoint, CSV, text).
 *  - "any": images, videos and documents.
 */
export type MediaUploadFileType = "all" | "image" | "video" | "document" | "any";

export type FileKind = "image" | "video" | "document";

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
];

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.avif,.gif,.svg," + IMAGE_MIME_TYPES.join(",");
const VIDEO_ACCEPT = ".mp4,.webm,.mov," + VIDEO_MIME_TYPES.join(",");
const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt," +
  DOCUMENT_MIME_TYPES.join(",");

const DOCUMENT_EXT_RE = /\.(pdf|docx?|xlsx?|pptx?|csv|txt)(\?|#|$)/i;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif|gif|svg)(\?|#|$)/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|mkv|avi)(\?|#|$)/i;

/** A file's kind from its MIME type, falling back to its name / URL. */
export function kindOf(mime: string | undefined | null, nameOrUrl = ""): FileKind {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m && DOCUMENT_MIME_TYPES.includes(m)) return "document";
  if (IMAGE_EXT_RE.test(nameOrUrl)) return "image";
  if (VIDEO_EXT_RE.test(nameOrUrl)) return "video";
  return "document";
}

/** Whether a picker of `fileType` takes a file of `kind`. */
export function acceptsKind(fileType: MediaUploadFileType, kind: FileKind): boolean {
  switch (fileType) {
    case "image":
      return kind === "image";
    case "video":
      return kind === "video";
    case "document":
      return kind === "document";
    case "any":
      return true;
    case "all":
    default:
      return kind === "image" || kind === "video";
  }
}

/** Whether an uploaded `File` is one this picker supports. */
export function isSupportedFile(fileType: MediaUploadFileType, file: File): boolean {
  const kind = kindOf(file.type, file.name);
  if (!acceptsKind(fileType, kind)) return false;
  if (kind === "image") return IMAGE_MIME_TYPES.includes(file.type);
  if (kind === "video") return VIDEO_MIME_TYPES.includes(file.type);
  // Some OSes report no / generic MIME for office files — trust the name.
  return DOCUMENT_MIME_TYPES.includes(file.type) || DOCUMENT_EXT_RE.test(file.name);
}

/** The `<input accept>` for a picker. */
export function acceptAttr(fileType: MediaUploadFileType): string {
  switch (fileType) {
    case "image":
      return IMAGE_ACCEPT;
    case "video":
      return VIDEO_ACCEPT;
    case "document":
      return DOCUMENT_ACCEPT;
    case "any":
      return [IMAGE_ACCEPT, VIDEO_ACCEPT, DOCUMENT_ACCEPT].join(",");
    case "all":
    default:
      return [IMAGE_ACCEPT, VIDEO_ACCEPT].join(",");
  }
}

/** Human list of what a picker takes, for hints and errors. */
export function fileTypeLabel(fileType: MediaUploadFileType): string {
  switch (fileType) {
    case "image":
      return "JPG, PNG, WebP, AVIF, GIF or SVG";
    case "video":
      return "MP4, WebM or MOV";
    case "document":
      return "PDF, Word, Excel, PowerPoint, CSV or TXT";
    case "any":
      return "Images, videos, PDFs and documents";
    case "all":
    default:
      return "Supported image or video files";
  }
}

/** The media-library folder a file of this kind belongs to. */
export function folderFor(kind: FileKind): "images" | "videos" | "documents" {
  return kind === "image" ? "images" : kind === "video" ? "videos" : "documents";
}
