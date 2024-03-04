const gameSettings = {
  playerXSpeed: 7,
  gravity: 30,
  jumpSpeed: 16,
  scale: 20,
  actorXOverlap: 4,
  canvasWidth: 800,
  canvasHeight: 600,
};
let paused = false;
let introShown = false;
let poweredUp = false;
let totalDeaths = 0;
let totalScore = 0;
let scorePerLevel = 0; // Reset this at the start of each level
let levelCounter = 1; // Start from level 1
let playerLives = 3; // Start with 3 lives
let coinsCollected = 0; // Retain this across game



function createSprite(src) {
  let sprite = document.createElement("img");
  sprite.src = src;
  return sprite;
}

var otherSprites = createSprite("img/sprites.png");
var playerSprites = createSprite("img/player.png");
var conveyorBeltSprites = createSprite("img/conveyor.png");
var poweredUpPlayerSprites = createSprite("img/playerPoweredUp.png");
var hoopaSprites = createSprite("img/hoopa.png");
var keggaSprites = createSprite("img/kegga.png");

function actorOverlap(actor1, actor2) {
  //console.debug("checking the actor overlap" + actor1.type + " " + actor2.type);
  // Check if either actor is non-interactable or if they are the same actor
  if (!actor1.interactable || !actor2.interactable || actor1 === actor2) {
      return false;
  }

  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

function updatePoints(state, pointsToAdd) {
  totalScore += pointsToAdd; // Add points directly to totalScore
  console.debug(`Points updated. Total score: ${totalScore}`);
  // Return a new state with the updated score
  return new State(state.level, state.actors, state.status,  totalScore);
}


function updateTotalScore() {
  totalScore += scorePerLevel; // Add the score for the current level to the total score
  console.debug(`Total Score Updated: ${totalScore}`);
  scorePerLevel = 0; // Reset score for the next level
}


var arrowKeys = trackKeys([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  " " //shooting with space will alter this later
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
    this.onConveyorBelt = undefined;
  }
}

class Player extends Actor {
  constructor(pos, speed, isDead = false, isPowered = poweredUp) {
    super(pos, speed, isDead);
    this.score = 0;
    this.coinsCollected = 0;
    this.isPowered = isPowered;

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

  // Handle player input
  if (!this.isDead) {
    if (keys.ArrowLeft) xSpeed -= gameSettings.playerXSpeed;
    if (keys.ArrowRight) xSpeed += gameSettings.playerXSpeed;
  }

  // Apply conveyor belt speed if on a conveyor belt
  if (this.onConveyorBelt !== undefined) {
    xSpeed += this.onConveyorBelt;
    //this.onConveyorBelt = undefined; // Reset the flag after applying the speed
  }

  // Apply horizontal movement
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
    playerLives -= 1;
    totalDeaths += 1;
    this.speed.y = gameSettings.gravity; // Simulate falling when dead
  }

  return new Player(this.pos, new Vec(xSpeed, this.speed.y), this.isDead, this.isPowered);
};


Player.prototype.isOnGround = function(state) {
  return state.level.touches(this.pos.plus(new Vec(0, 0.1)), this.size, "wall") ||
         state.level.touches(this.pos.plus(new Vec(0, 0.1)), this.size, "stone") ||
         state.level.touches(this.pos.plus(new Vec(0, 0.1)), this.size, "bridge");
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

class PowerUp {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
    this.interactable = true;
    this.pointValue = 1000;
  }
  size = new Vec(0.8, 0.9);
  wobbleSpeed = 8;
  wobbleDist = 0.07;

  get type() {
    return "powerUp";
  }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new PowerUp(basePos, basePos, Math.random() * Math.PI * 2);
  }

  update = function(time) {
    let wobble = this.wobble + time * wobbleSpeed;
    let wobblePos = Math.sin(wobble) * wobbleDist;
    return new PowerUp(this.basePos.plus(new Vec(0, wobblePos)),
                    this.basePos, wobble);
  };
}

class ConveyorBelt extends Actor {
  constructor(pos, speed) {
    super(pos, speed);
  }

  get type() {
    return "conveyorBelt";
  }

