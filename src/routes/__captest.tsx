import { createFileRoute } from "@tanstack/react-router";
import { SceneCapture } from "@/components/accident/scene-capture";
export const Route = createFileRoute("/__captest")({ component: () => <SceneCapture busy={false} onCapture={(s) => console.log("captured", s.kind, s.file.size, s.dataUrl.slice(0, 30))} /> });
