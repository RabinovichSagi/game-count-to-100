document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const grid = document.getElementById('grid');
    const numButtons = document.querySelectorAll('.num-btn');
    const clearBtn = document.getElementById('clear-btn');
    const enterBtn = document.getElementById('enter-btn');
    const startGameBtn = document.getElementById('start-game');
    const timerDisplay = document.getElementById('timer-display');
    const bestTimeDisplay = document.getElementById('best-time-display');
    const completionModal = document.getElementById('completion-modal');
    const completionTime = document.getElementById('completion-time');
    const modalBestTime = document.getElementById('modal-best-time');
    const playAgainBtn = document.getElementById('play-again');
    const hintDisplay = document.getElementById('hint-display');
    const gridContainer = document.querySelector('.grid-container');
    const numpadContainer = document.querySelector('.numpad-container');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const directionRadios = document.querySelectorAll('input[name="direction"]');
    
    // Game state variables
    let gameActive = false;
    let currentCell = null;
    let currentValue = '';
    let correctSequence = [];
    let currentPosition = 0;
    let timerInterval = null;
    let startTime = null;
    let elapsedTime = 0;
    let incorrectAttempts = 0;
    let gridSize = 10; // Default grid size
    
    // Initialize the grid
    function createGrid() {
        // Determine grid size based on mode
        const mode = document.querySelector('input[name="mode"]:checked').value;
        
        switch (mode) {
            case 'sequential':
                gridSize = 10; // 10x10 grid for sequential (0-100)
                break;
            case 'every2':
                gridSize = 7; // 7x7 grid for every2 (0-98)
                break;
            case 'every5':
                gridSize = 5; // 5x5 grid for every5 (0-100)
                break;
            case 'every10':
                gridSize = 4; // 4x4 grid for every10 (0-100)
                break;
        }
        
        // Clear the grid
        grid.innerHTML = '';
        
        // Set the grid template columns based on the grid size
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Calculate the total number of cells needed
        const totalCells = mode === 'sequential' ? 101 : 
                          mode === 'every2' ? 51 : 
                          mode === 'every5' ? 21 :
                          11; // every10
        
        // Create the cells
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.index = i;
            cell.textContent = '';
            // Make all cells initially disabled
            cell.setAttribute('tabindex', '-1');
            grid.appendChild(cell);
        }
    }
    
    // Generate the correct sequence based on game mode and direction
    function generateSequence() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const direction = document.querySelector('input[name="direction"]:checked').value;
        
        let sequence = [];
        
        switch (mode) {
            case 'sequential':
                sequence = Array.from({ length: 101 }, (_, i) => i);
                break;
            case 'every2':
                sequence = Array.from({ length: 51 }, (_, i) => i * 2);
                break;
            case 'every5':
                sequence = Array.from({ length: 21 }, (_, i) => i * 5);
                break;
            case 'every10':
                sequence = Array.from({ length: 11 }, (_, i) => i * 10);
                break;
        }
        
        if (direction === 'reverse') {
            sequence.reverse();
        }
        
        return sequence;
    }
    
    // Start the game
    function startGame() {
        // Reset game state
        gameActive = true;
        currentPosition = 0;
        incorrectAttempts = 0;
        currentValue = '';
        hideHint();
        
        // Make grid and numpad fully visible
        gridContainer.classList.add('active');
        numpadContainer.classList.add('active');
        
        // Generate the sequence
        correctSequence = generateSequence();
        
        // Create the grid
        createGrid();
        
        // Activate the first cell
        activateCell(0);
        
        // Disable configuration controls
        toggleConfigControls(false);
        
        // Reset and prepare timer (will start on first input)
        resetTimer();
        
        // Load best time for current mode and direction
        loadBestTime();
    }
    
    // Activate a specific cell
    function activateCell(index) {
        // Deactivate all cells first
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            cell.classList.remove('active');
            cell.setAttribute('tabindex', '-1');
        });
        
        // Activate only the current cell
        currentCell = cells[index];
        currentCell.classList.add('active');
        currentCell.setAttribute('tabindex', '0');
        
        // Reset current value
        currentValue = '';
        
        // Hide hint when moving to a new cell
        hideHint();
        
        // Reset incorrect attempts counter
        incorrectAttempts = 0;
    }
    
    // Handle number input
    function handleNumberInput(value) {
        if (!gameActive || !currentCell) return;
        
        // Start timer on first input if not started
        if (startTime === null) {
            startTimer();
        }
        
        // If the cell has an incorrect class, clear it first
        if (currentCell.classList.contains('incorrect')) {
            currentCell.classList.remove('incorrect');
            currentValue = '';
            currentCell.textContent = '';
        }
        
        // Append the number to current value (limit to 3 digits)
        if (currentValue.length < 3) {
            currentValue += value;
            currentCell.textContent = currentValue;
        }
    }
    
    // Clear the current cell
    function clearCell() {
        if (!gameActive || !currentCell) return;
        
        currentValue = '';
        currentCell.textContent = '';
        
        // Remove incorrect class if present
        if (currentCell.classList.contains('incorrect')) {
            currentCell.classList.remove('incorrect');
        }
    }
    
    // Validate the current cell
    function validateCell() {
        if (!gameActive || !currentCell || currentValue === '') return;
        
        const expectedValue = correctSequence[currentPosition];
        const userValue = parseInt(currentValue, 10);
        
        if (userValue === expectedValue) {
            // Correct answer
            currentCell.classList.add('correct');
            currentPosition++;
            incorrectAttempts = 0;
            hideHint();
            
            // Check if game is complete
            if (currentPosition >= correctSequence.length) {
                endGame();
                return;
            }
            
            // Activate next cell
            activateCell(currentPosition);
        } else {
            // Incorrect answer
            currentCell.classList.add('incorrect');
            incorrectAttempts++;
            
            // Show hint after 3 incorrect attempts
            if (incorrectAttempts >= 3) {
                showHint();
            }
        }
    }
    
    // Show hint
    function showHint() {
        const expectedValue = correctSequence[currentPosition];
        hintDisplay.textContent = `רמז: המספר הנכון הוא ${expectedValue}`;
        hintDisplay.classList.add('show');
    }
    
    // Hide hint
    function hideHint() {
        hintDisplay.textContent = '';
        hintDisplay.classList.remove('show');
    }
    
    // Reset the timer
    function resetTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        startTime = null;
        elapsedTime = 0;
        timerDisplay.textContent = '00:00';
    }
    
    // Start the timer
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        startTime = Date.now();
        
        // Update timer every second
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimerDisplay();
        }, 1000); // 1 second interval
        
        // Initial update
        updateTimerDisplay();
    }
    
    // Update the timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // End the game
    function endGame() {
        gameActive = false;
        
        // Stop the timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Final timer update to ensure accuracy
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
        
        // Save best time
        saveBestTime();
        
        // Show completion modal
        completionTime.textContent = timerDisplay.textContent;
        modalBestTime.textContent = bestTimeDisplay.textContent;
        completionModal.classList.add('show');
        
        // Disable all cells
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            cell.setAttribute('tabindex', '-1');
        });
        
        // Make numpad inactive
        numpadContainer.classList.remove('active');
        
        // Hide hint
        hideHint();
    }
    
    // Save best time to localStorage
    function saveBestTime() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const direction = document.querySelector('input[name="direction"]:checked').value;
        const key = `bestTime_${mode}_${direction}`;
        
        const currentBestTime = localStorage.getItem(key);
        
        if (!currentBestTime || elapsedTime < parseInt(currentBestTime, 10)) {
            localStorage.setItem(key, elapsedTime.toString());
            
            // Update the best time display
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            bestTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // Load best time from localStorage
    function loadBestTime() {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const direction = document.querySelector('input[name="direction"]:checked').value;
        const key = `bestTime_${mode}_${direction}`;
        
        const bestTime = localStorage.getItem(key);
        
        if (bestTime) {
            const minutes = Math.floor(parseInt(bestTime, 10) / 60000);
            const seconds = Math.floor((parseInt(bestTime, 10) % 60000) / 1000);
            bestTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            bestTimeDisplay.textContent = '--:--';
        }
    }
    
    // Toggle configuration controls
    function toggleConfigControls(enabled) {
        modeRadios.forEach(radio => {
            radio.disabled = !enabled;
        });
        
        directionRadios.forEach(radio => {
            radio.disabled = !enabled;
        });
        
        startGameBtn.disabled = !enabled;
    }
    
    // Reset the game
    function resetGame() {
        // Reset timer
        resetTimer();
        
        // Reset game state
        gameActive = false;
        currentCell = null;
        currentValue = '';
        currentPosition = 0;
        incorrectAttempts = 0;
        
        // Clear the grid
        grid.innerHTML = '';
        
        // Make grid and numpad half-transparent again
        gridContainer.classList.remove('active');
        numpadContainer.classList.remove('active');
        
        // Enable configuration controls
        toggleConfigControls(true);
        
        // Hide modal
        completionModal.classList.remove('show');
        
        // Hide hint
        hideHint();
    }
    
    // Event Listeners
    numButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleNumberInput(button.dataset.value);
        });
    });
    
    clearBtn.addEventListener('click', clearCell);
    
    enterBtn.addEventListener('click', validateCell);
    
    startGameBtn.addEventListener('click', startGame);
    
    playAgainBtn.addEventListener('click', resetGame);
    
    // Add event listeners for mode and direction changes to update best time display
    modeRadios.forEach(radio => {
        radio.addEventListener('change', loadBestTime);
    });
    
    directionRadios.forEach(radio => {
        radio.addEventListener('change', loadBestTime);
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        if (e.key >= '0' && e.key <= '9') {
            handleNumberInput(e.key);
        } else if (e.key === 'Enter') {
            validateCell();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            clearCell();
        }
    });
    
    // Prevent accidental refresh
    window.addEventListener('beforeunload', (e) => {
        if (gameActive) {
            e.preventDefault();
            e.returnValue = 'האם אתה בטוח שברצונך לעזוב? ההתקדמות שלך תאבד.';
            return 'האם אתה בטוח שברצונך לעזוב? ההתקדמות שלך תאבד.';
        }
    });
    
    // Initialize the game
    createGrid();
    loadBestTime(); // Load initial best time based on default selections
}); 