  static create(pos, ch) {
    if (ch == "<") {
      return new ConveyorBelt(pos, new Vec(-5, 0)); // Moving left
    } else if (ch == ">") {
      return new ConveyorBelt(pos, new Vec(5, 0)); // Moving right
    }
  }
}

ConveyorBelt.prototype.size = new Vec(1, 0.5);

ConveyorBelt.prototype.update = function(time) {
  // Conveyor belts might not need to update themselves since they are stationary
  return this;
};



Lava.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall") && !state.level.touches(newPos, this.size, "stone")) {  //lava can pass through bridges
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
    return new Hoopa(pos.plus(new Vec(0, 0)), new Vec(2, 0));
  }
}

Hoopa.prototype.size = new Vec(0.8, 0.99);

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

    // Apply conveyor belt speed if on a conveyor belt
    if (this.onConveyorBelt !== undefined) {
      console.log("hoopa is on conveyor belt");
      xSpeed += this.onConveyorBelt;
      //this.onConveyorBelt = undefined; // Reset the flag after applying the speed
    }

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
    this.speed.x *= 6; // Increase the speed if sliding and speed hasn't been increased yet
    this.speedIncreased = true;
  }

  let xSpeed = this.speed.x;
  let pos = this.pos;

    // Apply conveyor belt speed if on a conveyor belt
    if (this.onConveyorBelt !== undefined) {
      xSpeed += this.onConveyorBelt;
      console.log("kegga is on conveyor belt");
      //this.onConveyorBelt = undefined; // Reset the flag after applying the speed
    }

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
// Check for collisions with other actors
state.actors.forEach(actor => {
  // Ensure we're not checking the actor against itself
  if (actor !== this && actorOverlap(this, actor)) {
    // Handle collision with Hoopa
    if (actor instanceof Hoopa && !actor.isDead) {
      if (this.isSliding) {
        // Sliding KeggaTroopa collides with Hoopa
        actor.isDead = true; // Mark Hoopa as dead
        actor.interactable = false; // Make Hoopa non-interactable
        console.debug(`Hoopa slammed by sliding KeggaTroopa. Points added: ${actor.pointValue}`);
        totalScore += actor.pointValue; // Add points for killing Hoopa
      }
    } else if (actor instanceof KeggaTroopa) {
      // Handle collision between KeggaTroopas
      if (this.isSliding && !actor.isSliding) {
        // Sliding KeggaTroopa collides with a non-sliding KeggaTroopa
        console.debug("Sliding KeggaTroopa collided with non-sliding KeggaTroopa");
        // Decide the behavior (e.g., make the non-sliding KeggaTroopa start sliding, stop the sliding KeggaTroopa, etc.)
        actor.interactable = false; // Make the non-sliding KeggaTroopa non-interactable
        actor.isDead = true; // Example action: make the non-sliding KeggaTroopa start sliding
        totalScore += actor.pointValue / 2; // Add points for killing Hoopa

      }
    }
  }
});

  return new KeggaTroopa(pos, new Vec(xSpeed, ySpeed), this.isDead, this.deadTime, this.isSliding, this.speedIncreased);
};


