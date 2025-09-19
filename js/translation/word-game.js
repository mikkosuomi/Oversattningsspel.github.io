// Translation game functionality
import { gameState } from '../core/game-state.js';
import { shuffleArray } from '../utils/helpers.js';
import { createDraggableGreenPin, startDragging } from '../pins/green-pins.js';

// DOM elements
let swedishSentenceEl, finnishWordsContainerEl, playerGuessEl, nextSentenceBtn, switchLanguageBtn, undoBtn, finFlag, sweFlag, scorePin;

export function initializeTranslationGame() {
    // Get DOM elements
    swedishSentenceEl = document.getElementById('swedish-sentence');
    finnishWordsContainerEl = document.getElementById('finnish-words-container');
    playerGuessEl = document.getElementById('player-guess');
    nextSentenceBtn = document.getElementById('next-sentence-btn');
    switchLanguageBtn = document.getElementById('switch-language-btn');
    undoBtn = document.getElementById('undo-btn');
    finFlag = document.getElementById('fin-flag');
    sweFlag = document.getElementById('swe-flag');
    scorePin = document.getElementById('score-pin');
    
    // Initialize button state
    nextSentenceBtn.classList.add('btn-hidden');
    
    // Set up event listeners
    nextSentenceBtn.addEventListener('click', () => {
        gameState.currentSentenceIndex++;
        loadSentence();
    });
    
    switchLanguageBtn.addEventListener('click', () => {
        gameState.translationMode = gameState.translationMode === 'swe-fin' ? 'fin-swe' : 'swe-fin';
        updateFlagDisplay();
        loadSentence();
    });
    
    undoBtn.addEventListener('click', () => {
        if (gameState.playerGuess.length > 0) {
            gameState.playerGuess.pop();
            const lastWordEl = gameState.selectedWordElements.pop();
            if (lastWordEl) {
                lastWordEl.style.visibility = 'visible';
            }
            updatePlayerGuessDisplay();
        }
    });
    
    // Set up score pin dragging functionality
    scorePin.addEventListener('mousedown', (e) => {
        // Only allow dragging if score pin is in "correct" state and left mouse button
        if (!scorePin.classList.contains('correct') || e.button !== 0) return;
        
        // Create a new green pin at cursor position and start dragging it
        const newGreenPin = createDraggableGreenPin(e.clientX, e.clientY);
        startDragging(newGreenPin, e);
        
        // Decrease score by 1 (taking one pin from the stack)
        if (gameState.score > 0) {
            gameState.score--;
            document.getElementById('score-number').textContent = gameState.score.toString();
            
            // Remove correct class if score reaches 0
            if (gameState.score === 0) {
                scorePin.classList.remove('correct');
            }
        }
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Fetch sentences from Google Sheets
    fetchSentencesFromGoogleSheets()
        .then(sentences => {
            gameState.sentences = sentences;
            console.log(`📚 Loaded ${sentences.length} sentences from Google Sheets`);
            startTranslationGame();
        })
        .catch(error => {
            console.error('Error loading sentences from Google Sheets:', error);
            // Fallback to empty array or default sentences
            gameState.sentences = [
                { swedish: 'Hej världen!', finnish: 'Hei maailma!' },
                { swedish: 'Hur mår du?', finnish: 'Mitä kuuluu?' }
            ];
            startTranslationGame();
        });
}

function startTranslationGame() {
    shuffleArray(gameState.sentences);
    gameState.currentSentenceIndex = 0;
    updateFlagDisplay();
    loadSentence();
}

function loadSentence() {
    gameState.playerGuess = [];
    gameState.selectedWordElements = [];
    updatePlayerGuessDisplay();
    finnishWordsContainerEl.innerHTML = '';

    if (gameState.currentSentenceIndex >= gameState.sentences.length) {
        shuffleArray(gameState.sentences); // Re-shuffle for a new round
        gameState.currentSentenceIndex = 0; // Loop back to the start
    }

    const { swedish, finnish } = gameState.sentences[gameState.currentSentenceIndex];
    
    let sourceSentence, targetWords, targetSentence;

    if (gameState.translationMode === 'swe-fin') {
        sourceSentence = swedish;
        targetWords = finnish.split(' ');
        targetSentence = finnish;
    } else {
        sourceSentence = finnish;
        targetWords = swedish.split(' ');
        targetSentence = swedish;
    }

    swedishSentenceEl.textContent = sourceSentence;

    shuffleArray(targetWords).forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.textContent = word;
        wordEl.classList.add('finnish-word');
        wordEl.addEventListener('click', () => selectWord(word, wordEl));
        finnishWordsContainerEl.appendChild(wordEl);
    });

    nextSentenceBtn.classList.add('btn-hidden');
    finnishWordsContainerEl.style.pointerEvents = 'auto'; // Ensure words are clickable
}

