import React, {useState} from 'react';

const Main = ({ setUsername }: {
    setUsername: (username: string) => void
}) => {

    const [usernameLocal, setUsernameLocal] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    return (
        <section className="flex justify-center items-center h-screen bg-gray-100">
            <div className="max-w-md w-full bg-white rounded p-6 space-y-4">
                <div className="mb-4">
                    <h2 className="text-gray-600 font-bold">Enter your username to join the chat</h2>
                </div>
                <div>
                    <input 
                        className="w-full p-4 text-sm bg-gray-50 focus:outline-none border border-gray-200 rounded text-gray-600" 
                        type="text" 
                        placeholder="Username" 
                        onChange={(e) => {setUsernameLocal(e.target.value)}}
                        value={usernameLocal}
                    />
                    {errorMessage !== "" ? <span className="text-red-500 font-medium">{errorMessage}</span> : "" }
                </div>
                <div>
                    <button 
                        onClick={(e) => {
                            usernameLocal === "" ? setErrorMessage("username is empty") : setUsername(usernameLocal) 
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold text-gray-50 transition duration-200">
                            Join the chat
                    </button>
                </div>
            </div>
        </section>
    );
}

export default Main;