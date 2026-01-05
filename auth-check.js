// ============================================
// DÉTECTION ET GESTION DE L'AUTHENTIFICATION
// auth-check.js - VERSION CORRIGÉE
// ============================================

(function() {
    // Attendre que la page soit chargée
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Vérifier la configuration Supabase
        if (typeof window.checkSupabaseConfig === 'function' && !window.checkSupabaseConfig()) {
            console.error('Configuration Supabase invalide. Authentification désactivée.');
            showAuthButtons(); // Afficher quand même les boutons
            return;
        }

        // Vérifier que Supabase est chargé
        if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_KEY) {
            console.error('Supabase non initialisé correctement');
            showAuthButtons();
            return;
        }

        try {
            // Initialiser Supabase
            const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
            window.supabaseClient = supabase;
            
            let currentUser = null;

            // Vérifier l'authentification au chargement
            checkAuth();

            async function checkAuth() {
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    
                    if (error) {
                        console.error('Erreur de session:', error);
                        showAuthButtons();
                        return;
                    }
                    
                    if (session) {
                        currentUser = session.user;
                        showUserProfile();
                    } else {
                        showAuthButtons();
                    }
                } catch (err) {
                    console.error('Erreur checkAuth:', err);
                    showAuthButtons();
                }
            }

            // Afficher le profil utilisateur
            function showUserProfile() {
                const authButtons = document.getElementById('auth-buttons');
                const navProfile = document.getElementById('nav-profile-btn');
                
                if (authButtons) authButtons.style.display = 'none';
                if (navProfile) {
                    navProfile.style.display = 'flex';
                    
                    // Récupérer les infos utilisateur
                    const username = currentUser.user_metadata?.username || 
                                   currentUser.email?.split('@')[0] || 
                                   'Utilisateur';
                    const avatar = currentUser.user_metadata?.avatar || '😎';
                    
                    // Mettre à jour l'affichage
                    const profileAvatar = document.getElementById('profile-avatar');
                    const profileName = document.getElementById('profile-name');
                    
                    if (profileAvatar) profileAvatar.textContent = avatar;
                    if (profileName) profileName.textContent = username;
                    
                    // Ajouter le menu déroulant
                    addProfileMenu(navProfile);
                }
            }

            // Afficher les boutons de connexion
            function showAuthButtons() {
                const authButtons = document.getElementById('auth-buttons');
                const navProfile = document.getElementById('nav-profile-btn');
                
                if (authButtons) authButtons.style.display = 'flex';
                if (navProfile) navProfile.style.display = 'none';
            }

            // Ajouter le menu déroulant du profil
            function addProfileMenu(profileElement) {
                // Vérifier si le menu existe déjà
                if (profileElement.querySelector('.profile-dropdown')) return;
                
                const dropdown = document.createElement('div');
                dropdown.className = 'profile-dropdown';
                dropdown.innerHTML = `
                    <a href="#" data-page="profile">👤 Mon Profil</a>
                    <a href="dashboard.html">📊 Dashboard</a>
                    <a href="lobby.html">👥 Multijoueur</a>
                    <a href="chat.html">💬 Chat</a>
                    <a href="#" class="logout-btn" id="logout-link">🚪 Déconnexion</a>
                `;
                
                profileElement.appendChild(dropdown);
                
                // Gérer le clic sur le profil
                profileElement.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('logout-btn') && 
                        !e.target.closest('a[data-page]')) {
                        dropdown.classList.toggle('show');
                    }
                });
                
                // Gérer la déconnexion
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) {
                    logoutLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                            try {
                                await supabase.auth.signOut();
                                window.location.reload();
                            } catch (err) {
                                console.error('Erreur de déconnexion:', err);
                                alert('Erreur lors de la déconnexion');
                            }
                        }
                    });
                }
                
                // Fermer le dropdown si on clique ailleurs
                document.addEventListener('click', (e) => {
                    if (!profileElement.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });
            }

            // Écouter les changements d'authentification
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    currentUser = session.user;
                    showUserProfile();
                } else if (event === 'SIGNED_OUT') {
                    currentUser = null;
                    showAuthButtons();
                }
            });

            // Exporter pour utilisation globale
            window.RockQuizAuth = {
                getCurrentUser: () => currentUser,
                isAuthenticated: () => currentUser !== null,
                logout: async () => {
                    try {
                        await supabase.auth.signOut();
                        window.location.reload();
                    } catch (err) {
                        console.error('Erreur logout:', err);
                        throw err;
                    }
                }
            };

        } catch (error) {
            console.error('Erreur initialisation auth:', error);
            showAuthButtons();
        }
    }
})();