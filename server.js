const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'server logs');
const databaseFolder = path.join(__dirname, 'database');

const loginsFilePath = path.join(databaseFolder, 'logins.json');
const messagesFilePath = path.join(logsFolder, 'messages.txt');
const connectionsFilePath = path.join(logsFolder, 'connections.txt');
const disconnectionsFilePath = path.join(logsFolder, 'disconnections.txt');
const errorsFilePath = path.join(logsFolder, 'errors.txt');

const wss = new WebSocket.Server({ port: 8080 });
const speciesOptions = ['human', 'elf', 'dwarf', 'halfling', 'halfgiant'];
const archetypeOptions = ['fighter', 'rogue', 'mage'];
const alignmentOptions = ['lawful', 'neutral', 'chaotic'];
const stats = ['strength', 'constitution', 'dexterity', 'intelligence', 'wisdom', 'charisma'];

const inputModes = ['justConnected', 'loginUsername', 'loginPassword', 'loginPasswordConfirm', 'registerUsername', 'registerUsernameConfirm',
    'registerPassword', 'registerPasswordConfirm', 'chCrSpecies', 'chCrArchetype', 'chCrAlignment', 'chCrAbilityScores',
    'chCrMoney', 'chCrName', 'mainGame'];

const commands = {
    'a': 'attack',
    'l': 'login',
    'r': 'register',
    'lk': 'look',
    'mv': 'move',
    'i': 'item',
    'u': 'use',
    'ex': 'examine',
    'eq': 'equip',
    'uneq': 'unequip',
    'ch': 'character'
};

// let clients = [];
// let clientAddress = // netaddress and netport
// let currentTimeStamp = //new Date();
// let usernameAttempts = 0;
// let passwordAttempts = 0;
let tempLoginUsername = ''
let tempLoginPassword = ''
let tempRegisterUsername = ''
let tempRegisterPassword = ''

let character = {
    name: '',
    species: '', // human, elf, dwarf, halfling, halfgiant, beastkin, draconic, mutant
    archetype: '', // fighter, rogue, mage
    alignment: '', // lawful, neutral, chaotic
    strength: 0,
    constitution: 0,
    dexterity: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
    money: 0,
    level: 1,
    experience: 0
};

let user = {
    netaddress: '',
    netport: '',
    username: '',
    inputMode: 'justConnected',
    characterName: '',
    abilityScoresRerolls: 3,
    timeAbilityScoresReroll: 0 // sets to 24 hours to restore 1 ability score reroll after they use their 3 ability score rerolls
};

let logins = []; // Initialize the logins array

// Load user logins from logins.json
try {
    const loginsData = fs.readFileSync(loginsFilePath, 'utf8');
    logins = JSON.parse(loginsData);

    // Convert the logins data to an array of objects
    logins = Object.entries(logins).map(([username, password]) => ({ username, password }));
} catch (error) {
    console.error('Error loading logins:', error);
}

// Main server listener
wss.on('connection', (ws) => {
    console.log('A new client connected.');

    ws.on('message', (message) => {
        message = message.toString().trim()
        console.log(`Received message: ${message}`);

        if (message === 'l' && user.inputMode === 'justConnected') {
            user.inputMode = 'loginUsername';
            ws.send('color-white: Please enter your username.');
        }

        else if (message === 'r' && user.inputMode === 'justConnected') {
            user.inputMode = 'registerUsername';
            ws.send('color-white: Please register your username.');
        }

        else if (user.inputMode === 'loginUsername') {
            if (checkUserExists(message)) {
                tempLoginUsername = message;
                user.inputMode = 'loginPassword';
                ws.send('color-white: Please enter your password.');
            } else {
                ws.send('color-white: User not found.');
            }
        }

        else if (user.inputMode === 'loginPassword') {
            tempLoginPassword = message;
            if (checkCredentials(tempLoginUsername, tempLoginPassword)) {
                user.username = tempLoginUsername;
                tempLoginUsername = '';
                tempLoginPassword = '';
                ws.send('color-white: Login successful.')

                if (!user.character) {
                    user.inputMode = 'chCrSpecies';
                    ws.send(`color-white: It's your first time loggin in. Please create a character.`);
                    ws.send('color-white: Begin by choosing your character species.');
                } else {
                    user.inputMode = 'mainGame';
                    ws.send('color-white: Welcome to the game world!');
                }
            }
        }

        else if (user.inputMode === 'registerUsername') {
            tempRegisterUsername = message;
            user.inputMode = 'registerPassword';
            ws.send('color-white: Please register your password.');
        }

        else if (user.inputMode === 'registerPassword') {
            tempRegisterPassword = message;
            user.inputMode = 'registerPasswordConfirm';
            ws.send('color-white: Please confirm your password.');
        }

        else if (user.inputMode === 'registerPasswordConfirm') {
            if (message === tempRegisterPassword) {
                createUser(tempRegisterUsername, tempRegisterPassword);
                tempRegisterUsername = '';
                tempRegisterPassword = '';
                ws.send('color-white: Registration successful. Proceed to login.');
            } else {
                ws.send('color-white: Passwords do not match. Try again.');
                user.inputMode = 'registerPassword';
                ws.send('color-white: Please register your password.');
            }
        }
    });

    ws.on('close', () => {
        console.log('A client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('Server is online.');

// Function definitions

// Function to check if the username exists in logins
function checkUserExists(username) {
    for (const login of logins) {
        if (login.username === username) {
            return true;
        }
    }
    return false;
}

function checkCredentials(username, password) {
    const user = logins.find((login) => login.username === username);
    return user && user.password === password;
}

function createUser(username, password) {
    const newUser = { username, password };
    logins.push(newUser);
    saveLoginsToFile();
}

function saveLoginsToFile() {
    const loginsData = JSON.stringify(logins);
    fs.writeFileSync(loginsFilePath, loginsData, 'utf8');
}