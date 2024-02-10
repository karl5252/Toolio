var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;
const scale = 20;
let paused = false;

let introShown = false;

var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

var hoopaSprites = document.createElement("img");
hoopaSprites.src = "img/hoopa.png";
var monsterXOverlap = 4;

var keggaSprites = document.createElement("img");
keggaSprites.src = "img/kegga.png";



var arrowKeys = trackKeys([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
]);



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
class Actor {
  constructor(pos, speed, isDead = false, deadTime = 0) {
    this.pos = pos;
    this.speed = speed;
    this.isDead = isDead;
    this.interactable = true;
    this.deadTime = deadTime || 0;
  }
}

class Player extends Actor {
  constructor(pos, speed, isDead = false) {
    super(pos, speed, isDead);
    this.score = 0;
    this.coinsCollected = 0;
  
  }

  get type() {
    return "player";
  }

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
  }
}

Player.prototype.size = new Vec(0.8, 1.5);

Player.prototype.update = function(time, state, keys) {
  let xSpeed = 0;
  if (keys.ArrowLeft) xSpeed -= playerXSpeed;
  if (keys.ArrowRight) xSpeed += playerXSpeed;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall") && !state.level.touches(movedX, this.size, "stone")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall") && !state.level.touches(movedY, this.size, "stone")) {
    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }

  if (this.isDead) {
    return new Player(pos, new Vec(xSpeed, ySpeed), this.isDead);
  }

  if (state.level.touches(this.pos, this.size, "lava") || state.level.touches(this.pos, this.size, "Hoopa") || state.level.touches(this.pos, this.size, "KeggaTroopa")) {
    this.isDead = true;
  }

  return new Player(pos, new Vec(xSpeed, ySpeed), this.isDead);
};

class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
    this.interactable = true;
  }

  get type() {
    return "lava";
  }

  static create(pos, ch) {
    if (ch == "=") {
      return new Lava(pos, new Vec(2, 0));
    } else if (ch == "|") {
      return new Lava(pos, new Vec(0, 2));
    } else if (ch == "v") {
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1, 1);

class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
    this.interactable = true;
  }

  get type() {
    return "coin";
  }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
  }
}

Lava.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall") && !state.level.touches(newPos, this.size, "stone")) {
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    return new Lava(this.pos, this.speed.times(-1));
  }
};

Coin.prototype.size = new Vec(0.8, 0.9);
var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};



//add class Hoopa and its methods
class Hoopa extends Actor{
  constructor(pos, speed, isDead = false, deadTime = 0) {
   super(pos, speed, isDead, deadTime);
  }

  get type() {
    return "hoopa";
  }

  static create(pos) {
    return new Hoopa(pos.plus(new Vec(0, -0.5)), new Vec(2, 0));
  }
}

Hoopa.prototype.size = new Vec(0.8, 1.5);

Hoopa.prototype.update = function(time, state) {
  if (this.isDead) {
    this.deadTime += time;
    if (this.deadTime > 1.5) { // 1.5 seconds death animation
      this.remove = true; // Mark the monster for removal
    } 
    return this; // Make the monster non-interactable
  }

  let xSpeed = this.speed.x;
  let ySpeed = this.speed.y + time * gravity;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));

  if (!state.level.touches(movedX, this.size, "wall") && !state.level.touches(movedX, this.size, "stone")) {
    pos = movedX;
  } else {
    xSpeed = -xSpeed; // Reverse direction when hitting a wall
  }

  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall") && !state.level.touches(movedY, this.size, "stone")) {
    pos = movedY;
  } else if (ySpeed > 0) {
    ySpeed = 0;
  }
  let slidingKegga = state.actors.find(actor => actor instanceof KeggaTroopa && actor.isSliding);
if (slidingKegga && overlap(this, slidingKegga)) {
  this.isDead = true; // Kill the Hoopa if it collides with a sliding KeggaTroopa
}

  return new Hoopa(pos, new Vec(xSpeed, ySpeed), this.isDead, this.deadTime);
};

