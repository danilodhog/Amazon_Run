const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Variaveis
let score;
let scoreText;
let highscore;
let highscoreText;
let tutorialW;
let tutorialS;
let player;
let gravity;
let obstacles = [];
let gameSpeed;
let keys = {};

// Eventos
document.addEventListener('keydown', function (evt) {
  keys[evt.code] = true;
});
document.addEventListener('keyup', function (evt) {
  keys[evt.code] = false;
});



class Player {
  constructor (x, y, w, h, c, a, b, d, e, f, g, i, j, k, l) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;
	this.a = a;
	this.b = b;
	this.d = d;
	this.e = e;
	this.f = f;
	this.g = g;
	this.i = i;
	this.j = j;
	this.k = k;
	this.l = l;
	

    this.dy = 0;
    this.jumpForce = 15;
    this.originalHeight = h;
    this.grounded = false;
    this.jumpTimer = 0;
  }

  Animate () {
    // Pular
    if (keys['Space'] || keys['KeyW']) {
      this.Jump();
    } else {
      this.jumpTimer = 0;
    }

    if (keys['ShiftLeft'] || keys['KeyS']) {
      this.h = this.originalHeight / 2;
    } else {
      this.h = this.originalHeight;
    }

    this.y += this.dy;

    // Gravidade
    if (this.y + this.h < 600) {
      this.dy += gravity;
      this.grounded = false;
    } else {
      this.dy = 0;
      this.grounded = true;
      this.y = 600 - this.h;
    }

    this.Draw();
  }

  Jump () {
    if (this.grounded && this.jumpTimer == 0) {
      this.jumpTimer = 1;
      this.dy = -this.jumpForce;
    } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
      this.jumpTimer++;
      this.dy = -this.jumpForce - (this.jumpTimer / 50);
    }
  }

  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
	ctx.fillStyle = this.f;
    ctx.fillRect(this.a, this.y, this.d, this.e);
	ctx.fillStyle = this.l;
    ctx.fillRect(this.g, this.y, this.i, this.j);
    ctx.closePath();
  }
}

class Obstacle {
  constructor (x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;

    this.dx = -gameSpeed;
  }

  Update () {
    this.x += this.dx;
    this.Draw();
    this.dx = -gameSpeed;
  }

  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.closePath();
  }
}

class Text {
  constructor (t, x, y, a, c, s) {
    this.t = t;
    this.x = x;
    this.y = y;
    this.a = a;
    this.c = c;
    this.s = s;
  }

  Draw () {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.font = this.s + "px sans-serif";
    ctx.textAlign = this.a;
    ctx.fillText(this.t, this.x, this.y);
    ctx.closePath();
  }
}

// Funcoes
function SpawnObstacle () {
  let size = RandomIntInRange(155, 100);
  let type = RandomIntInRange(0, 1);
  let obstacle = new Obstacle(canvas.width + size, 600 - size, size, size, '#1C1C1C');

  if (type == 1) {
    obstacle.y -= player.originalHeight - 10;
  }
  obstacles.push(obstacle);
}


function RandomIntInRange (min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function Start () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx.fillStyle="#F4A460";
  ctx.beginPath();
  ctx.fillRect(0,600,2000,1000);
  ctx.stroke();
  ctx.fill();
  ctx.closePath();

  
  ctx.font = "20px sans-serif";

  gameSpeed = 3;
  gravity = 1;

  score = 0;
  highscore = 0;
  if (localStorage.getItem('highscore')) {
    highscore = localStorage.getItem('highscore');
  }

  player = new Player(50, 0, 80, 120, '#FFFAFA', 80, 10, 80, 35, '#FFFF00', 60, 10, 10, 35, '#1C1C1C');
  

  scoreText = new Text("Score: " + score, 25, 25, "left", "#212121", "20");
  highscoreText = new Text("Highscore: " + highscore, canvas.width - 25, 25, "right", "#212121", "20");
  tutorialW = new Text ("W/SPACE - PULA ", 700, 25, "left", "#212121", "20");
  tutorialS = new Text ("S/SHIFT - AGACHA ", 1095, 25, "left", "#212121", "20");

  requestAnimationFrame(Update);
}

let initialSpawnTimer = 160;
let spawnTimer = initialSpawnTimer;
function Update () {
  requestAnimationFrame(Update);
  ctx.clearRect(0, 0, canvas.width, 600);

  spawnTimer--;
  if (spawnTimer <= 0) {
    SpawnObstacle();
    console.log(obstacles);
    spawnTimer = initialSpawnTimer - gameSpeed * 8;
    
    if (spawnTimer < 60) {
      spawnTimer = 60;
    }
  }

  // Spawnar Inimigos
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    if (o.x + o.w < 0) {
      obstacles.splice(i, 1);
    }

    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      obstacles = [];
      score = 0;
      spawnTimer = initialSpawnTimer;
      gameSpeed = 3;
      window.localStorage.setItem('highscore', highscore);
    }

    o.Update();
  }

  player.Animate();

  score++;
  scoreText.t = "Score: " + score;
  scoreText.Draw();

  if (score > highscore) {
    highscore = score;
    highscoreText.t = "Highscore: " + highscore;
  }
  
  highscoreText.Draw();
  
  tutorialW.Draw();
   tutorialS.Draw();

  gameSpeed += 0.008;
}

Start();

