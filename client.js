const socket = new WebSocket('ws://localhost:8080')

socket.addEventListener('message', (event) => {
  let message = event.data
  const spanElement = document.createElement('span')
  const divTextOutput = document.getElementById('div-text-output')

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
  
  spanElement.innerHTML = message
  divTextOutput.appendChild(spanElement)
  divTextOutput.scrollTop = divTextOutput.scrollHeight
})

socket.addEventListener('error', (event) => {
  const message = `Client error.`;
  console.error(event)
  const spanElement = document.createElement('span');
  const divTextOutput = document.getElementById('div-text-output');
  spanElement.classList.add('span-color-light-purple');
  spanElement.innerHTML = message;
  divTextOutput.appendChild(spanElement);
  divTextOutput.scrollTop = divTextOutput.scrollHeight;
});

socket.addEventListener('close', (event) => {
  const message = `Disconnected from the server.`;
  console.log(`Code: ${event.code} Reason: ${event.reason}`)
  const spanElement = document.createElement('span');
  const divTextOutput = document.getElementById('div-text-output');
  spanElement.classList.add('span-color-light-purple');
  spanElement.innerHTML = message;
  divTextOutput.appendChild(spanElement);
  divTextOutput.scrollTop = divTextOutput.scrollHeight;
});

function handleKeyPress(event) {
  let inputTextMain = document.getElementById('input-text-main');
  let message = inputTextMain.value.trim();

  if (event.keyCode === 13 || event.key === 'Enter') {
    socket.send(message);
    inputTextMain.value = '';
  }
}