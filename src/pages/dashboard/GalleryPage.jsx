// frontend/src/pages/GalleryPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Image,
  FileText,
  UploadCloud,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Link2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { PLAN_LIMITS, PLAN_LABELS } from "../../utils/subscriptionPlan";
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const GalleryPage = () => {
  const {
    fetchGallery,
    uploadGalleryImage,
    addGalleryVideo,
    deleteGalleryItem,
    user,
  } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const imageItems = useMemo(
    () => items.filter((item) => item.type === "image"),
    [items]
  );
  const documentItems = useMemo(
    () => items.filter((item) => item.type === "document"),
    [items]
  );
  const mediaItems = useMemo(
    () => items.filter((item) => item.type === "image" || item.type === "document"),
    [items]
  );
  const videoItems = useMemo(
    () => items.filter((item) => item.type === "video"),
    [items]
  );

  const plan = (user?.subscriptionPlan || "basic").toLowerCase();
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
  const maxImages = planLimits?.maxImages ?? Number.MAX_SAFE_INTEGER;
  const maxVideos = planLimits?.maxVideos ?? Number.MAX_SAFE_INTEGER;
  const unlimitedImages =
    !Number.isFinite(maxImages) || maxImages >= Number.MAX_SAFE_INTEGER;
  const unlimitedVideos =
    !Number.isFinite(maxVideos) || maxVideos >= Number.MAX_SAFE_INTEGER;
  const remainingImageSlots = unlimitedImages
    ? Number.POSITIVE_INFINITY
    : Math.max(0, maxImages - mediaItems.length);
  const remainingVideoSlots = unlimitedVideos
    ? Number.POSITIVE_INFINITY
    : Math.max(0, maxVideos - videoItems.length);
  const hasReachedImageLimit = !unlimitedImages && remainingImageSlots <= 0;
  const hasReachedVideoLimit = !unlimitedVideos && remainingVideoSlots <= 0;
  const planLabel = PLAN_LABELS[plan] || PLAN_LABELS.basic;
  const imageLimitDescription = unlimitedImages
    ? "Upload unlimited images/documents (max 2 MB each)"
    : `Upload up to ${maxImages} images/documents (max 2 MB each)`;
  const videoLimitDescription = unlimitedVideos
    ? "unlimited video links"
    : `${maxVideos} video links`;
  const imageUsageText = unlimitedImages
    ? `${mediaItems.length} uploads`
    : `${Math.min(mediaItems.length, maxImages)}/${maxImages} uploads`;
  const videoUsageText = unlimitedVideos
    ? `${videoItems.length} video links`
    : `${Math.min(videoItems.length, maxVideos)}/${maxVideos} video links`;

  const updateUploadEntry = useCallback((id, updates) => {
    setUploading((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...(typeof updates === "function" ? updates(entry) : updates),
            }
          : entry
      )
    );
  }, []);

  const removeUploadEntry = useCallback((id) => {
    setUploading((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    const result = await fetchGallery();
    if (result.success) {
      setItems(result.items || []);
    } else {
      toast.error(result.error || "Failed to load gallery");
    }
    setLoading(false);
  }, [fetchGallery]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleFilesUpload = useCallback(
    async (files) => {
      const availableSlots = unlimitedImages
        ? files.length
        : Math.max(0, remainingImageSlots);

      if (!unlimitedImages && availableSlots <= 0) {
        toast.error(
          `You can only upload up to ${maxImages} images/documents on the ${planLabel} plan.`
        );
        return;
      }

      const filesToProcess = unlimitedImages
        ? files
        : files.slice(0, availableSlots);

      if (!filesToProcess.length) {
        toast.error(
          `You can only upload up to ${maxImages} images/documents on the ${planLabel} plan.`
        );
        return;
      }

      for (const file of filesToProcess) {
        const loweredName = (file.name || "").toLowerCase();
        const isImage = typeof file.type === "string" && file.type.startsWith("image/");
        const isAllowedDoc =
          file.type === "application/pdf" ||
          file.type === "application/msword" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          loweredName.endsWith(".pdf") ||
          loweredName.endsWith(".doc") ||
          loweredName.endsWith(".docx");

        if (!isImage && !isAllowedDoc) {
          toast.error(`${file.name}: Only image, PDF, DOC, DOCX files are allowed.`);
          continue;
        }

        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name}: File exceeds 2 MB limit.`);
          continue;
        }

        const id = `${file.name}-${Date.now()}-${Math.random()}`;
        setUploading((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            status: "uploading",
            progress: 20,
          },
        ]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", imageTitle.trim());
        formData.append("description", imageDescription.trim());

        try {
          updateUploadEntry(id, { progress: 70 });
          const result = await uploadGalleryImage(formData);

          if (!result.success || !result.item) {
            throw new Error(result.error || "Upload failed");
          }

          updateUploadEntry(id, { status: "success", progress: 100 });
          setItems((prev) => [result.item, ...prev]);
          toast.success(`${file.name} uploaded successfully`);
          setImageTitle("");
          setImageDescription("");

          setTimeout(() => {
            removeUploadEntry(id);
          }, 1200);
        } catch (error) {
          const message = error.message || "Failed to upload image";
          updateUploadEntry(id, {
            status: "error",
            progress: 100,
            error: message,
          });
          toast.error(`${file.name}: ${message}`);
        }
      }
    },
    [
      unlimitedImages,
      remainingImageSlots,
      removeUploadEntry,
      updateUploadEntry,
      uploadGalleryImage,
      maxImages,
      planLabel,
      imageTitle,
      imageDescription,
    ]
  );

  const renderVideoEmbed = useCallback((url) => {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace(/^www\./, "");

      if (hostname.includes("youtube") || hostname.includes("youtu.be")) {
        let videoId = parsed.searchParams.get("v");

        if (!videoId) {
          const segments = parsed.pathname.split("/").filter(Boolean);
          if (hostname === "youtu.be") {
            videoId = segments[0] || "";
          } else if (segments[0] === "shorts" || segments[0] === "live") {
            videoId = segments[1] || "";
          } else if (segments[0] === "embed") {
            videoId = segments[1] || "";
          } else if (segments.length) {
            videoId = segments[segments.length - 1];
          }
        }

        if (videoId) {
          const cleanId = videoId.split("?")[0].split("&")[0];
          const params = new URLSearchParams();
          const startAt =
            parsed.searchParams.get("t") || parsed.searchParams.get("start");
          if (startAt) {
            const numeric = startAt.replace(/[^0-9]/g, "");
            if (numeric) params.set("start", numeric);
          }
          params.set("rel", "0");
          params.set("modestbranding", "1");

          return (
            <iframe
              key={cleanId}
              title={`YouTube video ${cleanId}`}
              src={`https://www.youtube.com/embed/${cleanId}?${params.toString()}`}
              loading="lazy"
              className="w-full h-full rounded-t-2xl border-b border-gray-200"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          );
        }
      }

      if (hostname.includes("vimeo.com")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const videoId = segments.pop();
        if (videoId) {
          return (
            <iframe
              key={videoId}
              title={`Vimeo video ${videoId}`}
              src={`https://player.vimeo.com/video/${videoId}`}
              loading="lazy"
              className="w-full h-full rounded-t-2xl border-b border-gray-200"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          );
        }
      }
    } catch (error) {
      console.error("Unable to embed video", error);
    }

    return null;
  }, []);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      handleFilesUpload(acceptedFiles);
    },
    [handleFilesUpload]
  );

  const onDropRejected = useCallback((fileRejections) => {
    fileRejections.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((err) => {
        if (err.code === "file-too-large") {
          toast.error(`${file.name}: File exceeds 2 MB limit.`);
        } else {
          toast.error(`${file.name}: ${err.message}`);
        }
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxSize: MAX_SIZE_BYTES,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const handleAddVideo = useCallback(
    async (event) => {
      event.preventDefault();
      if (!videoUrl.trim()) {
        toast.error("Paste a valid video URL");
        return;
      }

      if (hasReachedVideoLimit) {
        toast.error(
          `You can only save up to ${maxVideos} video links on the ${planLabel} plan.`
        );
        return;
      }

      const result = await addGalleryVideo({
        url: videoUrl.trim(),
        title: videoTitle.trim(),
        description: videoDescription.trim(),
      });

      if (!result.success || !result.item) {
        toast.error(result.error || "Failed to add video link");
        return;
      }

      setItems((prev) => [result.item, ...prev]);
      setVideoUrl("");
      setVideoTitle("");
      setVideoDescription("");
      toast.success("Video link added to gallery");
    },
    [addGalleryVideo, videoDescription, videoTitle, videoUrl]
  );

  const handleDelete = useCallback(
    async (id) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this gallery item?"
      );
      if (!confirmed) return;

      const result = await deleteGalleryItem(id);
      if (!result.success) {
        toast.error(result.error || "Failed to delete item");
        return;
      }

      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Gallery item removed");
    },
    [deleteGalleryItem]
  );

  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/60 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Gallery</h1>
            <p className="mt-1 text-sm text-slate-300">
              {imageLimitDescription}. Add up to {videoLimitDescription} to
              showcase your work.
            </p>
          </div>
          <div className="hidden items-center space-x-3 rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-300 md:flex">
            <span>{imageUsageText}</span>
            <span>•</span>
            <span>{videoUsageText}</span>
          </div>
        </div>

        <div className="mt-4 text-sm font-medium text-primary-300">
          Current plan: {planLabel}
        </div>

        <div
          {...getRootProps({
            className: `relative mt-8 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition ${
              hasReachedImageLimit
                ? "cursor-not-allowed border-slate-800 bg-slate-900/70"
                : isDragActive
                ? "border-primary-400/70 bg-primary-500/10"
                : "cursor-pointer border-slate-800 hover:border-primary-400/70 hover:bg-slate-900/80"
            }`,
          })}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 text-primary-300">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">
                {hasReachedImageLimit
                  ? "Image limit reached"
                  : "Choose a file or drag & drop it here"}
              </p>
              <p className="text-sm text-slate-400">
                Images, PDF, DOC, DOCX formats, up to 2 MB
              </p>
            </div>
            <button
              type="button"
              disabled={hasReachedImageLimit}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasReachedImageLimit) open();
              }}
              className={`inline-flex items-center space-x-2 rounded-full px-5 py-2 font-medium shadow-sm ${
                hasReachedImageLimit
                  ? "cursor-not-allowed bg-slate-700 text-slate-400"
                  : "bg-primary-500 text-white hover:bg-primary-400"
              }`}
            >
              <span>Browse Files</span>
            </button>
          </div>
          {hasReachedImageLimit && (
            <p className="mt-4 text-sm text-amber-300">
              You already have {maxImages} uploads. Delete one to upload more.
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Image Title
              <span className="ml-1 text-xs text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={imageTitle}
              onChange={(event) => setImageTitle(event.target.value)}
              maxLength={100}
              placeholder="Add a short title for the image"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              disabled={hasReachedImageLimit}
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Helps identify the image in your gallery.</span>
              <span>{imageTitle.length}/100</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Image Description
              <span className="ml-1 text-xs text-slate-500">(optional)</span>
            </label>
            <textarea
              value={imageDescription}
              onChange={(event) => setImageDescription(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Describe the context, project, or story behind this image"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              disabled={hasReachedImageLimit}
            />
            <div className="mt-1 flex justify-end text-xs text-slate-500">
              <span>{imageDescription.length}/300</span>
            </div>
          </div>
        </div>

        {uploading.length > 0 && (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Upload Progress
                </h2>
                <p className="text-sm text-slate-400">
                  {uploading.filter((item) => item.status === "success").length}
                  /{uploading.length} files uploaded
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploading([])}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Clear all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {uploading.map((file) => (
                <div
                  key={file.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                    {file.error && (
                      <p className="mt-1 text-xs text-red-400">{file.error}</p>
                    )}
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          file.status === "error"
                            ? "bg-red-400"
                            : file.status === "success"
                            ? "bg-green-500"
                            : "bg-primary-500"
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {file.status === "uploading" && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
                    )}
                    {file.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    )}
                    {file.status === "error" ? (
                      <button
                        type="button"
                        onClick={() => removeUploadEntry(file.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Dismiss
                      </button>
                    ) : file.status === "success" ? (
                      <button
                        type="button"
                        onClick={() => removeUploadEntry(file.id)}
                        className="text-sm text-slate-400 hover:text-slate-200"
                      >
                        Hide
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleAddVideo} className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">
            Add your video links here:
          </h2>
          <div className="flex flex-col space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:space-x-3 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/paste-your-video-url-here"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-3 pl-9 pr-3 text-sm text-slate-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mt-3 flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={hasReachedVideoLimit}
              className={`inline-flex items-center justify-center space-x-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm ${
                hasReachedVideoLimit
                  ? "cursor-not-allowed bg-slate-700 text-slate-400"
                  : "bg-primary-500 text-white hover:bg-primary-400"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>
          {hasReachedVideoLimit && (
            <p className="mt-3 text-sm text-amber-300">
              You already have {maxVideos} video links. Delete one to add more.
            </p>
          )}
        </form>
      </div>

      <div className="mt-10">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/80">
              <Image className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-100">
              No items in your gallery yet
            </h3>
            <p className="mt-1 text-slate-400">
              Upload images or add a video link to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {imageItems.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Photos
                  </h2>
                  <span className="text-sm text-slate-400">
                    {imageUsageText}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {imageItems.map((item) => (
                    <article
                      key={item._id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-md shadow-slate-950/50"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(item)}
                          className="block w-full"
                        >
                          <img
                            src={item.url}
                            alt={item.title || "Gallery image"}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-56 object-cover cursor-zoom-in"
                          />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-slate-100">
                              {item.title || "Untitled image"}
                            </h3>
                            {item.description ? (
                              <p className="mt-1 line-clamp-3 text-sm text-slate-300">
                                {item.description}
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">
                                No description provided
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                            aria-label={`Delete ${item.title || "image"}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatBytes(item.size)}</span>
                          <span>
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {documentItems.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Documents
                  </h2>
                  <span className="text-sm text-slate-400">
                    {documentItems.length} files
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {documentItems.map((item) => (
                    <article
                      key={item._id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-md shadow-slate-950/50"
                    >
                      <button
                        type="button"
                        onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                        className="flex w-full items-center gap-4 p-5 text-left"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-300">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-100">
                            {item.title || "Untitled document"}
                          </h3>
                          {item.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                              {item.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">
                              No description provided
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span>{formatBytes(item.size)}</span>
                            <span>
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex justify-end px-5 pb-5">
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                          aria-label={`Delete ${item.title || "document"}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {videoItems.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Videos
                  </h2>
                  <span className="text-sm text-slate-400">
                    {videoUsageText}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {videoItems.map((item) => (
                    <article
                      key={item._id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-md shadow-slate-950/50"
                    >
                      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-black">
                        {renderVideoEmbed(item.url) || (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center px-6 text-center text-white">
                            <Link2 className="w-10 h-10 mb-3" />
                            <p className="font-semibold truncate w-full">
                              {item.title || "Video"}
                            </p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-200 underline mt-2 block truncate"
                            >
                              Open video
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-100">
                            {item.title || "Untitled video"}
                          </h3>
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="text-slate-500 transition-colors hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="px-5 pb-5">
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/80"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close image preview"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 rounded-full bg-slate-900 text-slate-200 shadow-lg shadow-slate-950/70 p-2 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title || "Gallery image"}
              loading="lazy"
              decoding="async"
              className="max-h-[80vh] w-full object-contain"
            />
            {(selectedPhoto.title || selectedPhoto.description) && (
              <div className="mt-4 px-6 pb-6 text-center text-white">
                {selectedPhoto.title && (
                  <h3 className="text-lg font-semibold">
                    {selectedPhoto.title}
                  </h3>
                )}
                {selectedPhoto.description && (
                  <p className="mt-1 text-sm text-slate-200">
                    {selectedPhoto.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
