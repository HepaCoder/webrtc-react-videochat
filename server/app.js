import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
const PORT = 4000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
app.use('/', (req, res) => {
    res.send('Hello');
});
let users = new Map();
io.on('connection', socket => {
    let userId = String(Math.floor(1000 + Math.random() * 9000));
    users.set(userId, socket.id);
    socket.emit('user-id', userId);
    socket.on('offer', (payload) => {
        io.to(users.get(payload.targetId)).emit('offer', payload);
    });
    socket.on('answer', (payload) => {
        io.to(users.get(payload.targetId)).emit('answer', payload);
    });
    socket.on('new-ice', (payload) => {
        io.to(users.get(payload.targetId)).emit('new-ice', payload);
    });
    socket.on('hang-up', (payload) => {
        io.to(users.get(payload.targetId)).emit('hang-up', payload);
    });
});
server.listen(PORT, () => {
    console.log('Server started at port => ', PORT);
});
