import { createFileRoute } from "@tanstack/react-router";
import { MicStatus } from "@/components/resqai/mic-status";
import { useMedAiVoice } from "@/hooks/use-medai-voice";
function T() {
  const v = useMedAiVoice("en-IN");
  return (
    <div>
      <MicStatus state={v.micState} error={v.micError} onEnable={() => void v.requestMic()} />
      <button onClick={() => void v.startListening()}>voice</button>
      <p>listening:{String(v.listening)}</p>
    </div>
  );
}
export const Route = createFileRoute("/captest")({ component: T });
