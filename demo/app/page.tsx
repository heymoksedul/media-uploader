"use client";

import {
  ApiMedia,
  MediaProvider,
  MediaUploadDialog,
  MediaUploadField,
} from "@hellokit/media-uploader";
import { Image as ImageIcon, X } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";

export default function Home() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [thumb, setThumb] = useState("");
  const [cover, setCover] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [attachment, setAttachment] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const dark = stored === "dark" || (!stored && prefersDark);
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Mock in-memory backend adapter for the demo
  const store = useRef<ApiMedia[]>([]);
  const adapter = useMemo(
    () => ({
      list: async () => ({ success: true, data: store.current }),
      upload: async (file: File, folder: string) => {
        const media: ApiMedia = {
          id: Math.random().toString(36).slice(2, 11),
          url: URL.createObjectURL(file),
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          folder: folder || "images",
          width: 800,
          height: 600,
          createdAt: new Date(),
        };
        store.current = [media, ...store.current];
        return { success: true, data: media };
      },
      remove: async (id: string) => {
        store.current = store.current.filter((m) => m.id !== id);
        return { success: true };
      },
      update: async (id: string, patch: { filename?: string }) => {
        store.current = store.current.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        );
        return { success: true, data: store.current.find((m) => m.id === id) };
      },
    }),
    [],
  );

  return (
    <MediaProvider
      adapter={adapter}
      config={{ theme: { primary: "#588aff", radius: "0.625rem" } }}
    >
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Navigation */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-xs font-bold shadow-xs">
                MU
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                @hellokit/media-uploader
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              {mounted && isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Media Uploader Sandbox
              </h1>
              <p className="text-sm text-muted-foreground">
                Zero-config React component suite with built-in cropper,
                filters, and dialogs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
            >
              Open Full Dialog
            </button>
          </div>

          {/* Component Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Box 1:1 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Box Variant (1:1)
                </span>
                <span className="text-xs text-muted-foreground">
                  1000 × 1000 px
                </span>
              </div>
              <div className="max-w-52 mx-auto pt-1">
                <MediaUploadField
                  value={thumb}
                  onChange={setThumb}
                  variant="box"
                  aspectRatio={1}
                  outputWidth={1000}
                  outputHeight={1000}
                  outputFormat="webp"
                  fileType="image"
                  label="Click to upload"
                  hint="1000 × 1000 px"
                />
              </div>
            </div>

            {/* Cover 16:9 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cover Variant (16:9)
                </span>
                <span className="text-xs text-muted-foreground">
                  Image or Video
                </span>
              </div>
              <div className="pt-1">
                <MediaUploadField
                  value={cover}
                  onChange={setCover}
                  variant="box"
                  aspectRatio={16 / 9}
                  fileType="all"
                  label="Click to upload banner"
                  hint="Image or video • 16:9"
                />
              </div>
            </div>

            {/* Avatar Round */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Avatar Variant
                </span>
                <span className="text-xs text-muted-foreground">
                  Round Profile
                </span>
              </div>
              <div className="flex justify-center pt-2">
                <MediaUploadField
                  value={avatar}
                  onChange={setAvatar}
                  variant="avatar"
                  aspectRatio={1}
                  outputWidth={512}
                  outputHeight={512}
                  fileType="image"
                  size={100}
                  title="Upload avatar"
                />
              </div>
            </div>

            {/* Button Variant */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Button Variant
                </span>
                <span className="text-xs text-muted-foreground">
                  Trigger Button
                </span>
              </div>
              <div className="flex items-center justify-center h-28 pt-1">
                <MediaUploadField
                  value={banner}
                  onChange={setBanner}
                  variant="button"
                  aspectRatio={3 / 1}
                  fileType="image"
                  label="Upload Banner Media"
                />
              </div>
            </div>

            {/* Dropzone Spanning Both Columns */}
            <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Dropzone Variant
                </span>
                <span className="text-xs text-muted-foreground">
                  Drag & Drop Area
                </span>
              </div>
              <div className="pt-1">
                <MediaUploadField
                  value={attachment}
                  onChange={setAttachment}
                  variant="dropzone"
                  fileType="all"
                  hint="Supports drag & drop images or videos up to 50MB"
                />
              </div>
            </div>

            {/* Gallery / Multiple Selection */}
            <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Gallery System
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Multiple Media Selection
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Add Media
                </button>
              </div>

              <div className="pt-2">
                {gallery.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/30 text-muted-foreground">
                    <ImageIcon className="size-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No media selected</p>
                    <p className="text-xs">
                      Click Add Media to select multiple files
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map((url, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square rounded-xl border border-border overflow-hidden bg-muted"
                      >
                        {url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            loop
                            autoPlay
                          />
                        ) : (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() =>
                            setGallery((prev) => prev.filter((u) => u !== url))
                          }
                          className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mx-auto max-w-5xl px-6 py-6 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>@hellokit/media-uploader</span>
          <span>Zero-config React Package</span>
        </footer>
      </div>

      {/* Standalone Full Upload Modal */}
      {isUploadOpen && (
        <MediaUploadDialog
          onClose={() => setIsUploadOpen(false)}
          onConfirm={(urls) => {
            setIsUploadOpen(false);
          }}
        />
      )}

      {/* Gallery Multiple Selector Modal */}
      {isGalleryOpen && (
        <MediaUploadDialog
          isMultiple={true}
          initialSelectedUrls={gallery}
          onClose={() => setIsGalleryOpen(false)}
          onConfirm={(urls) => {
            setGallery(Array.isArray(urls) ? urls : [urls]);
            setIsGalleryOpen(false);
          }}
        />
      )}
    </MediaProvider>
  );
}