//add new class for second hoopa and its methods
class KeggaTroopa extends Actor{
  constructor(pos, speed, isDead = false, deadTime = 0, sliding = false, speedIncreased = false) {
    super(pos, speed, isDead, deadTime);
    this.isSliding = sliding || false;
    this.speedIncreased = speedIncreased || false;
  }

  get type() {
    return "keggaTroopa";
  }

  static create(pos) {
    return new KeggaTroopa(pos.plus(new Vec(0, -0.5)), new Vec(2, 0));
  }
}

KeggaTroopa.prototype.size = new Vec(0.8, 1.5);

KeggaTroopa.prototype.update = function(time, state) {
  if (this.isDead) {
    this.deadTime += time;
    if (this.deadTime > 1.5) { // 1.5 seconds death animation
      this.remove = true; // Mark the monster for removal
    } 
    return this; // Make the monster non-interactable
  }
  if (this.isSliding && !this.speedIncreased) {
    this.isDead = false;
    this.interactable = true;
    this.speed.x = this.speed.x * 2;
    this.speedIncreased = true;
  }

  let xSpeed = this.speed.x;
  let ySpeed = this.speed.y + time * gravity;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall") && !state.level.touches(movedX, this.size, "stone")) {
    pos = movedX;
  } else {
    xSpeed = -xSpeed; // Reverse direction when hitting a wall
  }
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall") && !state.level.touches(movedY, this.size, "stone")) {
    pos = movedY;
  } else if (ySpeed > 0) {
    ySpeed = 0;
  }
  let slidingKegga = state.actors.find(actor => actor instanceof KeggaTroopa && actor !==this && actor.isSliding);
  if (slidingKegga && overlap(this, slidingKegga)) {
    this.isDead = true; // Kill the KeggaTroopa if it collides with a sliding KeggaTroopa
  }

  return new KeggaTroopa(pos, new Vec(xSpeed, ySpeed), this.isDead, this.deadTime, this.isSliding, this.speedIncreased);
};

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
  "m": Hoopa,
  "n": KeggaTroopa,
};

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
Level.prototype.touches = function(pos, size, type) {
  let xStart = Math.floor(pos.x);
  let xEnd = Math.ceil(pos.x + size.x);
  let yStart = Math.floor(pos.y);
  let yEnd = Math.ceil(pos.y + size.y);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width ||
                      y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (type === "wall" && (here === "wall" || here === "stone")) return true;
      if (here == type) return true;
    }
  }
  return false;
};

function overlap(actor1, actor2) {
    // If either actor is dead, they don't overlap.
    if (!actor1.interactable || !actor2.interactable) {
      return false;
    }
    if ((actor1 instanceof KeggaTroopa && actor1.isSliding && actor2 instanceof Hoopa) || 
    (actor2 instanceof KeggaTroopa && actor2.isSliding && actor1 instanceof Hoopa)) {
  console.debug("kegga is sliding and overlaps with hoppa");
} 
 

  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state) {
  let player = state.player;
  player.isDead = true;
  return new State(state.level, state.actors, "lost", this.coinsCollected);
};

Coin.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  if (!filtered.some(a => a.type == "coin")) status = "won";

  // Increment coinsCollected property of the State class
  console.debug("updating the coin counter on collision with coin");
  let coinsCollected = state.coinsCollected + 1;

  return new State(state.level, filtered, status, coinsCollected);
};


