import * as PIXI from 'pixi.js';
import spritesheetImage from './treasureHunter.png';
import spritesheetJSON from './treasureHunter.json';
import keyboard from './keyboard.js';
import collision from './collision.js';
import randomInt from './randomint.js';
import contain from './contain.js';

const Application = PIXI.Application;
const Container = PIXI.Container;
const loader = PIXI.loader;
const Graphics = PIXI.Graphics;
const Sprite = PIXI.Sprite;
const Text = PIXI.Text;
const TextStyle = PIXI.TextStyle;

// Create a Pixi Application
let app = new Application({
    width: 488,
    height: 488,
    antialias: true,
    transparent: false,
    resolution: 1
});
document.body.appendChild(app.view);

loader
    .load(setup);

let state;
let gameScene;
let gameOverScene;
let explorer;
let dungeon;
let door;
let treasure;
let blobs;
let healthBar;
let message;

function setup() {
    gameScene = new Container();
    app.stage.addChild(gameScene);

    // normally this wouldn't be this complex
    // but because we're using webpack and webpack by default
    // gives us .json files as json and not urls to the .json files
    // we need to use this fancy setup
    // discussed here https://github.com/pixijs/pixi.js/issues/4029
    // down the rabbit hole we go
    const baseTexture = new PIXI.BaseTexture.from(spritesheetImage, null, 1);
    const spritesheet = new PIXI.Spritesheet(baseTexture, spritesheetJSON);
    //console.log(spritesheet);
    spritesheet.parse(function (textures) {
        // finished preparing spritesheet textures
        //console.log(textures);

        dungeon = new Sprite(textures['dungeon.png']);
        gameScene.addChild(dungeon);

        door = new Sprite(textures['door.png']);
        door.position.set(32, 0);
        gameScene.addChild(door);

        treasure = new Sprite(textures['treasure.png']);
        treasure.x = gameScene.width - treasure.width - 48;
        treasure.y = gameScene.height / 2 - treasure.height / 2;
        gameScene.addChild(treasure);

        explorer = new Sprite(textures['explorer.png']);
        explorer.x = 68;
        explorer.y = gameScene.height / 2 - explorer.height / 2;
        explorer.vx = 0;
        explorer.vy = 0;
        gameScene.addChild(explorer);

        let blobAmount = 6;
        let blobSpacing = 48;
        let blobXOffset = 150;
        let blobSpeed = 2;
        let blobDirection = 1;

        blobs = [];

        for (let index = 0; index < blobAmount; index++) {

            let blob = new Sprite(textures['blob.png']);

            let x = blobSpacing * index + blobXOffset;
            let y = randomInt(0, app.stage.height - blob.height);

            blob.x = x;
            blob.y = y;
            blob.vy = blobSpeed * blobDirection;
            blobDirection *= -1;

            blobs.push(blob);

            gameScene.addChild(blob);
        }
    });

    healthBar = new Container();
    healthBar.position.set(app.stage.width - 170, 4);
    gameScene.addChild(healthBar);

    let innerBar = new Graphics();
    innerBar.beginFill(0x000000);
    innerBar.drawRect(0, 0, 128, 8);
    innerBar.endFill();
    healthBar.addChild(innerBar);

    let outerBar = new Graphics();
    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, 128, 8);
    outerBar.endFill();
    healthBar.addChild(outerBar);

    healthBar.outer = outerBar;

    gameOverScene = new Container();
    app.stage.addChild(gameOverScene);
    gameOverScene.visible = false;

    let gameOverStyle = new TextStyle({
        fontFamily: 'Avenir',
        fontSize: 48,
        fill: 'tomato'
    });
    message = new Text('That\'s all folks lmao', gameOverStyle);
    message.x = 120;
    message.y = app.stage.height / 2 - 32;
    gameOverScene.addChild(message);

    //Capture the keyboard arrow keys
    const left = keyboard(37);
    const up = keyboard(38);
    const right = keyboard(39);
    const down = keyboard(40);

    //Left arrow key `press` method
    left.press = () => {
        //Change the cat's velocity when the key is pressed
        explorer.vx = -5;
        explorer.vy = 0;
    };

    //Left arrow key `release` method
    left.release = () => {
    //If the left arrow has been released, and the right arrow isn't down,
    //and the cat isn't moving vertically:
    //Stop the cat
        if (!right.isDown && explorer.vy === 0) {
            explorer.vx = 0;
        }
    };

    //Up
    up.press = () => {
        explorer.vy = -5;
        explorer.vx = 0;
    };
    up.release = () => {
        if (!down.isDown && explorer.vx === 0) {
            explorer.vy = 0;
        }
    };

    //Right
    right.press = () => {
        explorer.vx = 5;
        explorer.vy = 0;
    };
    right.release = () => {
        if (!left.isDown && explorer.vy === 0) {
            explorer.vx = 0;
        }
    };

    //Down
    down.press = () => {
        explorer.vy = 5;
        explorer.vx = 0;
    };
    down.release = () => {
        if (!up.isDown && explorer.vx === 0) {
            explorer.vy = 0;
        }
    };

    state = play;

    app.ticker.add(delta => gameLoop(delta));
}
function gameLoop(delta) {
    state(delta);
}
function play(delta) {
    explorer.x += explorer.vx;
    explorer.y += explorer.vy;

    contain(explorer, {x: 28, y: 10, width: 488, height: 480});

    let explorerHit = false;

    blobs.forEach(function(blob) {
        blob.y += blob.vy;

        let blobHitsWall = contain(blob, {x: 28, y: 10, width: 488, height: 480});

        if (blobHitsWall === 'top' || blobHitsWall === 'bottom') {
            blob.vy *= -1;
        }

        if (collision(explorer, blob)) {
            explorerHit = true;
        }
    });

    if (explorerHit) {
        explorer.alpha = 0.5;
        healthBar.outer.width -= 1;
    } else {
        explorer.alpha = 1;
    }

    if (collision(explorer, treasure)) {
        treasure.x = explorer.x + 8;
        treasure.y = explorer.y + 8;
    }

    if (healthBar.outer.width <= 0) {
        state = end;
        message.text = 'loose';
    }

    if (collision(door, treasure)) {
        state = end;
        message.text = 'winrar';
    }
}
function end() {
    gameScene.visible = false;
    gameOverScene.visible = true;
}