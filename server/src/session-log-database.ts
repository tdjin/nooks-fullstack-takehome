export enum SessionAction {
    CREATE = 'create',
    SWITCH = 'switch',
    PLAY = 'play',
    PAUSE = 'pause',
    SEEK = 'seek',
    PROGRESS = 'progress'
}

export class SessionLogModel {
    sessionId!: string;

    action!: SessionAction;

    isPlaying!: boolean;

    url!: string;

    mediaTimeSeconds!: number;

    timestamp!: Date;
}

export class SessionLogDatabase {
    private sessionLogs: Record<string, SessionLogModel[]>;

    constructor(){
        this.sessionLogs = {};
    }

    add(sessionLog: SessionLogModel) {
        if (this.sessionLogs[sessionLog.sessionId] === undefined) {
            this.sessionLogs[sessionLog.sessionId] = [];
        }

        this.sessionLogs[sessionLog.sessionId].push(sessionLog);
    }

    getLast(sessionId: string) {
        if (this.sessionLogs[sessionId] === undefined) {
            return null;
        }

        return this.sessionLogs[sessionId][this.sessionLogs[sessionId].length - 1];
    }

    getAll(sessionId: string) {
        return this.sessionLogs[sessionId];
    }
}