Hoopa.prototype.collide = function(state) {
  let player = state.player;
  if (!this.isDead && this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5){//(player.pos.y + player.size.y < this.pos.y + 0.5 && player.speed.y > 0 && player.pos.x + player.size.x > this.pos.x && player.pos.x < this.pos.x + this.size.x) {
      this.isDead = true;
      this.interactable = false;
      this.speed.x = 0;
    } else {
      console.log("Player is dead");
      player.isDead = true;
      state.actors = state.actors.filter(a => a != this);
      state.status = "lost";
    }
  }
  let slidingKegga = state.actors.find(actor => {
    if (actor instanceof KeggaTroopa && actor.isSliding) {
      console.log('Sliding KeggaTroopa:', actor);
      return overlap(this, actor);
    }
  });
  if (slidingKegga) {
    console.debug("Hoopa collided with sliding KeggaTroopa");
    this.speed.y = -jumpSpeed / 1.5;
    //flip sprite on y
    this.isDead = true; // Kill the Hoopa if it collides with a sliding KeggaTroopa
  }

  return new State(state.level, state.actors, state.status, state.coinsCollected);
};

KeggaTroopa.prototype.collide = function(state) {
  let player = state.player;
  if (this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5){//(player.pos.y + player.size.y < this.pos.y + 0.1 && player.speed.y > 0 && player.pos.x + player.size.x > this.pos.x && player.pos.x < this.pos.x + this.size.x) {
      this.isSliding = true;
      console.log("is kegga sliding?: " + this.isSliding);
      // make player jump a little
      player.speed.y = -jumpSpeed / 1.5;
      return new State(state.level, state.actors, state.status, state.coinsCollected);

    } else {
      console.log("Player is dead");
      player.isDead = true;
      return new State(state.level, state.actors.filter(a => a != this), "lost", state.coinsCollected);
    }
  }

  return new State(state.level, state.actors, state.status, state.coinsCollected);
};

class State {
  constructor(level, actors, status, coinsCollected = 0) {
    this.level = level;
    this.actors = actors;
    this.status = status;

    this.coinsCollected = coinsCollected;
  }

  static start(level) {
    return new State(level, level.startActors, "playing", this.coinsCollected);
  }

  get player() {
    return this.actors.find((a) => a.type == "player");
  }

  update(time, keys) {
    let actors = this.actors.map((actor) => actor.update(time, this, keys));
    actors = actors.filter(actor => !actor.remove);
    let newState = new State(this.level, actors, this.status, this.coinsCollected);

    if (newState.status != "playing") return newState;

    let player = newState.player;
    if (this.level.touches(player.pos, player.size, "lava")) {
      return new State(this.level, actors, "lost", this.coinsCollected);
    }

    for (let actor of actors) {
      if (actor != player && overlap(actor, player)) {
        newState = actor.collide(newState);
      }
    }
    let keggasAndHoopas = actors.filter(actor => actor instanceof KeggaTroopa || actor instanceof Hoopa);

for (let i = 0; i < keggasAndHoopas.length; i++) {
  for (let j = i + 1; j < keggasAndHoopas.length; j++) {
    if (overlap(keggasAndHoopas[i], keggasAndHoopas[j])) {
    }
  }
}
    return newState;
  }
}


function elt(name, attrs, ...children) {
  let dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}

