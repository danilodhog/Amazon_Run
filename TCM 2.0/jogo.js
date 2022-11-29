

/**
 * Inicializando o jogo com o start.
 */
var game = new Game();

function init() {
	if(game.init())
		game.start();
}

/**
  Defina um objeto para conter todas as nossas imagens para o jogo para imagens
  são criados apenas uma vez. Este tipo de objeto é conhecido como
  singleton
 */
var imageRepository = new function() {
	// Define images
	this.background = new Image();
	this.spaceship = new Image();
	this.bullet = new Image();
	this.enemy = new Image();
	this.enemyBullet = new Image();

	// Certifique-se de que todas as imagens foram carregadas antes de iniciar o jogo
	var numImages = 5;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			window.init();
		}
	}
	this.background.onload = function() {
		imageLoaded();
	}
	this.spaceship.onload = function() {
		imageLoaded();
	}
	this.bullet.onload = function() {
		imageLoaded();
	}
	this.enemy.onload = function() {
		imageLoaded();
	}
	this.enemyBullet.onload = function() {
		imageLoaded();
	}

	// Definir imagens src
	this.background.src = "imgs/bg.jpg";
	this.spaceship.src = "imgs/ship.png";
	this.bullet.src = "imgs/bullet.png";
	this.enemy.src = "imgs/enemy.png";
	this.enemyBullet.src = "imgs/bullet_enemy.png";
}


/**
  Cria o objeto Drawable que será a classe base para
  todos os objetos desenhados no jogo. Define variáveis ​​padrão
  que todos os objetos filho irão herdar, bem como o padrão
  funções.
 */
function Drawable() {
	this.init = function(x, y, width, height) {
		// Defualt variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	this.collidableWith = "";
	this.isColliding = false;
	this.type = "";

	// Defina a função abstrata a ser implementada em objetos filhos
	this.draw = function() {
	};
	this.move = function() {
	};
	this.isCollidableWith = function(object) {
		return (this.collidableWith === object.type);
	};
}


/**
  Cria o objeto Background que se tornará filho de
  o objeto Drawable. O fundo é desenhado no "fundo"
  tela e cria a ilusão de movimento ao deslocar a imagem.
 */
function Background() {
	this.speed = 0.5; // Redefina a velocidade do plano de fundo para panorâmica

	// Implementar função abstrata
	this.draw = function() {
		// Pan background
		this.y += this.speed;
		//this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight);
		this.context.drawImage(imageRepository.background, this.x, this.y);

		// Desenhe outra imagem na borda superior da primeira imagem
		this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
		

		// Se a imagem rolou para fora da tela, redefina
		if (this.y >= this.canvasHeight)
			this.y = 0;
	};
}
// Defina o fundo para herdar as propriedades do Drawable
Background.prototype = new Drawable();


/**
   Cria o objeto Bullet que o navio dispara. As balas são
 * desenhado na tela "principal".
 */
function Bullet(object) {
	this.alive = false; // É verdadeiro se o marcador estiver em uso
	var self = object;
	/*
	 * Define os valores dos marcadores
	 */
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	};

	/*
	 *Usa um "retângulo drity" para apagar o marcador e movê-lo.
	* Retorna verdadeiro se o marcador se moveu da tela, indicando que
	* a bala está pronta para ser eliminada pela piscina, caso contrário, empata
	* a bala
	 */
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
		this.y -= this.speed;

		if (this.isColliding) {
			return true;
		}
		else if (self === "bullet" && this.y <= 0 - this.height) {
			return true;
		}
		else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
			return true;
		}
		else {
			if (self === "bullet") {
				this.context.drawImage(imageRepository.bullet, this.x, this.y);
			}
			else if (self === "enemyBullet") {
				this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
			}

			return false;
		}
	};

	/*
	 * Redefine os valores dos marcadores
	 */
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
		this.isColliding = false;
	};
}
Bullet.prototype = new Drawable();


