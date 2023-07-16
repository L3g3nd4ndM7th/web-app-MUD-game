class WebSocketClient {
  constructor() {
    this.socket = new WebSocket('ws://localhost:8080');
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    this.socket.addEventListener('error', this.handleError.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));
  }

  handleMessage(event) {
    let message = event.data;
    const spanElement = document.createElement('span');
    const divTextOutput = document.getElementById('div-text-output');

    if (message.includes(':lightpurple:')) {
      spanElement.classList.add('span-color-light-purple');
      message = message.replace(':lightpurple:', '');
    }

    if (message.includes(':darkpurple:')) {
      spanElement.classList.add('span-color-dark-purple');
      message = message.replace(':darkpurple:', '');
    }

    if (message.includes(':lightgreen:')) {
      spanElement.classList.add('span-color-light-green');
      message = message.replace(':lightgreen:', '');
    }

    if (message.includes(':darkgreen:')) {
      spanElement.classList.add('span-color-dark-green');
      message = message.replace(':darkgreen:', '');
    }

    spanElement.innerHTML = message;
    divTextOutput.appendChild(spanElement);
    divTextOutput.scrollTop = divTextOutput.scrollHeight;
  }

  handleError(event) {
    const message = 'Client error.';
    console.error(event);
    const spanElement = document.createElement('span');
    const divTextOutput = document.getElementById('div-text-output');
    spanElement.classList.add('span-color-light-purple');
    spanElement.innerHTML = message;
    divTextOutput.appendChild(spanElement);
    divTextOutput.scrollTop = divTextOutput.scrollHeight;
  }

  handleClose(event) {
    const message = 'Disconnected from the server.';
    console.log(`Code: ${event.code} Reason: ${event.reason}`);
    const spanElement = document.createElement('span');
    const divTextOutput = document.getElementById('div-text-output');
    spanElement.classList.add('span-color-light-purple');
    spanElement.innerHTML = message;
    divTextOutput.appendChild(spanElement);
    divTextOutput.scrollTop = divTextOutput.scrollHeight;
  }

  handleKeyPress(event) {
    let inputTextMain = document.getElementById('input-text-main');
    let message = inputTextMain.value.trim();

    if (event.keyCode === 13 || event.key === 'Enter') {
      this.socket.send(message);
      inputTextMain.value = '';
    }
  }
}

const client = new WebSocketClient();
