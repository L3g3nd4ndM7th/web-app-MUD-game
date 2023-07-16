const WebSocket = require('ws');
const fs = require('fs');

class Server {
  constructor() {
    this.clients = {};
    this.logins = {};
    this.loginUsernameAttempts = 2;
    this.loginPasswordAttempts = 2;
    this.registerPasswordAttempts = 2;
    this.wss = new WebSocket.Server({ port: 8080 });

    try {
      const loginsData = fs.readFileSync('database/logins.json', 'utf8');
      this.logins = JSON.parse(loginsData);
    } catch (error) {
      console.error('Error loading logins:', error);
    }

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('Server is online.');
  }

  handleConnection(ws, req) {
    const clientAddress = req.socket.remoteAddress + ':' + req.socket.remotePort;
    console.log(`${clientAddress} has connected.`);
    ws.send(':lightpurple: Connected to the server.');
    ws.send(':lightpurple: Please login or register.');

    this.clients[clientAddress] = {
      username: '',
      inputMode: 'loginOrRegister',
      characterName: '',
      abilityScoresRerolls: 3,
      timeAbilityScoresReroll: 0,
    };

    console.log('Number of connected clients:', Object.keys(this.clients).length);

    ws.on('message', (message) => {
      this.handleMessage(ws, clientAddress, message);
    });

    ws.on('close', () => {
      this.handleClose(clientAddress);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  handleMessage(ws, clientAddress, message) {
    const { inputMode } = this.clients[clientAddress];
    message = message.toString().trim();
    console.log(`Received message: ${message}`);

    if (inputMode === 'loginOrRegister') {
      if (message === 'l') {
        this.clients[clientAddress].inputMode = 'loginUsername';
        ws.send('Please enter your username.');
      } else if (message === 'r') {
        this.clients[clientAddress].inputMode = 'registerUsername';
        ws.send('Please register your username.');
      } else {
        ws.send('Type l or r to login or register.');
      }
    }

    if (inputMode === 'loginUsername') {
      const tempLoginUsername = message;

      if (this.logins[tempLoginUsername]) {
        this.clients[clientAddress].inputMode = 'loginPassword';
        this.clients[clientAddress].username = tempLoginUsername;
        ws.send('Please enter your password.');
      } else {
        if (this.loginUsernameAttempts === 0) {
          this.clients[clientAddress].inputMode = 'loginOrRegister';
          ws.send(':lightpurple: Login failed. Please try again.');
          this.loginUsernameAttempts = 2;
        } else {
          ws.send('User not found.');
          --this.loginUsernameAttempts;
        }
      }
    }

    if (inputMode === 'loginPassword') {
      const tempLoginPassword = message;

      if (this.logins[this.clients[clientAddress].username]?.password === tempLoginPassword) {
        this.clients[clientAddress].inputMode = 'chCrSpecies';
        console.log(this.clients);
        ws.send("It's your first time logging in. Please create a character.");
        ws.send(`Begin by choosing your character species.<br><br>
                         1. Human <br>2. Elf <br>3. Dwarf <br>4. Halfling <br>5. Halfgiant`);
      } else {
        if (this.loginPasswordAttempts === 0) {
          this.clients[clientAddress].inputMode = 'loginOrRegister';
          ws.send(':lightpurple: Login failed. Please login or register.');
          this.loginPasswordAttempts = 2;
        } else {
          ws.send('Incorrect password. Try again.');
          --this.loginPasswordAttempts;
        }
      }
    }

    if (inputMode === 'registerUsername') {
      const tempRegisterUsername = message;

      if (this.logins[tempRegisterUsername]) {
        ws.send('Username already exists. Please choose a different username.');
      } else {
        ws.send(`Your username is "${message}"`);
        this.clients[clientAddress].inputMode = 'registerPassword';
        this.clients[clientAddress].tempRegisterUsername = tempRegisterUsername;
        ws.send('Please register your password.');
      }
    }

    if (inputMode === 'registerPassword') {
      const tempRegisterPassword = message;
      this.clients[clientAddress].inputMode = 'registerPasswordConfirm';
      this.clients[clientAddress].tempRegisterPassword = tempRegisterPassword;
      ws.send('Please confirm your password.');
    }

    if (inputMode === 'registerPasswordConfirm') {
      const { tempRegisterUsername, tempRegisterPassword } = this.clients[clientAddress];

      if (message === tempRegisterPassword) {
        this.logins[tempRegisterUsername] = {
          netAddresses: this.logins[tempRegisterUsername]?.netAddresses || [],
          password: tempRegisterPassword,
          character: '',
        };

        this.logins[tempRegisterUsername].netAddresses.push(clientAddress);
        fs.writeFileSync('database/logins.json', JSON.stringify(this.logins), 'utf8');
        this.clients[clientAddress].tempRegisterUsername = '';
        this.clients[clientAddress].tempRegisterPassword = '';
        this.clients[clientAddress].inputMode = 'loginOrRegister';
        ws.send('Registration successful. Proceed to login.');
        console.log(this.logins);
      } else {
        if (this.registerPasswordAttempts === 0) {
          this.clients[clientAddress].inputMode = 'loginOrRegister';
          ws.send(':lightpurple: Registration failed. Please login or register.');
          this.registerPasswordAttempts = 2;
        } else {
          ws.send('Passwords do not match. <br>Please register your password.');
          --this.registerPasswordAttempts;
          this.clients[clientAddress].inputMode = 'registerPassword';
        }
      }
    }
  }

  handleClose(clientAddress) {
    console.log(`${clientAddress} disconnected.`);
    delete this.clients[clientAddress];
    console.log('Number of connected clients:', Object.keys(this.clients).length);
  }
}

new Server();