/**
 * Objeto QuadTree.
 *
 * Os índices dos quadrantes são numerados conforme abaixo:
 *     |
 *  1  |  0
 * ----+----
 *  2  |  3
 *     |
 */
function QuadTree(boundBox, lvl) {
	var maxObjects = 10;
	this.bounds = boundBox || {
		x: 1,
		y: 1,
		width:100,
		height: 100
	};
	var objects = [];
	this.nodes = [];
	var level = lvl || 0;
	var maxLevels = 5;

	/*
	 * Limpa o quadTree e todos os nós de objetos
	 */
	this.clear = function() {
		objects = [];

		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].clear();
		}

		this.nodes = [];
	};

	/*
	 * Pegue todos os objetos no quadTree
	 */
	this.getAllObjects = function(returnedObjects) {
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].getAllObjects(returnedObjects);
		}

		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}

		return returnedObjects;
	};

	/*
	 * Retorne todos os objetos com os quais o objeto poderia colidir
	 */
	this.findObjects = function(returnedObjects, obj) {
		if (typeof obj === "undefined") {
			console.log("UNDEFINED OBJECT");
			return;
		}

		var index = this.getIndex(obj);
		if (index != -1 && this.nodes.length) {
			this.nodes[index].findObjects(returnedObjects, obj);
		}

		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}

		return returnedObjects;
	};

	/*
	 * Insira o objeto no quadTree. Se a árvore
	* excede a capacidade, ele irá dividir e adicionar todos
	* objetos aos seus nós correspondentes.
	 */
	this.insert = function(obj) {
		if (typeof obj === "undefined") {
			return;
		}

		if (obj instanceof Array) {
			for (var i = 0, len = obj.length; i < len; i++) {
				this.insert(obj[i]);
			}

			return;
		}

		if (this.nodes.length) {
			var index = this.getIndex(obj);
			// Apenas adicione o objeto a um subnó se ele couber completamente
			// dentro de um
			if (index != -1) {
				this.nodes[index].insert(obj);

				return;
			}
		}

		objects.push(obj);

		// Impedir divisão infinita
		if (objects.length > maxObjects && level < maxLevels) {
			if (this.nodes[0] == null) {
				this.split();
			}

			var i = 0;
			while (i < objects.length) {

				var index = this.getIndex(objects[i]);
				if (index != -1) {
					this.nodes[index].insert((objects.splice(i,1))[0]);
				}
				else {
					i++;
				}
			}
		}
	};

	/*
	 *Determine a qual nó o objeto pertence. -1 significa
	* objeto não pode caber completamente em um nó e faz parte
	* do nó atual
	 */
	this.getIndex = function(obj) {

		var index = -1;
		var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
		var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

		// O objeto pode caber completamente no quadrante superior
		var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
		// O objeto pode caber completamente no quandrant inferior
		var bottomQuadrant = (obj.y > horizontalMidpoint);

		//O objeto pode caber completamente nos quadrantes esquerdos
		if (obj.x < verticalMidpoint &&
				obj.x + obj.width < verticalMidpoint) {
			if (topQuadrant) {
				index = 1;
			}
			else if (bottomQuadrant) {
				index = 2;
			}
		}
		// O objeto pode ser corrigido completamente dentro dos dilemas certos
		else if (obj.x > verticalMidpoint) {
			if (topQuadrant) {
				index = 0;
			}
			else if (bottomQuadrant) {
				index = 3;
			}
		}

		return index;
	};

	/*
	 * Divide o nó em 4 subnós
	 */
	this.split = function() {
		// Bitwise ou [html5rocks]
		var subWidth = (this.bounds.width / 2) | 0;
		var subHeight = (this.bounds.height / 2) | 0;

		this.nodes[0] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[1] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[2] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[3] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
	};
}


