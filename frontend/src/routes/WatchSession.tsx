import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const WatchSession: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const videoPlayer = useRef<any>(null);
  const clientId = uuidv4();
  const [firstProgressEventOccurred, setFirstProgressEventOccurred] = useState(false);

  const [linkCopied, setLinkCopied] = useState(false);

  const ws = new WebSocket('ws://localhost:8001');

  // Adjusts the video player based on the message received, if needed
  ws.onmessage = (event) => {
    const sessionLog = JSON.parse(event.data);
    
    if (sessionLog.url !== url) {
      setUrl(sessionLog.url);
    }

    if (videoPlayer.current) {
      const timeDiff = Math.abs(sessionLog.mediaTimeSeconds - videoPlayer.current.getCurrentTime());
      if (timeDiff > 1 || sessionLog.isPlaying !== videoPlayer.current.getPlaying()) {
        videoPlayer.current.seek(sessionLog.mediaTimeSeconds, sessionLog.isPlaying);
      }
    }
  };

  // Callback passed to VideoPlayer that will be called when the user join the session
  const joinCallback = () => {
    ws.send(JSON.stringify({
      sessionId,
      action: "join",
      clientId
    }));
  }

  // Callback passed to VideoPlayer that will be called when there is an event (play, pause, etc.)
  const eventCallback = (sessionLog: any) => {
    // The video player emits a 0 progress event when it's first initialized. Ignore it because it will
    // restart the video for other users.
    if (!firstProgressEventOccurred && sessionLog.action === 'progress' && sessionLog.mediaTimeSeconds === 0) {
      setFirstProgressEventOccurred(true);
      return;
    }

    ws.send(JSON.stringify({ ...sessionLog, sessionId, clientId }));
  }

  useEffect(() => {
    // load video by session ID -- right now we just hardcode a constant video but you should be able to load the video associated with the session
    // setUrl("https://www.youtube.com/watch?v=NX1eKLReSpY");

    const getAndSetUrl = async () => {
      const response = await axios.get(
        `http://localhost:8000/sessions/${sessionId}/getLast`
      );

      setUrl(response.data.url);
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
          <Tooltip title={linkCopied ? "Link copied" : "Copy link to share"}>
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
          <Tooltip title="Replay this watch party">
            <Button
              onClick={() => {
                window.open(`/replay/${sessionId}`, "_blank");
              }}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <VideoLibraryIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Create new watch party">
            <Button
              onClick={() => {
                navigate("/create");
              }}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <AddCircleOutlineIcon />
            </Button>
          </Tooltip>
        </Box>
        <VideoPlayer url={url} videoPlayerRef={videoPlayer} eventCallback={eventCallback} joinCallback={joinCallback} />;
      </>
    );
  }

  return null;
};

export default WatchSession;
