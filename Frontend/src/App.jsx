import React, { useState, useEffect } from "react";
import Home from "./Pages/Home";
import WatchRoom from "./Pages/WatchRoom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

function App() {
  const [activeRoom, setActiveRoom] = useState(null);
  const [initialRoomId, setInitialRoomId] = useState("");

  // Check URL on initial load for ?room=ROOM_ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setInitialRoomId(roomParam);
    }
  }, []); 

  const handleJoinRoom = ({ roomId, username, roomTitle = "", initialVideoId = "", isHost = false }) => {
    // Update browser URL without reload
    const newUrl = `${window.location.pathname}?room=${roomId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    setActiveRoom({
      roomId,
      username,
      roomTitle,
      initialVideoId,
      isHost,
    });
  };

  const handleLeaveRoom = () => {
    // Clear URL query
    window.history.pushState({}, "", window.location.pathname);
    setActiveRoom(null);
    setInitialRoomId("");
  };

  if (activeRoom) {
    return (
      <WatchRoom
        roomId={activeRoom.roomId}
        username={activeRoom.username}
        roomTitle={activeRoom.roomTitle}
        initialVideoId={activeRoom.initialVideoId}
        isHost={activeRoom.isHost}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Home
          onJoinRoom={handleJoinRoom}
          initialRoomId={initialRoomId}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;