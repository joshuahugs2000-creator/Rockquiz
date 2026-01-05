// === CONSTANTES ===
const QUESTIONS_PER_QUIZ = 10;

// === ÉTAT DE L'APPLICATION ===
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let quizStartTime = null;
let userProfile = {
    name: 'Invité',
    avatar: '👤'
};

// === ÉLÉMENTS DOM ===
const elements = {
    // Navigation
    hamburger: document.getElementById('hamburger'),
    navMenu: document.querySelector('.nav-menu'),
    navLinks: document.querySelectorAll('.nav-link'),
    navProfileBtn: document.getElementById('nav-profile-btn'),
    profileAvatar: document.getElementById('profile-avatar'),
    profileName: document.getElementById('profile-name'),
    
    // Modal
    profileModal: document.getElementById('profile-modal'),
    closeModal: document.querySelector('.close-modal'),
    avatarOptions: document.querySelectorAll('.avatar-option'),
    userNameInput: document.getElementById('user-name-input'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    
    // Pages
    homeScreen: document.getElementById('home-screen'),
    categoriesScreen: document.getElementById('categories-screen'),
    leaderboardScreen: document.getElementById('leaderboard-screen'),
    profileScreen: document.getElementById('profile-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultsScreen: document.getElementById('results-screen'),
    
    // Quiz
    themeCards: document.querySelectorAll('.theme-card'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    quizThemeTitle: document.getElementById('quiz-theme-title'),
    progressFill: document.getElementById('progress-fill'),
    questionCounter: document.getElementById('question-counter'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    feedback: document.getElementById('feedback'),
    nextBtn: document.getElementById('next-btn'),
    quitBtn: document.getElementById('quit-btn'),
    
    // Résultats
    scoreDisplay: document.getElementById('score-display'),
    scorePercent: document.getElementById('score-percent'),
    scoreCircle: document.getElementById('score-circle'),
    scoreMessage: document.getElementById('score-message'),
    correctCount: document.getElementById('correct-count'),
    incorrectCount: document.getElementById('incorrect-count'),
    reviewContainer: document.getElementById('review-container'),
    retryBtn: document.getElementById('retry-btn'),
    homeBtn: document.getElementById('home-btn'),
    
    // Stats
    userStatsHome: document.getElementById('user-stats-home'),
    totalPlayed: document.getElementById('total-played'),
    
    // Profil page
    profilePageAvatar: document.getElementById('profile-page-avatar'),
    profilePageName: document.getElementById('profile-page-name'),
    editProfilePageBtn: document.getElementById('edit-profile-page-btn'),
    achievementsGrid: document.getElementById('achievements-grid'),
    profileDetailedStats: document.getElementById('profile-detailed-stats'),
    resetAllBtn: document.getElementById('reset-all-btn'),
    
    // Classement
    leaderboardTabs: document.querySelectorAll('.leaderboard-tab'),
    personalLeaderboard: document.getElementById('personal-leaderboard'),
    themesLeaderboard: document.getElementById('themes-leaderboard'),
    themesRanking: document.getElementById('themes-ranking'),
    totalGames: document.getElementById('total-games'),
    avgScore: document.getElementById('avg-score'),
    bestScore: document.getElementById('best-score'),
    perfectGames: document.getElementById('perfect-games')
};

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    displayUserStats();
    updateCategoriesStats();
    setupEventListeners();
    updateTotalPlayed();
    checkAchievements();
});

// === GESTION DES ÉVÉNEMENTS ===
function setupEventListeners() {
    // Menu hamburger
    elements.hamburger?.addEventListener('click', () => {
        elements.navMenu.classList.toggle('active');
    });
    
  // Navigation
elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Si c'est un lien externe, on laisse le comportement par défaut
        if (link.classList.contains('external-link')) {
            return;
        }
        e.preventDefault();
        const page = link.dataset.page;
        navigateToPage(page);
        elements.navMenu.classList.remove('active');
    });
});
    // Footer links
    document.querySelectorAll('.footer-section a').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.dataset.page;
            if (page) {
                e.preventDefault();
                navigateToPage(page);
            }
        });
    });
    
    // Profil
    elements.navProfileBtn?.addEventListener('click', openProfileModal);
    elements.closeModal?.addEventListener('click', closeProfileModal);
    elements.saveProfileBtn?.addEventListener('click', saveProfile);
    elements.editProfilePageBtn?.addEventListener('click', openProfileModal);
    elements.resetAllBtn?.addEventListener('click', resetAllData);
    
    // Sélection avatar
    elements.avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            elements.avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    
    // Quiz - thèmes (page d'accueil)
    elements.themeCards.forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.dataset.theme;
            startQuiz(theme);
        });
    });
    
    // Catégories (page catégories)
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.closest('.category-item').dataset.theme;
            startQuiz(theme);
        });
    });

    elements.nextBtn?.addEventListener('click', nextQuestion);
    elements.quitBtn?.addEventListener('click', quitQuiz);
    elements.retryBtn?.addEventListener('click', retryQuiz);
    elements.homeBtn?.addEventListener('click', () => navigateToPage('home'));
    
    // Onglets classement
    elements.leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchLeaderboardTab(tabName);
        });
    });
    
    // Fermer modal
    window.addEventListener('click', (e) => {
        if (e.target === elements.profileModal) {
            closeProfileModal();
        }
    });
}

