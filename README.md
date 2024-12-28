# Toolio Super Bro

## Instructions
![Play instructions image](https://github.com/karl5252/Toolio/blob/main/img/instructions.png)

## Overview
This platformer game is an engaging web-based game where players control a character navigating through various levels filled with obstacles, enemies, coins, and lava. The game's objective is to collect coins, avoid or defeat enemies, and reach the level's exit to progress. The game features a physics engine for realistic movement and interaction within the game world.

## Features
- **Dynamic Levels:** Each level presents unique challenges with walls, platforms, lava pits, and more.
- **Player Character:** Control a character with abilities to move left or right, jump, and interact with the game environment.
- **Enemies:** Encounter different types of enemies like Hoopa and KeggaTroopa, each with unique behaviors.
- **Collectibles:** Collect coins scattered throughout the levels for points.
- **Physics Engine:** Experience realistic movement thanks to the game's physics for gravity and collision detection.

## Controls
- **Arrow Left/Right:** Move the player left or right.
- **Arrow Up:** Make the player jump.
- **Enter Key:** Start the game from the intro screen.

## Game Objects
### Player
The player character can move, jump, and interact with the environment. The player needs to avoid lava and enemies while collecting coins.

### Lava
Lava is a deadly obstacle. Touching lava results in an instant game over.

### Coin
Collecting coins increases the player's score. Coins are placed at various points in each level.

### PowerUp
Collecting powerup allows player to touch enemies without penalty once. 

### Hoopa and KeggaTroopa
These are enemy types in the game. Hoopa can be defeated by jumping on it, while KeggaTroopa becomes deadly when sliding.

## Technical Details
### `gameSettings`
Contains configuration for the game such as speed, gravity, and canvas dimensions.

### `createSprite`
Function to load and return sprite images for various game elements.

### `Vec`
A utility class for 2D vector operations, used for positions and movements.

### `Actor`, `Player`, `Lava`, `Coin`, `Hoopa`, `KeggaTroopa`
Classes representing different game entities, each with methods for creation, updates based on game physics, and interactions.

### `Level`
Manages the game level, including the layout and starting positions of actors.

### `State`
Represents the current state of the game, including all actors, the player's score, and the game status.

### `CanvasDisplay`
Manages rendering of the game on the canvas, including the game's background, actors, and UI elements like the score.

## Getting Started
To start the game, open the HTML file in a web browser. The game will load the intro screen, where pressing the Enter key begins the first level. Navigate through the level using the arrow keys, aiming to collect all coins and reach the exit without dying.

## Development
The game is built with HTML, CSS, and JavaScript. It uses the `<canvas>` element for rendering. Game logic is implemented in JavaScript, utilizing classes and functions for different game components.

### Adding Levels
Levels are defined as strings in an array, where different characters represent different level elements (e.g., walls, lava, coins). To add a new level, create a new string in the levels array with the desired layout.

### Extending Functionality
To add new features, such as additional enemy types or power-ups, define new classes for these entities and integrate them into the game loop and collision detection system.

## Conclusion
This platformer game offers a foundation for a fun and extendable game project. Its modular design allows for easy expansion and customization. Enjoy exploring and enhancing the game!


## Audio
Ownership and copyright of all included music is maintained by Joel R. Steudler.
Ownership of sounds effects is maintained by https://www.youtube.com/@jessicahartell1616
