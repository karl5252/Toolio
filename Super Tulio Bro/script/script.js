const gameSettings = {
  playerXSpeed: 7,
  gravity: 30,
  jumpSpeed: 15,
  scale: 20,
  actorXOverlap: 4,
  canvasWidth: 800,
  canvasHeight: 600,
};
let paused = false;
let introShown = false;
let totalDeaths = 0;
let totalScore = 0;
let scorePerLevel = 0; // Reset this at the start of each level


function createSprite(src) {
  let sprite = document.createElement("img");
  sprite.src = src;
  return sprite;
}

var otherSprites = createSprite("img/sprites.png");
var playerSprites = createSprite("img/player.png");
var hoopaSprites = createSprite("img/hoopa.png");
var keggaSprites = createSprite("img/kegga.png");

function actorOverlap(actor1, actor2) {
  // Check if either actor is non-interactable or if they are the same actor
  if (!actor1.interactable || !actor2.interactable || actor1 === actor2) {
      return false;
  }

  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}



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
  // Prevent horizontal movement if the player is dead
  if (!this.isDead) {
    if (keys.ArrowLeft) xSpeed -= gameSettings.playerXSpeed;
    if (keys.ArrowRight) xSpeed += gameSettings.playerXSpeed;
  }

  // Apply horizontal movement only if the player is not dead
  let newPos = state.level.moveActor(this, new Vec(xSpeed, 0), time);
  if (newPos.x !== this.pos.x) {
    this.pos = newPos; // Update position if horizontal movement occurred
  }

  let ySpeed = this.speed.y + time * gameSettings.gravity;

  // Check for jump input and apply jump force if on the ground
  if (!this.isDead && keys.isPressed("ArrowUp") && this.isOnGround(state)) {
    ySpeed = -gameSettings.jumpSpeed;
  }

  // Apply vertical movement due to gravity or jump
  newPos = state.level.moveActor(this, new Vec(0, ySpeed), time);
  if (newPos.y !== this.pos.y) {
    this.pos = newPos; // Update position if vertical movement occurred
    this.speed.y = ySpeed; // Update vertical speed
  } else {
    this.speed.y = 0; // Reset vertical speed if the player is on the ground or hits a ceiling
  }

  // Check for harmful collisions, such as with lava
  if (!this.isDead && state.level.touches(this.pos, this.size, "lava")) {
    this.isDead = true;
    // When player is marked as dead, make them drop to the ground
    this.speed.y = gameSettings.gravity; // Set a positive ySpeed to simulate falling
  }

  return new Player(this.pos, new Vec(xSpeed, this.speed.y), this.isDead);
};

Player.prototype.isOnGround = function(state) {
  return state.level.touches(this.pos.plus(new Vec(0, 0.1)), this.size, "wall") ||
         state.level.touches(this.pos.plus(new Vec(0, 0.1)), this.size, "stone");
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
    this.pointValue = 10;
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
   this.pointValue = 300;
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
    if (this.deadTime > 1.5) { // After 1.5 seconds of death animation, remove the Hoopa
      this.remove = true;
    }
    return this; // Return early if Hoopa is dead, no further updates needed
  }

  let xSpeed = this.speed.x;
  let pos = this.pos;

  // Use moveActor for horizontal movement, reversing direction on collision
  let newPos = state.level.moveActor(this, new Vec(xSpeed, 0), time);
  if (pos.x === newPos.x) {
    xSpeed = -xSpeed; // Reverse direction when hitting a wall
  } else {
    pos = newPos;
  }

  // Gravity affects vertical speed
  let ySpeed = this.speed.y + time * gameSettings.gravity;
  newPos = state.level.moveActor(this, new Vec(0, ySpeed), time);
  if (pos.y === newPos.y) {
    ySpeed = 0; // Stop vertical movement if we hit something
  } else {
    pos = newPos;
  }

  // Check for collisions with sliding KeggaTroopas
  state.actors.forEach(actor => {
    if (actor instanceof KeggaTroopa && actor !== this && actor.isSliding && actorOverlap(this, actor)) {
      this.isDead = true; // Hoopa dies if it collides with a sliding KeggaTroopa
    }
  });

  return new Hoopa(pos, new Vec(xSpeed, ySpeed), this.isDead, this.deadTime);
};

