import React, { useRef, useEffect } from 'react'
import io from 'socket.io-client';

interface Props {
    setUserId: React.Dispatch<React.SetStateAction<string | null>>,
    setPeerId: (peerId: string | null) => void,
    peerId: string | null;
    userId: string | null;
}

interface Offer {
    targetId: string | null,
    callerId: string | null,
    sdp: RTCSessionDescription ,
}

interface Ice {
    targetId: string | null,
    callerId: string | null,
    candidate: RTCIceCandidate,
}

interface HangUp {
    targetId: string,
    callerId: string,
}

const mediaOptions: MediaStreamConstraints = {
    video: true,
    audio: true,
};

const Chat: React.FC<Props> = ({userId, setUserId, peerId, setPeerId}) => {
     
    const userVideo = useRef<HTMLVideoElement | null>(null);
    const peerVideo = useRef<HTMLVideoElement | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const peerRef = useRef<string | null>(null);
    const socket = useRef<any>();
    const userStream = useRef<any>();
   
    useEffect(() => {
        navigator.mediaDevices.getUserMedia(mediaOptions).then(stream => {

            if(userVideo.current != null ){
                userVideo.current.srcObject = stream;

                // To prevent echoing of our own voice.
                userVideo.current.muted = true;
                
            }

            userStream.current = stream;
            socket.current = io('https://hidden-island-58396.herokuapp.com/');

            socket.current.on('user-id', (userId: string) => {
                setUserId(userId); 
            });

            socket.current.on('offer', (payload: Offer ) => {
                console.log('offer recieved +   ')
                console.log(payload.sdp);
                peerConnection.current = createConnectionObject();
                let desc = new RTCSessionDescription(payload.sdp);
                peerConnection.current.setRemoteDescription(desc).then(() => {
                    userStream.current?.getTracks().forEach((track: MediaStreamTrack) => {
                        peerConnection.current?.addTrack(track, userStream.current)});
                })
                .then(() => {
                    return peerConnection.current?.createAnswer();
                })
                .then(answer => {
                    return peerConnection.current?.setLocalDescription(answer);
                })
                .then(() => {
                    socket.current.emit('answer', {
                        targetId: payload.callerId,
                        callerId: userId,
                        sdp: peerConnection.current?.localDescription,
                    } as Offer);
                });

                setPeerId(payload.callerId);
                peerRef.current = payload.callerId;
                 
            });

            socket.current.on('answer', (payload: Offer) => {
                console.log('got answer')
                let desc = new RTCSessionDescription(payload.sdp);
                peerConnection.current?.setRemoteDescription(desc);

            });
        
            socket.current.on('new-ice', (ice: Ice) => {
                console.log('Got ice', ice)
                let candidate = new RTCIceCandidate(ice.candidate);
                peerConnection.current?.addIceCandidate(candidate);
            });

            socket.current.on('hang-up', (hangUp: HangUp) => {
                closeCall();
            });

        });

    }, [socket, setUserId]);

    useEffect(() => {
        if(peerId != null && peerConnection.current == null) {
            peerConnection.current = createConnectionObject();
            userStream.current?.getTracks().forEach((track: MediaStreamTrack) => {
                peerConnection.current?.addTrack(track, userStream.current)});
                peerRef.current = peerId;
                console.log('peer ref ', peerRef.current);
        }
        
        if(peerId == null && peerConnection.current != null){
            console.log("cloce ",peerRef.current)
            socket.current.emit('hang-up', {
                targetId: peerRef.current,
                callerId: userId,
            } as HangUp);

            closeCall();
        }

    }, [peerId]);

    function handleNegotiationNeededEvent() {
        peerConnection.current?.createOffer().then(offer => {
            return peerConnection.current?.setLocalDescription(offer);
        }).then(() => {
            socket.current.emit('offer', {
                targetId: peerId,
                callerId: userId,
                sdp: peerConnection.current?.localDescription,
            } as Offer);
        });
    }

    function handleICECandidateEvent(event: RTCPeerConnectionIceEvent) {
        console.log('Emit ice', event.candidate)

        if (event.candidate) {
            socket.current.emit('new-ice', {
                targetId: peerId,
                callerId: userId,
                candidate: event.candidate,
            } as Ice);
        }
    } 

    function handleTrackEvent(event: RTCTrackEvent) {
        console.log(event.streams[0])
        if (peerVideo.current != null){
            peerVideo.current.srcObject = event.streams[0];
        }
    }

    function closeCall() {
        if(peerConnection.current) {
            peerConnection.current.onnegotiationneeded = null;
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;

            if(peerVideo.current?.srcObject){
                (peerVideo.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                peerVideo.current.srcObject = null;
            }

            peerConnection.current.close();
            peerConnection.current = null;
            peerRef.current = null;
            setPeerId(null);
        }
    }

    function createConnectionObject(): RTCPeerConnection {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },  	{ urls: "turn:numb.viagenie.ca", credential: "drfunk",  username: "toadums@hotmail.com"}  
            ]
        });

        peerConnection.onicecandidate = handleICECandidateEvent;
        peerConnection.ontrack = handleTrackEvent;
        peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;

        return peerConnection;
    }

    return (
        <div className='video_screen'>
           <video autoPlay height={500} width={500} ref={userVideo} />
           <video autoPlay height={500} width={500} ref={peerVideo}/>
        </div>
    )
}

export default Chat;

