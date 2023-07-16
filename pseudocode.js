// Dependencies
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Server setup
const wss = new WebSocket.Server({ port: 8080 });

// File paths
const logsFolder = path.join(__dirname, 'server logs');
const databaseFolder = path.join(__dirname, 'database');

const loginsFilePath = path.join(databaseFolder, 'logins.json');
const charactersFilePath = path.join(databaseFolder, 'characters.json');
const messagesFilePath = path.join(logsFolder, 'messages.txt');
const connectionsFilePath = path.join(logsFolder, 'connections.txt');
const disconnectionsFilePath = path.join(logsFolder, 'disconnections.txt');
const errorsFilePath = path.join(logsFolder, 'errors.txt');

// Game data
const speciesOptions = ['human', 'elf', 'dwarf', 'halfling', 'halfgiant'];
const archetypeOptions = ['fighter', 'rogue', 'mage'];
const alignmentOptions = ['lawful', 'neutral', 'chaotic'];
const abilityScores = ['strength', 'constitution', 'dexterity', 'intelligence', 'wisdom', 'charisma'];

const inputModes = ['loginOrRegister', 'loginUsername', 'loginPassword', 'loginPasswordConfirm', 'registerUsername', 'registerUsernameConfirm',
              'registerPassword', 'registerPasswordConfirm', 'chCrSpecies', 'chCrArchetype', 'chCrAlignment', 'chCrAbilityScores',
              'chCrMoney', 'chCrName', 'mainGame'];

const passwordAttempts = 3;

const clients = {
    "netaddress:netport": {
        "username": "",
        "inputMode": "loginOrRegister",
        "characterName": "",
        "abilityScoresRerolls": 3,
        "timeAbilityScoresReroll": 0
    }
};

const logins = {
    "user1": {
        "netaddresses:netports": ["netaddress:netport"],
        "password": "pass1"
    },
    "user2": {
        "netaddresses:netports": ["netaddress:netport"],
        "password": "pass2"
    }
};

const loginsJSON = fs.readFileSync('database/logins.json', 'utf8');
const loginsObject = JSON.parse(loginsJSON);

const commands = {
    "a": "attack",
    "l": "login",
    "r": "register",
    "lk": "look",
    "mv": "move",
    "i": "item",
    "u": "use",
    "ex": "examine",
    "eq": "equip",
    "uneq": "unequip",
    "ch": "character"
};

const characters = {
    "username": {
        "name": "",
        "species": "", // human, elf, dwarf, halfling, halfgiant, beastkin, draconic, mutant
        "archetype": "", // fighter, rogue, mage
        "alignment": "", // lawful, neutral, chaotic
        "strength": 0,
        "constitution": 0,
        "dexterity": 0,
        "intelligence": 0,
        "wisdom": 0,
        "charisma": 0,
        "money": 0,
        "level": 1,
        "experience": 0
    }
};

wss.on('connection', (ws, req) => {
// clientAddress = net address : net port
// create client object with properties: clientaddress, username, inputMode, characterName
// add client object to list of current connections
// console log "clientAddress connected"
// console log amount of connections
})

ws.on('close', () => {
// Get the client's net address and port and form it into the clientAddress variable
// Log the clientAddress as disconnected
// Remove the client object from the list of current connections
// Log the current number of connected clients
});

ws.on('error', (error) => {
// Log WebSocket errors
});
