document.addEventListener('DOMContentLoaded', () => {
    // Bouncing flag animation
    const flag = document.getElementById('bouncing-flag');
    const flagClickArea = document.createElement('div');
    flagClickArea.style.position = 'fixed';
    flagClickArea.style.width = '100px';
    flagClickArea.style.height = '60px';
    flagClickArea.style.zIndex = '0';
    flagClickArea.style.cursor = 'pointer';
    document.body.appendChild(flagClickArea);
    let x = Math.random() * (window.innerWidth - 100);
    let y = Math.random() * (window.innerHeight - 60);
    let dx = (Math.random() - 0.5) * 2;
    let dy = (Math.random() - 0.5) * 2;
    let speedMultiplier = 1;

    flagClickArea.addEventListener('click', () => {
        // Prevent new speed boosts while one is active
        if (speedMultiplier > 1) return;

        speedMultiplier = 200; // A large spike in speed

        // Gradually reduce the speed multiplier back to 1 over 3 seconds
        const fadeOutInterval = setInterval(() => {
            speedMultiplier -= 5;
            if (speedMultiplier <= 1) {
                speedMultiplier = 1;
                clearInterval(fadeOutInterval);
            }
        }, 75); // 40 steps * 75ms = 3000ms = 3 seconds
    });

    function animate() {
        x += dx * speedMultiplier;
        y += dy * speedMultiplier;

        // Bounce off the walls
        if (x <= 0 || x >= window.innerWidth - 100) {
            dx = -dx;
        }
        if (y <= 0 || y >= window.innerHeight - 60) {
            dy = -dy;
        }

        flag.style.left = x + 'px';
        flag.style.top = y + 'px';
        flagClickArea.style.left = x + 'px';
        flagClickArea.style.top = y + 'px';

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    const swedishSentenceEl = document.getElementById('swedish-sentence');
    const finnishWordsContainerEl = document.getElementById('finnish-words-container');
    const playerGuessEl = document.getElementById('player-guess');
    const nextSentenceBtn = document.getElementById('next-sentence-btn');
    const switchLanguageBtn = document.getElementById('switch-language-btn');
    const undoBtn = document.getElementById('undo-btn');
    const finFlag = document.getElementById('fin-flag');
    const sweFlag = document.getElementById('swe-flag');

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
        shuffleArray(sentences);
        currentSentenceIndex = 0;
        loadSentence();
    }

    function loadSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        finnishWordsContainerEl.innerHTML = '';

        if (currentSentenceIndex >= sentences.length) {
            shuffleArray(sentences); // Re-shuffle for a new round
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

        nextSentenceBtn.style.visibility = 'hidden';
        finnishWordsContainerEl.style.pointerEvents = 'auto'; // Ensure words are clickable
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
            playerGuessEl.style.color = '#4ade80'; // A nice green color
            nextSentenceBtn.style.visibility = 'visible';
            // Prevent further word selection after correct answer
            finnishWordsContainerEl.style.pointerEvents = 'none';
        } else {
            const correctWords = correctSentence.split(' ');
            // If the player's guess is the same length as the correct answer, it must be wrong.
            if (playerGuess.length >= correctWords.length) {
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
            selectedWordElements.forEach(el => {
                el.style.visibility = 'visible';
            });

            // Clear player's guess
            playerGuess = [];
            selectedWordElements = [];
            updatePlayerGuessDisplay();

            // Re-enable clicking
            finnishWordsContainerEl.style.pointerEvents = 'auto';
        }, 500); // Duration should match the CSS animation
    }

    function resetCurrentSentence() {
        playerGuess = [];
        selectedWordElements = [];
        updatePlayerGuessDisplay();
        playerGuessEl.style.color = '#ffffff';
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

    function updateFlagDisplay() {
        if (translationMode === 'swe-fin') {
            finFlag.style.display = 'block';
            sweFlag.style.display = 'none';
        } else {
            finFlag.style.display = 'none';
            sweFlag.style.display = 'block';
        }
    }

    switchLanguageBtn.addEventListener('click', () => {
        translationMode = translationMode === 'swe-fin' ? 'fin-swe' : 'swe-fin';
        updateFlagDisplay();
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
