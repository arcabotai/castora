import FarcasterFrame from "./FarcasterFrame"

export default function CastEmbedFrames({ frames, castHash }) {

  return (
    <div className="flex flex-col gap-y-2">
      {frames.map((frame, index) => (
        <FarcasterFrame
          key={frame.frames_url + index}
          castHash={castHash}
          version={frame.version}
          image={frame.image}
          image_aspect_ratio={frame.image_aspect_ratio}
          buttons={frame.buttons}
          frame_url={frame.frames_url}
          post_url={frame.post_url}
          input={frame.input}
        />
      ))}
    </div>
  )
}
