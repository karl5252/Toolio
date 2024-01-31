var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;
const scale = 20;

let score = 0;


var arrowKeys = trackKeys([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
]);

var levelChars = {
  ".": "empty",
  "%": "stone",
  "#": "wall",
  "+": "lava",
  "@": Player,
  "o": Coin,
  "=": Lava,
  "|": Lava,
  "v": Lava,
  "m": Hoompa,
  "b": BrickWall,
  "s": StoneWall,
  "P": ()=> new BrickWallWithPowerUp(YeastPacket),
  "F": ()=> new BrickWallWithPowerUp(FireBarley),
};


var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

var hoompaSprites = document.createElement("img");
hoompaSprites.src = "img/monster.png";
var hoompaXOverlap = 4;


class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }

  times(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }
}
/**
 * represents an abstract game actor
 * @class Actor
 * @param {Vec} pos 
 * @param {Vec} speed
 * @param {boolean} isDead
 */
class Actor {
  constructor(pos, speed, isDead = false) {
    this.pos = pos;
    this.speed = speed;
    this.isDead = isDead;
  }
}

/**
 * represents a player
 * @class Player
 * @param {Vec} pos
 * @param {Vec} speed
 * @param {boolean} isDead
 * @param {number} size 
 */
class Player extends Actor {
  constructor(pos, speed, isDead = false, size = 1) {
    super(pos, speed, isDead);
    this.size = size;
    this.frame = 8; //idle frame
  }

  get type() {
    return "player";
  }
  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
  }


}
/**
 *  draws a new player
 * @param {} context 
 * @param {} x 
 * @param {} y 
 * @param {} width 
 * @param {} height 
 */
Player.prototype.draw = function(context, x, y, width, height) {
  context.save(); // Save the current context state

  // If the player is moving left, flip the context
  if (this.speed.x < 0) {
    context.scale(-1, 1);
    context.translate(-width, 0);
  }

  // Draw the player sprite
  let spriteX = this.frame * this.spriteWidth;
  let spriteY = 0; // Assuming all sprites are on the same row
  context.drawImage(playerSprites, spriteX, spriteY, this.spriteWidth, this.spriteHeight, x, y, width, height);

  context.restore(); // Restore the context state to what it was before we flipped it
};

Player.prototype.update = function(time, state, keys) {
  if (this.isDead) {
    state.freeze(500)
    this.frame = 10;
  } else if (keys.ArrowUp) {
    this.frame = 9;
  } else if (keys.ArrowLeft || keys.ArrowRight) {
    this.frame = (this.frame + 1) % 8;

  }

};
Player.prototype.collide = function(state) { 
};
/**
 * represents a monster
 * @class Monster
 * @param {Vec} pos
 * @param {Vec} speed
 * @param {boolean} isDead
 */
class Monster extends Actor {
  constructor(pos, speed, isDead = false) {
    super(pos, speed, isDead);
  }
}
/**
 * draws a new monster
 * @param {*} pos
 * @param {*} speed
 * @param {*} isDead
 * 
 */
class Hoompa extends Monster {
  constructor(pos, speed, isDead = false) {
    super(pos, speed, isDead);
  }

  get type() { 
    return "hoompa";
  }
  static create(pos) {
    return new Hoompa(pos.plus(new Vec(0, -0.5)), new Vec(2, 0));
  }
}

Hoompa.prototype.size = new Vec(0.8, 1.5);

Hoompa.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));

  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Hoompa(newPos, this.speed);
  } else {
    return new Hoompa(this.pos, this.speed.times(-1));
  }
};

Hoompa.prototype.draw = function(context, x, y, width, height) {
  context.drawImage(hoompaSprites, this.spriteX, this.spriteY, this.spriteWidth, this.spriteHeight, x, y, width, height);
};