// === NAVIGATION ===
function navigateToPage(pageName) {
    const pages = document.querySelectorAll('.page-screen');
    pages.forEach(page => page.classList.remove('active'));
    
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    const targetPage = document.getElementById(`${pageName}-screen`);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    // Mettre à jour les données selon la page
    if (pageName === 'leaderboard') {
        updateLeaderboard();
    } else if (pageName === 'profile') {
        updateProfilePage();
    } else if (pageName === 'categories') {
        updateCategoriesStats();
    } else if (pageName === 'home') {
        displayUserStats();
        updateTotalPlayed();
    }
}

// === GESTION DU PROFIL ===
function loadUserProfile() {
    const saved = localStorage.getItem('rockquiz_profile');
    if (saved) {
        userProfile = JSON.parse(saved);
        updateProfileDisplay();
    }
}

function updateProfileDisplay() {
    elements.profileAvatar.textContent = userProfile.avatar;
    elements.profileName.textContent = userProfile.name;
    if (elements.profilePageAvatar) {
        elements.profilePageAvatar.textContent = userProfile.avatar;
    }
    if (elements.profilePageName) {
        elements.profilePageName.textContent = userProfile.name;
    }
}

function openProfileModal() {
    elements.profileModal.classList.add('show');
    elements.userNameInput.value = userProfile.name === 'Invité' ? '' : userProfile.name;
    
    elements.avatarOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.avatar === userProfile.avatar) {
            opt.classList.add('selected');
        }
    });
}

function closeProfileModal() {
    elements.profileModal.classList.remove('show');
}

function saveProfile() {
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    const name = elements.userNameInput.value.trim() || 'Invité';
    
    if (!selectedAvatar) {
        alert('Veuillez sélectionner un avatar');
        return;
    }
    
    userProfile = {
        name: name,
        avatar: selectedAvatar.dataset.avatar
    };
    
    localStorage.setItem('rockquiz_profile', JSON.stringify(userProfile));
    updateProfileDisplay();
    closeProfileModal();
    updateProfilePage();
}

function resetAllData() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir tout réinitialiser ? Cette action est irréversible et supprimera :\n\n• Votre profil\n• Toutes vos statistiques\n• Tous vos scores')) {
        localStorage.clear();
        userProfile = { name: 'Invité', avatar: '👤' };
        updateProfileDisplay();
        displayUserStats();
        updateCategoriesStats();
        updateLeaderboard();
        updateProfilePage();
        updateTotalPlayed();
        alert('✅ Toutes les données ont été réinitialisées !');
        navigateToPage('home');
    }
}

