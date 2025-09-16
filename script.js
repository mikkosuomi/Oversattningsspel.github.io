document.addEventListener('DOMContentLoaded', () => {
    const swedishSentenceEl = document.getElementById('swedish-sentence');
    const finnishWordsContainerEl = document.getElementById('finnish-words-container');
    const playerGuessEl = document.getElementById('player-guess');
    const nextSentenceBtn = document.getElementById('next-sentence-btn');
    const switchLanguageBtn = document.getElementById('switch-language-btn');
    const undoBtn = document.getElementById('undo-btn');

    let sentences = [];
    let currentSentenceIndex = 0;
    let playerGuess = [];
    let selectedWordElements = [];
    let translationMode = 'swe-fin'; // 'swe-fin' or 'fin-swe'

    // Fetch sentences from the text file
    fetch('sentences.txt')
        .then(response => response.text())
        .then(text => {
            sentences = text.trim().split('\n').map(line => {
                const [swedish, finnish] = line.split(' | ');
                return { swedish, finnish };
            });
            startGame();
        });

    function startGame() {
        currentSentenceIndex = 0;
        loadSentence();
    }

    function loadSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        finnishWordsContainerEl.innerHTML = '';

        if (currentSentenceIndex >= sentences.length) {
            currentSentenceIndex = 0; // Loop back to the start
        }

        const { swedish, finnish } = sentences[currentSentenceIndex];
        
        let sourceSentence, targetWords, targetSentence;

        if (translationMode === 'swe-fin') {
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

        nextSentenceBtn.style.display = 'none';
    }

    function selectWord(word, wordEl) {
        playerGuess.push(word);
        selectedWordElements.push(wordEl);
        wordEl.style.visibility = 'hidden'; // Hide the word after selection
        updatePlayerGuessDisplay();
        checkGuess();
    }

    function updatePlayerGuessDisplay() {
        playerGuessEl.textContent = playerGuess.join(' ');
    }

    function checkGuess() {
        const { swedish, finnish } = sentences[currentSentenceIndex];
        const correctSentence = translationMode === 'swe-fin' ? finnish : swedish;

        if (playerGuess.join(' ') === correctSentence) {
            playerGuessEl.style.color = 'green';
            nextSentenceBtn.style.display = 'block';
        } else {
            const correctWords = correctSentence.split(' ');
            const playerWords = playerGuess;
            if (playerWords.length >= correctWords.length) {
                 playerGuessEl.style.color = 'red';
                 setTimeout(() => {
                    alert('Fel, försök igen!');
                    resetCurrentSentence();
                }, 500);
            }
        }
    }

    function resetCurrentSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        playerGuessEl.style.color = 'black';
        finnishWordsContainerEl.innerHTML = '';
        loadSentence(); 
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    nextSentenceBtn.addEventListener('click', () => {
        currentSentenceIndex++;
        loadSentence();
    });

    switchLanguageBtn.addEventListener('click', () => {
        translationMode = translationMode === 'swe-fin' ? 'fin-swe' : 'swe-fin';
        switchLanguageBtn.textContent = translationMode === 'swe-fin' ? 'Byt till Finska-Svenska' : 'Byt till Svenska-Finska';
        loadSentence();
    });

    undoBtn.addEventListener('click', () => {
        if (playerGuess.length > 0) {
            playerGuess.pop();
            const lastWordEl = selectedWordElements.pop();
            if (lastWordEl) {
                lastWordEl.style.visibility = 'visible';
            }
            updatePlayerGuessDisplay();
        }
    });
});