class Wall {
  constructor() {
    this.isDestroyed = false;
  }
  update = function(time, state, keys) {
    let xSpeed = 0;
    if (keys.ArrowLeft) xSpeed -= playerXSpeed;
    if (keys.ArrowRight) xSpeed += playerXSpeed;
    let pos = this.pos;
    let movedX = pos.plus(new Vec(xSpeed * time, 0));
    if (!state.level.touches(movedX, this.size, "wall")) {
      pos = movedX;
    }
  
    let ySpeed = this.speed.y + time * gravity;
    let movedY = pos.plus(new Vec(0, ySpeed * time));
    if (!state.level.touches(movedY, this.size, "wall")) {
      pos = movedY;
    } else if (keys.ArrowUp && ySpeed > 0) {
      ySpeed = -jumpSpeed;
    } else {
      ySpeed = 0;
    }
  }
}

Wall.prototype.size = new Vec(1, 1);
//if player touches the wall from sides or top - do nothing


/**
 * represents a brick wall that is destructible
 */
class BrickWall extends Wall {
  constructor() {
    super();
    
  }
}
BrickWall.prototype.size = new Vec(1, 1);

class BrickWallWithPowerUp extends Wall {
  constructor() {
    super();
    this.powerUp = null;
  }
}
BrickWallWithPowerUp.prototype.size = new Vec(1, 1);

BrickWallWithPowerUp.prototype.update = function(time, state, keys) {
  
    // Get the player from the state.actors array
    let player = state.actors.find(actor => actor.type === 'player');
  
    // Check if the player is below the wall and moving upwards
    if (player.pos.y > this.pos.y && player.speed.y < 0) {
      // Move the wall up by 4 pixels
      this.pos.y -= 4;
  
      // Replace the BrickWallWithPowerUp instance with a StoneWall instance
      let index = state.actors.indexOf(this);
      state.actors[index] = new StoneWall(this.pos, this.size);
  
      // Instantiate a new PowerUp object above the wall
      let powerUp = new PowerUp(new Vec(this.pos.x, this.pos.y - 1));
  
      // Add the PowerUp object to the state.actors array
      state.actors.push(powerUp);
  }
}




/**
 * represents a stone wall that is indestructible
 */
class StoneWall extends Wall {
  constructor() {
    super();
    this.unbreakable = true;
  }
}

/**
 * represents a coin that is a collectible item
 */
class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }
}

/**
 * represents a yeast packet that is a power-up
 */
class YeastPacket {
  constructor(pos, basePos) {
    this.pos = pos;
    this.basePos = basePos;
  }
}
class FireBarley {
  constructor(pos, basePos) {
    this.pos = pos;
    this.basePos = basePos;
  }
}

class Powerup {
  constructor(type) {
    this.type = type;
  }

  getCapability() {
    // Determine and return the capability based on the powerup type
    switch (this.type) {
      case 'coin':
        return 'coin'; //return coin instance 
      case 'yeast':
        return 'sizeUp'; // Example: collecting a yeast increases player's size
      // Add more cases for other powerup types as needed
      default:
        return null;
    }
  }
}

/**
 * represents a lava that is a deadly obstacle
 */
class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }
}


/**
 * represents a level drawn from a string provided by levels.js
 * @class Level
 * @param {string} plan
 */
class Level {
  constructor(plan) {
    let rows = plan.trim().split("\n").map((l) => [...l]);
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];

    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
} 
/**
 * represents a game state
 */
class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
    this.freezeTime = null;
  }

  update(time, keys) {
    if (Date.now() < this.freezeTime) {
      return;
    }
  }

  freeze(duration) {
    this.freezeTime = Date.now() + duration;
  }
}
/**
 * represents a game canvas
 */
class CanvasDisplay {
  constructor(parent, level) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(800, level.width * scale);
    this.canvas.height = Math.min(600, level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");
  }
}

function updateScore(newScore) {
  score = newScore;
}
/**
 * 
 * @param {*} context 
 */
function renderScore(context) {
  context.font = '20px Arial';
  context.fillStyle = 'black';
  context.fillText(`Score: ${score}`, 10, 30);
}
/**
 * 
 * @param {*} time 
 */
function gameLoop(time) {
  handleInput();
  if (keys.isDown('ESCAPE')) {
    state.freeze(Infinity);
  }
  updateGameState(time);
  drawFrame();
  renderScore(context);
  requestAnimationFrame(gameLoop);
}
 /**
  * 
  * @param {*} keys 
  * @returns key 
  */
function trackKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
  return down;
}
