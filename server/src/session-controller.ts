import { SessionAction, SessionLogDatabase, SessionLogModel } from './session-log-database';
import { SessionActionNotifier } from './session-action-notifier';

export class SessionController {
  private sessionActionNotifier;
  private sessionLogDatabase;

  constructor() {
    this.sessionActionNotifier = new SessionActionNotifier();
    this.sessionLogDatabase = new SessionLogDatabase();
  }

  createSession(sessionId: string, url: string) {
    this.sessionLogDatabase.add({
        sessionId,
        action: SessionAction.CREATE,
        isPlaying: false,
        url,
        mediaTimeSeconds: 0,
        timestamp: new Date(),
    })
  }

  registerSessionNotifierCallback(sessionId: string, sourceId: string, callback: (sessionLog: SessionLogModel) => boolean) {
    this.sessionActionNotifier.registerCallback(sessionId, sourceId, callback);
  }

  unregisterSessionNotifierCallback(sessionId: string, sourceId: string) {
    this.sessionActionNotifier.unregisterCallback(sessionId, sourceId);
  }

  addSessionLog(sessionLog: SessionLogModel, sourceId?: string) {
    this.sessionActionNotifier.push(sessionLog, sourceId);

    this.sessionLogDatabase.add(sessionLog);
  }

  getLastSessionLog(sessionId: string) {
    return this.sessionLogDatabase.getLast(sessionId);
  }

  getSessionLogs(sessionId: string) {
    return this.sessionLogDatabase.getAll(sessionId);
  }
}