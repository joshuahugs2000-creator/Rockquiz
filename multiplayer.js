// ============================================
// SYSTÈME MULTIJOUEUR ROCKQUIZ
// multiplayer.js - VERSION CORRIGÉE
// ============================================

class MultiplayerSystem {
    constructor() {
        this.currentUser = null;
        this.onlineUsers = [];
        this.messages = [];
        this.refreshInterval = null;
    }

    async init() {
        console.log('🎮 Initialisation du système multijoueur...');
        await this.initializeUser();
        await this.loadOnlineUsers();
        await this.loadMessages();
        this.startAutoRefresh();
        this.updateUI();
        console.log('✅ Système multijoueur initialisé');
    }

    // === GESTION UTILISATEUR ===
    async initializeUser() {
        try {
            // Vérifier si Supabase est disponible
            if (!window.supabaseClient) {
                console.log('⚠️ Supabase non disponible, utilisation du mode local');
                this.loadLocalUser();
                return;
            }

            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                // Utilisateur connecté avec Supabase
                this.currentUser = {
                    id: user.id,
                    pseudo: user.user_metadata?.username || user.email?.split('@')[0] || 'Joueur',
                    avatar: user.user_metadata?.avatar || '😎',
                    email: user.email,
                    isAuthenticated: true,
                    lastSeen: Date.now()
                };
                
                // Sauvegarder dans la table users
                await this.saveUserToDatabase();
            } else {
                // Mode invité
                this.loadLocalUser();
            }
            
            this.updatePresence();
        } catch (error) {
            console.error('Erreur initialisation utilisateur:', error);
            this.loadLocalUser();
        }
    }

    loadLocalUser() {
        // Charger ou créer un utilisateur local
        let stored = localStorage.getItem('rockquiz_multiplayer_user');
        
        if (stored) {
            this.currentUser = JSON.parse(stored);
            this.currentUser.lastSeen = Date.now();
        } else {
            this.currentUser = {
                id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                pseudo: 'Invité_' + Math.floor(Math.random() * 10000),
                avatar: '👤',
                isAuthenticated: false,
                lastSeen: Date.now()
            };
        }
        
        localStorage.setItem('rockquiz_multiplayer_user', JSON.stringify(this.currentUser));
    }

    async saveUserToDatabase() {
        if (!window.supabaseClient || !this.currentUser.isAuthenticated) return;

        try {
            const { error } = await window.supabaseClient
                .from('users')
                .upsert({
                    id: this.currentUser.id,
                    username: this.currentUser.pseudo,
                    avatar: this.currentUser.avatar,
                    email: this.currentUser.email,
                    last_seen: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Erreur sauvegarde utilisateur:', error);
        }
    }

    async updatePresence() {
        if (!this.currentUser) return;

        this.currentUser.lastSeen = Date.now();
        
        if (this.currentUser.isAuthenticated && window.supabaseClient) {
            await this.saveUserToDatabase();
        } else {
            localStorage.setItem('rockquiz_multiplayer_user', JSON.stringify(this.currentUser));
        }
    }

    // === UTILISATEURS EN LIGNE ===
    async loadOnlineUsers() {
        try {
            if (window.supabaseClient) {
                await this.loadOnlineUsersFromSupabase();
            } else {
                await this.loadOnlineUsersFromLocal();
            }
            
            this.updateOnlineCount();
        } catch (error) {
            console.error('Erreur chargement utilisateurs en ligne:', error);
        }
    }

    async loadOnlineUsersFromSupabase() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .gte('last_seen', fiveMinutesAgo)
                .order('last_seen', { ascending: false });

            if (error) throw error;

            this.onlineUsers = data.map(user => ({
                id: user.id,
                pseudo: user.username,
                avatar: user.avatar,
                isAuthenticated: true,
                lastSeen: new Date(user.last_seen).getTime()
            }));
        } catch (error) {
            console.error('Erreur Supabase:', error);
            this.onlineUsers = [this.currentUser];
        }
    }

    async loadOnlineUsersFromLocal() {
        // En mode local, on affiche juste l'utilisateur courant
        this.onlineUsers = this.currentUser ? [this.currentUser] : [];
    }

    updateOnlineCount() {
        const countEl = document.getElementById('online-count');
        if (countEl) {
            countEl.textContent = this.onlineUsers.length;
        }
        this.renderOnlineUsers();
    }

    renderOnlineUsers() {
        const container = document.getElementById('online-users-list');
        if (!container) return;

        if (this.onlineUsers.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-medium); grid-column: 1/-1;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">👥</div>
                    <p>Aucun joueur en ligne pour le moment</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.onlineUsers.map(user => `
            <div class="online-user ${user.id === this.currentUser?.id ? 'current-user' : ''}">
                <span class="user-avatar">${user.avatar}</span>
                <div class="user-info">
                    <div class="user-name">
                        ${user.pseudo}
                        ${user.id === this.currentUser?.id ? '<span class="badge">Vous</span>' : ''}
                        ${user.isAuthenticated ? '<span class="badge-auth">✓</span>' : ''}
                    </div>
                    <div class="user-time">${this.formatTime(user.lastSeen)}</div>
                </div>
                <span class="online-indicator"></span>
            </div>
        `).join('');
    }

    // === CHAT ===
    async loadMessages() {
        try {
            if (window.supabaseClient) {
                await this.loadMessagesFromSupabase();
            } else {
                await this.loadMessagesFromLocal();
            }
            
            this.renderMessages();
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    }

    async loadMessagesFromSupabase() {
        try {
            const { data, error } = await window.supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;

            this.messages = data.map(msg => ({
                id: msg.id,
                userId: msg.user_id,
                pseudo: msg.username,
                avatar: msg.avatar,
                text: msg.content,
                timestamp: new Date(msg.created_at).getTime()
            }));
        } catch (error) {
            console.error('Erreur Supabase messages:', error);
            this.messages = [];
        }
    }

    async loadMessagesFromLocal() {
        const stored = localStorage.getItem('rockquiz_messages');
        this.messages = stored ? JSON.parse(stored) : [];
    }

    async sendMessage(text) {
        if (!text.trim() || !this.currentUser) return;

        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: this.currentUser.id,
            pseudo: this.currentUser.pseudo,
            avatar: this.currentUser.avatar,
            text: text.trim(),
            timestamp: Date.now()
        };

        try {
            if (window.supabaseClient && this.currentUser.isAuthenticated) {
                // Mode Supabase : envoyer puis recharger
                await this.sendMessageToSupabase(message);
                await this.loadMessages();
            } else {
                // Mode local : sauvegarder et afficher
                await this.sendMessageToLocal(message);
                this.renderMessages();
            }
            
            // Nettoyer input
            const input = document.getElementById('chat-input');
            if (input) input.value = '';
        } catch (error) {
            console.error('Erreur envoi message:', error);
            alert('Erreur lors de l\'envoi du message');
        }
    }

    async sendMessageToSupabase(message) {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert({
                user_id: message.userId,
                username: message.pseudo,
                avatar: message.avatar,
                content: message.text
            });

        if (error) throw error;
    }

    async sendMessageToLocal(message) {
        this.messages.push(message);
        // Garder seulement les 100 derniers messages
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }
        localStorage.setItem('rockquiz_messages', JSON.stringify(this.messages));
    }

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-medium);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
                    <p>Aucun message pour le moment<br>Soyez le premier à parler !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => `
            <div class="message ${msg.userId === this.currentUser?.id ? 'message-own' : ''}">
                <span class="message-avatar">${msg.avatar}</span>
                <div class="message-content">
                    <div class="message-author">${msg.pseudo}</div>
                    <div class="message-text">${this.escapeHtml(msg.text)}</div>
                    <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                </div>
            </div>
        `).join('');

        // Scroll vers le bas
        container.scrollTop = container.scrollHeight;
    }

    // === MISE À JOUR PROFIL ===
    async updateProfile(newPseudo, newAvatar) {
        if (!this.currentUser) return;

        if (newPseudo) this.currentUser.pseudo = newPseudo;
        if (newAvatar) this.currentUser.avatar = newAvatar;
        this.currentUser.lastSeen = Date.now();

        try {
            if (this.currentUser.isAuthenticated && window.supabaseClient) {
                // Mettre à jour dans Supabase
                const { error } = await window.supabaseClient.auth.updateUser({
                    data: {
                        username: this.currentUser.pseudo,
                        avatar: this.currentUser.avatar
                    }
                });

                if (error) throw error;
                await this.saveUserToDatabase();
            }
            
            localStorage.setItem('rockquiz_multiplayer_user', JSON.stringify(this.currentUser));
            this.updateUI();
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
        }
    }

    // === RAFRAÎCHISSEMENT AUTO ===
    startAutoRefresh() {
        // Mettre à jour la présence toutes les 30 secondes
        this.refreshInterval = setInterval(async () => {
            await this.updatePresence();
            await this.loadOnlineUsers();
            await this.loadMessages();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    // === UI ===
    updateUI() {
        this.updateUserDisplay();
        this.updateOnlineCount();
        this.renderOnlineUsers();
        this.renderMessages();
    }

    updateUserDisplay() {
        if (!this.currentUser) return;

        // Mettre à jour l'affichage dans la navbar
        const userIdEl = document.getElementById('user-id-display');
        const userAvatarEl = document.getElementById('multiplayer-avatar');
        const userNameEl = document.getElementById('multiplayer-name');

        if (userIdEl) {
            userIdEl.textContent = this.currentUser.id.slice(0, 12) + '...';
        }
        if (userAvatarEl) {
            userAvatarEl.textContent = this.currentUser.avatar;
        }
        if (userNameEl) {
            userNameEl.textContent = this.currentUser.pseudo;
        }
    }

    // === UTILITAIRES ===
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
        if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSection(sectionId) {
        // Masquer toutes les sections
        document.querySelectorAll('.page-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Afficher la section demandée
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            window.scrollTo(0, 0);
        }

        // Mettre à jour les liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === sectionId.replace('-screen', '')) {
                link.classList.add('active');
            }
        });
    }
}

