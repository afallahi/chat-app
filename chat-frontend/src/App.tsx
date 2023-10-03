import React, {useState, useEffect} from 'react';
import './App.css';
import Main from './Main';
import Chat from './Chat';

function App() {

  const [username, setUsername] = useState(
    window.localStorage.getItem("username") || ""
  );

  useEffect(() => {
    window.localStorage.setItem("username", username);
  })

  if (username === "") {
    return <Main setUsername={setUsername} />
  }

  return (
    <Chat />
  );
}

export default App;
