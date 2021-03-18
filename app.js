import dotenv from 'dotenv';

//Max number of chat messages that can be sent within a minute
const chatLimit = process.env.CHAT_LIMIT || 40;
//Max number of commands per user per minute
const userCommandLimit = process.env.USER_COMMAND_LIMIT || 10;
//Brime specific Ably credentials
const ablyCredentials = {
    clientId: process.env.CLIENT_ID,
    key: process
};
//Channel's username
let username;

//Client sessions; manages user command limit
let clientSessions = {};

export const init = (username) => {
    username = username;
    connect();
}

let webSocket;
const connect = () => {
    console.log("Attempting to connect...");
    webSocket = new webSocket(`wss://realtime.ably.io/?key=${ablyCredentials.key}&clientId=${ablyCredentials}&format=json&heartbeats=true&v=1.2&lib=js-web-1.2.6`);
}

const close = () => {
    console.log("Closing connection...");
    websocket.close();
}

webSocket.onerror = (error) => {
    throw new Error(`Failed to connect: ${error.message}`);
}

webSocket.onclose = () => {
    throw new Error(`WebSocket closed`);
}

websocket.onopen = () => {
    console.log("Connected successfully");
}

webSocket.onmessage = (event) => {
    data = JSON.parse(event.data);
    switch(data.action) {
        case 4:
            webSocket.send({"action":10,"channel":`[?rewind=100]${username}`});
            break;
        case 11:
            webSocket.send({"action":14,"channel":`[?rewind=100]${username}`,"msgSerial":0,"presence":[{"action":2,"data":null}]});
            break;
        case 15:
            recieveMessage(data);
            break;
    }
}

let receiveMessageFunction;
export const onRecieveMessage = (func) => {
    receiveMessageFunction = func;
}

const recieveMessage = (data) => {
    let connectionId = data.messages[0].clientId;
    if (connectionId in clientSessions) {
        if ((clientSessions[connectionId].latestTimestamp + 60) < Date.now()) {
            clearMessages();
        }
        if (clientSessions[connectionId].messageCount >= userCommandLimit) {
            console.log(`User '${connectionId}' has exceeded the user command limit of ${userCommandLimit}`);
            return
        }
    } else {
        clientSessions[connectionId] = {};
    }
    let timestamp = data.timestamp;
    addMessageToSession(connectionId, timestamp);
    receiveMessageFunction(data.messages[0].data.message);
}

const addMessageToSession = (connectionId, timestamp) => {
    clientSessions[connectionId].timestamp = timestamp;
    if (connectionId in clientSessions) {
        clientSessions[connectionId].messageCount = clientSessions[connectionId].messageCount + 1;
    } else {
        clientSessions[connectionId].messageCount = 0;
    }
}

const clearMessages = (connectionId) => {
    clientSessions[connectionId] = {};
}

const currentUnixTimestamp = () => {
    Math.floor(Date.now() / 1000)
}
