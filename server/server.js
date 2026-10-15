const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
    },
});

app.use(express.static(path.join(__dirname, '../dist')));

// Pour toute route non gérée, retourner l'index.html de Vite
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Stockage des rooms et état initial du jeu
const rooms = {};

// Fonction utilitaire : Générer un code de room unique
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    socket.on('CONNECT', (isMobile) => {
        console.log(`[INFO] Le joueur ${socket.id} est ${isMobile ? 'sur mobile' : 'sur desktop'}`);
    });

    // Création d'une room
    socket.on('CREATE_ROOM', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            players: [
                {
                    id: socket.id,
                },
            ],
        };
        socket.join(roomCode);
        socket.emit('ROOM_CREATED', { roomCode });
    });

    // Rejoindre une room
    socket.on('JOIN_ROOM', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 2) {
            room.players.push({
                id: socket.id,
            });
            socket.join(roomCode);

            io.to(roomCode).emit('PLAYER_JOINED', {
                message: `Un joueur a rejoint la room !`,
            });

            if (room.players.length === 2) {
                io.to(roomCode).emit('READY_TO_START', {
                    message: 'Les deux joueurs sont prêts, la partie peut commencer !',
                });
            }
        } else {
            socket.emit('PLAYER_JOINED', {
                message: 'La room est pleine ou inexistante.',
            });
        }
    });

    socket.on('BUTTON_PRESSED', () => {
        const roomCode = [...socket.rooms].find((room) => room !== socket.id);
        if (!roomCode) return;

        socket.to(roomCode).emit('START_ANIMATION');
    });
});
