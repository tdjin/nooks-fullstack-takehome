import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import { SessionController } from './session-controller';
import { SessionLogModel } from './session-log-database';

dotenv.config();

const PORT = process.env.PORT || 8000;
const WEB_SOCKET_PORT = 8001;

const app: Express = express();

const server = http.createServer(app);

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const sessionController = new SessionController();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/sessions/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const url = req.body.url;
  sessionController.createSession(sessionId, url);
  res.status(201).send('success');
});

app.get('/sessions/:sessionId/getLast', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const sessionLog = sessionController.getLastSessionLog(sessionId);
  res.status(200).send(sessionLog);
});

app.get('/sessions/:sessionId/replay', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const sessionLogs = sessionController.getSessionLogs(sessionId);
  console.log(JSON.stringify(sessionLogs));
  res.status(200).send(sessionLogs);
});

wss.on('connection', (ws: WebSocket) => {
  function sessionNotifierCallback(sessionLog: SessionLogModel): boolean {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(sessionLog));
      return true;
    }

    return false;
  }

  // Handle messages from client
  ws.on('message', (message) => {
    const messageJson = JSON.parse(message.valueOf().toString());
    const sessionId = messageJson.sessionId;
    const clientId = messageJson.clientId;

    if (messageJson.action === 'join') {
      // When a user first joins the session, send the most recent log and register a callback so the client gets continous updates
      ws.send(JSON.stringify(sessionController.getLastSessionLog(sessionId)));
      sessionController.registerSessionNotifierCallback(sessionId, clientId, sessionNotifierCallback);
    } else {
      // For other events, push them to the notifier so that other clients receive the update
      sessionController.addSessionLog(messageJson, clientId);
    }
  });
});

app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));

server.listen(WEB_SOCKET_PORT, () => {
  console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
