const WebSocket = require('ws');
const fs = require('fs');

function startServer() {
    let clients = {};
    let logins = {};
    let characters = {};

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
        ws.clientAddress = req.socket.remoteAddress + ':' + req.socket.remotePort;
        const { clientAddress } = ws;
        console.log(`\n${clientAddress} connected.`);
        ws.send(':lightpurple: Connected to the server.');
        ws.send(':lightpurple: Please login or register.');

        clients[clientAddress] = {
            username: '',
            inputMode: 'loginOrRegister',
            loginUsernameAttempts: 2,
            loginPasswordAttempts: 2,
            registerUsernameAttempts: 2,
            registerPasswordAttempts: 2
        };

        console.log('Number of connected clients:', Object.keys(clients).length);
        console.log(Object.keys(clients), '\n');

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
                    if (clients[clientAddress].loginUsernameAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Login failed. Please try again.');
                        clients[clientAddress].loginUsernameAttempts = 2;
                    } else {
                        ws.send('User not found.');
                        --clients[clientAddress].loginUsernameAttempts;
                    }
                }
            }

            if (inputMode === 'loginPassword') {
                const tempLoginPassword = message;

                if (logins[clients[clientAddress].username]?.password === tempLoginPassword) {
                    clients[clientAddress].inputMode = 'chCrSpecies';
                    console.log(`${clientAddress} logged in.`)
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
                        ws.send("Please create a character.<br><br>");
                        ws.send("Choose your species.<br><br>(h) Human<br>(e) Elf<br>(d) Dwarf");
                    } else {
                        ws.send(`Welcome to the game world, ${characters[clients[clientAddress].username].name}.`);

                        if (!logins[clients[clientAddress].username]?.netAddresses.includes(clientAddress)) {
                            logins[clients[clientAddress].username]?.netAddresses.push(clientAddress);
                        }
                    }

                } else {
                    if (clients[clientAddress].loginPasswordAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Login failed. Please login or register.');
                        clients[clientAddress].loginPasswordAttempts = 2;
                    } else {
                        ws.send('Incorrect password. Try again.');
                        --clients[clientAddress].loginPasswordAttempts;
                    }
                }
            }

            if (inputMode === 'registerUsername') {
                const tempRegisterUsername = message;

                if (logins[tempRegisterUsername]) {
                    if (clients[clientAddress].loginUsernameAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Registration failed. Please login or register.');
                        clients[clientAddress].loginUsernameAttempts = 2;
                    } else {
                        ws.send('Username already exists. Please choose a different username.');
                        --clients[clientAddress].registerUsernameAttempts;
                    }
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
                        netAddresses: [],
                        password: tempRegisterPassword
                    };

                    logins[tempRegisterUsername].netAddresses.push(clientAddress);
                    console.log(`${tempRegisterUsername} created an account.`);
                    console.log(logins[tempRegisterUsername]);
                    clients[clientAddress].tempRegisterUsername = '';
                    clients[clientAddress].tempRegisterPassword = '';
                    clients[clientAddress].inputMode = 'loginOrRegister';
                    ws.send('Registration successful. Proceed to login.');
                } else {
                    if (clients[clientAddress].registerPasswordAttempts === 0) {
                        clients[clientAddress].inputMode = 'loginOrRegister';
                        ws.send(':lightpurple: Registration failed. Please login or register.');
                        clients[clientAddress].registerPasswordAttempts = 2;
                    } else {
                        ws.send('Passwords do not match. Please register your password.');
                        --clients[clientAddress].registerPasswordAttempts;
                        clients[clientAddress].inputMode = 'registerPassword';
                    }
                }
            }

            if (inputMode === 'chCrSpecies') {
                if (message === 'h' || message === 'human') {
                    const species = 'Human';
                    characters[clients[clientAddress].username].species = species;
                    ws.send(`You chose ${species}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrArchetype'
                    ws.send("Choose your archetype.<br><br>(f) Fighter<br>(r) Rogue<br>(m) Mage");
                } else if (message === 'e' || message === 'elf') {
                    const species = 'Elf';
                    characters[clients[clientAddress].username].species = species;
                    ws.send(`You chose ${species}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrArchetype'
                    ws.send("Choose your archetype.<br><br>(f) Fighter<br>(r) Rogue<br>(m) Mage");
                } else if (message === 'd' || message === 'dwarf') {
                    const species = 'Dwarf';
                    characters[clients[clientAddress].username].species = species;
                    ws.send(`You chose ${species}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrArchetype'
                    ws.send("Choose your archetype.<br><br>(f) Fighter<br>(r) Rogue<br>(m) Mage");
                }
            }

            if (inputMode === 'chCrArchetype') {
                if (message === 'f' || message === 'fighter') {
                    const archetype = 'Fighter';
                    characters[clients[clientAddress].username].archetype = archetype;
                    ws.send(`You chose ${archetype}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrAlignment'
                    ws.send("Choose your alignment.<br><br>(l) Lawful<br>(n) Neutral<br>(c) Chaotic");
                } else if (message === 'r' || message === 'rogue') {
                    const archetype = 'Rogue';
                    characters[clients[clientAddress].username].archetype = archetype;
                    ws.send(`You chose ${archetype}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrAlignment'
                    ws.send("Choose your alignment.<br><br>(l) Lawful<br>(n) Neutral<br>(c) Chaotic");
                } else if (message === 'm' || message === 'mage') {
                    const archetype = 'Mage';
                    characters[clients[clientAddress].username].archetype = archetype;
                    ws.send(`You chose ${archetype}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrAlignment'
                    ws.send("Choose your alignment.<br><br>(l) Lawful<br>(n) Neutral<br>(c) Chaotic");
                }
            }

            if (inputMode === 'chCrAlignment') {
                if (message === 'l' || message === 'lawful') {
                    const alignment = 'Lawful';
                    characters[clients[clientAddress].username].alignment = alignment;
                    ws.send(`You chose ${alignment}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrName'
                    ws.send("Enter your character's name.");
                } else if (message === 'n' || message === 'neutral') {
                    const alignment = 'Neutral';
                    characters[clients[clientAddress].username].alignment = alignment;
                    ws.send(`You chose ${alignment}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrName'
                    ws.send("Enter your character's name.");
                } else if (message === 'c' || message === 'chaotic') {
                    const alignment = 'Chaotic';
                    characters[clients[clientAddress].username].alignment = alignment;
                    ws.send(`You chose ${alignment}.<br><br>`);
                    clients[clientAddress].inputMode = 'chCrName'
                    ws.send("Enter your character's name.");
                }
            }

            if (inputMode === 'chCrName') {
                if (message != '') {
                    characters[clients[clientAddress].username].name = message
                    ws.send(`Your character's name is ${message}`)
                    console.log(`Character created for ${clients[clientAddress].username}`);
                    console.log(characters[clients[clientAddress].username])
                }
            }
        });
        
        ws.on('close', () => {
            console.log(`\n${clientAddress} disconnected.`);
            delete clients[clientAddress];
            console.log('Number of connected clients:', Object.keys(clients).length);
            console.log(Object.keys(clients), '\n');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    process.on('SIGINT', () => {
        console.log('Cleaning up and exiting gracefully...');
        fs.writeFileSync('database/logins.json', JSON.stringify(logins), 'utf8');
        fs.writeFileSync('database/characters.json', JSON.stringify(characters), 'utf8');
        process.exit();
    });

    console.log('Server is online.');
}

startServer();