// === INITIALISATION GLOBALE ===
let multiplayerSystem;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Démarrage du système multijoueur...');
    
    // Attendre que Supabase soit initialisé (si disponible)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    multiplayerSystem = new MultiplayerSystem();
    await multiplayerSystem.init();
    
    // Rendre disponible globalement
    window.multiplayerSystem = multiplayerSystem;
    
    // Setup des event listeners pour le chat
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                multiplayerSystem.sendMessage(chatInput.value);
            }
        });
    }
    
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', () => {
            multiplayerSystem.sendMessage(chatInput.value);
        });
    }
    
    console.log('✅ Système multijoueur prêt !');
});

// Nettoyer lors de la fermeture
window.addEventListener('beforeunload', () => {
    if (multiplayerSystem) {
        multiplayerSystem.stopAutoRefresh();
    }
	
	
});
// ============================================
// SYSTÈME D'ÉMOJIS POUR LE CHAT - ROCKQUIZ
// À ajouter à multiplayer.js
// ============================================

class EmojiPicker {
    constructor() {
        this.recentEmojis = this.loadRecentEmojis();
        this.currentCategory = 'smileys';
        this.isOpen = false;
        
        // Collection d'émojis par catégorie
        this.emojis = {
            smileys: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
                '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
                '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
                '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
                '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
                '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵',
                '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕'
            ],
            animals: [
                '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
                '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
                '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉',
                '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
                '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢',
                '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞',
                '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'
            ],
            food: [
                '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
                '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
                '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
                '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
                '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
                '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
                '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮'
            ],
            activities: [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
                '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
                '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
                '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
                '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
                '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣'
            ],
            travel: [
                '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
                '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
                '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
                '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
                '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
                '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁'
            ],
            objects: [
                '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
                '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷',
                '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
                '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️',
                '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌',
                '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵'
            ],
            symbols: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
                '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
                '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'
            ],
            flags: [
                '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
                '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲',
                '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽',
                '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭',
                '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷',
                '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨'
            ]
        };
        
        this.categoryNames = {
            smileys: '😊 Smileys',
            animals: '🐶 Animaux',
            food: '🍕 Nourriture',
            activities: '⚽ Activités',
            travel: '✈️ Voyages',
            objects: '💡 Objets',
            symbols: '❤️ Symboles',
            flags: '🏁 Drapeaux'
        };
    }

    init() {
        this.createPicker();
        this.attachEventListeners();
    }

    createPicker() {
        // Créer le bouton emoji
        const chatInputContainer = document.querySelector('.chat-input-container');
        if (!chatInputContainer) return;

        const emojiButton = document.createElement('button');
        emojiButton.className = 'emoji-trigger';
        emojiButton.innerHTML = '😊';
        emojiButton.title = 'Ajouter un emoji';
        emojiButton.type = 'button';
        chatInputContainer.appendChild(emojiButton);

        // Créer le sélecteur d'émojis
        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.innerHTML = `
            <div class="emoji-picker-header">
                <span class="emoji-picker-title">Émojis</span>
                <button class="emoji-picker-close" type="button">✕</button>
            </div>
            
            <input type="text" class="emoji-search" placeholder="Rechercher un emoji...">
            
            ${this.recentEmojis.length > 0 ? `
                <div class="emoji-recent-section">
                    <div class="emoji-section-title">Récents</div>
                    <div class="emoji-recent-grid" id="recent-emojis-grid"></div>
                </div>
            ` : ''}
            
            <div class="emoji-categories">
                ${Object.keys(this.emojis).map(cat => `
                    <button class="emoji-category-btn ${cat === this.currentCategory ? 'active' : ''}" 
                            data-category="${cat}" type="button">
                        ${this.categoryNames[cat]}
                    </button>
                `).join('')}
            </div>
            
            <div class="emoji-grid" id="emoji-grid"></div>
        `;
        
        chatInputContainer.appendChild(picker);
        
        // Remplir la grille d'émojis
        this.updateEmojiGrid();
        this.updateRecentEmojis();
    }

    attachEventListeners() {
        // Bouton toggle
        const trigger = document.querySelector('.emoji-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Bouton fermer
        const closeBtn = document.querySelector('.emoji-picker-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Catégories
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentCategory = e.target.dataset.category;
                this.updateEmojiGrid();
                
                // Mettre à jour les boutons actifs
                document.querySelectorAll('.emoji-category-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // Recherche
        const searchInput = document.querySelector('.emoji-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }

        // Fermer si clic en dehors
        document.addEventListener('click', (e) => {
            const picker = document.querySelector('.emoji-picker');
            const trigger = document.querySelector('.emoji-trigger');
            if (picker && !picker.contains(e.target) && e.target !== trigger) {
                this.close();
            }
        });
    }

    updateEmojiGrid() {
        const grid = document.getElementById('emoji-grid');
        if (!grid) return;

        const emojisToShow = this.emojis[this.currentCategory] || [];
        
        grid.innerHTML = emojisToShow.map(emoji => `
            <button class="emoji-item" data-emoji="${emoji}" type="button">
                ${emoji}
            </button>
        `).join('');

        // Event listeners pour les emojis
        grid.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.insertEmoji(emoji);
            });
        });
    }

    updateRecentEmojis() {
        const grid = document.getElementById('recent-emojis-grid');
        if (!grid) return;

        grid.innerHTML = this.recentEmojis.slice(0, 16).map(emoji => `
            <button class="emoji-item" data-emoji="${emoji}" type="button">
                ${emoji}
            </button>
        `).join('');

        // Event listeners
        grid.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.insertEmoji(emoji);
            });
        });
    }

    search(query) {
        const grid = document.getElementById('emoji-grid');
        if (!grid) return;

        if (!query.trim()) {
            this.updateEmojiGrid();
            return;
        }

        // Rechercher dans tous les emojis
        const allEmojis = Object.values(this.emojis).flat();
        const results = allEmojis.slice(0, 64); // Limiter les résultats
        
        if (results.length === 0) {
            grid.innerHTML = `
                <div class="emoji-no-results">
                    <div class="emoji-no-results-icon">🔍</div>
                    <p>Aucun emoji trouvé</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = results.map(emoji => `
            <button class="emoji-item" data-emoji="${emoji}" type="button">
                ${emoji}
            </button>
        `).join('');

        // Event listeners
        grid.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.insertEmoji(emoji);
            });
        });
    }

    insertEmoji(emoji) {
        const input = document.getElementById('chat-input');
        if (!input) return;

        // Insérer l'emoji à la position du curseur
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        input.value = text.substring(0, start) + emoji + text.substring(end);
        
        // Replacer le curseur
        const newPos = start + emoji.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();

        // Ajouter aux récents
        this.addToRecent(emoji);
        
        // Fermer le picker (optionnel - commenter pour garder ouvert)
        // this.close();
    }

    addToRecent(emoji) {
        // Retirer si déjà présent
        this.recentEmojis = this.recentEmojis.filter(e => e !== emoji);
        
        // Ajouter au début
        this.recentEmojis.unshift(emoji);
        
        // Garder seulement les 24 derniers
        this.recentEmojis = this.recentEmojis.slice(0, 24);
        
        // Sauvegarder
        this.saveRecentEmojis();
        this.updateRecentEmojis();
    }

    loadRecentEmojis() {
        try {
            const stored = localStorage.getItem('rockquiz_recent_emojis');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveRecentEmojis() {
        try {
            localStorage.setItem('rockquiz_recent_emojis', JSON.stringify(this.recentEmojis));
        } catch (e) {
            console.error('Erreur sauvegarde émojis récents:', e);
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const picker = document.querySelector('.emoji-picker');
        if (picker) {
            picker.classList.add('show');
            this.isOpen = true;
            
            // Focus sur la recherche
            const search = document.querySelector('.emoji-search');
            if (search) {
                setTimeout(() => search.focus(), 100);
            }
        }
    }

    close() {
        const picker = document.querySelector('.emoji-picker');
        if (picker) {
            picker.classList.remove('show');
            this.isOpen = false;
        }
    }
}

// ============================================
// INTÉGRATION AVEC LE SYSTÈME MULTIJOUEUR
// ============================================

// Variable globale pour le sélecteur d'émojis
let emojiPicker;

// Initialiser le sélecteur d'émojis quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que la page chat soit chargée
    setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            emojiPicker = new EmojiPicker();
            emojiPicker.init();
            console.log('✅ Sélecteur d\'émojis initialisé');
        }
    }, 1000);
});

// Fonction pour réinitialiser le picker si navigation
window.initEmojiPicker = function() {
    if (!emojiPicker && document.getElementById('chat-input')) {
        emojiPicker = new EmojiPicker();
        emojiPicker.init();
    }
};

// Amélioration de la fonction renderMessages pour supporter les emojis
if (window.MultiplayerSystem) {
    const originalRenderMessages = window.MultiplayerSystem.prototype.renderMessages;
    
    window.MultiplayerSystem.prototype.renderMessages = function() {
        // Appeler la fonction originale
        if (originalRenderMessages) {
            originalRenderMessages.call(this);
        }
        
        // Réinitialiser le picker si nécessaire
        setTimeout(() => {
            if (!emojiPicker && document.getElementById('chat-input')) {
                window.initEmojiPicker();
            }
        }, 100);
    };
}