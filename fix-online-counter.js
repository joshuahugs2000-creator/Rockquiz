// ============================================
// CORRECTIF D'URGENCE - COMPTEUR JOUEURS EN LIGNE
// Créez un fichier "fix-online-counter.js"
// ============================================

console.log('🔧 Correctif compteur joueurs chargé...');

// Fonction pour mettre à jour tous les compteurs
function updateAllCounters() {
    console.log('🔄 Mise à jour des compteurs...');
    
    let count = 1; // Au minimum vous êtes connecté
    
    // Si le système multiplayer existe, utiliser ses données
    if (window.multiplayerSystem && window.multiplayerSystem.onlineUsers) {
        count = window.multiplayerSystem.onlineUsers.length;
        console.log(`👥 ${count} joueur(s) détecté(s)`);
    }
    
    // Mettre à jour le compteur navbar
    const navCounter = document.getElementById('online-count');
    if (navCounter) {
        navCounter.textContent = count;
        console.log('✅ Navbar mis à jour:', count);
    }
    
    // Mettre à jour JOUEURS EN LIGNE
    const totalOnline = document.getElementById('total-online-users');
    if (totalOnline) {
        totalOnline.textContent = count;
        console.log('✅ Total en ligne mis à jour:', count);
    }
    
    // Mettre à jour MEMBRES INSCRITS
    const authenticated = document.getElementById('authenticated-users');
    if (authenticated) {
        const authCount = window.multiplayerSystem?.currentUser?.isAuthenticated ? 1 : 0;
        authenticated.textContent = authCount;
        console.log('✅ Authentifiés mis à jour:', authCount);
    }
    
    // Mettre à jour INVITÉS
    const guests = document.getElementById('guest-users');
    if (guests) {
        const guestCount = window.multiplayerSystem?.currentUser?.isAuthenticated ? 0 : 1;
        guests.textContent = guestCount;
        console.log('✅ Invités mis à jour:', guestCount);
    }
    
    // Mettre à jour ACTIFS MAINTENANT
    const activeNow = document.getElementById('active-now');
    if (activeNow) {
        activeNow.textContent = count;
        console.log('✅ Actifs maintenant mis à jour:', count);
    }
    
    console.log('✅ Tous les compteurs mis à jour !');
}

// Fonction pour le bouton Actualiser
window.refreshOnlineUsers = function() {
    console.log('🔄 Bouton Actualiser cliqué !');
    
    if (window.multiplayerSystem && window.multiplayerSystem.loadOnlineUsers) {
        window.multiplayerSystem.loadOnlineUsers().then(() => {
            console.log('✅ Utilisateurs rechargés');
            updateAllCounters();
        });
    } else {
        console.log('⚠️ Système multiplayer non disponible, mise à jour manuelle');
        updateAllCounters();
    }
};

// Mettre à jour automatiquement toutes les 5 secondes
setInterval(() => {
    if (document.getElementById('online-screen')?.classList.contains('active')) {
        console.log('⏰ Auto-refresh (page online visible)');
        updateAllCounters();
    }
}, 5000);

// Mettre à jour quand on arrive sur la page
document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page="online"]');
    if (link) {
        console.log('📍 Navigation vers page Online');
        setTimeout(() => {
            updateAllCounters();
        }, 500);
    }
});

// Mise à jour initiale après 1 seconde
setTimeout(() => {
    console.log('🚀 Initialisation des compteurs...');
    updateAllCounters();
}, 1000);

// Mise à jour toutes les 3 secondes si sur la page online
setInterval(() => {
    const onlineScreen = document.getElementById('online-screen');
    if (onlineScreen && onlineScreen.classList.contains('active')) {
        updateAllCounters();
    }
}, 3000);

// Hook sur le système multiplayer quand il se charge
const checkMultiplayer = setInterval(() => {
    if (window.multiplayerSystem) {
        console.log('✅ Système multiplayer détecté !');
        
        // Hook sur loadOnlineUsers
        const originalLoad = window.multiplayerSystem.loadOnlineUsers;
        if (originalLoad) {
            window.multiplayerSystem.loadOnlineUsers = async function() {
                await originalLoad.call(this);
                updateAllCounters();
            };
        }
        
        // Hook sur updateOnlineCount
        const originalUpdate = window.multiplayerSystem.updateOnlineCount;
        if (originalUpdate) {
            window.multiplayerSystem.updateOnlineCount = function() {
                originalUpdate.call(this);
                updateAllCounters();
            };
        }
        
        clearInterval(checkMultiplayer);
        
        // Forcer une première mise à jour
        setTimeout(() => {
            if (window.multiplayerSystem.currentUser) {
                console.log('👤 Utilisateur courant détecté:', window.multiplayerSystem.currentUser.pseudo);
                updateAllCounters();
            }
        }, 500);
    }
}, 500);

// Debug accessible globalement
window.debugOnlineCounter = function() {
    console.log('=== DEBUG COMPTEUR ===');
    console.log('Système multiplayer:', window.multiplayerSystem ? 'OUI' : 'NON');
    if (window.multiplayerSystem) {
        console.log('Utilisateur courant:', window.multiplayerSystem.currentUser);
        console.log('Utilisateurs en ligne:', window.multiplayerSystem.onlineUsers);
        console.log('Nombre:', window.multiplayerSystem.onlineUsers?.length || 0);
    }
    console.log('Éléments DOM:');
    console.log('- online-count:', document.getElementById('online-count')?.textContent);
    console.log('- total-online-users:', document.getElementById('total-online-users')?.textContent);
    console.log('- authenticated-users:', document.getElementById('authenticated-users')?.textContent);
    console.log('- guest-users:', document.getElementById('guest-users')?.textContent);
    console.log('- active-now:', document.getElementById('active-now')?.textContent);
    console.log('=====================');
};

console.log('✅ Correctif compteur installé !');
console.log('💡 Tapez window.debugOnlineCounter() pour debug');
console.log('💡 Tapez window.refreshOnlineUsers() pour actualiser');