import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from "aws-lambda";
import AWS, { AWSError } from "aws-sdk";
import { ErrorResponse, SuccessResponse } from "./utils/response";

const USERS_TABLE_NAME = "UsersTable";

type User = {
    connectionId: string,
    username: string
}

type Action = "$connect" | "$disconnect" | "getUsers";
const ddbDocClient = new AWS.DynamoDB.DocumentClient();
const apiGwMgmApi = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WSS_APIGATEWAY_ENDPOINT
})


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

        default:
            return ErrorResponse(404, "Not Found");
    }
}

const handleConnect = async (connectionId: string, queryParams: APIGatewayProxyEventQueryStringParameters | null): Promise<APIGatewayProxyResult> => {
    if (!queryParams || !queryParams["username"]) {
        return ErrorResponse(403, "Forbidden!");
    }

    const existingConnectionId = await getConnectionIdByUsername(queryParams["username"]);
    //   if (existingConnectionId &&
    //     (await postToConnection(existingConnectionId, JSON.stringify({ type: "ping" })))
    //   ) {
    //     return ErrorResponse(403, "User already exists");
    //   }

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
        if ( (e as AWSError).statusCode !== 410 ) {
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
    await postToConnection(connectionId, JSON.stringify(users));
    return SuccessResponse({});

}

const getAllUsers = async (): Promise<User[]> => {
    const res = await ddbDocClient.scan({
        TableName: USERS_TABLE_NAME
    }).promise();

    const users = res.Items || [];
    return users as User[];

}

const notifyUsers = async (connectionIdToExclude: string) => {
    const users = await getAllUsers();

    await Promise.all(
        users.filter((user) => user.connectionId !== connectionIdToExclude).map( async (user) => {
            await postToConnection(user.connectionId, JSON.stringify(users));
        })
    ); 

}

export const hello = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return SuccessResponse({message: "Function Hello says Hello!"});
}