var levelChars = {
  // Add new level characters here
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
  "<": ConveyorBelt,
  ">": ConveyorBelt,
  "E": "exit", // The exit is represented by E in the level plan
  "B": "bridge", // Bridge section should affect collision. Player walks on top of it.
  "T": "pipeTopLeft",
  "U": "pipeTopRight",
  "[": "pipeBodyLeft",
  "]": "pipeBodyRight",
  "L": "pipeUpperCornerLeft",
  "R": "pipeLowerCornerLeft",
  "I": "pipeTopHorizontalUpper",
  "P": "pipeTopHorizontalLower",
  "Q": "pipeBodyHorizontalUpper",
  "S": "pipeBodyHorizontalLower",
  //brewing tank
  "G": "brewingTankSectionLeft",
  "H": "brewingTankSectionRight",
  "J": "brewingTankBottomRight",
  "K": "brewingTankBottomLeft",
  "F": "brewingTankTopLeft",
  "W": "brewingTankTopRight",
  //stuff
  "9": PowerUp,
  //valves
  "1": "valveDecal1",
  "2": "valveDecal2",
  //decals
  "3": "barrier",


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
        if (type === "wall" && (here === "wall" || here === "stone" ||
          here === "pipeTopLeft" || here === "pipeTopRight" || here === "pipeBodyLeft" || here === "pipeBodyRight" || 
          here === "pipeUpperCornerLeft" || here === "pipeLowerCornerLeft" || here === "pipeTopHorizontalUpper" || here === "pipeTopHorizontalLower" ||
          here === "pipeBodyHorizontalUpper" || here === "pipeBodyHorizontalLower" )) return true;
        if (here == type) return true;
      }
    }
    return false;
  }

  // New method for moving an actor and checking for collisions
  moveActor(actor, move, time) {
    let newPos = actor.pos.plus(move.times(time));
    if (!this.touches(newPos, actor.size, "wall") &&
     !this.touches(newPos, actor.size, "stone") &&
     !this.touches(newPos, actor.size, "bridge")) {
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
  console.debug("kegga is sliding and overlaps with hoppa");
} 
if(actor1 instanceof KeggaTroopa && actor1.isSliding && actor2 instanceof KeggaTroopa ||
  actor2 instanceof KeggaTroopa && actor2.isSliding && actor1 instanceof KeggaTroopa) {
  console.debug("kegga is sliding and overlaps with another kegga");
  }
 

  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

ConveyorBelt.prototype.collide = function(state) {
  /*let player = state.player;
  if (player.type == "player" && overlap(this, player)) {
    console.log("player is on conveyor belt");
    player.onConveyorBelt = this.speed.x; // Set a flag indicating the player is on the conveyor belt
  }
  return new State(state.level, state.actors, state.status, state.score);*/
 // Temporarily store the actors to modify their properties if needed
 let updatedActors = state.actors.map(actor => {
  // Skip if we're checking the conveyor belt against itself or the actor is not one of the specified types
  if (actor === this || !(actor instanceof Hoopa || actor instanceof KeggaTroopa || actor instanceof Player)) {
    return actor; // Return the actor unmodified
  }

  // Check if the actor overlaps with the conveyor belt
  if (actorOverlap(this, actor)) {
    console.log(actor.type + " is on conveyor belt");
    // Create a modified copy of the actor with the onConveyorBelt property set
    actor.onConveyorBelt = this.speed.x;
    return actor; // Return the modified actor
  }

  return actor; // Return the actor unmodified if no overlap
});

// Return a new state with the updated actors
return new State(state.level, updatedActors, state.status, state.score);
};
  

Lava.prototype.collide = function(state) {
  let player = state.player;
  if (!player.isDead) { // Check if the player is not already dead
    player.isDead = true;
    totalDeaths += 1;
    playerLives -= 1;
    //player.interactable = false; // Make the player non-interactable
    console.debug("Player is swimming in beer not even hardhat will save you, remaining lives: " + playerLives);
  }

  //totalScore = Math.max(0, totalScore - 50);
  return new State(state.level, state.actors, "lost");
};

Coin.prototype.collide = function(state) {
  coinsCollected += 1; // Update the global coinsCollected variable
  let newState = updatePoints(state, this.pointValue);

  console.debug(`Coin collected. Coins collected: ${coinsCollected}`);
  // Check for extra life
  if (coinsCollected % 50 === 0) { // Every 50 coins
    playerLives += 1; // Award an extra life
    console.debug(`Extra life awarded! Current lives: ${playerLives}`);
  }

  return new State(newState.level, state.actors.filter(a => a != this), newState.status, newState.score);
};

PowerUp.prototype.collide = function(state) {
  console.log("powerup collided");
  let player = state.player;
  let newState = updatePoints(state, this.pointValue);

  if(player.isPowered){
    return;
  } else {
    player.isPowered = true;
    poweredUp = true;
    console.log("player is powered");
    return new State(state.level, state.actors.filter(a => a != this), newState.status, state.score, isPowered = true);
  
  }
};


Hoopa.prototype.collide = function(state) {
  let player = state.player;

  // Check for collision with player
  if (!this.isDead && this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5) {
      // Hoopa is killed by the player by jump on the top
      this.isDead = true;
      this.interactable = false;
      this.speed.x = 0;

      // Update the state with points for killing Hoopa
      console.debug(`Hoopa killed by player. Points added: ${this.pointValue}`);
      return updatePoints(state, this.pointValue);
    }else if (!player.isDead && player.isPowered) {
      //player is not dead but depowered
      player.isPowered = false;
      poweredUp = false;
      console.log("player is depowered now");
      return new State(state.level, state.actors.filter(a => a != this), state.status, state.score);

    } 
    else if (!player.isDead) {
      // Player dies on collision with Hoopa
      player.isDead = true;
      totalDeaths += 1;
      playerLives -= 1;
      console.log("Player is dead, remaining lives: " + playerLives);
      return new State(state.level, state.actors.filter(a => a != this), "lost", state.score);
    }
  }

  // No points update needed if no collision of interest occurred
  return state;
};


