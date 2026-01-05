// ============================================
// CONFIGURATION SUPABASE - ROCKQUIZ
// ============================================

// 🔑 VOS CLÉS SUPABASE
const SUPABASE_URL = 'https://ggfsgmieocsmzbtwtfgs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZnNnbWllb2NzbXpidHd0ZmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzQyNjYsImV4cCI6MjA4MjUxMDI2Nn0.zBvsNzK5Eiecya3yllri6BE0b_G03lMHkvTJ1Bv6Ai8';

// Export pour utilisation dans les autres fichiers
if (typeof window !== 'undefined') {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_KEY = SUPABASE_KEY;
    
    // Fonction de vérification
    window.checkSupabaseConfig = function() {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('❌ Configuration Supabase manquante');
            return false;
        }
        if (!SUPABASE_KEY.startsWith('eyJ')) {
            console.error('❌ Clé Supabase invalide');
            return false;
        }
        console.log('✅ Configuration Supabase valide');
        return true;
    };
}

// Ne pas initialiser Supabase ici - chaque page le fera elle-même