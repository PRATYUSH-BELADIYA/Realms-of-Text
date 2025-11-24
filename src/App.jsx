import { useState , useEffect } from 'react'
import './App.css'
import Game from './component/Realms-of-Text'
import Login from './component/Login'
import { supabase } from './supabase'
import { loadFromCloud } from './supabase';

function App() {
  const [session, setSession] = useState(null);
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const email = data.session.user.email;
        const saved = await loadFromCloud(email);
        setPlayerData(saved);
      }
    });
  }, []);

  if (!session) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  return <Game initialPlayer={playerData} />;
}

export default App
