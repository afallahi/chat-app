<div align="center">
	<a><img width="150" src="https://user-images.githubusercontent.com/25181517/183568594-85e280a7-0d7e-4d1a-9028-c8c2209e073c.png" alt="Node.js" title="Node.js"/></a>
	<a><img width="150" src="https://user-images.githubusercontent.com/25181517/183896132-54262f2e-6d98-41e3-8888-e40ab5a17326.png" alt="AWS" title="AWS"/></a>
</div>

<p align="center">
	<a><img width="60" src="https://user-images.githubusercontent.com/25181517/183890598-19a0ac2d-e88a-4005-a8df-1ee36782fde1.png" alt="TypeScript" title="TypeScript"/></a>
	<a><img width="60" src="https://user-images.githubusercontent.com/25181517/121401671-49102800-c959-11eb-9f6f-74d49a5e1774.png" alt="npm" title="npm"/></a>	
    <a><img width="150" src="https://www.vectorlogo.zone/logos/serverless/serverless-ar21.svg" /></a>
</p>


# Chat App

## Requirements

### Functional Requirements
- [x] Conversation: Supports one-on-one conversation between 2 users. Both User A and User B can initiate the call to start chat with the other party. 
- [x] Message Processing: Chat service stores and relays the messages.
- [x] Acknowledgement: Users get acknowledgemnets on their messages.
- [x] Media: Messages are in plain text.
- [x] Storage: Chat service provides persistent storage to save the messages when the recipient is offline.

**Out of scope:**
- [ ] Media sharing: Users share files and photos
- [ ] Notification: Users get notified if they are offline and get new messages.


### Non-Functional Requirements
- [x] Consistency: Chat service delivers the messages in the same order of receiving from chat parties.
- [x] Low Latency: User should recieve messages with low latency.
- [ ] Availability: Should be highly available.
- [ ] Scalability: Should be highly scalable and adapt to the workload (i.e. number of users and number of messages in a given time period)

**Out of scope:**
- [ ] Security:  Communication must be secure.

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

- Stateful services: 
- Stateless services: Authentications, profiles, etc (TBD)
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

## Usage

### Deployment

#### Backend

```
npm run deploy
```


#### Demo


Postman                    |  Chat App
:-------------------------:|:-------------------------:
![postman-to-chat-app](https://github.com/afallahi/chat-app/assets/73287428/fdb45117-c57f-42b2-85c5-407cee75ef92)  |  ![chat-app-to-postman](https://github.com/afallahi/chat-app/assets/73287428/a3d1cf51-e5c5-4a42-bba2-6323e28e6ff3)

![chat-app](https://github.com/afallahi/chat-app/assets/73287428/4f1ce88f-773c-461a-817f-41b958404f0e)


### CI/CD (TBD)

We use AWS CodePipeline. A Lambda function accommodates the logic to trigger the appropriate pipeline for each project (i.e. backend and frontend).

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/5df8c9c5-262a-4ba6-aefd-63f768c1cb0d">
</p>