/**
 Objeto Pool personalizado. Contém objetos Bullet a serem gerenciados para prevenir
 * coleta de lixo.
 * A piscina funciona da seguinte forma:
 * - Quando o pool é inicializado, ele popoulates um array com
 * Objetos de bala.
 * - Quando o pool precisa criar um novo objeto para uso, ele olha para
 * o último item na matriz e verifica se ele está
 * em uso ou não. Se estiver em uso, a piscina está cheia. Se for
 * não em uso, o pool "gera" o último item na matriz e
 * em seguida, o retira do final e o empurra de volta para a frente do
 * a matriz. Isso faz com que a piscina tenha objetos livres na parte de trás
 * e objetos usados ​​na frente.
 * - Quando a piscina anima seus objetos, ela verifica se o
 * objeto está em uso (não há necessidade de desenhar objetos não utilizados) e se estiver,
 * desenha. Se a função draw () retornar verdadeiro, o objeto é
 * pronto para ser limpo, para "limpar" o objeto e usar o
 * array function splice () para remover o item do array e
 * empurra para trás.
 * Fazer isso torna a criação / destruição de objetos no pool
 * constante.
 */
function Pool(maxSize) {
	var size = maxSize; // Máximo de balas permitido na piscina
	var pool = [];

	this.getPool = function() {
		var obj = [];
		for (var i = 0; i < size; i++) {
			if (pool[i].alive) {
				obj.push(pool[i]);
			}
		}
		return obj;
	}

	/*
	 * Preenche a matriz de pool com o objeto fornecido
	 */
	this.init = function(object) {
		if (object == "bullet") {
			for (var i = 0; i < size; i++) {
				// Inicializando o objeto
				var bullet = new Bullet("bullet");
				bullet.init(0,0, imageRepository.bullet.width,
										imageRepository.bullet.height);
				bullet.collidableWith = "enemy";
				bullet.type = "bullet";
				pool[i] = bullet;
			}
		}
		else if (object == "enemy") {
			for (var i = 0; i < size; i++) {
				var enemy = new Enemy();
				enemy.init(0,0, imageRepository.enemy.width,
									 imageRepository.enemy.height);
				pool[i] = enemy;
			}
		}
		else if (object == "enemyBullet") {
			for (var i = 0; i < size; i++) {
				var bullet = new Bullet("enemyBullet");
				bullet.init(0,0, imageRepository.enemyBullet.width,
										imageRepository.enemyBullet.height);
				bullet.collidableWith = "ship";
				bullet.type = "enemyBullet";
				pool[i] = bullet;
			}
		}
	};

	/*
	 * Pega o último item da lista, inicializa-o e
	* empurra-o para a frente do array.
	 */
	this.get = function(x, y, speed) {
		if(!pool[size - 1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());
		}
	};

	/*
	 
	* Usado para que o navio possa receber duas balas de uma vez. E se
	* apenas a função get () é usada duas vezes, o navio é capaz de
	* atire e tenha apenas 1 projétil de bala em vez de 2.
	 */
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		if(!pool[size - 1].alive && !pool[size - 2].alive) {
			this.get(x1, y1, speed1);
			this.get(x2, y2, speed2);
		}
	};

	/*
	 
	* Desenha quaisquer marcadores em uso. Se uma bala sai da tela,
	* limpa-o e empurra-o para a frente do array.
	 */
	this.animate = function() {
		for (var i = 0; i < size; i++) {
			// Só desenhe até encontrarmos uma bala que não está viva
			if (pool[i].alive) {
				if (pool[i].draw()) {
					pool[i].clear();
					pool.push((pool.splice(i,1))[0]);
				}
			}
			else
				break;
		}
	};
}


/**
 
* Crie o objeto Ship que o jogador controla. O navio é
 * desenhado na tela "navio" e usa retângulos sujos para se mover
 * ao redor da tela.
 */
