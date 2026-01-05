// ============================================
// SYSTÈME D'ANALYTICS SUPABASE - ROCKQUIZ
// analytics.js - À placer dans votre dossier js/
// ============================================

class RockQuizAnalytics {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.pageStartTime = Date.now();
        this.supabase = null;
        this.currentUser = null;
        this.deviceInfo = this.detectDevice();
    }

    // ============================================
    // INITIALISATION
    // ============================================

    async init() {
        // Attendre que Supabase soit disponible
        await this.waitForSupabase();
        
        // Récupérer l'utilisateur connecté
        await this.getCurrentUser();
        
        // Tracker la visite de page
        await this.trackPageView();
        
        // Tracker la sortie de page
        this.setupBeforeUnload();
        
        console.log('✅ Analytics initialisé - Session:', this.sessionId);
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabaseClient) {
                    this.supabase = window.supabaseClient;
                    resolve();
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;
        } catch (error) {
            console.warn('Analytics: Pas d\'utilisateur connecté');
        }
    }

    // ============================================
    // GESTION SESSION
    // ============================================

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('rockquiz_session_id');
        
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('rockquiz_session_id', sessionId);
        }
        
        return sessionId;
    }

    // ============================================
    // DÉTECTION APPAREIL
    // ============================================

    detectDevice() {
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'unknown';

        // Détecter le type d'appareil
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            deviceType = 'tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            deviceType = 'mobile';
        }

        // Détecter le navigateur
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        else if (ua.indexOf('Trident') > -1) browser = 'IE';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';

        return { deviceType, browser };
    }

    // ============================================
    // TRACKING PAGE VIEW
    // ============================================

    async trackPageView() {
        if (!this.supabase) return;

        try {
            const pageData = {
                page_url: window.location.pathname,
                page_title: document.title,
                user_id: this.currentUser?.id || null,
                session_id: this.sessionId,
                referrer: document.referrer || null,
                user_agent: navigator.userAgent,
                device_type: this.deviceInfo.deviceType,
                browser: this.deviceInfo.browser,
                created_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('page_views')
                .insert(pageData);

            if (error) {
                console.error('Erreur tracking page view:', error);
            } else {
                console.log('📊 Page view trackée:', pageData.page_url);
            }
        } catch (error) {
            console.error('Erreur analytics:', error);
        }
    }

    // ============================================
    // TRACKING ÉVÉNEMENTS
    // ============================================

    async trackEvent(eventName, eventData = {}, category = 'engagement') {
        if (!this.supabase) return;

        try {
            const eventPayload = {
                event_name: eventName,
                event_category: category,
                event_data: eventData,
                user_id: this.currentUser?.id || null,
                session_id: this.sessionId,
                page_url: window.location.pathname,
                created_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('analytics_events')
                .insert(eventPayload);

            if (error) {
                console.error('Erreur tracking event:', error);
            } else {
                console.log('📊 Événement tracké:', eventName, eventData);
            }
        } catch (error) {
            console.error('Erreur analytics event:', error);
        }
    }

    // ============================================
    // ÉVÉNEMENTS SPÉCIFIQUES ROCKQUIZ
    // ============================================

    // Quiz
    trackQuizStart(theme) {
        this.trackEvent('quiz_start', { theme }, 'engagement');
    }

    trackQuizComplete(theme, score, totalQuestions, duration) {
        this.trackEvent('quiz_complete', { 
            theme, 
            score,
            total_questions: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            duration_seconds: duration 
        }, 'engagement');
    }

    trackQuizAbandoned(theme, questionNumber) {
        this.trackEvent('quiz_abandoned', { 
            theme, 
            question_number: questionNumber 
        }, 'engagement');
    }

    // Authentification
    trackLogin(method = 'email') {
        this.trackEvent('user_login', { method }, 'conversion');
    }

    trackLogout() {
        this.trackEvent('user_logout', {}, 'engagement');
    }

    trackSignup(method = 'email') {
        this.trackEvent('user_signup', { method }, 'conversion');
    }

    // Navigation
    trackCategoryView(category) {
        this.trackEvent('category_view', { category }, 'navigation');
    }

    trackThemeClick(theme) {
        this.trackEvent('theme_click', { theme }, 'engagement');
    }

    // Chat & Social
    trackChatMessageSent() {
        this.trackEvent('chat_message_sent', {}, 'engagement');
    }

    trackOnlineUsersView() {
        this.trackEvent('online_users_view', {}, 'engagement');
    }

    // Profil
    trackProfileView() {
        this.trackEvent('profile_view', {}, 'engagement');
    }

    trackProfileEdit() {
        this.trackEvent('profile_edit', {}, 'engagement');
    }

    trackAvatarChange(newAvatar) {
        this.trackEvent('avatar_change', { avatar: newAvatar }, 'engagement');
    }

    // Leaderboard
    trackLeaderboardView(tab) {
        this.trackEvent('leaderboard_view', { tab }, 'engagement');
    }

    // Erreurs
    trackError(errorType, errorMessage) {
        this.trackEvent('error', { 
            type: errorType, 
            message: errorMessage 
        }, 'error');
    }

    // Recherche
    trackSearch(query, resultsCount) {
        this.trackEvent('search', { 
            query, 
            results_count: resultsCount 
        }, 'engagement');
    }

    // Boutons
    trackButtonClick(buttonName, location) {
        this.trackEvent('button_click', { 
            button: buttonName, 
            location 
        }, 'engagement');
    }

    // ============================================
    // SUIVI DU TEMPS PASSÉ
    // ============================================

    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000);
            
            // Utiliser sendBeacon pour envoyer avant fermeture
            if (navigator.sendBeacon && this.supabase) {
                this.trackEvent('page_time', { 
                    seconds: timeSpent,
                    page: window.location.pathname
                }, 'engagement');
            }
        });
    }

    // ============================================
    // TRACKING AUTOMATIQUE DES CLICS
    // ============================================

    trackAllLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const isExternal = !link.href.includes(window.location.hostname);
                this.trackEvent('link_click', {
                    url: link.href,
                    text: link.textContent?.trim() || '',
                    external: isExternal
                }, 'navigation');
            }
        });
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    // Obtenir les stats en temps réel
    async getRealtimeStats() {
        if (!this.supabase) return null;

        try {
            const { data, error } = await this.supabase
                .from('stats_realtime')
                .select('*')
                .single();

            return error ? null : data;
        } catch (error) {
            console.error('Erreur stats realtime:', error);
            return null;
        }
    }

    // Obtenir les visiteurs des 7 derniers jours
    async getVisitors7Days() {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('stats_visitors_7days')
                .select('*')
                .order('date', { ascending: false });

            return error ? [] : data;
        } catch (error) {
            console.error('Erreur stats 7 jours:', error);
            return [];
        }
    }

    // Obtenir les pages les plus visitées
    async getTopPages() {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('stats_top_pages')
                .select('*')
                .limit(10);

            return error ? [] : data;
        } catch (error) {
            console.error('Erreur top pages:', error);
            return [];
        }
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

// Créer l'instance globale
window.analytics = new RockQuizAnalytics();

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analytics.init();
    });
} else {
    window.analytics.init();
}

// ============================================
// INTÉGRATION AVEC APP.JS
// ============================================

// Vous pouvez maintenant utiliser partout dans votre code :
// 
// window.analytics.trackQuizStart('culture');
// window.analytics.trackQuizComplete('culture', 8, 10, 45);
// window.analytics.trackLogin('email');
// window.analytics.trackChatMessageSent();
// etc.

console.log('📊 Analytics ROCKQUIZ chargé et prêt !');