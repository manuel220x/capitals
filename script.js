// Game state variables
let gameState = {
    playerName: '',
    currentScore: 0,
    completedStates: 0,
    stateResults: {}, // Will store results for each state: 'perfect', 'partial', 'incorrect'
    userAnswers: {}, // Will store user's original answers: { stateName: { capital: 'answer', gentilicio: 'answer' } }
    currentState: null
};

// Scoring system
const SCORING = {
    PERFECT: 10,   // Both capital and demonym correct
    PARTIAL: 5,    // Only one correct
    INCORRECT: -2  // Both wrong
};

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Show welcome screen
    showScreen('welcome-screen');
    
    // Set up event listeners
    document.getElementById('player-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    document.getElementById('quiz-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitQuiz();
    });
    
    // Create the Mexico map and progress table
    createMexicoMap();
    initializeProgressTable();
}

function startGame() {
    const playerNameInput = document.getElementById('player-name');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Por favor, escribe tu nombre para continuar.');
        playerNameInput.focus();
        return;
    }
    
    // Initialize game state
    gameState.playerName = playerName;
    gameState.currentScore = 0;
    gameState.completedStates = 0;
    gameState.stateResults = {};
    gameState.userAnswers = {};
    gameState.currentState = null;
    
    // Update UI
    document.getElementById('player-display').textContent = `¡Hola, ${playerName}!`;
    updateScoreDisplay();
    
    // Show game screen
    showScreen('game-screen');
}

