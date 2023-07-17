const WebSocket = require('ws');
const fs = require('fs');

function startServer() {
    let clients = {};
    let logins = {};
    let characters = {};
    let loginUsernameAttempts = 2;
    let loginPasswordAttempts = 2;
    let registerPasswordAttempts = 2;

    // Read logins data from file
    try {
        const loginsData = fs.readFileSync('database/logins.json', 'utf8');
        logins = JSON.parse(loginsData);
    } catch (error) {
        console.error('Error loading logins:', error);
    }

    // Read characters data from file
    try {
        const charactersData = fs.readFileSync('database/characters.json', 'utf8');
        characters = JSON.parse(charactersData);
    } catch (error) {
        console.error('Error loading characters:', error);
    }

    const wss = new WebSocket.Server({ port: 8080 });

    wss.on('connection', (ws, req) => {
        const clientAddress = req.socket.remoteAddress + ':' + req.socket.remotePort;
        console.log(`${clientAddress} has connected.`);
        ws.send(':lightpurple: Connected to the server.');
        ws.send(':lightpurple: Please login or register.');

        clients[clientAddress] = {
            username: '',
            inputMode: 'loginOrRegister',
            characterName: '',
            abilityScoresRerolls: 3,
            timeAbilityScoresReroll: 0
        };

        console.log('Number of connected clients:', Object.keys(clients).length);

        ws.on('message', (message) => {
            const { inputMode } = clients[clientAddress];
            message = message.toString().trim();
            console.log(`Received message: ${message}`);

            // Handle message based on input mode
            if (inputMode === 'loginOrRegister') {
                if (message === 'l') {
                    clients[clientAddress].inputMode = 'loginUsername';
                    ws.send('Please enter your username.');
                } else if (message === 'r') {
                    clients[clientAddress].inputMode = 'registerUsername';
                    ws.send('Please register your username.');
                } else {
                    ws.send('Type l or r to login or register.');
                }
            }

            if (inputMode === 'loginUsername') {
                const tempLoginUsername = message;

                if (logins[tempLoginUsername]) {
                    clients[clientAddress].inputMode = 'loginPassword';
                    clients[clientAddress].username = tempLoginUsername;
                    ws.send('Please enter your password.');
                } else {
                    if (loginUsernameAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Login failed. Please try again.');
                        loginUsernameAttempts = 2;
                    } else {
                        ws.send('User not found.');
                        --loginUsernameAttempts;
                    }
                }
            }

            if (inputMode === 'loginPassword') {
                const tempLoginPassword = message;

                if (logins[clients[clientAddress].username]?.password === tempLoginPassword) {
                    clients[clientAddress].inputMode = 'chCrSpecies';
                    console.log(clients[clientAddress]);

                    if (!characters[clients[clientAddress].username]) {
                        const character = {
                            name: 'Adventurer',
                            species: '',
                            archetype: '',
                            alignment: '',
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

                        characters[clients[clientAddress].username] = character;
                        console.log(`Character created for ${clients[clientAddress].username}`);
                        ws.send("Please create a character.\n\n");
                        ws.send("Begin by choosing your character species.\n\n1. Human\n2. Elf\n3. Dwarf");
                    } else {
                        ws.send(`Welcome to the game world, ${characters[clients[clientAddress].username].name}.`);
                    }
                } else {
                    if (loginPasswordAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Login failed. Please login or register.');
                        loginPasswordAttempts = 2;
                    } else {
                        ws.send('Incorrect password. Try again.');
                        --loginPasswordAttempts;
                    }
                }
            }

            if (inputMode === 'registerUsername') {
                const tempRegisterUsername = message;

                if (logins[tempRegisterUsername]) {
                    ws.send('Username already exists. Please choose a different username.');
                } else {
                    ws.send(`Your username is "${message}"`);
                    clients[clientAddress].inputMode = 'registerPassword';
                    clients[clientAddress].tempRegisterUsername = tempRegisterUsername;
                    ws.send('Please register your password.');
                }
            }

            if (inputMode === 'registerPassword') {
                const tempRegisterPassword = message;
                clients[clientAddress].inputMode = 'registerPasswordConfirm';
                clients[clientAddress].tempRegisterPassword = tempRegisterPassword;
                ws.send('Please confirm your password.');
            }

            if (inputMode === 'registerPasswordConfirm') {
                const { tempRegisterUsername, tempRegisterPassword } = clients[clientAddress];

                if (message === tempRegisterPassword) {
                    logins[tempRegisterUsername] = {
                        netAddresses: logins[tempRegisterUsername]?.netAddresses || [],
                        password: tempRegisterPassword,
                        character: ''
                    };

                    logins[tempRegisterUsername].netAddresses.push(clientAddress);
                    console.log(`${tempRegisterUsername} created an account.`);
                    console.log(logins[tempRegisterUsername]);
                    clients[clientAddress].tempRegisterUsername = '';
                    clients[clientAddress].tempRegisterPassword = '';
                    clients[clientAddress].inputMode = 'loginOrRegister';
                    ws.send('Registration successful. Proceed to login.');
                } else {
                    if (registerPasswordAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Registration failed. Please login or register.');
                        registerPasswordAttempts = 2;
                    } else {
                        ws.send('Passwords do not match. Please register your password.');
                        --registerPasswordAttempts;
                        clients[clientAddress].inputMode = 'registerPassword';
                    }
                }
            }

            if (inputMode === 'chCrSpecies') {
                if (message === 'h' || message === 'human') {
                    // Handle Human species
                } else if (message === 'e' || message === 'elf') {
                    // Handle Elf species
                } else if (message === 'd' || message === 'dwarf') {
                    // Handle Dwarf species
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
    })
    
    process.on('SIGINT', () => {
        console.log('Cleaning up and exiting gracefully...');
        fs.writeFileSync('database/logins.json', JSON.stringify(logins), 'utf8');
        fs.writeFileSync('database/characters.json', JSON.stringify(characters), 'utf8');
        process.exit();
    });
    
    console.log('Server is online.');
}

startServer();
