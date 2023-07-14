const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const logsFolder = path.join(__dirname, 'server logs');
fs.existsSync(logsFolder) || fs.mkdirSync(logsFolder);

const messagesFilePath = path.join(logsFolder, 'messages.txt');
const connectionsFilePath = path.join(logsFolder, 'connections.txt');
const disconnectionsFilePath = path.join(logsFolder, 'disconnections.txt');
const errorsFilePath = path.join(logsFolder, 'errors.txt');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  const clientAddress = `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
  const getCurrentTimestamp = () => new Date().toISOString();

  const logMessage = (filePath, message) => {
    fs.appendFile(filePath, `[${getCurrentTimestamp()}] ${message}\n`, (err) => {
      if (err) {
        console.error(err);
      }
    });
  };

  logMessage(connectionsFilePath, `Client connected: ${clientAddress}`);
  console.log(`Client connected: ${clientAddress}`);

  const handleMessage = (message) => {
    const receivedMessage = message.toString('utf8');

    if (receivedMessage === 'l') {
      handleLogin();
    } else if (receivedMessage === 'r') {
      handleRegistration();
    }
  };

  ws.on('message', handleMessage);

  const handleLogin = () => {
    ws.send('System3: Please enter your username');

    let attempts = 0;

    const handleUsername = (username) => {
      fs.readFile('database/logins.json', 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        const logins = JSON.parse(data);

        if (logins.hasOwnProperty(username)) {
          ws.removeListener('message', handleUsername);
          ws.send('System3: Please enter your password');

          let passwordAttempts = 0;

          const handlePassword = (password) => {
            if (logins[username] === password.toString()) {
              ws.removeListener('message', handlePassword);
              ws.send('System1: Welcome to the game world!');
              console.log(`Client logged in: ${clientAddress}`);

              // Check if character exists
              fs.readFile('database/characters.json', 'utf8', (err, charData) => {
                if (err) {
                  console.error(err);
                  return;
                }

                const characters = JSON.parse(charData);

                if (!characters.hasOwnProperty(username)) {
                  // Character does not exist, initiate character creation process
                  ws.send('System2: Character creation process...');
                  createCharacter(username);
                } else {
                  // Character exists, proceed with gameplay
                  // Attach the game command listener...
                }
              });
            } else {
              passwordAttempts++;
              if (passwordAttempts < 3) {
                ws.send(`System3: Incorrect password. ${3 - passwordAttempts} attempts remaining.`);
              } else {
                ws.removeListener('message', handlePassword);
                ws.send('System3: Exceeded maximum password attempts. Please try again later.');
              }
            }
          };

          ws.on('message', handlePassword);
        } else {
          attempts++;
          if (attempts < 3) {
            ws.send(`System3: Username not found. Please register or try again. ${3 - attempts} attempts remaining.`);
          } else {
            ws.removeListener('message', handleUsername);
            ws.send('System3: Exceeded maximum username attempts. Please try again later.');
          }
        }
      });
    };

    ws.on('message', handleUsername);
  };

  const handleRegistration = () => {
    ws.send('System3: Please enter your desired username');

    let attempts = 0;

    const handleUsername = (username) => {
      fs.readFile('database/logins.json', 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        const logins = JSON.parse(data);

        if (logins.hasOwnProperty(username)) {
          ws.send(`System3: Username '${username}' already exists. Please choose a different username.`);
        } else {
          ws.removeListener('message', handleUsername);
          ws.send(`System3: '${username}' is your desired username? (yes/no)`);

          const handleConfirmation = (confirmation) => {
            const confirmed = confirmation.toString().toLowerCase();

            if (confirmed === 'yes' || confirmed === 'y') {
              ws.removeListener('message', handleConfirmation);
              ws.send('System3: Please enter your desired password');

              let passwordAttempts = 0;

              const handlePassword = (password) => {
                ws.removeListener('message', handlePassword);
                ws.send('System3: Please confirm your password');

                const handleConfirmation = (passwordConfirmation) => {
                  ws.removeListener('message', handleConfirmation);
                  const confirmedPassword = passwordConfirmation.toString();

                  if (password.toString() === confirmedPassword) {
                    logins[username] = confirmedPassword;
                    const updatedLogins = JSON.stringify(logins);

                    fs.writeFile('database/logins.json', updatedLogins, (err) => {
                      if (err) {
                        console.error(err);
                      } else {
                        ws.send('System3: Registration complete. You may now login.');
                      }
                    });
                  } else {
                    ws.send("System3: Passwords don't match. Please try again.");
                  }
                };

                ws.on('message', handleConfirmation);
              };

              ws.on('message', handlePassword);
            } else if (confirmed === 'no' || confirmed === 'n') {
              ws.send('System3: Registration canceled. You may try again later.');
              ws.removeListener('message', handleConfirmation);
            } else {
              ws.send("System3: Invalid confirmation. Please enter 'yes' or 'no'.");
            }
          };

          ws.on('message', handleConfirmation);
        }
      });
    };

    ws.on('message', handleUsername);
  };

  const createCharacter = (username) => {
    const speciesOptions = ['human', 'elf', 'dwarf', 'halfling', 'halfgiant'];
    const archetypeOptions = ['fighter', 'rogue', 'mage'];
    const alignmentOptions = ['lawful', 'neutral', 'chaotic'];
    const stats = ['strength', 'constitution', 'dexterity', 'intelligence', 'wisdom', 'charisma'];

    const getRandomNumber = () => {
      return Math.floor(Math.random() * 6) + 1;
    };

    const character = {
      species: '',
      archetype: '',
      alignment: '',
      stats: {},
      money: getRandomNumber() + getRandomNumber() + getRandomNumber(),
      name: '',
    };

    const askSpecies = () => {
      ws.send('System3: Please choose a species:\n');
      speciesOptions.forEach((species, index) => {
        ws.send(`System3: ${index + 1}. ${species}`);
      });
      ws.on('message', (choice) => {
        const index = parseInt(choice.toString().trim(), 10);
        if (index >= 1 && index <= speciesOptions.length) {
          character.species = speciesOptions[index - 1];
          ws.send(`System3: You chose ${character.species}.\n`);
          askArchetype();
        } else {
          ws.send('System3: Invalid choice. Please choose a valid species.');
        }
      });
    };

    const askArchetype = () => {
      ws.send('System3: Please choose an archetype:\n');
      archetypeOptions.forEach((archetype, index) => {
        ws.send(`System3: ${index + 1}. ${archetype}`);
      });
      ws.on('message', (choice) => {
        const index = parseInt(choice.toString().trim(), 10);
        if (index >= 1 && index <= archetypeOptions.length) {
          character.archetype = archetypeOptions[index - 1];
          ws.send(`System3: You chose ${character.archetype}.\n`);
          askAlignment();
        } else {
          ws.send('System3: Invalid choice. Please choose a valid archetype.');
        }
      });
    };

    const askAlignment = () => {
      ws.send('System3: Please choose an alignment:\n');
      alignmentOptions.forEach((alignment, index) => {
        ws.send(`System3: ${index + 1}. ${alignment}`);
      });
      ws.on('message', (choice) => {
        const index = parseInt(choice.toString().trim(), 10);
        if (index >= 1 && index <= alignmentOptions.length) {
          character.alignment = alignmentOptions[index - 1];
          ws.send(`System3: You chose ${character.alignment}.\n`);
          generateStats();
        } else {
          ws.send('System3: Invalid choice. Please choose a valid alignment.');
        }
      });
    };

    const generateStats = () => {
      stats.forEach((stat) => {
        character.stats[stat] = getRandomNumber() + getRandomNumber() + getRandomNumber();
      });

      displayStats();
    };

    const displayStats = () => {
      ws.send('System3: Here are your character stats:\n');
      stats.forEach((stat) => {
        ws.send(`System3: ${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${character.stats[stat]}`);
      });

      ws.send(`System3: Your character's money: ${character.money}`);

      ws.send('System3: Please enter a name for your character.');
      ws.on('message', (name) => {
        character.name = name.toString().trim();
        ws.send(`System3: Your character name is ${character.name}.`);
        displayCharacter();
      });
    };

    const displayCharacter = () => {
      ws.send('System3: Here is your character:\n');
      Object.keys(character).forEach((property) => {
        if (property !== 'stats') {
          ws.send(`System3: ${property.charAt(0).toUpperCase() + property.slice(1)}: ${character[property]}`);
        }
      });

      // Save character data to the characters database
      fs.readFile('database/characters.json', 'utf8', (err, charData) => {
        if (err) {
          console.error(err);
          return;
        }

        const characters = JSON.parse(charData);
        characters[username] = character;
        const updatedCharacters = JSON.stringify(characters);

        fs.writeFile('database/characters.json', updatedCharacters, (err) => {
          if (err) {
            console.error(err);
          } else {
            ws.send('System3: Character creation complete. Let the game begin!');
          }
        });
      });
    };

    askSpecies();
  };

  ws.on('close', () => {
    logMessage(disconnectionsFilePath, `Client disconnected: ${clientAddress}`);
    console.log(`Client disconnected: ${clientAddress}`);
  });

  ws.on('error', (error) => {
    logMessage(errorsFilePath, `WebSocket error for ${clientAddress}: ${error}`);
  });
});

console.log("Server is online.");