// === DÉMARRAGE DU QUIZ ===
function startQuiz(theme) {
    if (!quizData[theme]) {
        alert('Ce quiz n\'est pas encore disponible !');
        return;
    }

    const allQuestions = [...quizData[theme]];
    const selectedQuestions = shuffleArray(allQuestions).slice(0, QUESTIONS_PER_QUIZ);

    currentQuiz = {
        theme: theme,
        questions: selectedQuestions
    };
    
    currentQuestionIndex = 0;
    userAnswers = [];
    score = 0;
    quizStartTime = Date.now();

    const themeTitles = {
        culture: '📚 Culture Générale',
        science: '🔬 Sciences',
        histoire: '🏛️ Histoire',
        technologie: '💻 Technologie',
        sport: '⚽ Sport',
        geographie: '🌍 Géographie',
        cinema: '🎬 Cinéma',
        musique: '🎵 Musique',
        anime: '🎌 Anime & Manga'
    };

    elements.quizThemeTitle.textContent = themeTitles[theme] || theme;
    
    navigateToPage('quiz');
    displayQuestion();
}

// === AFFICHAGE DES QUESTIONS ===
function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.questionCounter.textContent = `Question ${currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;
    
    // Afficher le nom de l'anime si c'est le thème anime
    if (currentQuiz.theme === 'anime' && question.anime) {
        elements.questionText.innerHTML = `
            <div style="font-size: 1rem; color: var(--turquoise-neon); margin-bottom: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                ${question.anime}
            </div>
            ${question.question}
        `;
    } else {
        elements.questionText.textContent = question.question;
    }
    
    elements.optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option;
        optionEl.dataset.index = index;
        optionEl.addEventListener('click', () => selectOption(index, optionEl));
        elements.optionsContainer.appendChild(optionEl);
    });
    
    elements.feedback.classList.remove('show', 'correct', 'incorrect');
    elements.nextBtn.disabled = true;
}

// === SÉLECTION D'UNE OPTION ===
function selectOption(selectedIndex, selectedElement) {
    const question = currentQuiz.questions[currentQuestionIndex];
    const options = document.querySelectorAll('.option');
    
    options.forEach(opt => {
        opt.classList.add('disabled');
        opt.classList.remove('selected');
    });
    
    selectedElement.classList.add('selected');
    
    const isCorrect = selectedIndex === question.correctAnswer;
    
    if (isCorrect) {
        selectedElement.classList.add('correct');
        elements.feedback.textContent = '✅ Bonne réponse !';
        elements.feedback.className = 'feedback show correct';
        score++;
    } else {
        selectedElement.classList.add('incorrect');
        options[question.correctAnswer].classList.add('correct');
        elements.feedback.textContent = `❌ Incorrect ! La bonne réponse était : ${question.options[question.correctAnswer]}`;
        elements.feedback.className = 'feedback show incorrect';
    }
    
    userAnswers.push({
        question: question.question,
        userAnswer: selectedIndex,
        correctAnswer: question.correctAnswer,
        options: question.options,
        isCorrect: isCorrect,
        anime: question.anime || null // Sauvegarder le nom de l'anime si présent
    });
    
    elements.nextBtn.disabled = false;
}

// === QUESTION SUIVANTE ===
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuiz.questions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

// === AFFICHAGE DES RÉSULTATS ===
function showResults() {
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    elements.scoreDisplay.textContent = `${score}/${totalQuestions}`;
    elements.scorePercent.textContent = `${percentage}%`;
    elements.scoreMessage.textContent = getScoreMessage(percentage);
    
    // Animation cercle
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (percentage / 100) * circumference;
    if (elements.scoreCircle) {
        elements.scoreCircle.style.strokeDashoffset = offset;
    }
    
    elements.correctCount.textContent = score;
    elements.incorrectCount.textContent = totalQuestions - score;
    
    displayReview();
    
    saveQuizStats(currentQuiz.theme, score, totalQuestions, percentage);
    
    navigateToPage('results');
    checkAchievements();
}

// === MESSAGE EN FONCTION DU SCORE ===
function getScoreMessage(percentage) {
    if (percentage === 100) return '🏆 Parfait ! Vous êtes un expert !';
    if (percentage >= 90) return '🌟 Excellent travail !';
    if (percentage >= 70) return '👏 Très bien !';
    if (percentage >= 60) return '👍 Bien joué !';
    if (percentage >= 50) return '🙂 Pas mal, continuez !';
    return '💪 Vous pouvez faire mieux !';
}

// === RÉVISION DES QUESTIONS ===
function displayReview() {
    elements.reviewContainer.innerHTML = '';
    
    userAnswers.forEach((answer, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        
        // Ajouter le nom de l'anime si présent
        const animeLabel = answer.anime ? `<div style="font-size: 0.9rem; color: var(--turquoise-neon); margin-bottom: 0.5rem; font-weight: 600;">${answer.anime}</div>` : '';
        
        reviewItem.innerHTML = `
            ${animeLabel}
            <div class="review-question">${index + 1}. ${answer.question}</div>
            <div class="review-answer user">
                ${answer.isCorrect ? '✅' : '❌'} Votre réponse : ${answer.options[answer.userAnswer]}
            </div>
            ${!answer.isCorrect ? `
                <div class="review-answer correct-ans">
                    ✓ Bonne réponse : ${answer.options[answer.correctAnswer]}
                </div>
            ` : ''}
        `;
        
        elements.reviewContainer.appendChild(reviewItem);
    });
}

// === STATISTIQUES ===
function loadUserStats() {
    const stats = {};
    const themes = ['culture', 'science', 'histoire', 'technologie', 'sport', 'geographie', 'cinema', 'musique', 'anime'];
    
    themes.forEach(theme => {
        const saved = localStorage.getItem(`rockquiz_${theme}`);
        if (saved) {
            stats[theme] = JSON.parse(saved);
        }
    });
    
    return stats;
}

function saveQuizStats(theme, score, total, percentage) {
    const existing = localStorage.getItem(`rockquiz_${theme}`);
    let stats = existing ? JSON.parse(existing) : {
        attempts: 0,
        bestScore: 0,
        bestPercentage: 0,
        totalScore: 0,
        totalQuestions: 0
    };
    
    stats.attempts++;
    stats.totalScore += score;
    stats.totalQuestions += total;
    
    if (percentage > stats.bestPercentage) {
        stats.bestScore = score;
        stats.bestPercentage = percentage;
    }
    
    localStorage.setItem(`rockquiz_${theme}`, JSON.stringify(stats));
    displayUserStats();
    updateCategoriesStats();
    updateTotalPlayed();
}

function displayUserStats() {
    const stats = loadUserStats();
    if (!elements.userStatsHome) return;
    
    elements.userStatsHome.innerHTML = '';
    
    const themeLabels = {
        culture: 'Culture G.',
        science: 'Sciences',
        histoire: 'Histoire',
        technologie: 'Techno',
        sport: 'Sport',
        geographie: 'Géo',
        cinema: 'Cinéma',
        musique: 'Musique',
        anime: 'Anime'
    };
    
    const sortedStats = Object.entries(stats)
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 4);
    
    if (sortedStats.length === 0) {
        elements.userStatsHome.innerHTML = '<p style="text-align: center; color: var(--text-medium); grid-column: 1/-1;">Aucune statistique. Commencez un quiz !</p>';
        return;
    }
    
    for (const [theme, data] of sortedStats) {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div class="stat-value">${data.bestPercentage}%</div>
            <div class="stat-label">${themeLabels[theme]}</div>
            <div style="font-size: 0.85em; color: var(--text-medium); margin-top: 8px;">
                ${data.attempts} partie${data.attempts > 1 ? 's' : ''}
            </div>
        `;
        elements.userStatsHome.appendChild(statItem);
    }
}

