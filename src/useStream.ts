import { act, useEffect } from "react";
import { useAtom } from "jotai";
import { activeStreamsAtom, BlockIdsAtom, BlockMapAtom } from "./atoms";

export function useStream() {
  const [activeStreams, setActiveStreams] = useAtom(activeStreamsAtom);
  const [blockIds] = useAtom(BlockIdsAtom);
  const [blockMap] = useAtom(BlockMapAtom);

  useEffect(() => {
    const streamKeys = Object.keys(activeStreams);
    for (const key of streamKeys) {
      const activeStream = activeStreams[key];
      if (!activeStream) continue;
      if (activeStream.stream && !activeStream.refs.video) {
        activeStream.refs.video = document.createElement("video");
        activeStream.refs.video.style.position = "absolute";
        activeStream.refs.video.style.left = "0";
        activeStream.refs.video.style.top = "0";
        activeStream.refs.video.style.opacity = "0";
        activeStream.refs.video.style.pointerEvents = "none";
        activeStream.refs.video.autoplay = true;
        activeStream.refs.video.playsInline = true;
        activeStream.refs.video.muted = true;
        document.body.appendChild(activeStream.refs.video);
        if (!activeStream.refs.canvas) {
          activeStream.refs.canvas = document.createElement("canvas");
        }
        activeStream.refs.video.onloadedmetadata = () => {
          const videoWidth = activeStream.refs.video!.videoWidth;
          const videoHeight = activeStream.refs.video!.videoHeight;
          setActiveStreams((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              videoSize: { width: videoWidth, height: videoHeight },
            },
          }));
          activeStream.refs.canvas!.width = videoWidth;
          activeStream.refs.canvas!.height = videoHeight;
          const ctx = activeStream.refs.canvas!.getContext("2d")!;
          function draw() {
            ctx.drawImage(activeStream.refs.video!, 0, 0);
            activeStream.refs.drawRequest = window.requestAnimationFrame(draw);
          }
          activeStream.refs.drawRequest = window.requestAnimationFrame(draw);
        };
        activeStream.refs.video.srcObject = activeStream.stream;
      }
    }
  }, [activeStreams]);


  useEffect(() => {
    // cleanup
    const webcamBlocks = blockIds.map((id) => blockMap[id]).filter((block) => block.type === "webcam");
    const streamsBeingUsed = new Set(webcamBlocks.map((block) => block.src));
    const streamKeys = Object.keys(activeStreams);
    for (const key of streamKeys) {
      if (!streamsBeingUsed.has(key)) {
        const activeStream = activeStreams[key];
        if (activeStream.refs.video) {
          activeStream.refs.video.remove();
        }
        if (activeStream.refs.canvas) {
          activeStream.refs.canvas.remove();
        }
        if (activeStream.refs.drawRequest) {
          window.cancelAnimationFrame(activeStream.refs.drawRequest);
        }
        setActiveStreams((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    }
 }, [blockIds, blockMap]);
}