//add new class for second hoopa and its methods
class KeggaTroopa extends Actor{
  constructor(pos, speed, isDead = false, deadTime = 0, sliding = false, speedIncreased = false) {
    super(pos, speed, isDead, deadTime);
    this.isSliding = sliding || false;
    this.speedIncreased = speedIncreased || false;
    this.pointValue = 500;
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
    if (this.deadTime > 1.5) { // After 1.5 seconds of death animation, remove the KeggaTroopa
      this.remove = true;
    }
    return this; // Return early if KeggaTroopa is dead, no further updates needed
  }

  if (this.isSliding && !this.speedIncreased) {
    this.speed.x *= 2; // Double the speed if sliding and speed hasn't been increased yet
    this.speedIncreased = true;
  }

  let xSpeed = this.speed.x;
  let pos = this.pos;

  // Use moveActor for horizontal movement, reversing direction on collision
  let newPos = state.level.moveActor(this, new Vec(xSpeed, 0), time);
  if (pos.x === newPos.x) {
    xSpeed = -xSpeed; // Reverse direction when hitting a wall
  } else {
    pos = newPos;
  }

  // Gravity affects vertical speed
  let ySpeed = this.speed.y + time * gameSettings.gravity;
  newPos = state.level.moveActor(this, new Vec(0, ySpeed), time);
  if (pos.y === newPos.y) {
    ySpeed = 0; // Stop vertical movement if we hit something
  } else {
    pos = newPos;
  }

  // Check for collisions with sliding KeggaTroopas
  state.actors.forEach(actor => {
    if (actor instanceof KeggaTroopa && actor !== this && actor.isSliding && actorOverlap(this, actor)) {
      this.isDead = true; // KeggaTroopa dies if it collides with another sliding KeggaTroopa
    }
  });

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
  "E": "exit", // The exit is represented by E in the level plan
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
    this.exitReached = false;
  }

  touches(pos, size, type) {
    let xStart = Math.floor(pos.x);
    let xEnd = Math.ceil(pos.x + size.x);
    let yStart = Math.floor(pos.y);
    let yEnd = Math.ceil(pos.y + size.y);

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
        let here = isOutside ? "wall" : this.rows[y][x];
        if (type === "wall" && (here === "wall" || here === "stone")) return true;
        if (here == type) return true;
      }
    }
    return false;
  }

  // New method for moving an actor and checking for collisions
  moveActor(actor, move, time) {
    let newPos = actor.pos.plus(move.times(time));
    if (!this.touches(newPos, actor.size, "wall") && !this.touches(newPos, actor.size, "stone")) {
      return newPos; // New position is valid, no collision
    }
    return actor.pos; // Collision detected, return original position
  }
}



function overlap(actor1, actor2) {
    // If either actor is dead, they don't overlap.
    if (!actor1.interactable || !actor2.interactable) {
      return false;
    }
    if ((actor1 instanceof KeggaTroopa && actor1.isSliding && actor2 instanceof Hoopa) || 
    (actor2 instanceof KeggaTroopa && actor2.isSliding && actor1 instanceof Hoopa)) {
  console.log("kegga is sliding and overlaps with hoppa");
} 
if(actor1 instanceof KeggaTroopa && actor1.isSliding && actor2 instanceof KeggaTroopa ||
  actor2 instanceof KeggaTroopa && actor2.isSliding && actor1 instanceof KeggaTroopa) {
  console.log("kegga is sliding and overlaps with another kegga");
  }
 

  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state) {
  let player = state.player;
  player.isDead = true;
  totalDeaths += 1;
  //totalScore = Math.max(0, totalScore - 50);
  return new State(state.level, state.actors, "lost", this.coinsCollected);
};

Coin.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  let points = 0;
  //if (!filtered.some(a => a.type == "coin")) status = "won";

  // Increment coinsCollected property of the State class
  console.debug("updating the coin counter on collision with coin");
  let coinsCollected = state.coinsCollected + 1;
  points = state.score + this.pointValue; // Create a new score variable
  scorePerLevel += points;

  return new State(state.level, filtered, status, coinsCollected, points);
};


