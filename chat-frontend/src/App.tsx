import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import { Connector } from "./Connector";
import Main from "./Main";

type MessageItem = {
  sender: string;
  message: string;
};

const WS_URL = "wss://r4ykbetne9.execute-api.us-east-1.amazonaws.com/dev";
const connector = new Connector();

function App() {
  const [username, setUsername] = useState<string>(
    window.localStorage.getItem("username") || ""
  );
  const [users, setUsers] = useState<string[]>([]);
  const [target, setTarget] = useState<string>(
    window.localStorage.getItem("lastTarget") || ""
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const webSocket = useRef(connector);

  const loadMessages = (target: string) => {
    webSocket.current.getConnection(url).send(
      JSON.stringify({
        action: "getMessages",
        targetUsername: target,
        limit: 1000,
      })
    );
  };

  const setNewTarget = (target: string) => {
    setTarget(target);
    setMessages([]);
    loadMessages(target);
  };

  useEffect(() => {
    window.localStorage.setItem("username", username);
    window.localStorage.setItem("lastTarget", target);
  });

  if (username === "") {
    return (
      <Main
        setUsername={(username) => {
          setUsername(username);
          if (target === "") {
            setTarget(username);
          }
        }}
      />
    );
  }

  const url = `${WS_URL}?username=${username}`;
  const ws = webSocket.current.getConnection(url);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data) as {
      type: string;
      value: unknown;
    };
    console.log(msg);
    if (msg.type === "users") {
      setUsers(
        (msg.value as { username: string }[]).map((c) => c.username).sort()
      );
      console.log(`users: ${users}`);
    }

    if (msg.type === "messages") {
      const body = msg.value as {
        messages: MessageItem[];
        lastEvaluatedKey: unknown;
      };

      setMessages([...body.messages.reverse(), ...messages]);
    }

    if (msg.type === "message") {
      console.log("message type");
      const item = msg.value as MessageItem;
      console.log(`item: ${JSON.stringify(item)}`);
      if (item.sender === username || item.sender !== target) {
        console.log("here1");
        console.log(`username: ${username}, target: ${target}`);
        return;
      }
      setMessages([...messages, item]);
      console.log(`messages: ${messages}`);
    }
  };

  ws.onopen = () => {
    webSocket.current
      .getConnection(url)
      .send(JSON.stringify({ action: "getUsers" }));

    loadMessages(target);
  };

  const sendMessage = (value: string) => {
    webSocket.current.getConnection(url).send(
      JSON.stringify({
        action: "sendMessage",
        recipientUsername: target,
        message: value,
      })
    );
    setMessages([
      ...messages,
      {
        message: value,
        sender: username,
      },
    ]);
  };

  return (
    <div className="flex">
        <Sidebar
          me={username}
          users={users}
          setTarget={(target) => setNewTarget(target)}
        />
      <div className="flex-auto">
        <Chat
          target={target}
          messages={messages}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}

export default App;