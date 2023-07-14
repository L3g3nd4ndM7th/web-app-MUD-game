const socket = new WebSocket('ws://localhost:8080');

// Connection opened event
socket.addEventListener('open', () => {
  let connectionMessage = 'Connected to WebSocket server.';
  let spanElement = createSpanElement(connectionMessage, 'span-color-dark-purple');
  insertIntoTextOutput(spanElement);
  connectionMessage = 'Type c for a list of commands.';
  spanElement = createSpanElement(connectionMessage, 'span-color-white');
  insertIntoTextOutput(spanElement);
});

socket.addEventListener('error', (error) => {
  let connectionError = 'Failed to connect to WebSocket server';
  let spanElement = createSpanElement(connectionError, 'span-color-dark-purple');
  insertIntoTextOutput(spanElement);
});

// Message received event
socket.addEventListener('message', (event) => {
  let message = event.data;

  // Determine the message color based on the prefix
  let className = '';
  if (message.startsWith('System2: ')) {
    className = 'span-color-light-purple';
    message = message.substring('System2: '.length);
  } else if (message.startsWith('System1: ')) {
    className = 'span-color-dark-purple';
    message = message.substring('System1: '.length);
  } else if (message.startsWith('System3: ')) {
    className = 'span-color-white';
    message = message.substring('System3: '.length);
  } else {
    className = 'span-color-dark-green';
  }

  // Create a new element to hold the message content
  let spanElement = createSpanElement(message, className);
  insertIntoTextOutput(spanElement);

  // Check if the message ends with a newline character (\n)
  if (message.endsWith('\n')) {
    // Create a <br> element
    let brElement = document.createElement('br');
    insertIntoTextOutput(brElement);
  }
});

// Connection closed event
socket.addEventListener('close', () => {
  let disconnectionMessage = 'Disconnected from WebSocket server';
  let spanElement = createSpanElement(disconnectionMessage, 'span-color-dark-purple');
  insertIntoTextOutput(spanElement);
});

function createSpanElement(message, className) {
  let spanElement = document.createElement('span');
  spanElement.textContent = message;
  spanElement.classList.add(className);
  return spanElement;
}

function insertIntoTextOutput(element) {
  let textOutputDiv = document.getElementById('div-text-output');
  textOutputDiv.appendChild(element);
  textOutputDiv.scrollTop = textOutputDiv.scrollHeight;
}

function handleKeyPress(event) {
  let inputTextMain = document.getElementById('input-text-main');
  let message = inputTextMain.value.trim();

  if (event.keyCode === 13 || event.key === 'Enter') {
    // Enter key was pressed
    // Send the message to the server
    socket.send(message);

    // Clear the input field
    inputTextMain.value = '';
  }
}
