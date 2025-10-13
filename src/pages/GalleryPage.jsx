// frontend/src/pages/GalleryPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  UploadCloud,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Link2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { PLAN_LIMITS, PLAN_LABELS } from "../utils/subscriptionPlan";
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
    : Math.max(0, maxImages - imageItems.length);
  const remainingVideoSlots = unlimitedVideos
    ? Number.POSITIVE_INFINITY
    : Math.max(0, maxVideos - videoItems.length);
  const hasReachedImageLimit =
    !unlimitedImages && remainingImageSlots <= 0;
  const hasReachedVideoLimit =
    !unlimitedVideos && remainingVideoSlots <= 0;
  const planLabel = PLAN_LABELS[plan] || PLAN_LABELS.basic;
  const imageLimitDescription = unlimitedImages
    ? "Upload unlimited images (max 2 MB each)"
    : `Upload up to ${maxImages} images (max 2 MB each)`;
  const videoLimitDescription = unlimitedVideos
    ? "unlimited video links"
    : `${maxVideos} video links`;
  const imageUsageText = unlimitedImages
    ? `${imageItems.length} images`
    : `${Math.min(imageItems.length, maxImages)}/${maxImages} images`;
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
          `You can only upload up to ${maxImages} images on the ${planLabel} plan.`
        );
        return;
      }

      const filesToProcess = unlimitedImages
        ? files
        : files.slice(0, availableSlots);

      if (!filesToProcess.length) {
        toast.error(
          `You can only upload up to ${maxImages} images on the ${planLabel} plan.`
        );
        return;
      }

      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: Only image files are allowed.`);
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
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
            <p className="text-gray-500 mt-1">
              {imageLimitDescription}. Add up to {videoLimitDescription} to
              showcase your work.
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-3 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2">
            <span>{imageUsageText}</span>
            <span>•</span>
            <span>{videoUsageText}</span>
          </div>
        </div>

        <div className="mt-4 text-sm text-primary-600 font-medium">
          Current plan: {planLabel}
        </div>

        <div
          {...getRootProps({
            className: `mt-8 border-2 border-dashed rounded-2xl p-8 text-center transition relative overflow-hidden ${
              hasReachedImageLimit
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : isDragActive
                ? "border-primary-300 bg-primary-50"
                : "border-gray-200 hover:border-primary-300 cursor-pointer"
            }`,
          })}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {hasReachedImageLimit
                  ? "Image limit reached"
                  : "Choose a file or drag & drop it here"}
              </p>
              <p className="text-sm text-gray-500">
                JPEG, PNG formats, up to 2 MB
              </p>
            </div>
            <motion.button
              whileHover={{ scale: hasReachedImageLimit ? 1 : 1.05 }}
              whileTap={{ scale: hasReachedImageLimit ? 1 : 0.98 }}
              disabled={hasReachedImageLimit}
              onClick={(event) => {
                event.stopPropagation();
                if (!hasReachedImageLimit) open();
              }}
              className={`inline-flex items-center space-x-2 px-5 py-2 rounded-full font-medium shadow-sm ${
                hasReachedImageLimit
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              }`}
            >
              <span>Browse Files</span>
            </motion.button>
          </div>
          {hasReachedImageLimit && (
            <p className="mt-4 text-sm text-amber-600">
              You already have {maxImages} images. Delete one to upload more.
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Title
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={imageTitle}
              onChange={(event) => setImageTitle(event.target.value)}
              maxLength={80}
              placeholder="Add a short title for the image"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={hasReachedImageLimit}
            />
            <div className="mt-1 text-xs text-gray-400 flex justify-between">
              <span>Helps identify the image in your gallery.</span>
              <span>{imageTitle.length}/80</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Description
              <span className="ml-1 text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              value={imageDescription}
              onChange={(event) => setImageDescription(event.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Describe the context, project, or story behind this image"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              disabled={hasReachedImageLimit}
            />
            <div className="mt-1 text-xs text-gray-400 flex justify-end">
              <span>{imageDescription.length}/160</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {uploading.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 space-y-3"
            >
              {uploading.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(file.size)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
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
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    )}
                    {file.status === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {file.status === "error" && (
                      <button
                        onClick={() => removeUploadEntry(file.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Dismiss"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAddVideo} className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Add your video links here:
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/paste-your-video-url-here"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-3 space-y-3 sm:space-y-0">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: hasReachedVideoLimit ? 1 : 1.05 }}
              whileTap={{ scale: hasReachedVideoLimit ? 1 : 0.98 }}
              type="submit"
              disabled={hasReachedVideoLimit}
              className={`inline-flex items-center justify-center space-x-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm ${
                hasReachedVideoLimit
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </motion.button>
          </div>
          {hasReachedVideoLimit && (
            <p className="mt-3 text-sm text-amber-600">
              You already have {maxVideos} video links. Delete one to add more.
            </p>
          )}
        </form>
      </div>

      <div className="mt-10">
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No items in your gallery yet
            </h3>
            <p className="mt-1 text-gray-500">
              Upload images or add a video link to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {imageItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Photos
                  </h2>
                  <span className="text-sm text-gray-500">{imageUsageText}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {imageItems.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group"
                      >
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(item)}
                            className="block w-full"
                          >
                            <motion.img
                              src={item.url}
                              alt={item.title || "Gallery image"}
                              className="w-full h-56 object-cover cursor-zoom-in"
                              initial={{ scale: 1.02 }}
                              animate={{ scale: 1 }}
                            />
                          </button>
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {item.title || "Untitled image"}
                              </h3>
                              {item.description ? (
                                <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-gray-400">
                                  No description provided
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(item._id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                              aria-label={`Delete ${item.title || "image"}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                            <span>{formatBytes(item.size)}</span>
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
            {videoItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                </h2>
                <div className="text-sm text-gray-500 mb-3">{videoUsageText}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {videoItems.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group"
                      >
                        <div className="relative w-full h-56 bg-black flex items-center justify-center overflow-hidden">
                          {renderVideoEmbed(item.url) || (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-center px-6 text-white"
                            >
                              <Link2 className="w-10 h-10 mx-auto mb-3" />
                              <p className="font-semibold truncate">
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
                            </motion.div>
                          )}
                        </div>
                        <div className="p-5 flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {item.title || "Untitled video"}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="px-5 pb-5">
                          <p className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative max-w-4xl w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close image preview"
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-4 -right-4 rounded-full bg-white text-gray-700 shadow-lg p-2 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || "Gallery image"}
                className="w-full max-h-[80vh] object-contain rounded-2xl bg-black"
              />
              {(selectedPhoto.title || selectedPhoto.description) && (
                <div className="mt-4 text-center text-white">
                  {selectedPhoto.title && (
                    <h3 className="text-lg font-semibold">
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-sm text-gray-200 mt-1">
                      {selectedPhoto.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
