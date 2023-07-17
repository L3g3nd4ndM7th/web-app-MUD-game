function startWebSocketClient() {
  const socket = new WebSocket('ws://localhost:8080');

  function handleMessage(event) {
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

  function handleError(event) {
    const message = 'Client error.';
    console.error(event);
    const spanElement = document.createElement('span');
    const divTextOutput = document.getElementById('div-text-output');
    spanElement.classList.add('span-color-light-purple');
    spanElement.innerHTML = message;
    divTextOutput.appendChild(spanElement);
    divTextOutput.scrollTop = divTextOutput.scrollHeight;
  }

  function handleClose(event) {
    const message = 'Disconnected from the server.';
    console.log(`Code: ${event.code} Reason: ${event.reason}`);
    const spanElement = document.createElement('span');
    const divTextOutput = document.getElementById('div-text-output');
    spanElement.classList.add('span-color-light-purple');
    spanElement.innerHTML = message;
    divTextOutput.appendChild(spanElement);
    divTextOutput.scrollTop = divTextOutput.scrollHeight;
  }

  socket.addEventListener('message', handleMessage);
  socket.addEventListener('error', handleError);
  socket.addEventListener('close', handleClose);
  
  const inputTextMain = document.getElementById('input-text-main');
  
  inputTextMain.addEventListener('keypress', function(event) {
    let message = inputTextMain.value.trim();
  
    if (event.key === 'Enter') {
      socket.send(message);
      inputTextMain.value = '';
    }
  });
}

startWebSocketClient()