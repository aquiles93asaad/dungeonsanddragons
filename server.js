require('dotenv').config();
const http      = require('http');
const express   = require('express');
const session   = require('express-session');
const { Server } = require('socket.io');
const path      = require('path');
const connectDB = require('./db/connect');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

connectDB();

// Archivos estáticos — van antes del session middleware (no necesitan sesión)
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// Render (y cualquier reverse proxy) — necesario para cookies secure y req.ip correctos
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

// ── Relay en memoria para sincronización live ──────────────────────────────
// No persiste en DB — el DM es la fuente de verdad, el servidor solo retransmite
const liveCache = { session: null, hp: {} };

io.on('connection', socket => {
  socket.on('live:sync', data => {
    liveCache.session = data;
    socket.broadcast.emit('live:sync', data);
  });
  socket.on('hp:update', ({ charId, hp }) => {
    liveCache.hp[charId] = hp;
    socket.broadcast.emit('hp:update', { charId, hp });
  });
  socket.on('live:request', () => {
    if (liveCache.session || Object.keys(liveCache.hp).length) {
      socket.emit('live:welcome', liveCache);
    }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Ardaetheros corriendo en http://localhost:${PORT}`);
});