KeggaTroopa.prototype.collide = function(state) {
  let player = state.player;

  // KeggaTroopa is interactable and collides with the player
  if (this.interactable && overlap(this, player)) {
    // Player jumps on top of KeggaTroopa, making it slide
    if (player.pos.y + player.size.y < this.pos.y + 0.5) {
      this.isSliding = true;
      console.debug("KeggaTroopa is sliding. " + this.isSliding);
      player.speed.y = -gameSettings.jumpSpeed / 1.5; // Bounce effect

      // No points update, just change in state
      return new State(state.level, state.actors, state.status, state.score);
    } else if (!player.isDead && player.isPowered) {
      //player is not dead but depowered
      player.isPowered = false;
      poweredUp = false;
      console.log("player is depowered now");
      return new State(state.level, state.actors.filter(a => a != this), state.status, state.score);

    } else if (!player.isDead) { // Check if the player is not already dead
        player.isDead = true;
        totalDeaths += 1;
        playerLives -= 1;
        //player.interactable = false; // Make the player non-interactable
        console.debug("Player is dead, remaining lives: " + playerLives);
      }

      // Remove the KeggaTroopa from the state and update status
      return new State(state.level, state.actors.filter(a => a != this), "lost",  state.score);
    }
  

  // Return state unmodified if no relevant collision occurred
  return state;
};


class State {
  constructor(level, actors, status, score = 0, exitReached = false, isPowered) {
    this.level = level;
    this.actors = actors;
    this.status = status;
    //this.coinsCollected = coinsCollected;
    this.score = score;
    this.exitReached = exitReached; // Now part of the state
    this.isPowered = isPowered;
}


  static start(level) {
    return new State(level, level.startActors, "playing",  this.score, this.isPowered);
  }

  get player() {
    return this.actors.find((a) => a.type == "player");
  }

