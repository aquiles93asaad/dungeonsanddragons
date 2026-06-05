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
  // DM transmite estado completo de la sesión live
  socket.on('live:sync', data => {
    liveCache.session = data;
    socket.broadcast.emit('live:sync', data);
  });

  // DM transmite cambio de HP de un personaje
  socket.on('hp:update', ({ charId, hp }) => {
    liveCache.hp[charId] = hp;
    socket.broadcast.emit('hp:update', { charId, hp });
  });

  // Jugador pide el estado actual (al cargar o reconectar)
  socket.on('live:request', () => {
    if (liveCache.session || Object.keys(liveCache.hp).length) {
      socket.emit('live:welcome', liveCache);
    }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Diagnóstico temporal — remover después de confirmar deploy
app.get('/debug-fs', (req, res) => {
  const fs = require('fs');
  const pub = path.join(__dirname, 'public');
  const js  = path.join(pub, 'js');
  res.json({
    dirname: __dirname,
    cwd: process.cwd(),
    publicExists: fs.existsSync(pub),
    jsExists: fs.existsSync(js),
    jsFiles: fs.existsSync(js) ? fs.readdirSync(js) : 'N/A',
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Ardaetheros corriendo en http://localhost:${PORT}`);
});
