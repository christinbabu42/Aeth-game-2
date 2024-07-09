const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const _ = require('lodash');

const Snake = require('./snake');
const Apple = require('./apple');

let autoId = 0;
const GRID_SIZE = 40;
let players = []; // Array to hold player snakes

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', (client) => {
  let player;
  let id;

  client.on('auth', (opts, cb) => {
    if (players.length >= 2) {
      // Reject if there are already two players
      cb({ error: 'Maximum players reached' });
      return;
    }

    id = ++autoId;
    player = new Snake(_.assign({
      id,
      dir: 'right',
      gridSize: GRID_SIZE,
      snakes: players,
      apples
    }, opts));
    players.push(player);
    cb({ id });
  });

  client.on('key', (key) => {
    if (player) {
      player.changeDirection(key);
    }
  });

  client.on('disconnect', () => {
    _.remove(players, player);
  });
});

// Create initial apples
const apples = [];
for (let i = 0; i < 3; i++) {
  apples.push(new Apple({
    gridSize: GRID_SIZE,
    snakes: players,
    apples
  }));
}

// Main game loop
setInterval(() => {
  players.forEach((p) => {
    p.move();
  });
  io.emit('state', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y,
      id: p.id,
      points: p.points,
      tail: p.tail
    })),
    apples: apples.map((a) => ({
      x: a.x,
      y: a.y
    }))
  });
}, 100);

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`);
});
