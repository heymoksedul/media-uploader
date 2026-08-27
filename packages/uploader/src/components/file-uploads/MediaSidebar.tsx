import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatShortDateWithYear } from "../../lib/format/date";
import { formatSize } from "../media-helpers";
import { useMediaContext, type ApiMedia } from "../MediaProvider";

export function MediaSidebar({
  file,
  onClose,
}: {
  file?: ApiMedia;
  onClose?: () => void;
}) {
  const { updateMedia, config } = useMediaContext();
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const splitFilename = (name: string) => {
    if (!name) return { base: "", ext: "" };
    const lastDot = name.lastIndexOf(".");
    if (lastDot === -1) return { base: name, ext: "" };
    return { base: name.substring(0, lastDot), ext: name.substring(lastDot) };
  };

  const fileExt = file ? splitFilename(file.filename).ext : "";

  const [formData, setFormData] = useState({
    filename: "",
    altText: "",
    title: "",
    caption: "",
    description: "",
  });

  useEffect(() => {
    if (file) {
      setFormData({
        filename: splitFilename(file.filename || "").base,
        altText: file.altText || "",
        title: file.title || "",
        caption: file.caption || "",
        description: file.description || "",
      });
    }
  }, [file]);

  if (!file) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field: keyof typeof formData) => {
    let newValue = formData[field];
    if (field === "filename") {
      newValue = newValue + fileExt;
    }

    const currentValue = file[field as keyof ApiMedia] || "";
    if (currentValue === newValue) return;

    setIsSaving(true);
    await updateMedia(file.id, { [field]: newValue });
    setIsSaving(false);
  };

  const size = formatSize(Number(file.sizeBytes));
  const url = config?.resolveMediaUrl
    ? config.resolveMediaUrl(file.url)
    : file.url;

  return (
    <div className="flex flex-col gap-6 h-full pb-6 text-sm pr-2 relative">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">Preview</h4>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Preview Area */}
      <div className="w-full bg-muted/30 rounded-lg border border-border/50 flex items-center justify-center overflow-hidden min-h-30">
        {file.contentType?.startsWith("video/") ||
        url.match(/\.(mp4|webm|ogg)$/i) ? (
          <video
            src={url}
            controls
            className="w-full max-h-50 object-contain"
          />
        ) : (
          <img
            src={url}
            alt={file.altText || file.filename}
            className="w-full max-h-50 object-contain"
          />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <span className="font-medium text-muted-foreground shrink-0">
            Uploaded on
          </span>
          <span className="font-medium text-foreground text-right">
            {formatShortDateWithYear(file.createdAt)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="font-medium text-muted-foreground shrink-0">
            File size
          </span>
          <span className="font-medium text-foreground text-right">{size}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="font-medium text-muted-foreground shrink-0">
            Dimensions
          </span>
          <span className="font-medium text-foreground text-right">
            {file.width && file.height
              ? `${file.width} by ${file.height} pixels`
              : "—"}
          </span>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground font-medium text-xs">
            Name
          </span>
          <div className="flex items-center w-full">
            <Input
              value={formData.filename}
              onChange={(e) => handleChange("filename", e.target.value)}
              onBlur={() => handleBlur("filename")}
              className="flex-1 h-8 text-xs bg-background dark:bg-background border-border/60 focus-visible:ring-primary/20 shadow-none rounded-r-none border-r-0"
            />
            {fileExt && (
              <div className="h-8 px-2 flex items-center bg-muted/50 text-muted-foreground border border-border/60 rounded-r-md text-xs shrink-0 select-none">
                {fileExt}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground font-medium text-xs">
            Alt Text
          </span>
          <Input
            value={formData.altText}
            onChange={(e) => handleChange("altText", e.target.value)}
            onBlur={() => handleBlur("altText")}
            className="w-full h-8 text-xs bg-background dark:bg-background border-border/60 focus-visible:ring-primary/20 shadow-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground font-medium text-xs">
            Caption
          </span>
          <Input
            value={formData.caption}
            onChange={(e) => handleChange("caption", e.target.value)}
            onBlur={() => handleBlur("caption")}
            className="w-full h-8 text-xs bg-background dark:bg-background border-border/60 focus-visible:ring-primary/20 shadow-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground font-medium text-xs">
            File URL
          </span>
          <div className="w-full flex items-center gap-1 border border-border/60 rounded-md bg-muted/30 pl-2">
            <span className="flex-1 truncate text-xs text-muted-foreground select-all">
              {url}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="shrink-0 h-7 w-7 text-muted-foreground border-l border-border/60 rounded-l-none bg-background"
            >
              {isCopied ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isSaving && (
        <div className="text-xs text-muted-foreground text-right animate-pulse mt-2">
          Saving changes...
        </div>
      )}
    </div>
  );
}
