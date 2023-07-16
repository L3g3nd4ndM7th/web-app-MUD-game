const socket = new WebSocket('ws://localhost:8080')

socket.addEventListener('message', (event) => {
  let message = event.data
  const spanElement = document.createElement('span')
  const divTextOutput = document.getElementById('div-text-output')

  if (message.includes(':white:')) {
    spanElement.classList.add('span-color-white');
    message = message.replaceAll(':white:', '');
  }

  if (message.includes(':lightpurple:')) {
    spanElement.classList.add('span-color-light-purple');
    message = message.replaceAll(':lightpurple:', '');
  }

  if (message.includes(':darkpurple:')) {
    spanElement.classList.add('span-color-dark-purple');
    message = message.replaceAll(':darkpurple:', '');
  }

  if (message.includes(':lightgreen:')) {
    spanElement.classList.add('span-color-light-green');
    message = message.replaceAll(':lightgreen:', '');
  }

  if (message.includes(':darkgreen:')) {
    spanElement.classList.add('span-color-dark-green');
    message = message.replaceAll(':darkgreen:', '');
  }
  
  spanElement.innerHTML = message
  divTextOutput.appendChild(spanElement)

  divTextOutput.scrollTop = divTextOutput.scrollHeight
})

function handleKeyPress(event) {
  let inputTextMain = document.getElementById('input-text-main');
  let message = inputTextMain.value.trim();

  if (event.keyCode === 13 || event.key === 'Enter') {
    socket.send(message);
    inputTextMain.value = '';
  }
}