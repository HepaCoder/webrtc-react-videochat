import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface Offer {
    targetId: string,
    callerId: string,
    sdp: RTCSessionDescription | null | undefined,
}

interface Ice {
    targetId: string,
    candidate: RTCIceCandidate,
}

interface HangUp {
    targetId: string,
    callerId: string,
}

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', 
    }
});

app.use('/', (req, res) => {
    res.send('Hello');
})


let users = new Map<string, string>();

io.on('connection', socket => {

    let userId = String(Math.floor(1000 + Math.random() * 9000));
    users.set(userId, socket.id);

    socket.emit('user-id', userId);

    socket.on('offer', (payload: Offer) => {
        io.to(users.get(payload.targetId)!).emit('offer', payload);
    });

    socket.on('answer', (payload: Offer) => {
        io.to(users.get(payload.targetId)!).emit('answer', payload);
    });

    socket.on('new-ice', (payload: Ice) => {
        io.to(users.get(payload.targetId)!).emit('new-ice', payload);
    });

    socket.on('hang-up', (payload: HangUp) => {
        io.to(users.get(payload.targetId)!).emit('hang-up', payload);
    });

});

server.listen(PORT, () => {
    console.log('Server started at port => ', PORT);
});