function selectWord(word, wordEl) {
    gameState.playerGuess.push(word);
    gameState.selectedWordElements.push(wordEl);
    wordEl.style.visibility = 'hidden'; // Hide the word after selection
    updatePlayerGuessDisplay();
    checkGuess();
}

function updatePlayerGuessDisplay() {
    playerGuessEl.textContent = gameState.playerGuess.join(' ');
}

function checkGuess() {
    const { swedish, finnish } = gameState.sentences[gameState.currentSentenceIndex];
    const correctSentence = gameState.translationMode === 'swe-fin' ? finnish : swedish;

    if (gameState.playerGuess.join(' ') === correctSentence) {
        playerGuessEl.style.color = '#4ade80'; // A nice green color
        nextSentenceBtn.classList.remove('btn-hidden');
        // Prevent further word selection after correct answer
        finnishWordsContainerEl.style.pointerEvents = 'none';
        // Increase base speed by 5% for each correct answer
        gameState.baseSpeedMultiplier *= 1.05;
        // Update score and pin
        gameState.score++;
        document.getElementById('score-number').textContent = gameState.score.toString();
        const scorePin = document.getElementById('score-pin');
        if (scorePin) {
            scorePin.classList.add('correct');
        }
    } else {
        const correctWords = correctSentence.split(' ');
        // If the player's guess is the same length as the correct answer, it must be wrong.
        if (gameState.playerGuess.length >= correctWords.length) {
            handleWrongGuess();
        }
    }
}

function handleWrongGuess() {
    // Disable clicking more words during the animation
    finnishWordsContainerEl.style.pointerEvents = 'none';

    // Flash the background red
    document.body.classList.add('wrong-answer');

    // After the animation, reset for another try
    setTimeout(() => {
        // Remove the background flash class and make words visible again
        document.body.classList.remove('wrong-answer');
        gameState.selectedWordElements.forEach(el => {
            el.style.visibility = 'visible';
        });

        // Clear player's guess
        gameState.playerGuess = [];
        gameState.selectedWordElements = [];
        updatePlayerGuessDisplay();

        // Re-enable clicking
        finnishWordsContainerEl.style.pointerEvents = 'auto';
    }, 500); // Duration should match the CSS animation
}

function updateFlagDisplay() {
    if (gameState.translationMode === 'swe-fin') {
        finFlag.style.display = 'block';
        sweFlag.style.display = 'none';
    } else {
        finFlag.style.display = 'none';
        sweFlag.style.display = 'block';
    }
}

async function fetchSentencesFromGoogleSheets() {
    const SHEET_ID = '1_LmZkkfmYsRPaFPLaWmWI7y0ERXuaCSV6TSdBe6uzws';
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Google Sheets returns JSONP, need to extract JSON
        const jsonText = text.substring(47).slice(0, -2); // Remove "google.visualization.Query.setResponse(" and ");"
        const data = JSON.parse(jsonText);
        
        const sentences = [];
        const rows = data.table.rows;
        
        // Parse rows - Column A = Swedish, Column B = Finnish
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.c && row.c.length >= 2) {
                const swedish = row.c[0]?.v || '';
                const finnish = row.c[1]?.v || '';
                
                // Only add rows with both Swedish and Finnish text
                if (swedish.toString().trim() && finnish.toString().trim()) {
                    sentences.push({
                        swedish: swedish.toString().trim(),
                        finnish: finnish.toString().trim()
                    });
                }
            }
        }
        
        return sentences;
    } catch (error) {
        console.error('Failed to fetch from Google Sheets:', error);
        throw error;
    }
}
