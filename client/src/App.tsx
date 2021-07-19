import React, { useState } from 'react';
import Chat from './components/Chat';

function App() {
  const [ userId, setUserId ] = useState<string | null>(null);
  const [ peerId, setPeerId ] = useState<string | null>(null);
  const [ inputPeer, setInputPeer ] = useState<string>('');

  const setPeerIdWrapper = (peerId: string | null) => {
    setInputPeer('');
    setPeerId(peerId);
  }

  return (
    <div className='wrapper'>
      <div className='user_info'>Your user id is {userId}</div>
      <Chat setUserId={setUserId} peerId={peerId} userId={userId} setPeerId={setPeerIdWrapper} />
      <div className='peer_id_input_wrapper' >
        <input type='text' placeholder='Enter Peer Id' className='peer_id_input' 
          value={inputPeer} onChange={(e) => setInputPeer(e.target.value)} hidden={peerId != null}/>
        <button type='button' className='connect_button' onClick={() => peerId == null ? setPeerId(inputPeer) : setPeerId(null)}>
          { peerId != null ? 'Disconnect' : 'Connect'}
        </button>
      </div>
              
    </div>
  );
}

export default App;