function Ship() {
	this.speed = 3;
	this.bulletPool = new Pool(30);
	this.bulletPool.init("bullet");
	var fireRate = 15;
	var counter = 0;
	this.collidableWith = "enemyBullet";
	this.type = "ship";

	this.draw = function() {
		this.context.drawImage(imageRepository.spaceship, this.x, this.y);
	};
	this.move = function() {
		counter++;
		// Determine se a ação é uma ação de movimento
		if (KEY_STATUS.left || KEY_STATUS.right ||
				KEY_STATUS.down || KEY_STATUS.up) {
			// A nave se moveu, então apague a imagem atual para que ela possa
			// ser redesenhado em seu novo local
			this.context.clearRect(this.x, this.y, this.width, this.height);

			// Atualize x e y de acordo com a direção para mover e
			// redesenhar o navio. Altere as instruções else if's para if
			// para ter movimento diagonal.
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0) // Manter o jogador na tela
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				if (this.y <= this.canvasHeight/4*3)
					this.y = this.canvasHeight/4*3;
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}

			// Termine redesenhando o navio
			if (!this.isColliding) {
				this.draw();
			}
		}
		if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
			this.fire();
			counter = 0;
		}
	};

	/*
	 * Dispara duas balas
	 */
	this.fire = function() {
		this.bulletPool.getTwo(this.x+6, this.y, 3,
		                       this.x+33, this.y, 3);
	};
}
Ship.prototype = new Drawable();


/**
 * Crie o objeto nave Inimigo.
 */
function Enemy() {
	var percentFire = .01;
	var chance = 0;
	this.alive = false;
	this.collidableWith = "bullet";
	this.type = "enemy";

	/*
	 * Define os valores do inimigo
	 */
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.speedX = 0;
		this.speedY = speed;
		this.alive = true;
		this.leftEdge = this.x - 90;
		this.rightEdge = this.x + 220;
		this.bottomEdge = this.y + 150;
	};

	/*
	 *Mova o inimigo
	 */
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
		this.x += this.speedX;
		this.y += this.speedY;
		if (this.x <= this.leftEdge) {
			this.speedX = this.speed;
		}
		else if (this.x >= this.rightEdge + this.width) {
			this.speedX = -this.speed;
		}
		else if (this.y >= this.bottomEdge) {
			this.speed = 2.0;
			this.speedY = 0;
			this.y -= 5;
			this.speedX = -this.speed;
		}

		if (!this.isColliding) {
			this.context.drawImage(imageRepository.enemy, this.x, this.y);

			// O inimigo tem a chance de atirar em todos os movimentos
			chance = Math.floor(Math.random()*101);
			if (chance/100 < percentFire) {
				this.fire();
			}

			return false;
		}
		else {
			return true;
		}
	};

	/*
	 * Dispara uma bala
	 */
	this.fire = function() {
		game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
	};

	/*
	 * Redefine os valores do inimigo
	 */
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
		this.isColliding = false;
	};
}
Enemy.prototype = new Drawable();


 /**
 * Cria o objeto Game que conterá todos os objetos e dados para
 * o jogo.
 */
function Game() {
	/*
	 * Obtém informações e contexto da tela e configura todo o jogo
	* objetos.
	* Retorna verdadeiro se a tela é suportada e falso se
	* não é. Isso impede que o script de animação fique constantemente
	* rodando em navegadores que não suportam o canvas.
	 */
	this.init = function() {
		//Obtenha os elementos da tela
		this.bgCanvas = document.getElementById('background');
		this.shipCanvas = document.getElementById('ship');
		this.mainCanvas = document.getElementById('main');

		// Teste para ver se a tela é compatível. Só precisa de
		// verifique uma tela
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			this.shipContext = this.shipCanvas.getContext('2d');
			this.mainContext = this.mainCanvas.getContext('2d');

			// Inicialize objetos para conter seu contexto e tela
			// em formação
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			Ship.prototype.context = this.shipContext;
			Ship.prototype.canvasWidth = this.shipCanvas.width;
			Ship.prototype.canvasHeight = this.shipCanvas.height;

			Bullet.prototype.context = this.mainContext;
			Bullet.prototype.canvasWidth = this.mainCanvas.width;
			Bullet.prototype.canvasHeight = this.mainCanvas.height;

			Enemy.prototype.context = this.mainContext;
			Enemy.prototype.canvasWidth = this.mainCanvas.width;
			Enemy.prototype.canvasHeight = this.mainCanvas.height;

			// Inicialize o objeto de fundo
			this.background = new Background();
			this.background.init(0,0); // Set draw point to 0,0

			// Inicialize o objeto do navio
			this.ship = new Ship();
			// Configure o navio para começar próximo ao meio da parte inferior da tela
			var shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
			var shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
			this.ship.init(shipStartX, shipStartY,
										 imageRepository.spaceship.width,
			               imageRepository.spaceship.height);

			// Inicialize o objeto pool inimigo
			this.enemyPool = new Pool(30);
			this.enemyPool.init("enemy");
			var height = imageRepository.enemy.height;
			var width = imageRepository.enemy.width;
			var x = 100;
			var y = -height;
			var spacer = y * 1.5;
			for (var i = 1; i <= 18; i++) {
				this.enemyPool.get(x,y,2);
				x += width + 25;
				if (i % 6 == 0) {
					x = 100;
					y += spacer
				}
			}

			this.enemyBulletPool = new Pool(50);
			this.enemyBulletPool.init("enemyBullet");

			// Iniciar QuadTree
			this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});

			return true;
		} else {
			return false;
		}
	};

	// Comece o loop de animação
	this.start = function() {
		this.ship.draw();
		animate();
	};
}