Hoopa.prototype.collide = function(state) {
  let player = state.player;
  let points = 0;
  if (!this.isDead && this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5){//(player.pos.y + player.size.y < this.pos.y + 0.5 && player.speed.y > 0 && player.pos.x + player.size.x > this.pos.x && player.pos.x < this.pos.x + this.size.x) {
      this.isDead = true;
      this.interactable = false;
      this.speed.x = 0;
      points = state.score + this.pointValue; // Create a new score variable
      scorePerLevel += points;

    } else {
      console.log("Player is dead");
      player.isDead = true;
      totalDeaths += 1;
      //totalScore = Math.max(0, totalScore - 50);
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
    this.speed.y = -gameSettings.jumpSpeed / 1.5;
    //flip sprite on y
    this.isDead = true; // Kill the Hoopa if it collides with a sliding KeggaTroopa
    points = state.score + this.pointValue; // Create a new score variable
    scorePerLevel += points;

  }

  return new State(state.level, state.actors, state.status, state.coinsCollected, points);
};

KeggaTroopa.prototype.collide = function(state) {
  let player = state.player;
  let points = 0; // Define points variable
  //scorePerLevel +=
  if (this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5) {
      this.isSliding = true;
      console.log("is kegga sliding?: " + this.isSliding);
      player.speed.y = -gameSettings.jumpSpeed / 1.5;
      return new State(state.level, state.actors, state.status, state.coinsCollected, state.score);
    } else if (!this.isDead && this.interactable && overlap(this, player)) {
      if (player.pos.y + player.size.y < this.pos.y + 0.5) {
        this.isDead = true;
        this.interactable = false;
        this.speed.x = 0;
        points = state.score + this.pointValue; // Update points variable
        scorePerLevel += points;
      } else {
        console.log("Player is dead");
        player.isDead = true;
        totalDeaths += 1;
        //totalScore = Math.max(0, totalScore - 50);
        return new State(state.level, state.actors.filter(a => a != this), "lost", state.coinsCollected);
      } 
    }
  }
  return new State(state.level, state.actors, state.status, state.coinsCollected, points); // Use points variable
};

class State {
  constructor(level, actors, status, coinsCollected = 0, score = 0, exitReached = false) {
    this.level = level;
    this.actors = actors;
    this.status = status;
    this.coinsCollected = coinsCollected;
    this.score = score;
    this.exitReached = exitReached; // Now part of the state
}


  static start(level) {
    return new State(level, level.startActors, "playing", this.coinsCollected, this.score);
  }

  get player() {
    return this.actors.find((a) => a.type == "player");
  }

