import { Box, Button, Card, IconButton, Stack } from "@mui/material";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  url: string;
  hideControls?: boolean;
  videoPlayerRef: React.MutableRefObject<any>;
  eventCallback?: (event: any) => void;
  joinCallback: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = forwardRef(({ url, hideControls, videoPlayerRef, eventCallback, joinCallback }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const player = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handleSeek = (seconds: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?

    console.log(
      "This never prints because seek decetion doesn't work: ",
      seconds
    );
  };

  const handlePlay = () => {
    if (eventCallback) {
        eventCallback({
          action: 'play',
          isPlaying: true,
          url,
          mediaTimeSeconds: player.current?.getCurrentTime(),
          timestamp: new Date()
        });
    }

    setPlaying(true);
  };

  const handlePause = () => {
    if (eventCallback) {
        eventCallback({
          action: 'pause',
          isPlaying: false,
          url,
          mediaTimeSeconds: player.current?.getCurrentTime(),
          timestamp: new Date()
        });
    }
    setPlaying(false);
  };

  const handleBuffer = () => {
    console.log("Video buffered");
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    if (eventCallback) {
        eventCallback({
          action: 'progress',
          isPlaying: playing,
          url,
          mediaTimeSeconds: player.current?.getCurrentTime(),
          timestamp: new Date()
        });
    }
  };

  // Expose functions for parent
  useImperativeHandle(videoPlayerRef, () => ({
    play(mediaTimeSeconds: number) {
      player.current?.seekTo(mediaTimeSeconds, 'seconds')
      setPlaying(true);
    },

    pause(mediaTimeSeconds: number) {
      player.current?.seekTo(mediaTimeSeconds, 'seconds')
      setPlaying(false);
    },

    seek(mediaTimeSeconds: number, isPlaying: boolean) {
      player.current?.seekTo(mediaTimeSeconds, 'seconds')
      setPlaying(isPlaying);
    },

    getPlaying() {
      return playing;
    },

    getCurrentTime() {
      return player.current?.getCurrentTime() ?? 0;
    }
  }));

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box
        width="100%"
        height="100%"
        display={hasJoined ? "flex" : "none"}
        flexDirection="column"
      >
        <ReactPlayer
          ref={player}
          url={url}
          playing={hasJoined && playing}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            joinCallback();
            setHasJoined(true);
          }}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
});

export default VideoPlayer;
