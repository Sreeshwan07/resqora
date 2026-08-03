import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Square, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_RECORD_SECONDS = 30;

function readFile(file: File | Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/** A video is reduced to one clear key frame in the browser before analysis. */
function grabVideoFrame(source: File | Blob) {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(source);
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video"));
    };
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.6, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return fail();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    video.onerror = fail;
  });
}

export type CapturedScene = { dataUrl: string; kind: "photo" | "video" };

export function SceneCapture({
  busy,
  onCapture,
}: {
  busy: boolean;
  onCapture: (scene: CapturedScene) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_RECORD_SECONDS) stopRecording();
  }, [seconds, recording]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function handleFile(file: File) {
    const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!isMedia) {
      toast.error("Please choose a photo or video of the scene.");
      return;
    }
    if (file.size === 0 || file.size > 25 * 1024 * 1024) {
      toast.error("That file is empty or larger than 25 MB.");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    try {
      const dataUrl = isVideo ? await grabVideoFrame(file) : await readFile(file);
      onCapture({ dataUrl, kind: isVideo ? "video" : "photo" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file");
    } finally {
      for (const ref of [cameraRef, uploadRef]) if (ref.current) ref.current.value = "";
    }
  }

  async function startRecording() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Recording isn't supported here — upload a video instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        setSeconds(0);
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
          onCapture({ dataUrl: await grabVideoFrame(blob), kind: "video" });
        } catch {
          toast.error("Could not read the recording — try a photo instead.");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      toast.error("Camera permission is needed to record the scene.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <section aria-label="Capture the accident scene" className="glass-panel rounded-3xl p-4 sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Capture the scene</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Photo, a clip up to {MAX_RECORD_SECONDS}s, or an existing file. Location and time are
        attached automatically.
      </p>

      {recording && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-alert/60">
          <video ref={previewRef} muted playsInline className="h-44 w-full bg-black object-cover" />
          <div className="flex items-center justify-between bg-alert px-4 py-2 text-alert-foreground">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-2.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
              Recording {seconds}s / {MAX_RECORD_SECONDS}s
            </span>
            <Button size="sm" variant="secondary" onClick={stopRecording}>
              <Square className="size-4" aria-hidden="true" />
              Stop
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button
          size="xl"
          disabled={busy || recording}
          onClick={() => cameraRef.current?.click()}
          className="h-16 rounded-2xl bg-alert text-base font-bold text-alert-foreground hover:bg-alert/90"
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-5" aria-hidden="true" />
          )}
          Take photo
        </Button>
        <Button
          size="xl"
          variant="outline"
          disabled={busy}
          onClick={() => (recording ? stopRecording() : void startRecording())}
          className="soft-card h-16 rounded-2xl text-base font-bold"
        >
          <Video className="size-5" aria-hidden="true" />
          {recording ? "Stop recording" : "Record video"}
        </Button>
        <Button
          size="xl"
          variant="outline"
          disabled={busy || recording}
          onClick={() => uploadRef.current?.click()}
          className="soft-card h-16 rounded-2xl text-base font-bold"
        >
          <ImageUp className="size-5" aria-hidden="true" />
          Upload
        </Button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Take an accident photo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload an accident photo or video"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </section>
  );
}
