const WebSocket = require('ws')
const fs = require('fs')
const wss = new WebSocket.Server({ port: 8080 })

let clients = {}
let logins = {}

let loginUsernameAttempts = 2
let loginPasswordAttempts = 2
let registerPasswordAttempts = 2

try {
    const loginsData = fs.readFileSync('database/logins.json', 'utf8')
    logins = JSON.parse(loginsData)
} catch (error) {
    console.error('Error loading logins:', error)
}

wss.on('connection', (ws, req) => {
    const clientAddress = req.socket.remoteAddress + ':' + req.socket.remotePort
    console.log(`${clientAddress} has connected.`)
    ws.send(':lightpurple: Connected to the server.')
    ws.send(':lightpurple: Please login or register.')

    clients[clientAddress] = {
        username: '',
        inputMode: 'loginOrRegister',
        characterName: '',
        abilityScoresRerolls: 3,
        timeAbilityScoresReroll: 0,
    }

    console.log('Number of connected clients:', Object.keys(clients).length)

    ws.on('message', (message) => {
        const clientAddress = ws._socket.remoteAddress + ':' + ws._socket.remotePort
        const { inputMode } = clients[clientAddress]
        message = message.toString().trim()
        console.log(`Received message: ${message}`)
        
        if (inputMode === 'loginOrRegister') {
            if (message === 'l') {
                clients[clientAddress].inputMode = 'loginUsername'
                ws.send('Please enter your username.')
            } 
            
            else if (message === 'r') {
                clients[clientAddress].inputMode = 'registerUsername'
                ws.send('Please register your username.')
            } 
            
            else {
                ws.send('Type l or r to login or register.')
            }
        }
        
        if (inputMode === 'loginUsername') {
            const tempLoginUsername = message

            if (logins[tempLoginUsername]) {
                clients[clientAddress].inputMode = 'loginPassword'
                clients[clientAddress].username = tempLoginUsername
                ws.send('Please enter your password.')
            } 

            else {
                if (loginUsernameAttempts === 0) {
                    clients[clientAddress].inputMode = 'loginOrRegister'
                    ws.send(':lightpurple: Login failed. Please try again.')
                    loginUsernameAttempts = 2
                }

                else {
                    ws.send('User not found.')
                    --loginUsernameAttempts
                }
            }
        } 
        
        if (inputMode === 'loginPassword') {
            const tempLoginPassword = message

            if (logins[clients[clientAddress].username]?.password === tempLoginPassword) {
                clients[clientAddress].inputMode = 'chCrSpecies'
                console.log(clients)
                ws.send("It's your first time logging in. Please create a character.")
                ws.send(`Begin by choosing your character species.<br><br>
                         1. Human <br>2. Elf <br>3. Dwarf <br>4. Halfling <br>5. Halfgiant`)

            } 
            
            else {
                if (loginPasswordAttempts === 0) {
                    clients[clientAddress].inputMode = 'loginOrRegister'
                    ws.send(':lightpurple: Login failed. Please login or register.')
                    loginPasswordAttempts = 2
                }

                else {
                    ws.send('Incorrect password. Try again.')
                    --loginPasswordAttempts
                }
            }
        } 
        
        if (inputMode === 'registerUsername') {
            const tempRegisterUsername = message
            
            if (logins[tempRegisterUsername]) {
                ws.send('Username already exists. Please choose a different username.')
            } 
            
            else {
                ws.send(`Your username is "${message}"`)
                clients[clientAddress].inputMode = 'registerPassword'
                clients[clientAddress].tempRegisterUsername = tempRegisterUsername
                ws.send('Please register your password.')
            }
            
        } 
        
        if (inputMode === 'registerPassword') {
            const tempRegisterPassword = message
            clients[clientAddress].inputMode = 'registerPasswordConfirm'
            clients[clientAddress].tempRegisterPassword = tempRegisterPassword
            ws.send('Please confirm your password.')
        } 
        
        if (inputMode === 'registerPasswordConfirm') {
            const { tempRegisterUsername, tempRegisterPassword } = clients[clientAddress]

            if (message === tempRegisterPassword) {
                logins[tempRegisterUsername] = {
                    netAddresses: logins[tempRegisterUsername]?.netAddresses || [],
                    password: tempRegisterPassword,
                    character: ''
                }

                logins[tempRegisterUsername].netAddresses.push(clientAddress)
                fs.writeFileSync('database/logins.json', JSON.stringify(logins), 'utf8')
                clients[clientAddress].tempRegisterUsername = ''
                clients[clientAddress].tempRegisterPassword = ''
                clients[clientAddress].inputMode = 'loginOrRegister'
                ws.send('Registration successful. Proceed to login.')
                console.log(logins)
            } 
            
            else {
                if (registerPasswordAttempts === 0) {
                    clients[clientAddress].inputMode = 'loginOrRegister'
                    ws.send(':lightpurple: Registration failed. Please login or register.')
                    registerPasswordAttempts = 2
                }

                else {ws.send('Passwords do not match. <br>Please register your password.')
                --registerPasswordAttempts
                clients[clientAddress].inputMode = 'registerPassword'
                }
            }
        }
    })

    ws.on('close', () => {
        const clientAddress = ws._socket.remoteAddress + ':' + ws._socket.remotePort
        console.log(`${clientAddress} disconnected.`)
        delete clients[clientAddress]
        console.log('Number of connected clients:', Object.keys(clients).length)
    })

    ws.on('error', (error) => {
        console.error('WebSocket error:', error)
    })
})

console.log('Server is online.')