var CanvasDisplay = class CanvasDisplay {
  constructor(parent, level) {
    let existingCanvas = document.querySelector("canvas");
    console.debug("existingCanvas: ", existingCanvas);
    if (existingCanvas){
      this.canvas = existingCanvas;
      //this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    }else{
      console.debug("creating new canvas");
      this.canvas = document.createElement("canvas");
      this.canvas.width = Math.min(800, level.width * scale);
      this.canvas.height = Math.min(600, level.height * scale);
      parent.appendChild(this.canvas);
    }
    this.cx = this.canvas.getContext("2d");

    this.flipPlayer = false;

    this.viewport = {
      left: 0,
      top: 0,
      width: this.canvas.width / scale,
      height: this.canvas.height / scale,
    };
  }

  clear() {
    if (this.canvas) {
      this.cx = this.canvas.getContext('2d');
      this.cx.fillStyle = 'black';
      this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      console.error('Cannot clear canvas because it does not exist');
    }
  }

  drawStatus(state) {
    this.cx.font = 'bold 20px "Courier New"';
    this.cx.fillStyle = 'white';
  
    let levelText = `Level: ${state.level.name}`.toLocaleUpperCase();
    let scoreText = `Score: ${state.score}`.toLocaleUpperCase();
    let coinsCollectedText = `Coins: ${state.coinsCollected}`.toLocaleUpperCase();

    let levelTextWidth = this.cx.measureText(levelText).width;
    let scoreTextWidth = this.cx.measureText(scoreText).width;
    let coinsCollectedTextWidth = this.cx.measureText(coinsCollectedText).width;
  
    let levelTextPosition = (this.cx.canvas.width / 3 - levelTextWidth) / 2;
    let scoreTextPosition = this.cx.canvas.width / 3 + (this.cx.canvas.width / 3 - scoreTextWidth) / 2;
    let coinsCollectedTextPosition = this.cx.canvas.width / 3 * 2 + (this.cx.canvas.width / 3 - coinsCollectedTextWidth) / 2;
  
    this.cx.fillText(levelText, levelTextPosition, 30);
    this.cx.fillText(scoreText, scoreTextPosition, 30);
    this.cx.fillText(coinsCollectedText, coinsCollectedTextPosition, 30);
  }

  drawIntro() {
    console.log('Drawing intro screen');

    let cx = this.canvas.getContext('2d');

    cx.font = 'bold 20px "Courier New"';
    cx.fillStyle = 'black';
    //fill canvas with solid black
    cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    cx.fillStyle = 'white';
    cx.fillText('Welcome to the game!', 100, 50);
    cx.fillText("Press any key to start", 100, 100);
    cx.fillText("Use arrow keys to move", 100, 150);
    cx.fillText("Press 'P' to pause", 100, 200);
    // add here other instructions to play the game
  }

  drawOutro() {
    this.cx.font = 'bold 20px "Courier New"';
    this.cx.fillStyle = 'white';
    this.cx.fillText("Game Over", 100, 100);
    this.cx.fillText("Press any key to restart", 100, 150);
  }

  syncState(state) {
    console.log('Syncing game state:', state.status); 
    this.updateViewport(state);
    this.clearDisplay(state.status);
    this.drawBackground(state.level);
    this.drawActors(state.actors);
    this.drawStatus(state);

  }

  updateViewport(state) {
    let view = this.viewport,
      margin = view.width / 3;
    let player = state.player;
    let center = player.pos.plus(player.size.times(0.5));

    if (center.x < view.left + margin) {
      view.left = Math.max(center.x - margin, 0);
    } else if (center.x > view.left + view.width - margin) {
      view.left = Math.min(
        center.x + margin - view.width,
        state.level.width - view.width
      );
    }
    if (center.y < view.top + margin) {
      view.top = Math.max(center.y - margin, 0);
    } else if (center.y > view.top + view.height - margin) {
      view.top = Math.min(
        center.y + margin - view.height,
        state.level.height - view.height
      );
    }
  }

  clearDisplay(status) {
    if (status == "won") {
      this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (status == "lost") {
      this.cx.fillStyle = "rgb(44, 136, 214)";
    } else {
      this.cx.fillStyle = "rgb(52, 166, 251)";
    }
    this.cx.fillRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  drawBackground(level) {
    let { left, top, width, height } = this.viewport;
    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        let tile = level.rows[y][x];
        if (tile == "empty") continue;
        let screenX = (x - left) * scale;
        let screenY = (y - top) * scale;
        //let tileX = tile == "lava" ? scale : 0;
        let tileX;
        if (tile == "lava") {
          tileX = scale;
        } else if (tile == "stone") {
          tileX = 3.5 * scale; // Change this to the x-coordinate of the new texture in your spritesheet
        } else {
          tileX = 0;
        }
        this.cx.drawImage(
          otherSprites,
          tileX,
          0,
          scale,
          scale,
          screenX,
          screenY,
          scale,
          scale
        );
      }
    }
  }
/**
 * Draws the player on the canvas.
 *
 * @param {Player} player The player object, which includes properties for speed.
 * @param {int} x The x-coordinate where the player should be drawn.
 * @param {int} y The y-coordinate where the player should be drawn.
 * @param {float} width The width of the player's sprite.
 * @param {float} height The height of the player's sprite.
 */
drawPlayer(player, x, y, width, height) {
  // Adjust the width and x-coordinate based on the player's overlap.
  width += playerXOverlap * 2;
  x -= playerXOverlap;

  // Determine whether to flip the player's sprite based on the player's x speed.
  if (player.speed.x != 0) {
    this.flipPlayer = player.speed.x < 0;
  }

  // Choose a tile from the player's sprite sheet based on the player's speed.
  let tile = 8;
  if (player.speed.y != 0) {
    tile = 9;
  } else if (player.speed.x != 0) {
    tile = Math.floor(Date.now() / 60) % 8;
  } else if (player.isDead) {
    tile = 10;
  }

  // Save the current drawing state.
  this.cx.save();

  // If the player's sprite should be flipped, flip it horizontally.
  if (this.flipPlayer) {
    this.flipHorizontally(x + width / 2);
  }

  // Calculate the x-coordinate of the left edge of the tile on the sprite sheet.
  let tileX = tile * width;

  // Draw the chosen tile at the calculated position.
  this.cx.drawImage(
    playerSprites,
    tileX,
    0,
    width,
    height,
    x,
    y,
    width,
    height
  );

  // Restore the saved drawing state.
  this.cx.restore();
}

/**
 * Draws the Hoopa on the canvas.
 *
 * @param {Hoopa} hoopa The Hoopa object, which includes properties for speed.
 * @param {int} x The x-coordinate where the Hoopa should be drawn.
 * @param {int} y The y-coordinate where the Hoopa should be drawn.
 * @param {float} width The width of the Hoopa's sprite.
 * @param {float} height The height of the Hoopa's sprite.
 */
drawHoopa(hoopa, x, y, width, height) {
  // Adjust the width and x-coordinate based on the monster's overlap.
  width += monsterXOverlap * 2;
  x -= monsterXOverlap;

  // Determine whether to flip the monster's sprite based on the monster's x speed.
  if (hoopa.speed.x != 0) {
    this.flipMonster = hoopa.speed.x < 0;
  }

  // Choose a tile from the monster's sprite sheet based on the monster's speed.
  let tile = 8;
  if (hoopa.isDead && hoopa.deadTime < 1.5) {
    console.debug("Drawing dead hoopa");
    tile = 10;
  } else if (hoopa.speed.y != 0) {
    tile = 8;
  } else if (hoopa.speed.x != 0) {
    tile = Math.floor(Date.now() / 60) % 8;
  } else {
    tile = 8;
  }

  // Save the current drawing state.
  this.cx.save();

  // If the hoopa's sprite should be flipped, flip it horizontally.
  if (this.flipMonster) {
    this.flipHorizontally(x + width / 2);
  }

  // Calculate the x-coordinate of the left edge of the tile on the sprite sheet.
  let tileX = tile * width;

  // Draw the chosen tile at the calculated position.
  this.cx.drawImage(
    hoopaSprites,
    tileX,
    0,
    width,
    height,
    x,
    y,
    width,
    height
  );

  // Restore the saved drawing state.
  this.cx.restore();
}

drawKegga(keggaTroopa, x, y, width, height) {
  // Adjust the width and x-coordinate based on the monster's overlap.
  width += monsterXOverlap * 2;
  x -= monsterXOverlap;

  // Determine whether to flip the monster's sprite based on the monster's x speed.
  if (keggaTroopa.speed.x != 0) {
    this.flipMonster = keggaTroopa.speed.x < 0;
  }

  // Choose a tile from the monster's sprite sheet based on the monster's speed.
  let tile = 8;
  if (keggaTroopa.isSliding && !keggaTroopa.isDead) {
    console.debug("Drawing sliding kegga monster");
    tile = 10;
  } else if (keggaTroopa.speed.y != 0) {
    tile = 8;
  } else if (keggaTroopa.speed.x != 0) {
    tile = Math.floor(Date.now() / 60) % 8;
  } else {
    tile = 8;
  }

  // Save the current drawing state.
  this.cx.save();

  // If the monster's sprite should be flipped, flip it horizontally.
  if (this.flipMonster) {
    this.flipHorizontally(x + width / 2);
  }

  // Calculate the x-coordinate of the left edge of the tile on the sprite sheet.
  let tileX = tile * width;

  // Draw the chosen tile at the calculated position.
  this.cx.drawImage(
    keggaSprites,
    tileX,
    0,
    width,
    height,
    x,
    y,
    width,
    height
  );

  // Restore the saved drawing state.
  this.cx.restore();
}

  drawActors(actors) {
    for (let actor of actors) {
      let width = actor.size.x * scale;
      let height = actor.size.y * scale;
      let x = (actor.pos.x - this.viewport.left) * scale;
      let y = (actor.pos.y - this.viewport.top) * scale;
      if (actor.type == "player") {
        this.drawPlayer(actor, x, y, width, height);
      }
      else if (actor.type == "hoopa") {
        this.drawHoopa(actor, x, y, width, height);
      }
      else if (actor.type == "keggaTroopa") {
        this.drawKegga(actor, x, y, width, height);
      }
      else {
        let tileX = (actor.type == "coin" ? 2 : 1) * scale;
        let spriteWidth = actor.type == "coin" ? width * 0.72 : width; 

        //console.debug(`Drawing ${actor.type} at (${x}, ${y}) with size (${width}, ${height}) from spritesheet position (${tileX}, 0)`);
        this.cx.drawImage(
          otherSprites,
          tileX,
          0,
          spriteWidth,
          height,
          x,
          y,
          spriteWidth,
          height
        );
      }
    }
  }

  flipHorizontally(around) {
    this.cx.translate(around, 0);
    this.cx.scale(-1, 1);
    this.cx.translate(-around, 0);
  }
};


