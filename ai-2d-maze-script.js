document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('maze-container');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const difficultySelect = document.getElementById('difficulty');
    const movesDisplay = document.getElementById('moves');
    const timerDisplay = document.getElementById('timer');
    
    let maze = [];
    let player = { x: 0, y: 0 };
    let exit = { x: 0, y: 0 };
    let cellSize = 30;
    let mazeWidth, mazeHeight;
    let moves = 0;
    let gameTime = 0;
    let timerInterval;
    let gameStarted = false;
    
    // Initialize game when Start button is clicked
    startBtn.addEventListener('click', initGame);
    
    // Listen for keyboard inputs
    document.addEventListener('keydown', movePlayer);
    
    function initGame() {
        clearInterval(timerInterval);
        
        const difficulty = difficultySelect.value;
        
        // Set maze dimensions based on difficulty
        if (difficulty === 'easy') {
            mazeWidth = 10;
            mazeHeight = 10;
        } else if (difficulty === 'medium') {
            mazeWidth = 15;
            mazeHeight = 15;
        } else {
            mazeWidth = 20;
            mazeHeight = 20;
        }
        
        // Set canvas size
        canvas.width = mazeWidth * cellSize;
        canvas.height = mazeHeight * cellSize;
        
        // Reset game stats
        moves = 0;
        gameTime = 0;
        movesDisplay.textContent = `Moves: ${moves}`;
        timerDisplay.textContent = `Time: ${gameTime}s`;
        
        // Generate maze
        generateMaze();
        
        // Set player at entrance (top-left corner)
        player = { x: 0, y: 0 };
        
        // Set exit at bottom-right corner
        exit = { x: mazeWidth - 1, y: mazeHeight - 1 };
        
        // Draw the maze
        drawMaze();
        
        // Start the timer
        timerInterval = setInterval(() => {
            gameTime++;
            timerDisplay.textContent = `Time: ${gameTime}s`;
        }, 1000);
        
        gameStarted = true;
    }
    
    function generateMaze() {
        // Initialize maze with walls
        maze = Array(mazeHeight).fill().map(() => Array(mazeWidth).fill(1));
        
        // Generate maze using Recursive Backtracking algorithm
        const startX = 0;
        const startY = 0;
        maze[startY][startX] = 0; // Set entrance
        
        // Carve paths
        carvePath(startX, startY);
        
        // Ensure exit is accessible by creating a path from the nearest open cell
        ensureExitAccessible();
    }
    
    function ensureExitAccessible() {
        // Set exit cell to open
        const exitY = mazeHeight - 1;
        const exitX = mazeWidth - 1;
        maze[exitY][exitX] = 0;
        
        // If exit is already connected, we're done
        if (isConnected(exitX, exitY)) return;
        
        // Find the nearest open cell and connect to it
        const directions = [[-1, 0], [0, -1]]; // Left and Up
        
        // Try connecting directly
        for (const [dx, dy] of directions) {
            const nx = exitX + dx;
            const ny = exitY + dy;
            
            if (nx >= 0 && ny >= 0 && nx < mazeWidth && ny < mazeHeight) {
                if (maze[ny][nx] === 0) {
                    // Found an adjacent open cell, we're done
                    return;
                }
                // Carve a path
                maze[ny][nx] = 0;
                if (isConnected(nx, ny)) return;
            }
        }
        
        // If still not connected, create a path toward start
        let x = exitX, y = exitY;
        while (!isConnected(x, y) && (x > 0 || y > 0)) {
            // Move toward start
            if (x > 0 && (y === 0 || Math.random() > 0.5)) {
                x--;
            } else if (y > 0) {
                y--;
            }
            maze[y][x] = 0;
        }
    }
    
    function isConnected(x, y) {
        // Simple flood fill to check if cell is connected to start
        const visited = Array(mazeHeight).fill().map(() => Array(mazeWidth).fill(false));
        const queue = [{x: 0, y: 0}]; // Start at entrance
        visited[0][0] = true;
        
        while (queue.length > 0) {
            const {x: cx, y: cy} = queue.shift();
            
            if (cx === x && cy === y) return true;
            
            const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
            for (const [dx, dy] of directions) {
                const nx = cx + dx;
                const ny = cy + dy;
                
                if (nx >= 0 && ny >= 0 && nx < mazeWidth && ny < mazeHeight && 
                    maze[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push({x: nx, y: ny});
                }
            }
        }
        
        return false;
    }
    
    function carvePath(x, y) {
        // Define the four directions: right, down, left, up
        const directions = [
            [1, 0], [0, 1], [-1, 0], [0, -1]
        ];
        
        // Shuffle directions randomly
        shuffleArray(directions);
        
        // Try each direction
        for (let [dx, dy] of directions) {
            const nx = x + dx * 2;
            const ny = y + dy * 2;
            
            // Check if the new position is within bounds and is a wall
            if (nx >= 0 && ny >= 0 && nx < mazeWidth && ny < mazeHeight && maze[ny][nx] === 1) {
                // Carve a path by making cells corridors
                maze[y + dy][x + dx] = 0;
                maze[ny][nx] = 0;
                
                // Continue recursively
                carvePath(nx, ny);
            }
        }
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the maze
        for (let y = 0; y < mazeHeight; y++) {
            for (let x = 0; x < mazeWidth; x++) {
                if (maze[y][x] === 1) {
                    // Draw wall
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Draw exit
        ctx.fillStyle = 'green';
        ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
        
        // Draw player
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    }
    
    function movePlayer(e) {
        if (!gameStarted) return;
        
        const key = e.key;
        let dx = 0, dy = 0;
        
        // Determine direction from key input
        if (key === 'ArrowUp' || key === 'w' || key === 'W') dy = -1;
        else if (key === 'ArrowDown' || key === 's' || key === 'S') dy = 1;
        else if (key === 'ArrowLeft' || key === 'a' || key === 'A') dx = -1;
        else if (key === 'ArrowRight' || key === 'd' || key === 'D') dx = 1;
        else return; // Not a movement key
        
        // Calculate new position
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Check bounds and walls
        if (newX >= 0 && newY >= 0 && newX < mazeWidth && newY < mazeHeight && maze[newY][newX] === 0) {
            player.x = newX;
            player.y = newY;
            moves++;
            movesDisplay.textContent = `Moves: ${moves}`;
            drawMaze();
            
            // Check if player has reached the exit
            if (player.x === exit.x && player.y === exit.y) {
                gameWon();
            }
        }
    }
    
    function gameWon() {
        clearInterval(timerInterval);
        gameStarted = false;
        setTimeout(() => {
            alert(`Congratulations! You solved the maze in ${moves} moves and ${gameTime} seconds!`);
        }, 100);
    }
    
    // Initialize with an empty maze until player clicks start
    canvas.width = 300;
    canvas.height = 300;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click "New Game" to start', canvas.width / 2, canvas.height / 2);
});