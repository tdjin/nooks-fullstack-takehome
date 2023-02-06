import { SessionLogModel } from "./session-log-database";

export class SessionActionNotifier {
    private sessionCallbacks: Record<string, Record<string, (sessionAction: any) => boolean>>;

    constructor(){
        this.sessionCallbacks = {};
    }

    registerCallback(sessionId: string, sourceId: string, callback: (sessionLog: SessionLogModel) => boolean) {
      if (this.sessionCallbacks[sessionId] === undefined) {
        this.sessionCallbacks[sessionId] = {};
      }

      this.sessionCallbacks[sessionId][sourceId] = callback;
    }

    unregisterCallback(sessionId: string, sourceId: string) {
      if (this.sessionCallbacks[sessionId] === undefined 
          || this.sessionCallbacks[sessionId][sourceId] === undefined) {
        return;
      }

      delete this.sessionCallbacks[sessionId][sourceId];
    }

    push(sessionLog: SessionLogModel, sourceId?: string) {
      const sessionId = sessionLog.sessionId;
      if (this.sessionCallbacks[sessionId] === undefined) {
          return;
      }

      const callbacksToDelete = [];
      for (let [callbackSourceId, callback] of Object.entries(this.sessionCallbacks[sessionId])) {
        if (sourceId === callbackSourceId) {
          continue;
        }

        const result = callback(sessionLog);
        if (!result) {
          callbacksToDelete.push(callbackSourceId);
        }
      }

      for (let callbackSourceId of callbacksToDelete) {
        this.unregisterCallback(sessionId, callbackSourceId);
      }
    }
}