/**
 * O loop da animação. Chama o shim requestAnimationFrame para
 * Otimize o loop do jogo e desenhe todos os objetos do jogo. Isto
 * função deve ser uma função gobal e não pode estar dentro de um
 * objeto.
 */
function animate() {
	// Inserir objetos em quadtree
	game.quadTree.clear();
	game.quadTree.insert(game.ship);
	game.quadTree.insert(game.ship.bulletPool.getPool());
	game.quadTree.insert(game.enemyPool.getPool());
	game.quadTree.insert(game.enemyBulletPool.getPool());

	detectCollision();

	// Animar objetos de jogo
	requestAnimFrame( animate );
	game.background.draw();
	game.ship.move();
	game.ship.bulletPool.animate();
	game.enemyPool.animate();
	game.enemyBulletPool.animate();
}

function detectCollision() {
	var objects = [];
	game.quadTree.getAllObjects(objects);

	for (var x = 0, len = objects.length; x < len; x++) {
		game.quadTree.findObjects(obj = [], objects[x]);

		for (y = 0, length = obj.length; y < length; y++) {

			// DETECTAR ALGORITMO DE COLISÃO
			if (objects[x].collidableWith === obj[y].type &&
				(objects[x].x < obj[y].x + obj[y].width &&
			     objects[x].x + objects[x].width > obj[y].x &&
				 objects[x].y < obj[y].y + obj[y].height &&
				 objects[x].y + objects[x].height > obj[y].y)) {
				objects[x].isColliding = true;
				obj[y].isColliding = true;
			}
		}
	}
};



// Os códigos de tecla que serão mapeados quando um usuário pressionar um botão.
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
}


// Cria a matriz para conter o KEY_CODES e define todos os seus valores
// para verdadeiro. Verificar true / flase é a maneira mais rápida de verificar o status
// de uma tecla pressionada e qual foi pressionada ao determinar
// quando mover e em que direção.
KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 
* Configura o documento para ouvir eventos onkeydown (disparado quando
 * qualquer tecla do teclado é pressionada). Quando uma tecla é pressionada,
 * define a direção apropriada como verdadeira para nos informar qual
 * chave era.
 */
document.onkeydown = function(e) {
// Firefox e opera usam charCode em vez de keyCode para
// retorna qual tecla foi pressionada.
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
		e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}
/**
 *Configura o documento para ouvir os próprios eventos de teclado (disparado quando
 * qualquer tecla do teclado é liberada). Quando uma tecla é liberada,
 * define a direção apropriada como falsa para nos informar qual
 * chave era.
 */
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}


/**
 
* requestAnim shim layer de Paul Irish
 * Encontra a primeira API que funciona para otimizar o loop de animação,
 * caso contrário, o padrão é setTimeout ().
 */
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();

