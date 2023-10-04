# Chat App

## Requirements

### Functional Requirements
- Supports one-on-one conversation between 2 users.
- Both Client A and Client B can initiate the call to start chat with the other party. 
- Chat service stores and relays the messages.
- Users get acknowledgemnets on their messages.
- Messages are plain text.
- Chat service provides persistent storage to save the messages when the recipient is offline.

### Non-Functional Requirements
- Consistency: Chat service delivers the messages in the same order of receiving from chat parties.
- Low Latency: User should recieve messages with low latency.

## System Design

### High Level Design

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/8fea6623-525e-4f43-b6ab-b1fa02fa9adb">

</p>

### Communication Protocol

- Http(s): Http is client-initiated protocol and server can not initiate the conversation. Http with `keep-alive` in header may establish a connection with the server. But this does not help the server to start the communication.
- Polling: Client requests data from the server priodically. This is inefficient as it leads to high number network calls.
- Long polling: To reduce the number of requests, server keeps the connection open till there is data to send.
- Websockets: Common solution for bidirectional real-time communication on a single connection with the lowest latency. We can use this to send async messages from server to the client.


<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/a43cf410-ee58-4fe8-829b-962749c7cb49">
</p>

### Service Types

- Stateful services: Authentications, profiles, etc (TBD)
- Stateless services
- Third party integrations: e.g. push notifications (TBD)

## Architecture

- `Monorepo` architecture to accommodate both frontend and backend projects in the same repository.
- Serverless, Event-driven, Function as a Service (FaaS) in the backend with AWS Lambda functions. This gives us high availability for backend services.
- Host frontend in AWS S3. 

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/0bba630d-cd2e-4935-946e-48d2159e3cb2">
</p>

### Database

For our Serverless Architecture, we use `DynamoDB` database.  DynamoDB is a serverless service meaning that it's billed based on your usage and well integrated with Lambda service that we are using.

### Diagram

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/1112df12-ed6a-41d1-98f6-70cb1765fce9">
</p>


## CI/CD (TBD)

We use AWS CodePipeline. A Lambda function accommodates the logic to trigger the appropriate pipeline for each project.

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/5df8c9c5-262a-4ba6-aefd-63f768c1cb0d">
</p>


