import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import axios from "axios";

const ReplaySession: React.FC = () => {
  const { sessionId } = useParams();
  const [url, setUrl] = useState<string | null>(null);
  const videoPlayer = useRef<any>(null);
  const [sessionLogs, setSessionLogs] = useState<any[] | undefined>(undefined);

  const [linkCopied, setLinkCopied] = useState(false);

  // Callback passed to VideoPlayer that will be called when the user join the session
  const joinCallback = () => {
    if (!sessionLogs || sessionLogs.length < 1) {
      return;
    }

    let index = 0;
    let logStartTime: Date | undefined = undefined;

    while (index < sessionLogs.length) {
      const sessionLog = sessionLogs[index];
      index++;

      if (!logStartTime && sessionLog.action !== 'create') {
        logStartTime = new Date(sessionLog.timestamp);
        videoPlayer.current.seek(sessionLog.mediaTimeSeconds, sessionLog.isPlaying);
      }
      else if (logStartTime) {
        if (sessionLog.action === 'play' || sessionLog.action === 'pause') {
          setTimeout(() => videoPlayer.current.seek(sessionLog.mediaTimeSeconds, sessionLog.isPlaying), new Date(sessionLog.timestamp).getTime() - logStartTime.getTime());
        }
      }
    }

    if (logStartTime) {
      const lastSessionLog = sessionLogs[sessionLogs.length - 1];
      setTimeout(() => videoPlayer.current.seek(lastSessionLog.mediaTimeSeconds, false), new Date(lastSessionLog.timestamp).getTime() - logStartTime!.getTime());
    }
  }

  useEffect(() => {
    // load video by session ID -- right now we just hardcode a constant video but you should be able to load the video associated with the session
    // setUrl("https://www.youtube.com/watch?v=NX1eKLReSpY");

    const getAndSetUrl = async () => {
      const response = await axios.get(
        `http://localhost:8000/sessions/${sessionId}/replay`
      );

      setSessionLogs(response.data);

      if (!response.data || response.data.length < 1) {
        return;
      }

      setUrl(response.data[0].url);
    }
  
    getAndSetUrl().catch(console.error);

    // if session ID doesn't exist, you'll probably want to redirect back to the home / create session page
  }, [sessionId]);

  if (!!url) {
    return (
      <>
        <Box
          width="100%"
          maxWidth={1000}
          display="flex"
          gap={1}
          marginTop={1}
          alignItems="center"
        >
          <TextField
            label="Youtube URL"
            variant="outlined"
            value={url}
            inputProps={{
              readOnly: true,
              disabled: true,
            }}
            fullWidth
          />
          <Tooltip
            title={linkCopied ? "Link copied" : "Copy replay link to share"}
          >
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              disabled={linkCopied}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <LinkIcon />
            </Button>
          </Tooltip>
        </Box>
        <VideoPlayer url={url} hideControls videoPlayerRef={videoPlayer} joinCallback={joinCallback} />
      </>
    );
  }

  return null;
};

export default ReplaySession;