async function createMexicoMap() {
    const mapSvg = document.getElementById('mexico-map');
    
    try {
        // Load the SVG content from mx.svg
        const response = await fetch('mx.svg');
        const svgText = await response.text();
        
        // Parse the SVG and extract its content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        // Clear existing content and copy SVG attributes and content
        mapSvg.innerHTML = '';
        
        // Copy viewBox and other relevant attributes from the source SVG
        if (svgElement.hasAttribute('viewBox')) {
            mapSvg.setAttribute('viewBox', svgElement.getAttribute('viewBox'));
        }
        
        // Copy all child elements from the source SVG
        Array.from(svgElement.children).forEach(child => {
            mapSvg.appendChild(child.cloneNode(true));
        });
        
        // Now attach event listeners to the path elements using our mapping
        Object.keys(mexicanStates).forEach(stateKey => {
            const svgId = stateIdMapping[stateKey];
            if (svgId) {
                // Try to find the path element with this ID
                const pathElement = mapSvg.querySelector(`path[id="${svgId}"]`);
                if (pathElement) {
                    pathElement.setAttribute('class', 'state');
                    pathElement.setAttribute('data-state', stateKey);
                    pathElement.setAttribute('title', stateKey);
                    
                    // Add click event
                    pathElement.addEventListener('click', function() {
                        openQuiz(stateKey);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading SVG map:', error);
        // Fallback: display an error message
        mapSvg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="red">Error loading map</text>';
    }
}

function openQuiz(stateKey) {
    // Don't allow clicking on already completed states
    if (gameState.stateResults[stateKey]) {
        return;
    }
    
    gameState.currentState = stateKey;
    const state = mexicanStates[stateKey];
    
    // Update modal content
    document.getElementById('state-name').textContent = stateKey;
    
    // Clear and reset input fields to prevent autofill
    const capitalInput = document.getElementById('capital-input');
    const demonymInput = document.getElementById('demonym-input');
    
    capitalInput.value = '';
    demonymInput.value = '';
    
    // Additional measures to prevent autofill
    capitalInput.setAttribute('autocomplete', 'new-password'); // Trick browsers
    demonymInput.setAttribute('autocomplete', 'new-password');
    
    // Reset form completely
    document.getElementById('quiz-form').reset();
    
    // Show modal
    document.getElementById('quiz-modal').classList.remove('hidden');
    
    // Focus with a small delay to ensure modal is visible
    setTimeout(() => {
        capitalInput.focus();
    }, 100);
}

function closeQuiz() {
    // Clear inputs before closing to prevent any form data retention
    document.getElementById('capital-input').value = '';
    document.getElementById('demonym-input').value = '';
    document.getElementById('quiz-form').reset();
    
    document.getElementById('quiz-modal').classList.add('hidden');
    gameState.currentState = null;
}

function submitQuiz() {
    if (!gameState.currentState) return;
    
    const state = mexicanStates[gameState.currentState];
    const capitalInput = document.getElementById('capital-input').value.trim();
    const demonymInput = document.getElementById('demonym-input').value.trim();
    
    // Store user's original answers for later display
    gameState.userAnswers[gameState.currentState] = {
        capital: capitalInput,
        gentilicio: demonymInput
    };
    
    // Normalize inputs for comparison
    const normalizedCapital = normalizeText(capitalInput.toLowerCase());
    const normalizedDemonym = normalizeText(demonymInput.toLowerCase());
    
    // Check answers
    const capitalCorrect = checkCapital(normalizedCapital, state.capital);
    const demonymCorrect = checkDemonym(normalizedDemonym, state.acceptedDemonyms);
    
    // Determine result and score
    let result, points;
    if (capitalCorrect && demonymCorrect) {
        result = 'perfect';
        points = SCORING.PERFECT;
    } else if (capitalCorrect || demonymCorrect) {
        result = 'partial';
        points = SCORING.PARTIAL;
    } else {
        result = 'incorrect';
        points = SCORING.INCORRECT;
    }
    
    // Update game state
    gameState.stateResults[gameState.currentState] = result;
    gameState.currentScore += points;
    gameState.completedStates++;
    
    // Update state appearance on map
    updateStateAppearance(gameState.currentState, result);
    
    // Update progress table with individual results
    updateProgressTable(gameState.currentState, result, capitalCorrect, demonymCorrect, points);
    
    // Update score display
    updateScoreDisplay();
    
    // Close modal
    closeQuiz();
    
    // Check if game is complete
    if (gameState.completedStates >= Object.keys(mexicanStates).length) {
        setTimeout(() => {
            showFinalScore();
        }, 500);
    }
}

function checkCapital(input, correctCapital) {
    const normalizedCorrect = normalizeText(correctCapital);
    return input === normalizedCorrect;
}

function checkDemonym(input, acceptedDemonyms) {
    const normalizedInput = normalizeText(input);
    
    // Check against all accepted demonyms in both singular and plural forms
    return acceptedDemonyms.some(demonym => {
        const normalizedDemonym = normalizeText(demonym);
        const pluralDemonym = makePlural(normalizedDemonym);
        
        return normalizedInput === normalizedDemonym || normalizedInput === pluralDemonym;
    });
}

function makePlural(word) {
    // Handle Spanish pluralization rules for gentilicios
    const lastChar = word.slice(-1);
    const lastTwoChars = word.slice(-2);
    
    // If word ends in vowel (a, e, i, o, u), add 's'
    if (['a', 'e', 'i', 'o', 'u'].includes(lastChar)) {
        return word + 's';
    }
    
    // If word ends in consonant, add 'es'
    // Special case: if word ends in 'z', change to 'ces'
    if (lastChar === 'z') {
        return word.slice(0, -1) + 'ces';
    }
    
    // For most consonants, just add 'es'
    return word + 'es';
}

function normalizeText(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
        .trim();
}

function updateStateAppearance(stateKey, result) {
    const stateElement = document.querySelector(`[data-state="${stateKey}"]`);
    if (stateElement) {
        // Remove existing completion classes
        stateElement.classList.remove('completed-perfect', 'completed-partial', 'completed-incorrect');
        // Add the new completion class while keeping the state class
        stateElement.classList.add(`completed-${result}`);
    }
}

function initializeProgressTable() {
    const tableBody = document.getElementById('progress-table-body');
    tableBody.innerHTML = '';
    
    Object.keys(mexicanStates).forEach(stateKey => {
        const state = mexicanStates[stateKey];
        const row = document.createElement('tr');
        row.setAttribute('data-state', stateKey);
        
        row.innerHTML = `
            <td class="state-name">${stateKey}</td>
            <td class="status-icon capital-status">⭕</td>
            <td class="status-icon gentilicio-status">⭕</td>
            <td class="points-column points-zero">-</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateProgressTable(stateKey, result, capitalCorrect, demonymCorrect, points) {
    const row = document.querySelector(`#progress-table-body tr[data-state="${stateKey}"]`);
    if (row) {
        const stateNameCell = row.querySelector('.state-name');
        const capitalStatusCell = row.querySelector('.capital-status');
        const gentilicioStatusCell = row.querySelector('.gentilicio-status');
        const pointsCell = row.querySelector('.points-column');
        const state = mexicanStates[stateKey];
        const userAnswer = gameState.userAnswers[stateKey];
        
        // Add click handler to state name to show user's original answers in popup
        if (stateNameCell && userAnswer) {
            stateNameCell.className = 'state-name clickable-answer';
            stateNameCell.style.cursor = 'pointer';
            stateNameCell.innerHTML = `${stateKey} <span class="answer-indicator">ℹ️</span>`;
            
            // Add click event to show popup with answers
            stateNameCell.addEventListener('click', function(e) {
                e.preventDefault();
                showAnswersPopup(stateKey, userAnswer);
            });
        }
        
        if (capitalStatusCell && gentilicioStatusCell && pointsCell) {
            // Update Capital status
            if (capitalCorrect) {
                capitalStatusCell.textContent = '✅';
                capitalStatusCell.title = 'Capital correcta';
                capitalStatusCell.className = 'status-icon capital-status';
            } else {
                capitalStatusCell.innerHTML = `
                    <div class="tooltip">
                        <span class="incorrect-icon">❌</span>
                        <span class="tooltiptext">
                            <strong>Capital correcta:</strong><br>
                            ${state.capital}
                        </span>
                    </div>
                `;
                capitalStatusCell.className = 'status-icon capital-status incorrect';
                
                // Add click event for mobile devices
                capitalStatusCell.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const tooltip = this.querySelector('.tooltip');
                    if (tooltip) {
                        tooltip.classList.toggle('active');
                        setTimeout(() => {
                            tooltip.classList.remove('active');
                        }, 3000);
                    }
                });
            }
            
            // Update Gentilicio status
            if (demonymCorrect) {
                gentilicioStatusCell.textContent = '✅';
                gentilicioStatusCell.title = 'Gentilicio correcto';
                gentilicioStatusCell.className = 'status-icon gentilicio-status';
            } else {
                gentilicioStatusCell.innerHTML = `
                    <div class="tooltip">
                        <span class="incorrect-icon">❌</span>
                        <span class="tooltiptext">
                            <strong>Gentilicios correctos:</strong><br>
                            ${state.acceptedDemonyms.join(', ')}
                        </span>
                    </div>
                `;
                gentilicioStatusCell.className = 'status-icon gentilicio-status incorrect';
                
                // Add click event for mobile devices
                gentilicioStatusCell.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const tooltip = this.querySelector('.tooltip');
                    if (tooltip) {
                        tooltip.classList.toggle('active');
                        setTimeout(() => {
                            tooltip.classList.remove('active');
                        }, 3000);
                    }
                });
            }
            
            // Update Points
            if (points > 0) {
                pointsCell.textContent = `+${points}`;
                pointsCell.className = 'points-column points-positive';
            } else if (points < 0) {
                pointsCell.textContent = `${points}`;
                pointsCell.className = 'points-column points-negative';
            } else {
                pointsCell.textContent = '0';
                pointsCell.className = 'points-column points-zero';
            }
        }
    }
}

function updateScoreDisplay() {
    document.getElementById('current-score').textContent = gameState.currentScore;
    document.getElementById('completed-states').textContent = gameState.completedStates;
}

function showFinalScore() {
    // Calculate score breakdown
    const breakdown = {
        perfect: 0,
        partial: 0,
        incorrect: 0
    };
    
    Object.values(gameState.stateResults).forEach(result => {
        breakdown[result]++;
    });
    
    // Update final screen
    document.getElementById('final-player-name').textContent = gameState.playerName;
    document.getElementById('final-score-display').textContent = gameState.currentScore;
    document.getElementById('perfect-count').textContent = breakdown.perfect;
    document.getElementById('partial-count').textContent = breakdown.partial;
    document.getElementById('incorrect-count').textContent = breakdown.incorrect;
    
    // Show final screen
    showScreen('final-screen');
}

function restartGame() {
    // Reset game state
    gameState = {
        playerName: '',
        currentScore: 0,
        completedStates: 0,
        stateResults: {},
        userAnswers: {},
        currentState: null
    };
    
    // Clear player name input
    document.getElementById('player-name').value = '';
    
    // Recreate the map to reset state colors
    createMexicoMap();
    
    // Reset progress table
    initializeProgressTable();
    
    // Show welcome screen
    showScreen('welcome-screen');
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('player-name').focus();
    }, 100);
}

function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.remove('hidden');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        closeQuiz();
    }
});

