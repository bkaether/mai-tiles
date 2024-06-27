const socket = io();

document.addEventListener('DOMContentLoaded', () => {
  const gameBoardContainer = document.getElementById('game-board-container');
  const gameBoard = document.getElementById('game-board');
  const tilesContainer = document.getElementById('tiles');
  let size = 17; // Initial size of the grid
  const tileSize = 30;
  
  // Initialize game board
  createGrid(size);

  function createGrid(size) {
    gameBoard.innerHTML = ''; // Clear previous grid
    gameBoard.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
    gameBoard.style.gridTemplateRows = `repeat(${size}, ${tileSize}px)`;
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.className = 'tile';
      cell.dataset.index = i;
      cell.draggable = true; // Make the board cells draggable
      cell.addEventListener('dragstart', handleDragStart);
      cell.addEventListener('dragend', handleDragEnd);
      gameBoard.appendChild(cell);
    }
  }

  // Handle receiving initial tiles from the server
  socket.on('initial-tiles', (tiles) => {
    tilesContainer.innerHTML = ''; // Clear previous tiles
    tiles.forEach((letter, index) => {
      createTile(letter, `tile-${index}`);
    });
  });

  // Handle receiving a new tile from the server
  socket.on('new-tile', (letter) => {
    createTile(letter, `tile-${Date.now()}`); // Assign a unique ID based on timestamp
  });

  function createTile(letter, id) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = id; // Assign a unique ID
    tile.textContent = letter;
    tile.draggable = true;
    tilesContainer.appendChild(tile);

    tile.addEventListener('dragstart', handleDragStart);
    tile.addEventListener('dragend', handleDragEnd);
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text', e.target.textContent);
    e.dataTransfer.setData('id', e.target.id); // Store the tile's id
    e.target.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  gameBoard.addEventListener('dragover', handleDragOver);
  gameBoard.addEventListener('drop', handleDrop);
  tilesContainer.addEventListener('dragover', handleDragOver);
  tilesContainer.addEventListener('drop', handleDropBackToInventory);

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData('text');
    const tileId = e.dataTransfer.getData('id'); // Get the tile's id
    const tileElement = document.getElementById(tileId);

    const cellIndex = parseInt(e.target.dataset.index);

    // Check if the target cell already has a tile
    if (e.target.textContent !== '') {
      // If the cell is not empty, return the tile back to the inventory
      if (tileElement) {
        createTile(letter, tileId); // Recreate the tile in the inventory
        tileElement.remove(); // Remove the tile from its current location
      }
    } else {
      // Update the text content of the target cell
      e.target.textContent = letter;

      // If the drop target is on the game board, remove the tile from the inventory
      if (tileElement) {
        tileElement.remove();
      }

      // Ensure the dropped cell is draggable and has the appropriate events
      e.target.draggable = true;
      e.target.id = tileId; // Maintain the id for future drag events
      e.target.addEventListener('dragstart', handleDragStart);
      e.target.addEventListener('dragend', handleDragEnd);

      // Check if the cell is near the border and expand the grid if necessary
      if (cellIndex % size === 0) {
        expandGrid('left');
      } else if (cellIndex % size === size - 1) {
        expandGrid('right');
      } else if (cellIndex < size) {
        expandGrid('top');
      } else if (cellIndex >= size * (size - 1)) {
        expandGrid('bottom');
      }
    }

    // Check if the inventory is empty and words are valid
    if (tilesContainer.children.length === 0 && areWordsValid()) {
      socket.emit('peel');
    }
  }

  function handleDropBackToInventory(e) {
    e.preventDefault();
    const letter = e.dataTransfer.getData('text');
    const tileId = e.dataTransfer.getData('id'); // Get the tile's id

    const existingTile = document.getElementById(tileId);
    if (existingTile) {
      existingTile.remove();
    }

    createTile(letter, tileId);
  }

  function areWordsValid() {
    // Implement your word validation logic here
    // For now, let's assume all words are valid
    return true;
  }

  function expandGrid(direction) {
    const oldSize = size;
    size += 6; // Increase size by 6
    const newSize = size;

    // Update grid template columns and rows
    gameBoard.style.gridTemplateColumns = `repeat(${newSize}, ${tileSize}px)`;
    gameBoard.style.gridTemplateRows = `repeat(${newSize}, ${tileSize}px)`;

    const newGrid = new Array(newSize * newSize).fill(null);

    // Populate newGrid with existing cells
    for (let i = 0; i < oldSize; i++) {
      for (let j = 0; j < oldSize; j++) {
        const oldIndex = i * oldSize + j;
        const newIndex =
          direction === 'left' ? i * newSize + j + 6 :
          direction === 'right' ? i * newSize + j :
          direction === 'top' ? (i + 6) * newSize + j :
          direction === 'bottom' ? i * newSize + j : null;

        newGrid[newIndex] = gameBoard.children[oldIndex];
      }
    }

    // Insert new cells in the appropriate positions
    for (let i = 0; i < newSize * newSize; i++) {
      if (!newGrid[i]) {
        const cell = document.createElement('div');
        cell.className = 'tile';
        cell.dataset.index = i;
        cell.draggable = true;
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragend', handleDragEnd);
        newGrid[i] = cell;
      }
    }

    // Rebuild the game board with the new grid
    gameBoard.innerHTML = '';
    newGrid.forEach(cell => gameBoard.appendChild(cell));
  }
});
