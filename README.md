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
- [x] Availability: Should be highly available.
- [x] Scalability: Should be highly scalable and adapt to the workload (i.e. number of users and number of messages in a given time period)
- [x] Security:  Communication must be secure.

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

- [x] Stateful services: chat service is the only stateful service and users have persistent network connection.
- [ ] Stateless services: Authentications, profiles, etc (TBD)
- [ ] Third party integrations: e.g. push notifications (TBD)

## Architecture

- `Monorepo` architecture to accommodate both frontend and backend projects in the same repository.
- Serverless, Event-driven, Function as a Service (FaaS) in the backend with AWS Lambda functions. This gives us high availability for backend services.
- Host frontend in AWS S3. 

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/0bba630d-cd2e-4935-946e-48d2159e3cb2">
</p>

### Database

#### Stateless Services
For services like Authentication and Profile (TBD), Relational databses are a good candidate. We'll revist this once these services implemented.

#### Chat Service Database
For Chat service, we will have huge amout of data which users may want to access although the request to have the most recent chat history is more frequent. A key-value NoSQL database looks a better candidate to support our needs although some features (e.g. search) out of scope but might be implemented later.
For our Serverless Architecture, we use `DynamoDB` database.  
- [x] DynamoDB is a serverless service meaning that it's billed based on your usage and well integrated with Lambda service that we are using.
- [x] DynamoDB is horizontally scalable.
- [x] DynamoDB provides low latency to access data.
- [ ] DynamoDB is a good candidate if later we decide to improve our service and make it **Multi-Region** service with `Global Tables`. This will result to even lower latency for a system to serve the users across the globe. You may find more details of a Multi-region serverless architecture with DynamoDB Global Tables [here](https://github.com/afallahi/nest-ddb-mr).

## Data Models 
TBD

## API Design

- connect
- disconnect
- send message
- get messages
- get users

## Security

We benefit from API Gateway features to enforce security of the application. We also need to take more steps to make the connection secure.

- [x] Communications Encryption: API Gateway provides encrypted websockets over Transport Layer Security (TLS) with scheme `wss://`.
- [x] Cross-Site Websocket Hijacking: This is Cross-Site request Forgery (CSRF) for websockets. If Websocket uses cookies for handshakes in the session and does not provide CSRF token, the connection is vulnerable to an attack in which the attacker may obtain sensitive information by establishing a cross-site websocket connection. We are not establishing sessions and are not facing this attack.
- [x] Denial of Service (DoS): API gateways employ rate limiting and throttling as security measures to mitigate DoS attacks.
- [ ] Input Validation: If server does not valiadate and sanitize the input, the request to the server might be intercepted and trigger SQL injection or Cross-Site Scripting (XSS) attack by replacing the payload of the request.
- [ ] Authentication and Authorization: Authentication has not been implemented in this project yet (TBD).


## Diagram

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/1112df12-ed6a-41d1-98f6-70cb1765fce9">
</p>

## Backend Microservice Design Pattern
We select **Serverless Architecture** for the backend with the following details.

### Event-driven 
We detect the events and act based on them on decoupled services.

#### Benefits
- Scale and fail independently by decoupling services
- Agile development with leveraging the event router
- Reduce costs by spinning the server (or serverless functions) only when trigerred by the event.

### Function as a Service (FaaS)
Function as a Service (FaaS) is the comouting part of the Serverless architecture.

#### Benefits
- Decoupled
- Lightweight
- Highly Scalable
- Highly Available
- Very cost efficient (pay per use)

## Backend Implementation
We use API Gateway (WebSocket), Lambda functions, and DynamoDB which are well suited for Serverless application and follow the `event-driven` architecture with `FaaS` serverless compute.

**Note:** With Serverless architecture, we no longer need `Load balancer` or services like `Zookeeper` for `Service Discovery`. API Gateway is good enough for this purpose and our Serverless architecture adapts well to the workload with Lambda functions.

## Usage

### Deployment

#### Backend

```
npm run deploy
```

### Frontend

We are going to manually upload our React app to S3 bucket and create a website which will be avilable through Cloudfront.

#### Deploy Frontend with AWS CLI

Create a bucket policy that allows public read:

```
touch ./bucket_policy.json
code ./bucket_policy.json
```

Add the following into the policy json file:

```{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::<bucket-name>/*"
        }
    
    ]
}
```

Run the commands below to get the website url:

```
npm run build
aws s3api create-bucket --bucket <bucket-name> --region=us-east-1

# When creating a new bucket, default policy doesn't grant public access (Amazon S3 Block Public Access is enabled). If your new bucket # # policy grants public access, you need to run this:

aws s3api delete-public-access-block --bucket <bucket-name>
aws s3api put-bucket-policy --bucket chat-frontend --policy file:///tmp/bucket_policy.json
aws s3 sync ./build s3://<bucket-name>/
aws s3 website s3://<bucket-name>/ --index-document index.html --error-document index.html
```

The website should be available at
```
http://<bucket-name>.s3-website.us-east-1.amazonaws.com/
```

#### Deploy Frontend with AWS Amplify

To host the app with CloudFront and S3 using Amplify, use the `chat-amplify` folder and follow the steps below to publish the app:

First configure the project

```
npm install
amplify configure
amplify int
```
Now is the time to publish

```
amplify add hosting
amplify publish
```

### Demo


Postman                    |  Chat App
:-------------------------:|:-------------------------:
![postman-to-chat-app](https://github.com/afallahi/chat-app/assets/73287428/fdb45117-c57f-42b2-85c5-407cee75ef92)  |  ![chat-app-to-postman](https://github.com/afallahi/chat-app/assets/73287428/a3d1cf51-e5c5-4a42-bba2-6323e28e6ff3)

![chat-app](https://github.com/afallahi/chat-app/assets/73287428/4f1ce88f-773c-461a-817f-41b958404f0e)


### CI/CD (TBD)

We use AWS CodePipeline. A Lambda function accommodates the logic to trigger the appropriate pipeline for each project (i.e. backend and frontend).

<p align="center">
    <img src="https://github.com/afallahi/chat-app/assets/73287428/5df8c9c5-262a-4ba6-aefd-63f768c1cb0d">
</p>


## Enhancements - Multi_Region Architecture



![multi_region_serverless_chat](https://github.com/afallahi/chat-app/assets/73287428/a07556f8-5041-4095-a414-823c436b9126)