function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;
  return new Promise((resolve) => {
    runAnimation((time) => {
      if (introShown & !state.player.isDead) {
        state.status = 'playing';
      } else {
        state.status = 'intro';
      }
      state = state.update(time, arrowKeys);
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= time;
        return true;
      } else if(state.status === "intro"){
        display.drawIntro();

        // Add keydown listener for the ENTER key to start the game
        window.addEventListener('keydown', function(event) {
          console.log('Key pressed:', event.key); // Log the key that was pressed
          if (event.key === 'Enter') {
            console.log('ENTER key pressed'); // Log when the ENTER key is pressed
            //state = State.start(level);
            introShown = true;
            //state.status = "playing";
            console.log('Game state after pressing ENTER:', state.status); // Log the game state after pressing ENTER

            //state.score = 0;
            //state.coinsCollected = 0;
            resolve(state.status);
          }
        }, {once: true}); // The listener is removed after being invoked once

        return false;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}

async function runGame(plans, Display) {
  for (let level = 0; level < plans.length; ) {
    let status = await runLevel(
      new Level(plans[level]),
      Display
    );
    if (status == "won") level++;
  }

  console.log("You've won!");
}

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
  window.addEventListener('keydown', function(event) {
    if (event.key === 'p' || event.key === 'P') { // Replace 'p' with your pause key
      paused = !paused;
      console.debug("paused: ", paused);
    }
  });
  return down;
}




//runGame([simpleLevelPlan], CanvasDisplay);
