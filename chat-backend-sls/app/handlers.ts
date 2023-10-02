import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from "aws-lambda";
import AWS, { AWSError } from "aws-sdk";
import { ErrorResponse, SuccessResponse } from "./utils/response";
import { v4 } from "uuid";
import { Key } from "aws-sdk/clients/dynamodb";

const USERS_TABLE_NAME = "UsersTable";
const MESSAGES_TABLE_NAME = "Messages";

type User = {
    connectionId: string,
    username: string
}

type SendMessageBody = {
    recipientUsername: string;
    message: string;
}

type GetMessagesBody = {
    targetUsername: string;
    startKey: Key | undefined;
    limit: number;
  };

type Action = "$connect" | "$disconnect" | "getUsers" | "sendMessage" | "getMessages";
const ddbDocClient = new AWS.DynamoDB.DocumentClient();
const apiGwMgmApi = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WSS_APIGATEWAY_ENDPOINT
})

const isConnectionNotExistError = (e: unknown) =>
  (e as AWSError).statusCode === 410;


export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const routeKey = event.requestContext.routeKey as Action
    const connectionId = event.requestContext.connectionId as string

    switch (routeKey) {
        case "$connect":
            return handleConnect(connectionId, event.queryStringParameters);
        case "$disconnect":
            return handleDisonnect(connectionId);
        case "getUsers":
            return handleGetUsers(connectionId);
        case "sendMessage":
            return handleSendMessage(await getUser(connectionId), parseSendMessageBody(event.body));
        case "getMessages":
            return handleGetMessages(await getUser(connectionId), parseGetMessageBody(event.body));
        default:
            return ErrorResponse(404, "Not Found");
    }
}

const handleSendMessage = async (user: User, body: SendMessageBody) => {

    const usernameToUsername = getUsernameToUsername([
        user.username,
        body.recipientUsername,
      ]);

    await ddbDocClient.put({
      TableName: MESSAGES_TABLE_NAME,
      Item: {
        messageId: v4(),
        usernameToUsername,
        message: body.message,
        sender: user.username,
        createdAt: new Date().getTime(),
      },
    }).promise();

    const recipientConnectionId = await getConnectionIdByUsername(body.recipientUsername);

    if (recipientConnectionId) {
        await apiGwMgmApi.postToConnection({
            ConnectionId: recipientConnectionId,
            Data: JSON.stringify({
              type: "message",
              value: {
                sender: user.username,
                message: body.message,
              },
            }),
        }).promise();
    }

    return SuccessResponse({});
}

const getUsernameToUsername = (names: string[]) => {
    names.sort().join("#");
}

const handleGetMessages = async (user: User, body: GetMessagesBody) => {

    const res = await ddbDocClient.scan({
      TableName: MESSAGES_TABLE_NAME,
      IndexName: "UsernameToUsernameIndex",
      FilterExpression: "#usernameTousername = :usernameToUsername",
      ExpressionAttributeNames: {
        "#usernameToUsername": "usernameToUsername",
      },
      ExpressionAttributeValues: {
        ":usernameToUsername": getUsernameToUsername([
          user.username,
          body.targetUsername,
        ]),
      },
      Limit: body.limit,
      ExclusiveStartKey: body.startKey,
      //ScanIndexForward: false,
    })
    .promise();

    await postToConnection(
        user.connectionId,
        JSON.stringify({
            type: "messages",
            value: {
                messages: res.Items && res.Items.length > 0 ? res.Items : [],
                lastEvaluatedKey: res.LastEvaluatedKey,
            },
        }),
    );

    return SuccessResponse({});
}

const handleConnect = async (connectionId: string, queryParams: APIGatewayProxyEventQueryStringParameters | null): Promise<APIGatewayProxyResult> => {
    if (!queryParams || !queryParams["username"]) {
        return ErrorResponse(403, "Forbidden!");
    }

    const existingConnectionId = await getConnectionIdByUsername(queryParams["username"]);
      if (existingConnectionId &&
        (await postToConnection(existingConnectionId, JSON.stringify({ type: "ping" })))
      ) {
        return ErrorResponse(403, "User already exists");
      }

    await ddbDocClient.put({
        TableName: USERS_TABLE_NAME,
        Item: {
            connectionId,
            username: queryParams["username"],
        }
    }).promise();

    await notifyUsers(connectionId);
    return SuccessResponse({});
};

const getConnectionIdByUsername = async (username: string): Promise<string | undefined> => {

    const res = await ddbDocClient.scan({
      TableName: USERS_TABLE_NAME,
      IndexName: "UsernameIndex",
      FilterExpression: "#username = :username",
      ExpressionAttributeNames: {
        "#username": "username",
      },
      ExpressionAttributeValues: {
        ":username": username,
      },
    })
    .promise();

  return res.Items && res.Items.length > 0 ? res.Items[0].connectionId : undefined;
}

const handleDisonnect = async (connectionId: string): Promise<APIGatewayProxyResult> => {

    await ddbDocClient.delete({
        TableName: USERS_TABLE_NAME,
        Key: {
            connectionId,
        },
    }).promise();

    notifyUsers(connectionId);
    return SuccessResponse({});
};


const postToConnection = async (connectionId: string, data: string): Promise<boolean> => {
    try {
        await apiGwMgmApi.postToConnection({
            ConnectionId: connectionId,
            Data: data
        }).promise();
        return true
    
    } catch (e) {
        //if ( (e as AWSError).statusCode !== 410 ) {
        if (!isConnectionNotExistError(e)) {
            throw e;
        }

        await ddbDocClient.delete({
            TableName: USERS_TABLE_NAME,
            Key: {
                connectionId: connectionId
            }
        }).promise();
        return false
        
    }
}

const handleGetUsers = async (connectionId: string) => {
    
    const users = await getAllUsers();
    await postToConnection(connectionId, JSON.stringify({type: "users", value: users}));
    return SuccessResponse({});

}

const getAllUsers = async (): Promise<User[]> => {
    const res = await ddbDocClient.scan({
        TableName: USERS_TABLE_NAME
    }).promise();

    const users = res.Items || [];
    return users as User[];

}

const getUser = async (connectionId: string) => {
    const res = await ddbDocClient.get({
        TableName: USERS_TABLE_NAME,
        Key: {
            connectionId
        }
    }).promise();

    if (!res.Item) {
        throw new Error("User does not exist");
    }

    return res.Item as User;
}

const notifyUsers = async (connectionIdToExclude: string) => {
    const users = await getAllUsers();

    await Promise.all(
        users.filter((user) => user.connectionId !== connectionIdToExclude).map( async (user) => {
            await postToConnection(user.connectionId, JSON.stringify({type: "users", value: users}));
        })
    ); 

}

const parseSendMessageBody = (body: string | null): SendMessageBody => {
    const msgBody = JSON.parse(body || "{}") as SendMessageBody;
    if (!msgBody || !msgBody.recipientUsername || !msgBody.message) {
        throw new Error("invalid message format");
    }
    return msgBody;
}

const parseGetMessageBody = (body: string | null) => {
    const msgBody = JSON.parse(body || "{}") as GetMessagesBody;

    if (!msgBody || !msgBody.targetUsername || !msgBody.limit) {
        throw new Error("invalid message format");
    }

    return msgBody;
}

export const hello = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return SuccessResponse({message: "Function Hello says Hello!"});
}