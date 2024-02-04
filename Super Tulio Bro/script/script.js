var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;
const scale = 20;
var otherSprites = document.createElement("img");
otherSprites.src = "img/sprites.png";

var playerSprites = document.createElement("img");
playerSprites.src = "img/player.png";
var playerXOverlap = 4;

var monsterSprites = document.createElement("img");
monsterSprites.src = "img/monster.png";
var monsterXOverlap = 4;


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

class Player {
  constructor(pos, speed, isDead = false) {
    this.pos = pos;
    this.speed = speed;
    this.isDead = isDead;
    this.interactable = true;
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
  if (!state.level.touches(movedX, this.size, "wall") && !state.level.touches(movedX, this.size, "stone")) {    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall") && !state.level.touches(movedY, this.size, "stone")) {    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }


  //add check on state lost if player is dead
  if (state.status == "lost" && !this.isDead){
    this.isDead = true;

    return new Player(pos, new Vec(xSpeed, ySpeed), this.isDead);
  }else {
    return new Player(pos, new Vec(xSpeed, ySpeed), this.isDead);
  }
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

//add class Monster and its methods
class Monster {
  constructor(pos, speed, isDead = false, deadTime = 0) {
    this.pos = pos;
    this.speed = speed;
    this.isDead = isDead;
    this.interactable = true;
    this.deadTime = deadTime || 0;


  }

  get type() {
    return "monster";
  }

  static create(pos) {
    return new Monster(pos.plus(new Vec(0, -0.5)), new Vec(2, 0));
  }
}

Monster.prototype.size = new Vec(0.8, 1.5);

Monster.prototype.update = function(time, state) {
  if (this.isDead) {
    this.deadTime += time;
    if (this.deadTime > 1.5) { // 1.5 seconds death animation
      this.remove = true; // Mark the monster for removal
    } 
    return this; // Make the monster non-interactable
    }

  let newPos = this.pos.plus(this.speed.times(time));

  if (!state.level.touches(newPos, this.size, "wall") && !state.level.touches(newPos, this.size, "stone")) {
    return new Monster(newPos, this.speed, this.isDead, this.deadTime);
  } else {
    return new Monster(this.pos, this.speed.times(-1), this.isDead, this.deadTime);
  }
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
  "m": Monster,
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
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state) {
  return new State(state.level, state.actors, "lost");
};

Coin.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  if (!filtered.some(a => a.type == "coin")) status = "won";
  return new State(state.level, filtered, status);
};


Monster.prototype.collide = function(state) {
  let player = state.player;
  if (this.interactable && overlap(this, player)) {
    if (player.pos.y + player.size.y < this.pos.y + 0.5) {
      this.isDead = true;
      this.interactable = false;
      this.speed.x = 0;
      return new State(state.level, state.actors, state.status);
    } else {
      return new State(state.level, state.actors.filter(a => a != this), "lost");
    }
  }
  return new State(state.level, state.actors, state.status);
};

class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find((a) => a.type == "player");
  }

  update(time, keys) {
    let actors = this.actors.map((actor) => actor.update(time, this, keys));
    actors = actors.filter(actor => !actor.remove);
    let newState = new State(this.level, actors, this.status);

    if (newState.status != "playing") return newState;

    let player = newState.player;
    if (this.level.touches(player.pos, player.size, "lava")) {
      return new State(this.level, actors, "lost");
    }

    for (let actor of actors) {
      if (actor != player && overlap(actor, player)) {
        newState = actor.collide(newState);
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
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(800, level.width * scale);
    this.canvas.height = Math.min(600, level.height * scale);
    parent.appendChild(this.canvas);
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
    this.canvas.remove();
  }

  syncState(state) {
    this.updateViewport(state);
    this.clearDisplay(state.status);
    this.drawBackground(state.level);
    this.drawActors(state.actors);


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
 * Draws the monster on the canvas.
 *
 * @param {Monster} monster The monster object, which includes properties for speed.
 * @param {int} x The x-coordinate where the monster should be drawn.
 * @param {int} y The y-coordinate where the monster should be drawn.
 * @param {float} width The width of the monster's sprite.
 * @param {float} height The height of the monster's sprite.
 */
drawMonster(monster, x, y, width, height) {
  // Adjust the width and x-coordinate based on the monster's overlap.
  width += monsterXOverlap * 2;
  x -= monsterXOverlap;

  // Determine whether to flip the monster's sprite based on the monster's x speed.
  if (monster.speed.x != 0) {
    this.flipMonster = monster.speed.x < 0;
  }

  // Choose a tile from the monster's sprite sheet based on the monster's speed.
  let tile = 8;
  if (monster.isDead && monster.deadTime < 1.5) {
    console.log("Drawing dead monster");
    tile = 10;
  } else if (monster.speed.y != 0) {
    tile = 9;
  } else if (monster.speed.x != 0) {
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
    monsterSprites,
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
      else if (actor.type == "monster") {
        this.drawMonster(actor, x, y, width, height);
      }
      else {
        let tileX = (actor.type == "coin" ? 2 : 1) * scale;
        this.cx.drawImage(
          otherSprites,
          tileX,
          0,
          width,
          height,
          x,
          y,
          width,
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
  let display = new Display(
    document.body,
    level
  );
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
  return down;
}

function drawStatus(state, context) {
  context.font = '20px Arial';
  context.fillStyle = 'black';
  
  let levelText = `Level: ${state.level}`;
  let scoreText = `Score: ${state.score}`;
  let coinsCollectedText = `Coins Collected: ${state.coinsCollected}`;

  context.fillText(levelText, 10, 30);
  context.fillText(scoreText, 10, 60);
  context.fillText(coinsCollectedText, 10, 90);
}


//runGame([simpleLevelPlan], CanvasDisplay);