function updateTotalPlayed() {
    const stats = loadUserStats();
    let total = 0;
    Object.values(stats).forEach(data => {
        total += data.attempts;
    });
    if (elements.totalPlayed) {
        elements.totalPlayed.textContent = total;
    }
}

function updateCategoriesStats() {
    const stats = loadUserStats();
    const themes = ['culture', 'science', 'histoire', 'technologie', 'sport', 'geographie', 'cinema', 'musique', 'anime'];
    
    themes.forEach(theme => {
        const playedEl = document.getElementById(`cat-${theme}-played`);
        const bestEl = document.getElementById(`cat-${theme}-best`);
        
        if (playedEl && bestEl) {
            if (stats[theme]) {
                playedEl.textContent = stats[theme].attempts;
                bestEl.textContent = stats[theme].bestPercentage;
            } else {
                playedEl.textContent = '0';
                bestEl.textContent = '0';
            }
        }
    });
}

// === CLASSEMENT ===
function switchLeaderboardTab(tabName) {
    elements.leaderboardTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    elements.personalLeaderboard.classList.remove('active');
    elements.themesLeaderboard.classList.remove('active');
    
    if (tabName === 'personal') {
        elements.personalLeaderboard.classList.add('active');
    } else {
        elements.themesLeaderboard.classList.add('active');
    }
}