  update(time, keys) {
    let actors = this.actors.map(actor => actor.update(time, this, keys));
    actors = actors.filter(actor => !actor.remove);

    let newState = new State(this.level, actors, this.status, this.score, this.exitReached);

    if (!newState.exitReached && newState.level.touches(newState.player.pos, newState.player.size, "exit")) {
      newState.exitReached = true;
      newState.status = "won"; // Optionally change the game status
    }

    let player = newState.player;
    if (!newState.exitReached && newState.level.touches(player.pos, player.size, "exit")) {
      newState = new State(newState.level, actors, "won", newState.score, true);
      // Assuming you might want to handle level transition or scoring here
      return newState;
    }

    if (newState.level.touches(player.pos, player.size, "lava")) {
      return new State(newState.level, actors, "lost", newState.score, newState.exitReached);
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
    if (existingCanvas) {
      this.canvas = existingCanvas;
    } else {
      this.canvas = document.createElement("canvas");
      parent.appendChild(this.canvas);
    }
    this.cx = this.canvas.getContext("2d");
    this.flipPlayer = false;

    // Initialize the viewport here to ensure it's done once
    this.viewport = {
      left: 0,
      top: 0,
      width: this.canvas.width / gameSettings.scale,
      height: this.canvas.height / gameSettings.scale
    };
  }

  initializeLevel(level) {
    // Set canvas size based on the level size, do not reset the viewport here
    this.canvas.width = Math.min(gameSettings.canvasWidth, level.width * gameSettings.scale);
    this.canvas.height = Math.min(gameSettings.canvasHeight, level.height * gameSettings.scale);
  }

  syncState(state) {
    this.updateViewport(state); // Update viewport based on the current state, don't reinitialize
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

    if (center.x < view.left + margin) {
      view.left = Math.max(center.x - margin, 0);
    } else if (center.x > view.left + view.width - margin) {
      view.left = Math.min(center.x + margin - view.width, state.level.width - view.width);
    }

    // Add vertical camera movement if your game requires it
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

    let quarterWidth = this.cx.canvas.width / 4; // Divide the canvas width into four equal parts
  
    let levelText = `Level: WORLD ${levelCounter}`.toLocaleUpperCase();
    let livesText = `Lives: ${playerLives}`.toLocaleUpperCase();
    let scoreText = `Score: ${totalScore}`.toLocaleUpperCase();
    let coinsCollectedText = `Coins: ${coinsCollected}`.toLocaleUpperCase();

    let levelTextWidth = this.cx.measureText(levelText).width;
    let livesTextWidth = this.cx.measureText(livesText).width;
    let scoreTextWidth = this.cx.measureText(scoreText).width;
    let coinsCollectedTextWidth = this.cx.measureText(coinsCollectedText).width;
  
    // Calculate positions to center the texts within their respective quarters
    let levelTextPosition = quarterWidth * 0 + (quarterWidth - levelTextWidth) / 2 + 10; // Added 10px margin
    let livesTextPosition = quarterWidth * 1 + (quarterWidth - livesTextWidth) / 2;
    let scoreTextPosition = quarterWidth * 2 + (quarterWidth - scoreTextWidth) / 2;
    let coinsCollectedTextPosition = quarterWidth * 3 + (quarterWidth - coinsCollectedTextWidth) / 2;
  
    
    //let levelTextPosition = (this.cx.canvas.width / 3 - levelTextWidth) / 2;
    //let scoreTextPosition = this.cx.canvas.width / 3 + (this.cx.canvas.width / 3 - scoreTextWidth) / 2;
    //let coinsCollectedTextPosition = this.cx.canvas.width / 3 * 2 + (this.cx.canvas.width / 3 - coinsCollectedTextWidth) / 2;
  
    this.cx.fillText(levelText, levelTextPosition, 30);
    this.cx.fillText(livesText, livesTextPosition, 30);
    this.cx.fillText(scoreText, scoreTextPosition, 30);
    this.cx.fillText(coinsCollectedText, coinsCollectedTextPosition, 30);
  }

drawScreen(options) {
    this.canvas.width = gameSettings.canvasWidth;
    this.canvas.height = gameSettings.canvasHeight;
    this.clear(); // Clear the canvas

    // Default options
    const defaults = {
      textAlign: 'center',
      fillStyle: 'white',
      font: 'bold 20px "Courier New"',
      messages: [],
      action: null, // Optional action to perform on key press
    };

    // Override default options with provided options
    const settings = {...defaults, ...options};

    this.cx.textAlign = settings.textAlign;
    this.cx.fillStyle = settings.fillStyle;
    this.cx.font = settings.font;

    settings.messages.forEach((message, index) => {
      const x = this.canvas.width / 2;
      const y = 100 + index * 50; // Adjust vertical spacing as needed
      this.cx.fillText(message, x, y);
    });

    if (settings.action) {
      window.addEventListener('keydown', settings.action, {once: true});
    }
  }

  drawIntro() {
    console.debug('Drawing intro screen');
    this.drawScreen({
      messages: [
        'Welcome to the game!',
        'Press ENTER key to start',
        'Use arrow keys to move',
        // Add more messages as needed
      ],
      action: () => {
        // Action to start the game or go to the next screen
        runGame(gameLevels, CanvasDisplay);
      }
    });
  }

  drawOutro() {
    console.debug('Drawing outro screen');
    //let finalScore = Math.max(0, totalScore - (50 * totalDeaths));
    this.drawScreen({
      messages: [
        'Thanks for playing!',
        `Total score: ${totalScore}`,
        `Total deaths: ${totalDeaths}`,
        'Press F5 to restart',
      ],
      action: () => {
        // Optional: Action to restart the game or go to another screen
        location.reload(); // Simple way to restart the game
      }
    });
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
    let padding = 1; // 1 pixel of padding on the right side of each sprite
    this.cx.imageSmoothingEnabled = false;
    this.initializeLevel(level);
    this.cx.fillStyle = "rgb(135, 206, 235)"; // Light blue color, similar to sky blue
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let { left, top, width, height } = this.viewport;

    for (let y = Math.floor(top); y < Math.ceil(top + height); y++) {
        for (let x = Math.floor(left); x < Math.ceil(left + width); x++) {
            if (y < 0 || y >= level.rows.length || x < 0 || x >= level.rows[y].length) {
                continue; // Skip tiles outside the level bounds
            }
            let tile = level.rows[y][x];
            if (tile == "empty") continue;
            
            let screenX = Math.round((x - left) * gameSettings.scale); // Round to avoid subpixel rendering
            let screenY = Math.round((y - top) * gameSettings.scale); // Round to avoid subpixel rendering
            let tileIndex = 0; // Index of the tile in the sprite sheet

            // Determine the tile's index based on its type
            //tiles are 20x20 px + 1px padding on the left side
            switch(tile) {
              case "wall":
                tileIndex = 0; // Assuming "wall" is the first sprite
                break;
              case "lava":
                tileIndex = 1; // Assuming "lava" is the second sprite
                break;
              case "stone":
                tileIndex = 4; // Assuming "stone" is the fifth sprite
                  break;
              case "bridge":
                tileIndex = 5; // Assuming "bridge" is the sixth sprite
                break;
              case "pipeTopLeft":
                tileIndex = 6; // Assuming "pipeTopLeft" is the seventh sprite
                break;
              case "pipeTopRight":
                tileIndex = 7; // Assuming "pipeTopRight" is the eighth sprite
                break;
              case "pipeBodyLeft":
                tileIndex = 8; // Assuming "pipeBodyLeft" is the ninth sprite
                break;
              case "pipeBodyRight":
                tileIndex = 9; // Assuming "pipeBodyRight" is the tenth sprite
                break;
              case "pipeUpperCornerLeft":
                tileIndex = 10; // Assuming "pipeUpperCornerLeft" is the eleventh sprite
                break;
              case "pipeLowerCornerLeft":
                tileIndex = 11; // Assuming "pipeLowerCornerLeft" is the twelfth sprite
                break;
              case "pipeTopHorizontalUpper":
                tileIndex = 12; // Assuming "pipeTopHorizontalUpper" is the thirteenth sprite
                break;
              case "pipeTopHorizontalLower":
                tileIndex = 13; // Assuming "pipeTopHorizontalLower" is the fourteenth sprite
                break;
              case "pipeBodyHorizontalUpper":
                tileIndex = 14; // Assuming "pipeBodyHorizontalUpper" is the fifteenth sprite
                break;
              case "pipeBodyHorizontalLower":
                tileIndex = 15; // Assuming "pipeBodyHorizontalLower" is the sixteenth sprite
                break;
              case "exit":
                tileIndex = 16;
                break;
              case "brewingTankSectionLeft":
                tileIndex = 17;
                break;
              case "brewingTankSectionRight":
                tileIndex = 18;
                break;
              case "brewingTankBottomLeft":
                tileIndex = 19;
                break;
              case "brewingTankBottomRight":
                tileIndex = 20;
                break;
              case "brewingTankTopLeft":
                tileIndex = 21;
                break;
              case "brewingTankTopRight":
                tileIndex = 22;
                break;
              case "valveDecal1":
                tileIndex = 23;
                break;
              case "valveDecal2":
                tileIndex = 24;
                break;
              case "barrier":
                tileIndex = 25;
                break;
            }
               // Calculate tileX considering the width, padding, and index
            let tileX = tileIndex * (gameSettings.scale + padding);

            // Draw the tile
            this.cx.drawImage(otherSprites, tileX, 0, gameSettings.scale, gameSettings.scale, screenX, screenY, gameSettings.scale, gameSettings.scale);
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
  width += gameSettings.actorXOverlap * 2;
  x -= gameSettings.actorXOverlap;

  if (player.speed.x != 0) {
    this.flipPlayer = player.speed.x < 0;
  }

  let tile = 8;
  if (player.speed.y != 0) {
    tile = 9;
  } else if (player.speed.x != 0) {
    tile = Math.floor(Date.now() / 60) % 8;
  } else if (player.isDead) {
    tile = 10;
  }

  this.cx.save();

  if (this.flipPlayer) {
    this.flipHorizontally(x + width / 2);
  }

  let tileX = tile * width;

  // Choose the appropriate spritesheet based on the player's powered-up state.
  let spriteSheet = player.isPowered ? poweredUpPlayerSprites : playerSprites;

  // Draw the player sprite using the selected spritesheet.
  this.cx.drawImage(spriteSheet, tileX, 0, width, height, x, y, width, height);

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

  //height = gameSettings.scale + 10; //setting the height for hoppa to be bit smaller and fit ONE TILE

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
    
    // Define a spriteWidth variable that can be adjusted per actor type
    let spriteWidth = width;
    
    if (actor.type == "player") {
      this.drawPlayer(actor, x, y, width, height);
    } else if (actor.type == "hoopa") {
      this.drawHoopa(actor, x, y - 10, width, height + 10);
    } else if (actor.type == "keggaTroopa") {
      this.drawKegga(actor, x, y, width, height);
    } else if (actor.type == "lava") {
      let tileX = 1 * gameSettings.scale; // Lava sprite position on the spritesheet
      this.cx.drawImage(otherSprites, tileX, 0, spriteWidth, height, x, y, spriteWidth, height);
    } else if (actor.type == "coin") {
      spriteWidth = width * 0.75; // Adjust sprite width for coins
      let tileX = 2 * gameSettings.scale; // Coin sprite position on the spritesheet
      this.cx.drawImage(otherSprites, tileX + 1, 0, spriteWidth, height, x, y, spriteWidth, height);
    } else if (actor.type == "powerUp") {
      let tileX = 27.2 * gameSettings.scale; // set the tileX to the powerup sprite
      // Use the full width for powerup sprites
      this.cx.drawImage(otherSprites, tileX, 0, spriteWidth, height, x, y, width, height);
    }else if (actor.type == "conveyorBelt") {
      let frame = Math.floor(Date.now() / 100) % 3; // Change frame every 100ms, cycle through 3 frames
      let sx = frame * 21; // Move sx by 21 pixels for each frame (20 pixels width + 1 pixel padding)
      let sy = 0; // Assuming all frames are on the same row in the sprite sheet
      let sWidth = 20; // Source width (sprite width)
      let sHeight = 20; // Source height (sprite height)
      let dx = x; // Destination x-coordinate on the canvas
      let dy = y; // Destination y-coordinate on the canvas
      let dWidth = width; // Destination width
      let dHeight = height + 10; // Destination height
    
      this.cx.save(); // Save the current state
      if (actor.speed.x > 0) { // If the conveyor belt is moving left
        this.cx.translate(dx + dWidth / 2, dy + dHeight / 2); // Translate to the center of the conveyor belt
        this.cx.scale(-1, 1); // Flip horizontally
        this.cx.translate(-(dx + dWidth / 2), -(dy + dHeight / 2)); // Translate back
      }
    
      this.cx.drawImage(conveyorBeltSprites, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      this.cx.restore(); // Restore the state
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
              console.debug('Game starting after intro...');
              window.removeEventListener("keydown", handler);
              resolve();
          }
      });
  });

  // Now start the game levels
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[level]), Display);
    if (status == "won") {
        updateTotalScore(); // Update total score when a level is won
        levelCounter++;
        level++;
    } else if (status == "lost") {
        // Handle game over scenario, maybe reset totalScore or offer a retry
    }
}

console.debug("You've won the game!");
display.drawOutro(totalScore);
};

// Modify the runLevel function to check for player lives
function runLevel(level, Display) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;
  return new Promise((resolve) => {
      runAnimation((time) => {
          // Update the game state
          state = state.update(time, arrowKeys);

          // Sync the display with the new game state
          display.syncState(state);

          // If the game is still playing, continue the animation
          if (state.status == "playing") {
              // Check for player lives here
              if (playerLives <= 0) {
                  // Player has no lives left, show outro screen and end the game
                  display.drawOutro();
                  // Stop the animation loop
                  return false;
              }
              return true;
          } else if (ending > 0) {
              // The level is ending, continue for a bit
              ending -= time;
              return true;
          } else {
              // The level has ended, clear the display and resolve the promise
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
      console.debug(event.key, state);
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