// Prevent accidental page refresh during game
window.addEventListener('beforeunload', function(e) {
    if (gameState.completedStates > 0 && gameState.completedStates < Object.keys(mexicanStates).length) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Perderás tu progreso actual.';
    }
});

// Show answers popup function
function showAnswersPopup(stateKey, userAnswer) {
    // Remove any existing popup
    const existingPopup = document.getElementById('answers-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup overlay
    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'answers-popup';
    popupOverlay.className = 'popup-overlay';
    
    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    
    popupContent.innerHTML = `
        <div class="popup-header">
            <h3>Tus respuestas para ${stateKey}</h3>
            <button class="popup-close" onclick="closeAnswersPopup()">×</button>
        </div>
        <div class="popup-body">
            <p><strong>Capital:</strong> "${userAnswer.capital}"</p>
            <p><strong>Gentilicio:</strong> "${userAnswer.gentilicio}"</p>
        </div>
    `;
    
    popupOverlay.appendChild(popupContent);
    document.body.appendChild(popupOverlay);
    
    // Close popup when clicking overlay
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            closeAnswersPopup();
        }
    });
    
    // Close popup with Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeAnswersPopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Close answers popup function
function closeAnswersPopup() {
    const popup = document.getElementById('answers-popup');
    if (popup) {
        popup.remove();
    }
}