function updateLeaderboard() {
    const stats = loadUserStats();
    
    // Stats personnelles
    let totalGames = 0;
    let totalScore = 0;
    let totalQuestions = 0;
    let bestPercentage = 0;
    let perfectGames = 0;
    
    Object.values(stats).forEach(data => {
        totalGames += data.attempts;
        totalScore += data.totalScore;
        totalQuestions += data.totalQuestions;
        if (data.bestPercentage > bestPercentage) {
            bestPercentage = data.bestPercentage;
        }
        // Compter les quiz parfaits (100%)
        const avgForTheme = data.totalQuestions > 0 ? (data.totalScore / data.totalQuestions) * 100 : 0;
        if (data.bestPercentage === 100) {
            perfectGames++;
        }
    });
    
    const avgPercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    if (elements.totalGames) elements.totalGames.textContent = totalGames;
    if (elements.avgScore) elements.avgScore.textContent = `${avgPercentage}%`;
    if (elements.bestScore) elements.bestScore.textContent = `${bestPercentage}%`;
    if (elements.perfectGames) elements.perfectGames.textContent = perfectGames;
    
    // Classement par thème
    const themeLabels = {
        culture: '📚 Culture Générale',
        science: '🔬 Sciences',
        histoire: '🏛️ Histoire',
        technologie: '💻 Technologie',
        sport: '⚽ Sport',
        geographie: '🌍 Géographie',
        cinema: '🎬 Cinéma',
        musique: '🎵 Musique',
        anime: '🎌 Anime & Manga'
    };
    
    const themeIcons = {
        culture: '📚',
        science: '🔬',
        histoire: '🏛️',
        technologie: '💻',
        sport: '⚽',
        geographie: '🌍',
        cinema: '🎬',
        musique: '🎵',
        anime: '🎌'
    };
    
    const sortedThemes = Object.entries(stats)
        .sort((a, b) => b[1].bestPercentage - a[1].bestPercentage);
    
    if (elements.themesRanking) {
        elements.themesRanking.innerHTML = '';

        
        sortedThemes.forEach(([theme, data]) => {
            const item = document.createElement('div');
            item.className = 'theme-rank-item';
            item.innerHTML = `
                <div class="theme-rank-info">
                    <div class="theme-rank-icon">${themeIcons[theme]}</div>
                    <div class="theme-rank-details">
                        <h4>${themeLabels[theme]}</h4>
                        <p>${data.attempts} partie${data.attempts > 1 ? 's' : ''} jouée${data.attempts > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="theme-rank-score">${data.bestPercentage}%</div>
            `;
            elements.themesRanking.appendChild(item);
        });
        
        if (sortedThemes.length === 0) {
            elements.themesRanking.innerHTML = '<p style="text-align: center; color: var(--text-medium);">Aucune donnée disponible</p>';
        }
    }
}

