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
    <img src="https://github.com/afallahi/chat-app/assets/73287428/1e354e60-3757-4adc-8b86-a1e7c1721668">
</p>

### Communication Protocol

- Http(s): Http is client-initiated protocol and server can not initiate the conversation. Http with `keep-alive` in header may establish a connection with the server. But this does not help the server to start the communication.
- Polling: Client requests data from the server priodically. This is inefficient as it leads to high number network calls.
- Long polling: To reduce the number of requests, server keeps the connection open till there is data to send.
- Websockets: Common solution for bidirectional real-time communication on a single connection with the lowest latency. We can use this to send async messages from server to the client.


<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/d7cf6897-63fd-4332-b1a2-665248044b8a">
</p>





