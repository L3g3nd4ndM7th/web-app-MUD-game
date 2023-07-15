const WebSocket = require('ws');
const fs = require('fs');
const wss = new WebSocket.Server({ port: 8080 });

let clients = {};
let logins = {};
try {
    const loginsData = fs.readFileSync('database/logins.json', 'utf8');
    logins = JSON.parse(loginsData);
} catch (error) {
    console.error('Error loading logins:', error);
}

wss.on('connection', (ws, req) => {
    const clientAddress = req.socket.remoteAddress + ':' + req.socket.remotePort;
    console.log(`${clientAddress} has connected.`);

    clients[clientAddress] = {
        username: '',
        inputMode: 'loginOrRegister',
        characterName: '',
        abilityScoresRerolls: 3,
        timeAbilityScoresReroll: 0,
    };

    console.log('Number of connected clients:', Object.keys(clients).length);

    ws.on('message', (message) => {
        const clientAddress = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
        message = message.toString().trim();
        console.log(`Received message: ${message}`);

        const { inputMode } = clients[clientAddress];

        if (message === 'l' && inputMode === 'loginOrRegister') {
            clients[clientAddress].inputMode = 'loginUsername';
            ws.send('color-white: Please enter your username.');
        } 
        
        else if (message === 'r' && inputMode === 'loginOrRegister') {
            clients[clientAddress].inputMode = 'registerUsername';
            ws.send('color-white: Please register your username.');
        } 
        
        else if (inputMode === 'loginUsername') {
            const tempLoginUsername = message;
            if (logins[tempLoginUsername]) {
                clients[clientAddress].inputMode = 'loginPassword';
                clients[clientAddress].username = tempLoginUsername;
                ws.send('color-white: Please enter your password.');
            } else {
                ws.send('color-white: User not found.');
            }
        } 
        
        else if (inputMode === 'loginPassword') {
            const tempLoginPassword = message;
            if (logins[clients[clientAddress].username]?.password === tempLoginPassword) {
                clients[clientAddress].inputMode = 'chCrSpecies';
                ws.send(`color-white: It's your first time logging in. Please create a character.`);
                ws.send('color-white: Begin by choosing your character species.');
            } else {
                ws.send('color-white: Passwords do not match. Try again.');
                clients[clientAddress].inputMode = 'loginPassword';
                ws.send('color-white: Please enter your password.');
            }
        } 
        
        else if (inputMode === 'registerUsername') {
            const tempRegisterUsername = message;
            if (logins[tempRegisterUsername]) {
                ws.send('color-white: Username already exists. Please choose a different username.');
                return;
            }
            clients[clientAddress].inputMode = 'registerPassword';
            clients[clientAddress].tempRegisterUsername = tempRegisterUsername;
            ws.send('color-white: Please register your password.');
        } 
        
        else if (inputMode === 'registerPassword') {
            const tempRegisterPassword = message;
            clients[clientAddress].inputMode = 'registerPasswordConfirm';
            clients[clientAddress].tempRegisterPassword = tempRegisterPassword;
            ws.send('color-white: Please confirm your password.');
        } 
        
        else if (inputMode === 'registerPasswordConfirm') {
            const { tempRegisterUsername, tempRegisterPassword } = clients[clientAddress];
            if (message === tempRegisterPassword) {
                logins[tempRegisterUsername] = {
                    netAddresses: logins[tempRegisterUsername]?.netAddresses || [],
                    password: tempRegisterPassword,
                };
                logins[tempRegisterUsername].netAddresses.push(clientAddress);
                fs.writeFileSync('database/logins.json', JSON.stringify(logins), 'utf8');
                clients[clientAddress].tempRegisterUsername = '';
                clients[clientAddress].tempRegisterPassword = '';
                clients[clientAddress].inputMode = 'loginOrRegister'
                ws.send('color-white: Registration successful. Proceed to login.');
            } else {
                ws.send('color-white: Passwords do not match. Try again.');
                clients[clientAddress].inputMode = 'registerPassword';
                ws.send('color-white: Please register your password.');
            }
        }
    });

    ws.on('close', () => {
        console.log(`${clientAddress} disconnected.`);
        delete clients[clientAddress];
        console.log('Number of connected clients:', Object.keys(clients).length);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('Server is online.');
