## Nooks Watch Party Project

### Instructions

In the `/server` folder, run `npm i` and then `npm run serve`. The server runs on port 8000.

In the `/frontend` folder, run `npm i` and then `npm start`. The frontend runs on port 3000.

### High Level Design Overview

#### Create Session
When a session is created, the frontend client sends a request to the server to create a session and automatically navigates to the `/watch` page.

#### Watch Session
When a user opens the watch page, the frontend client sends a request to the server to get the latest log for the session in order to set the url for the video and opens a WebSocket in preparation to start playing the video.

When the user clicks "Watch Session", the frontend sends a WebSocket message to signal that it has joined. The server replies with the latest log for the session, which the frontend will use to sync the new user's video with other users. The server also sets up a listener using the `SessionActionNotifier` for events that are occurring from other users, which it passes to the frontend client through the WebSocket to ensure it stays synced with others.

As the video plays and when users control the video, messages are sent through the WebSocket to the server. These messages are stored in the database and passed to other frontend clients.

#### Replay Session
When replaying a session, the frontend client retrieves all logs for that session and uses it to replay the session.

#### Database
I used a database abstraction class in file `server/src/session-log-database.ts` as a mock database. To productionalize this project, this class would be used to connect to a real database.

#### Session Events
I used an abstraction for an event queue in file `server/src/session-action-notifier.ts`. Events for each session are added to this class and it calls callback functions associated with the session for the event. To productionalize this, this class can be hooked up to a multi-producer and multi-consumer queue (eg. Azure Service Bus).

### Improvements
Due to time constraints, this project is of course not perfect and there are many possibilities for improvements. Below are some of the improvements that can be made with more time:

1. Currently, I only store the events (eg. play, pause, progress) for a session. It would be useful to also store metadata about the session such as total time, url, and number of users in a different collection so that it can be displayed to users on a home page for easier access.
2. Error handling for failed requests to the server and failed requests to the database.
3. Error handling for when a user tries to join a session or watch a replay that does not exist.
4. Handling for when a user's video is taking a long time to buffer.
5. In a distributed environment, session events may be sent and received out of order, we'll need handling to make sure that earlier events are not processed after later events are already processed.