// === PAGE PROFIL ===
function updateProfilePage() {
    updateProfileDisplay();
    
    const stats = loadUserStats();
    const themeLabels = {
        culture: '📚 Culture G.',
        science: '🔬 Sciences',
        histoire: '🏛️ Histoire',
        technologie: '💻 Techno',
        sport: '⚽ Sport',
        geographie: '🌍 Géo',
        cinema: '🎬 Cinéma',
        musique: '🎵 Musique',
        anime: '🎌 Anime'
    };
    
    if (elements.profileDetailedStats) {
        elements.profileDetailedStats.innerHTML = '';
        
        for (const [theme, data] of Object.entries(stats)) {
            const item = document.createElement('div');
            item.className = 'profile-stat-item';
            item.innerHTML = `
                <div class="stat-value">${data.bestPercentage}%</div>
                <div class="stat-label">${themeLabels[theme]}</div>
                <div style="font-size: 0.85em; color: var(--text-medium); margin-top: 8px;">
                    ${data.attempts} partie${data.attempts > 1 ? 's' : ''}
                </div>
            `;
            elements.profileDetailedStats.appendChild(item);
        }
        
        if (Object.keys(stats).length === 0) {
            elements.profileDetailedStats.innerHTML = '<p style="text-align: center; color: var(--text-medium); grid-column: 1/-1;">Jouez des quiz pour voir vos stats !</p>';
        }
    }
    
    checkAchievements();
}

// === RÉALISATIONS ===
function checkAchievements() {
    const stats = loadUserStats();
    let totalGames = 0;
    let totalScore = 0;
    let totalQuestions = 0;
    let perfectGames = 0;
    let themesPlayed = new Set();
    
    Object.entries(stats).forEach(([theme, data]) => {
        totalGames += data.attempts;
        totalScore += data.totalScore;
        totalQuestions += data.totalQuestions;
        if (data.bestPercentage === 100) perfectGames++;
        themesPlayed.add(theme);
    });
    
    const avgPercentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
    
    const achievements = [
        { condition: totalGames >= 1, index: 0 },
        { condition: perfectGames >= 1, index: 1 },
        { condition: totalGames >= 10, index: 2 },
        { condition: totalGames >= 5 && avgPercentage >= 80, index: 3 },
        { condition: themesPlayed.size >= 9, index: 4 }, // Mis à jour pour 9 thèmes incluant anime
        { condition: totalGames >= 50, index: 5 }
    ];
    
    if (elements.achievementsGrid) {
        const achievementItems = elements.achievementsGrid.querySelectorAll('.achievement-item');
        achievements.forEach(({ condition, index }) => {
            if (condition && achievementItems[index]) {
                achievementItems[index].classList.remove('locked');
                achievementItems[index].classList.add('unlocked');
            }
        });
    }
}

// === UTILITAIRES ===
function quitQuiz() {
    if (confirm('Êtes-vous sûr de vouloir quitter le quiz ? Votre progression sera perdue.')) {
        navigateToPage('home');
    }
}

function retryQuiz() {
    startQuiz(currentQuiz.theme);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
	
}
// === GESTION DES PAGES MULTIJOUEUR ===
// Ajoutez ceci à la fin de votre app.js

// Modifier la fonction navigateToPage existante
// OU ajouter cette gestion spécifique
document.addEventListener('DOMContentLoaded', () => {
    // ... votre code existant ...
    
    // AJOUTEZ CE BLOC :
    // Gestion spéciale pour les pages multijoueur
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.dataset.page;
            
            if (page === 'online' || page === 'chat') {
                e.preventDefault();
                
                // Masquer toutes les pages
                document.querySelectorAll('.page-screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                
                // Afficher la page demandée
                const targetPage = document.getElementById(`${page}-screen`);
                if (targetPage) {
                    targetPage.classList.add('active');
                }
                
                // Mettre à jour les liens actifs
                document.querySelectorAll('.nav-link').forEach(l => {
                    l.classList.remove('active');
                });
                link.classList.add('active');
                
                // Rafraîchir les données
                if (page === 'online' && window.multiplayerSystem) {
                    window.multiplayerSystem.loadOnlineUsers();
                }
                if (page === 'chat' && window.multiplayerSystem) {
                    window.multiplayerSystem.loadMessages();
                }
                
                window.scrollTo(0, 0);
            }
        });
    });
});