  update(time, keys) {
    let actors = this.actors.map(actor => actor.update(time, this, keys));
    actors = actors.filter(actor => !actor.remove);

    let newState = new State(this.level, actors, this.status, this.coinsCollected, this.score, this.exitReached);

    if (!newState.exitReached && newState.level.touches(newState.player.pos, newState.player.size, "exit")) {
      newState.exitReached = true;
      newState.status = "won"; // Optionally change the game status
    }

    let player = newState.player;
    if (!newState.exitReached && newState.level.touches(player.pos, player.size, "exit")) {
      newState = new State(newState.level, actors, "won", newState.coinsCollected, newState.score, true);
      // Assuming you might want to handle level transition or scoring here
      return newState;
    }

    if (newState.level.touches(player.pos, player.size, "lava")) {
      return new State(newState.level, actors, "lost", newState.coinsCollected, newState.score, newState.exitReached);
    }

    for (let actor of actors) {
      if (actor != player && overlap(actor, player)) {
        newState = actor.collide(newState);
      }
    }

    // Consider what should happen if keggas and hoopas overlap. Currently, this loop does nothing.
    let keggasAndHoopas = actors.filter(actor => actor instanceof KeggaTroopa || actor instanceof Hoopa);
    for (let i = 0; i < keggasAndHoopas.length; i++) {
      for (let j = i + 1; j < keggasAndHoopas.length; j++) {
        if (overlap(keggasAndHoopas[i], keggasAndHoopas[j])) {
          // Handle overlap logic here
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
  constructor(parent) {
    // Find or create the canvas element
    let existingCanvas = document.querySelector("canvas");
    console.debug("existingCanvas: ", existingCanvas);
    if (existingCanvas) {
      this.canvas = existingCanvas;
    } else {
      console.debug("creating new canvas");
      this.canvas = document.createElement("canvas");
      parent.appendChild(this.canvas);
    }
    this.cx = this.canvas.getContext("2d");
    this.flipPlayer = false;

    // Initialize a default viewport in case it's used before setting up with level specifics
    this.viewport = {
      left: 0,
      top: 0,
      width: this.canvas.width / gameSettings.scale, // Default width, will be updated in initializeLevel
      height: this.canvas.height / gameSettings.scale // Default height, will be updated in initializeLevel
    };
  }


  initializeLevel(level) {
    this.canvas.width = Math.min(gameSettings.canvasWidth, level.width * gameSettings.scale);
    this.canvas.height = Math.min(gameSettings.canvasHeight, level.height * gameSettings.scale);
    this.viewport = {
      left: 0,
      top: 0,
      width: this.canvas.width / gameSettings.scale,
      height: this.canvas.height / gameSettings.scale
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
     // Set canvas size for the intro screen
  this.canvas.width = gameSettings.canvasWidth; // or any other size suitable for the intro
  this.canvas.height = gameSettings.canvasHeight; // or any other size suitable for the intro

  console.log('Drawing intro screen');

    let cx = this.canvas.getContext('2d');

    cx.font = 'bold 20px "Courier New"';
    cx.fillStyle = 'black';
    //fill canvas with solid black
    cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    cx.fillStyle = 'white';
    cx.fillText('Welcome to the game!', this.canvas.width / 2, 50);
    cx.fillText("Press any key to start", this.canvas.width / 2, 100);
    cx.fillText("Use arrow keys to move", this.canvas.width / 2, 150);
    //cx.fillText("Press 'P' to pause", 100, 200);
    // add here other instructions to play the game
  }

  drawOutro() {
         // Set canvas size for the intro screen
  this.canvas.width = gameSettings.canvasWidth; // or any other size suitable for the intro
  this.canvas.height = gameSettings.canvasHeight; // or any other size suitable for the intro
    this.clear(); // Clear the canvas
  
    // Draw outro messages
    this.cx.fillStyle = 'white';
    this.cx.textAlign = 'center';
    this.cx.font = 'bold 20px "Courier New"';
    let finalScore = Math.max(0, totalScore - (50 * totalDeaths));
    this.cx.fillText('Thanks for playing!', this.canvas.width / 2, 100);
    this.cx.fillText(`Total score: ${finalScore}`, this.canvas.width / 2, 150);
    this.cx.fillText(`Total deaths: ${totalDeaths}`, this.canvas.width / 2, 200);
    this.cx.fillText('Press F5 to restart', this.canvas.width / 2, 300);
  
    // Listen for any key to restart the game
    window.addEventListener('keydown', () => {
      // Reset global variables or reload the page for a full reset
      totalDeaths = 0;
      totalScore = 0;
      scorePerLevel = 0;
      runGame(gameLevels, CanvasDisplay); // Restart the game
    }, { once: true });
  }
  

  syncState(state) {
    console.log('Syncing game state:', state.status); 
    this.updateViewport(state); // Make sure this is called first
    this.clearDisplay(state.status);
    this.drawBackground(state.level);
    this.drawActors(state.actors);
    this.drawStatus(state);
  }
  

  updateViewport(state) {
    const view = this.viewport;
    const margin = view.width / 3;
    const player = state.player;
    const center = player.pos.plus(player.size.times(0.5));
  
    // Update viewport left position based on player's center and margin
    if (center.x < view.left + margin) {
      view.left = Math.max(center.x - margin, 0);
    } else if (center.x > view.left + view.width - margin) {
      view.left = Math.min(center.x + margin - view.width, state.level.width - view.width);
    }
  
    // Optional: Update viewport top position if vertical movement is needed
    // const verticalMargin = view.height / 4;
    // if (center.y < view.top + verticalMargin) {
    //   view.top = Math.max(center.y - verticalMargin, 0);
    // } else if (center.y > view.top + view.height - verticalMargin) {
    //   view.top = Math.min(center.y + verticalMargin - view.height, state.level.height - view.height);
    // }
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
    // Ensure the viewport is initialized
    this.initializeLevel(level);
    this.cx.fillStyle = "rgb(135, 206, 235)"; // Light blue color, similar to sky blue
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let { left, top, width, height } = this.viewport;
    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            if (y < 0 || y >= level.rows.length || x < 0 || x >= level.rows[y].length) {
                continue; // Skip tiles outside the level bounds
            }
            let tile = level.rows[y][x];
            if (tile == "empty") continue;
            let screenX = (x - left) * gameSettings.scale;
            let screenY = (y - top) * gameSettings.scale;

            if (tile == "exit") {
                this.cx.fillStyle = "gold"; // Gold color for the exit
                this.cx.fillRect(screenX, screenY, gameSettings.scale, gameSettings.scale);
                if (this.exitReached) {
                  this.cx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Overlay with semi-transparent red
                  this.cx.fillRect(screenX, screenY, gameSettings.scale, gameSettings.scale);
                }
            } else {
                let tileX = (tile == "lava") ? gameSettings.scale : 0;
                if (tile == "stone") {
                    tileX = 3.55 * gameSettings.scale; // Adjust for your spritesheet
                }
                this.cx.drawImage(otherSprites, tileX, 0, gameSettings.scale, gameSettings.scale, screenX, screenY, gameSettings.scale, gameSettings.scale);
            }
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
  width += gameSettings.actorXOverlap * 2;
  x -= gameSettings.actorXOverlap;

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
  width += gameSettings.actorXOverlap * 2;
  x -= gameSettings.actorXOverlap;

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
  width += gameSettings.actorXOverlap * 2;
  x -= gameSettings.actorXOverlap;

  // Determine whether to flip the monster's sprite based on the monster's x speed.
  if (keggaTroopa.speed.x != 0) {
    this.flipMonster = keggaTroopa.speed.x < 0;
  }

  // Choose a tile from the monster's sprite sheet based on the monster's speed.
  let tile = 8;
  if (keggaTroopa.isSliding && !keggaTroopa.isDead) {
    console.debug("Drawing sliding kegga monster");
    tile = 10;
  } else if (keggaTroopa.isDead && keggaTroopa.deadTime < 1.5) {
    console.debug("Drawing dead kegga monster");
    tile = 9;
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
      let width = actor.size.x * gameSettings.scale;
      let height = actor.size.y * gameSettings.scale;
      let x = (actor.pos.x - this.viewport.left) * gameSettings.scale;
      let y = (actor.pos.y - this.viewport.top) * gameSettings.scale;
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
        let tileX = (actor.type == "coin" ? 2 : 1) * gameSettings.scale;
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
  let display = new Display(document.body);
  display.initializeLevel(level); // Initialize the level and set viewport dimensions
  let state = State.start(level);
  let ending = 1;
  return new Promise((resolve) => {
    runAnimation((time) => {
      if (introShown && !state.player.isDead) {
        state.status = 'playing';
      } else if (!introShown) {
        state.status = 'intro';
        display.drawIntro();
        return false; // Stop the animation loop if still on the intro screen
      }
      state = state.update(time, arrowKeys);
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= time;
        return true;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}


async function runGame(plans, Display) {
  // Display the intro screen first
  let display = new CanvasDisplay(document.body);
  display.drawIntro();

  // Wait for the user to press 'Enter' to start the game
  await new Promise(resolve => {
      window.addEventListener("keydown", function handler(event) {
          if (event.key === 'Enter') {
              console.log('Game starting after intro...');
              window.removeEventListener("keydown", handler);
              resolve();
          }
      });
  });

  // Now start the game levels
  for (let level = 0; level < plans.length;) {
      let status = await runLevel(new Level(plans[level]), Display);
      if (status == "won"){
        totalScore += scorePerLevel;  //faield to load score
        level++;
      } 
  }

  console.log("You've won!");
  display.drawOutro();

}

// Modify the runLevel function to not show the intro again
function runLevel(level, Display) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;
  return new Promise((resolve) => {
      runAnimation((time) => {
          state = state.update(time, arrowKeys);
          display.syncState(state);
          if (state.status == "playing") {
              return true;
          } else if (ending > 0) {
              ending -= time;
              return true;
          } else {
              display.clear();
              resolve(state.status);
              return false;
          }
      });
  });
}


function trackKeys(keys) {
  let down = Object.create(null);
  let pressed = Object.create(null); // New object to track freshly pressed keys

  function track(event) {
    if (keys.includes(event.key)) {
      let state = event.type == "keydown";
      if (state && !down[event.key]) {
        pressed[event.key] = true; // Mark as freshly pressed if it wasn't down before
      }
      down[event.key] = state;
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);

  down.isPressed = (key) => {
    if (pressed[key]) {
      pressed[key] = false; // Reset after acknowledging the press
      return true;
    }
    return false;
  };

  return down;
}

