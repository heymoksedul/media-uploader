import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMediaContext } from "../MediaProvider";

interface UseMediaUploaderProps {
  onConfirm: (
    uploadedUrls: string[] | string,
    ratio?: number,
    selectedType?: string,
  ) => void;
  imageRatio?: number;
  imageWidth?: number;
  imageFormat?: string;
  isMultiple?: boolean;
  fileType?: "all" | "image" | "video";
  onlyVideo?: boolean;
  initialFile?: File | null;
  initialSelectedUrl?: string;
  initialSelectedUrls?: string[];
  onUploadSuccess?: () => void;
}

export function useMediaUploader({
  onConfirm,
  imageRatio,
  imageWidth,
  imageFormat,
  isMultiple = false,
  fileType = "all",
  onlyVideo = false,
  initialFile,
  initialSelectedUrl,
  initialSelectedUrls,
  onUploadSuccess,
}: UseMediaUploaderProps) {
  const resolvedFileType = onlyVideo ? "video" : fileType;
  const [activeTab, setActiveTab] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileUrls, setSelectedFileUrls] = useState<string[]>(
    initialSelectedUrls || (initialSelectedUrl ? [initialSelectedUrl] : [])
  );
  const [selectedFileRatio, setSelectedFileRatio] = useState<number | null>(
    null,
  );
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [isVideoUpload, setIsVideoUpload] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    mediaFiles: files,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore: onLoadMore,
    uploadMedia,
    deleteMedia: contextRemoveItem,
    isLimitError,
    onLimitExceeded,
  } = useMediaContext();

  const removeItem = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && selectedFileUrls.includes(file.url)) {
      setSelectedFileUrls((prev) => prev.filter((u) => u !== file.url));
    }
    await contextRemoveItem(id);
  };

  const setFolder = (folder: string | null) => {
    // In a real app, you might want to filter the files or trigger a re-fetch.
    // For now, the MediaProvider handles all media.
  };

  const setSearchInput = (query: string) => {
    // handled by provider if needed
  };

  useEffect(() => {
    if (resolvedFileType === "image") setFolder("images");
    else if (resolvedFileType === "video") setFolder("videos");
    else setFolder(null);
  }, [resolvedFileType, setFolder]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery, setSearchInput]);

  const filteredFiles = files;

  const handleFileSelect = (
    url: string,
    ratio: number | null,
    fromUpload: boolean,
    fileType: string,
    file?: File,
  ) => {
    if (fileType === "video") {
      if (fromUpload) {
        setIsVideoUpload(true);
        setSelectedFile(file || null);
        return;
      }
      if (isMultiple) {
        setSelectedFileUrls((prev) =>
          prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
        );
      } else {
        setSelectedFileUrls([url]);
      }
      return;
    }

    if (fileType === "file") {
      if (isMultiple) {
        setSelectedFileUrls((prev) =>
          prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
        );
      } else {
        setSelectedFileUrls([url]);
        onConfirm(url, 1, "file");
      }
      return;
    }

    if (fileType === "image") {
      const isGif =
        url.toLowerCase().endsWith(".gif") || file?.type === "image/gif";
      const isSvg =
        url.toLowerCase().endsWith(".svg") ||
        url.startsWith("data:image/svg+xml") ||
        file?.type === "image/svg+xml";
      const bypassCropper = isGif || isSvg;

      if (isMultiple) {
        setSelectedFileUrls((prev) =>
          prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
        );
        return;
      }

      setSelectedFileUrls([url]);
      setSelectedFileRatio(ratio);
      if (file) {
        setSelectedFile(file);
      }

      if (bypassCropper) {
        onConfirm(url, 1, "image");
        return;
      }

      if (fromUpload && !isMultiple) {
        setIsCropping(true);
      }
    }
  };

  const onFileUpload = async (fileOrUrl: File | string) => {
    if (typeof fileOrUrl === "string") {
      handleFileSelect(fileOrUrl, 1, true, "image");
      return;
    }

    const file = fileOrUrl;

    if (isMultiple) {
      const isImage = file.type.startsWith("image/");
      const isVectorOrAnim = file.type.includes("svg") || file.type.includes("gif");
      
      if (isImage && !isVectorOrAnim) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const img = new Image();
            img.onload = async () => {
              try {
                toast.loading(`Uploading ${file.name}...`, { id: `upload-${file.name}` });
                
                let targetWidth = img.width;
                let targetHeight = img.height;
                if (targetWidth > 1080) {
                  const ratio = 1080 / targetWidth;
                  targetWidth = 1080;
                  targetHeight = Math.round(targetHeight * ratio);
                }

                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Could not get canvas context");
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                const webpBlob = await new Promise<Blob>((resolve, reject) =>
                  canvas.toBlob(
                    (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
                    "image/webp",
                    0.8
                  )
                );
                
                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                const result = await uploadMedia(
                  new File([webpBlob], newFileName, { type: "image/webp" }),
                  "images"
                );

                if (result.success && result.data) {
                  toast.success("Uploaded successfully!", { id: `upload-${file.name}` });
                  const uploadedUrl = result.data.url;
                  setSelectedFileUrls((prev) =>
                    prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl]
                  );
                  setActiveTab(1);
                  if (onUploadSuccess) onUploadSuccess();
                } else {
                  toast.error("Upload failed", { id: `upload-${file.name}` });
                }
              } catch (e) {
                toast.error("Upload error", { id: `upload-${file.name}` });
              }
            };
            img.src = reader.result as string;
          }
        };
        reader.readAsDataURL(file);
      } else {
        try {
          toast.loading(`Uploading ${file.name}...`, { id: `upload-${file.name}` });
          const folder = file.type.startsWith("video/") ? "videos" : "images";
          const result = await uploadMedia(file, folder);
          if (result.success && result.data) {
            toast.success("Uploaded successfully!", { id: `upload-${file.name}` });
            const uploadedUrl = result.data.url;
            setSelectedFileUrls((prev) => 
              prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl]
            );
            setActiveTab(1);
            if (onUploadSuccess) onUploadSuccess();
          } else {
            toast.error("Upload failed", { id: `upload-${file.name}` });
          }
        } catch (e) {
          toast.error("Upload error", { id: `upload-${file.name}` });
        }
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const fileUrl = reader.result as string;
        if (file.type.startsWith("image/")) {
          if ((imageWidth || imageFormat) && !isMultiple) {
            const img = new Image();
            img.onload = async () => {
              let isExactSize = true;
              if (imageWidth) {
                const targetHeight = imageRatio
                  ? Math.round(imageWidth / imageRatio)
                  : imageWidth;
                isExactSize =
                  img.width === imageWidth && img.height === targetHeight;
              }
              const isExactFormat =
                !imageFormat || file.type === `image/${imageFormat}`;

              if (isExactSize && isExactFormat) {
                try {
                  toast.loading("Uploading image...", { id: "direct-upload" });

                  // Architecture: convert to WebP (quality 70-80%) before uploading.
                  // The backend (Sharp/BullMQ) will generate AVIF + variants from this.
                  const canvas = document.createElement("canvas");
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) throw new Error("Could not get canvas context");
                  ctx.drawImage(img, 0, 0);

                  const webpBlob = await new Promise<Blob>((resolve, reject) =>
                    canvas.toBlob(
                      (b) =>
                        b ? resolve(b) : reject(new Error("toBlob failed")),
                      "image/webp",
                      0.75,
                    ),
                  );

                  const result = await uploadMedia(
                    new File([webpBlob], "image.webp", { type: "image/webp" }),
                    "images",
                  );
                  if (result.success && result.data) {
                    onConfirm(result.data.url, imageRatio || 1, "image");
                    toast.success("Image uploaded successfully!", {
                      id: "direct-upload",
                    });
                  } else {
                    toast.error("Failed to upload image", {
                      description: result.error || "An error occurred",
                      id: "direct-upload",
                    });
                    if (
                      isLimitError &&
                      result.error &&
                      isLimitError(result.error)
                    ) {
                      onLimitExceeded?.();
                    }
                  }
                } catch (error) {
                  console.error("Direct upload error:", error);
                  toast.dismiss("direct-upload");
                  const message = error instanceof Error ? error.message : "";
                  if (isLimitError && message && isLimitError(message)) {
                    onLimitExceeded?.();
                  } else {
                    toast.error("Failed to upload image", {
                      id: "direct-upload",
                    });
                  }
                }
              } else {
                handleFileSelect(
                  fileUrl,
                  imageRatio || null,
                  true,
                  "image",
                  file,
                );
              }
            };
            img.src = fileUrl;
          } else {
            handleFileSelect(fileUrl, imageRatio || null, true, "image", file);
          }
        } else if (file.type.startsWith("video/")) {
          handleFileSelect(fileUrl, null, true, "video", file);
        } else {
          handleFileSelect(fileUrl, 1, true, "file", file);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (initialFile) {
      setTimeout(() => {
        onFileUpload(initialFile);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const handleCropApply = (croppedUrl?: string) => {
    if (!croppedUrl) return;
    setSelectedFileUrls([croppedUrl]);
    setIsCropping(false);
    onConfirm(croppedUrl, imageRatio || 1, "image");
  };

  const handleVideoUploadConfirm = (videoUrl: string) => {
    setIsVideoUpload(false);
    setSelectedFile(null);
    onConfirm(videoUrl, 1, "video");
  };

  const isVideoType = (url: string) => {
    return /\.(mp4|mov|avi|mkv|webm)$/i.test(url);
  };

  const handleConfirm = () => {
    if (selectedFileUrls.length === 0) {
      toast.error("Please select a file before confirming.");
      return;
    }

    if (isVideoUpload) {
      onConfirm(selectedFileUrls[0], 1, "video");
      return;
    }

    if (selectedFileUrls.length > 0 && isVideoType(selectedFileUrls[0])) {
      onConfirm(selectedFileUrls[0], 1, "video");
      return;
    }

    if (isMultiple) {
      onConfirm(selectedFileUrls, 1, "image");
      return;
    }

    const url = selectedFileUrls[0];
    if (selectedFileRatio === null) {
      onConfirm(url, 1, "image");
      return;
    }

    if (
      activeTab === 6 ||
      (imageRatio && Math.abs(selectedFileRatio - imageRatio) > 0.01)
    ) {
      setIsCropping(true);
    } else {
      onConfirm(url, selectedFileRatio, "image");
    }
  };

  return {
    resolvedFileType,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedFileUrls,
    isCropping,
    setIsCropping,
    isVideoUpload,
    setIsVideoUpload,
    selectedFile,
    setSelectedFileUrls,
    filteredFiles,
    isLoading,
    isLoadingMore,
    hasMore,
    onLoadMore,
    removeItem,
    onFileUpload,
    handleCropApply,
    handleVideoUploadConfirm,
    handleConfirm,
    handleFileSelect,
  };
}
