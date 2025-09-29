//region Variables

const COLORS = {
    RED: { hex: '#FF0000', displayName: 'Red', start: { x: -359, y: 70, z: 1366 }, end: { x: -356, y: 70, z: 1372 } },
    GREEN: { hex: '#00FF00', displayName: 'Green', start: { x: -356, y: 70, z: 1370 }, end: { x: -359, y: 70, z: 1376 } },
    BLUE: { hex: '#0000FF', displayName: 'Blue', start: { x: -360, y: 70, z: 1369 }, end: { x: -361, y: 70, z: 1372 } },
}

const STARTING_BLOCK =  { x: -362, y: 70, z: 1367 };
const GAME_AREA_X_LENGTH = 9;
const GAME_AREA_Z_LENGTH = 9;

//endregion



//region Initial code to create the map

for (const colorsKey of Object.keys(COLORS)) {
    COLORS[colorsKey].id = colorsKey;
}

const EVENT_LISTENERS = [];

let activeColor = null;

const CONNECTING_BLOCKS_D3D = Hud.createDraw3D();
CONNECTING_BLOCKS_D3D.register();
const CONNECTING_BLOCKS = new Map();
setConnectingBlocks();

const PLAYER_BLOCKS_D3D = Hud.createDraw3D();
PLAYER_BLOCKS_D3D.register();
const PLAYER_BLOCKS = new Map();
setPlayerBlocks();



function setConnectingBlocks() {
    for (const colorsKey of Object.keys(COLORS)) {
        const color = COLORS[colorsKey];

        const blocks = [
            { x: color.start.x, y: color.start.y, z: color.start.z, color: color.id },
            { x: color.end.x, y: color.end.y, z: color.end.z, color: color.id }
        ];

        for (const block of blocks) {
            CONNECTING_BLOCKS.set(getMapIdentifier(block.x, block.y, block.z), block);
            addBox(CONNECTING_BLOCKS_D3D, block.x, block.y, block.z, color.hex, 150);
        }
    }
}

function setPlayerBlocks() {
    for (let xAxis = 0; xAxis < GAME_AREA_X_LENGTH; xAxis++) {
        for (let zAxis = 0; zAxis < GAME_AREA_Z_LENGTH; zAxis++) {
            const block = { x: STARTING_BLOCK.x + xAxis, y: STARTING_BLOCK.y, z: STARTING_BLOCK.z + zAxis, color: null };
            const identifier = getMapIdentifier(block.x, block.y, block.z);

            if (CONNECTING_BLOCKS.has(identifier)) {
                continue;
            }

            PLAYER_BLOCKS.set(identifier, block);
        }
    }

    updateMap();
}

//endregion



//region Kill Event Listener

JsMacros.createCustomEvent("KillScripts_E794735C-0573-4843-96FE-CBABBDAB42C8").registerEvent();
EVENT_LISTENERS.push(JsMacros.on("KillScripts_E794735C-0573-4843-96FE-CBABBDAB42C8",
    JavaWrapper.methodToJava((event) => {
        try {
            EVENT_LISTENERS.forEach(eventListener => eventListener.off());
            CONNECTING_BLOCKS_D3D.unregister();
            PLAYER_BLOCKS_D3D.unregister();
        } catch (error) {
            showError(error);
        }
    })
));

//endregion



//region Interact Block Listener

EVENT_LISTENERS.push(JsMacros.on("InteractBlock", JavaWrapper.methodToJava((event) => {
    try {
        if (event?.block?.getId() !== 'minecraft:stone_button') {
            return;
        }

        const identifier = getMapIdentifier(event.block.getX(), event.block.getY(), event.block.getZ());

        const connectingBlock = CONNECTING_BLOCKS.get(identifier);
        if (connectingBlock) {
            activeColor = connectingBlock.color;
            Chat.log('Your active color is now: ' + COLORS[connectingBlock.color].displayName);
            return;
        }

        const playerBlock = PLAYER_BLOCKS.get(identifier);
        if (playerBlock) {
            if (!activeColor) {
                Chat.log('Please select a color!');
                return;
            }

            playerBlock.color = playerBlock.color === activeColor ? null : activeColor;
            PLAYER_BLOCKS.set(identifier, playerBlock);

            updateMap();
            return;
        }
    } catch (error) {
        showError(error);
    }
})));

//endregion



//region Help Functions

function showError(error) {
    Chat.log('ERROR in color-flow-puzzle.js: ' + error);
}

function updateMap() {
    for (const box of PLAYER_BLOCKS_D3D.getBoxes()) {
        PLAYER_BLOCKS_D3D.removeBox(box);
    }

    for (const playerBlockKey of PLAYER_BLOCKS.keys()) {
        const block = PLAYER_BLOCKS.get(playerBlockKey);
        if (!block.color) {
            continue;
        }

        addBox(PLAYER_BLOCKS_D3D, block.x, block.y, block.z, COLORS[block.color].hex, 25);
    }

    const colorsFinished = getFinishedColorsMap();
    for (const colorsFinishedKey of colorsFinished.keys()) {
        for (const block of colorsFinished.get(colorsFinishedKey)) {
            addBox(PLAYER_BLOCKS_D3D, block.x, block.y, block.z, COLORS[colorsFinishedKey].hex, 100);
        }
    }

    if (colorsFinished.size === Object.keys(COLORS).length) {
        Chat.log("YOU DID IT!")
    }
}

// Function is just there in case the identifier ever needs to change
function getMapIdentifier(x, y, z) {
    return 'X:' + x + ';Y:' + y + ';Z:' + z;
}

function addBox(d3d, x, y, z, color, opacity) {
    if (!color) {
        return;
    }

    const existingBox = d3d.getBoxes().find(b => b.x === x && b.y === y && b.z === z);
    if (existingBox) {
        d3d.removeBox(existingBox);
    }

    d3d.addBox(x, y, z, (x + 1), (y + 1), (z + 1), 0, 0, Number('0x' + color.replace('#', '')), opacity, true);
}

function getFinishedColorsMap() {
    const finishedColorsMap = new Map();

    for (const colorKey of Object.keys(COLORS)) {
        const finishedColorStack = getFinishedColorStack([COLORS[colorKey].start], colorKey);
        if (finishedColorStack) {
            finishedColorsMap.set(colorKey, finishedColorStack);
        }
    }

    return finishedColorsMap;
}

function getFinishedColorStack(stack, color) {
    const currentBlock = stack[stack.length - 1];

    const neighbours = [
        { x: currentBlock.x + 1, y: currentBlock.y, z: currentBlock.z },
        { x: currentBlock.x - 1, y: currentBlock.y, z: currentBlock.z },
        { x: currentBlock.x, y: currentBlock.y, z: currentBlock.z + 1 },
        { x: currentBlock.x, y: currentBlock.y, z: currentBlock.z - 1 },
    ];

    for (const neighbour of neighbours) {
        if (COLORS[color].end.x === neighbour.x && COLORS[color].end.y === neighbour.y && COLORS[color].end.z === neighbour.z) {
            stack.push(neighbour);
            return stack;
        }

        const block = PLAYER_BLOCKS.get(getMapIdentifier(neighbour.x, neighbour.y, neighbour.z));
        if (!block
            || block.color !== color
            || stack.find(s => s.x === neighbour.x && s.y === neighbour.y && s.z === neighbour.z)) {
                continue;
        }

        let newStack = [...stack];
        newStack.push(neighbour);
        newStack = getFinishedColorStack(newStack, color);

        if (newStack) {
            return newStack;
        }
    }

    return null;
}


//endregion