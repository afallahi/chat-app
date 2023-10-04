import React, {useState, useEffect, useRef} from 'react';
import './App.css';
import Main from './Main';
import Chat from './Chat';
import { Connector } from './Connector';
import Sidebar from "./Sidebar";

const WEBSOCKET_URL = "wss://r4ykbetne9.execute-api.us-east-1.amazonaws.com/dev";
const connector = new Connector();

type MessageItem = {
  sender: string;
  message: string;
};


function App() {

  const [username, setUsername] = useState(
    window.localStorage.getItem("username") || ""
  );


  const [target, setTarget] = useState<string>(
    window.localStorage.getItem("lastTarget") || ""
  );
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const webSocket = useRef(connector);

  const setNewTarget = (target: string) => {
    setTarget(target);
    setMessages([]);
    getMessages(target);
  };

  const getMessages = (target: string) => {
    webSocket.current.getConnection(url).send(
      JSON.stringify({
        action: "getMessages",
        targetUsername: target,
        limit: 50
      })
    );   
  }

  useEffect(() => {
    window.localStorage.setItem("username", username);
    window.localStorage.setItem("lastTarget", target);
  });

  if (username === "") {
    return (
      <Main setUsername={(username) => {
        setUsername(username);
        if (target === "") {
          setTarget(username);
        }
      }} 
      />
    );
  }

  const url = `${WEBSOCKET_URL}?username=${username}`;
  const ws = webSocket.current.getConnection(url);

  ws.onopen = () => {
    webSocket.current.getConnection(url).send(JSON.stringify({action: "getUsers"}));
    getMessages(target);
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
  }

  ws.onmessage = (event: MessageEvent) => {
    const msg = JSON.parse(event.data) as {
      type: string;
      value: unknown;
    };
    console.log(event);
    console.log(msg);
    if (msg.type === "users") {
      setUsers(
        (msg.value as { username: string }[]).map((c) => c.username).sort()
      );
    }

    if (msg.type === "messages") {
      const body = msg.value as {
        messages: MessageItem[];
        lastEvaluatedKey: unknown;
      };

      setMessages([...body.messages.reverse(), ...messages]);
    }
  }

  return (
    <div className='flex'>
      <Sidebar 
        me={username}
        users={users}
        setTarget={(target) => setNewTarget(target)}
      />
      <div className='flex-auto'>
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
