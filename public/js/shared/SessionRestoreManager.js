// =============================================
// SessionRestoreManager.js
// Sistema de Restauração de Sessão Otimizado
// Versão: 2.0
// =============================================

class SessionRestoreManager {
    constructor(app) {
        this.app = app;
        this.sessionCheckInProgress = false;
        this.sessionRestored = false;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo
        
        console.log('SessionRestoreManager inicializado');
    }

    // MÉTODO PRINCIPAL - Substitui múltiplas implementações
    async restoreUserSession() {
        if (this.sessionCheckInProgress || this.sessionRestored) {
            console.log('Restauração de sessão já em andamento ou completa');
            return this.sessionRestored;
        }

        this.sessionCheckInProgress = true;
        console.log('Iniciando restauração de sessão...');

        try {
            // 1. VERIFICAÇÃO IMEDIATA DO FIREBASE AUTH
            const firebaseUser = await this.checkFirebaseAuthState();
            if (firebaseUser) {
                await this.setUserSession(firebaseUser, 'firebase');
                return true;
            }

            // 2. VERIFICAÇÃO DO AUTHMANAGER
            const authManagerUser = await this.checkAuthManagerState();
            if (authManagerUser) {
                await this.setUserSession(authManagerUser, 'authManager');
                return true;
            }

            // 3. VERIFICAÇÃO DO LOCALSTORAGE (BACKUP)
            const localUser = await this.checkLocalStorageSession();
            if (localUser) {
                await this.setUserSession(localUser, 'localStorage');
                return true;
            }

            console.log('Nenhuma sessão válida encontrada');
            return false;

        } catch (error) {
            console.error('Erro na restauração de sessão:', error);
            return false;
        } finally {
            this.sessionCheckInProgress = false;
        }
    }

    // VERIFICAÇÃO DO FIREBASE AUTH DIRETO
    async checkFirebaseAuthState() {
        try {
            // Aguardar Firebase estar disponível
            let attempts = 0;
            while (attempts < 20 && (!window.firebaseAuth || !window.firebaseAuth.currentUser)) {
                await this.sleep(100);
                attempts++;
            }

            if (window.firebaseAuth?.currentUser) {
                const user = window.firebaseAuth.currentUser;
                console.log('Usuário encontrado no Firebase Auth:', user.email);
                
                // Verificar se o token ainda é válido
                try {
                    const tokenResult = await user.getIdTokenResult();
                    const now = new Date();
                    const expTime = new Date(tokenResult.expirationTime);
                    
                    if (expTime > now) {
                        return {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            source: 'firebase',
                            tokenValid: true
                        };
                    } else {
                        console.warn('Token Firebase expirado');
                        return null;
                    }
                } catch (tokenError) {
                    console.warn('Erro ao verificar token:', tokenError);
                    // Ainda assim retornar o usuário se existir
                    return {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        source: 'firebase',
                        tokenValid: false
                    };
                }
            }

            return null;
        } catch (error) {
            console.warn('Erro ao verificar Firebase Auth:', error);
            return null;
        }
    }

    // VERIFICAÇÃO DO AUTHMANAGER
    async checkAuthManagerState() {
        try {
            let attempts = 0;
            while (attempts < 30 && !window.authManager) {
                await this.sleep(100);
                attempts++;
            }

            if (window.authManager && typeof window.authManager.isUserAuthenticated === 'function') {
                if (window.authManager.isUserAuthenticated()) {
                    const user = window.authManager.getCurrentUser();
                    if (user?.uid) {
                        console.log('Usuário encontrado no AuthManager:', user.email);
                        return {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            source: 'authManager'
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.warn('Erro ao verificar AuthManager:', error);
            return null;
        }
    }

    // VERIFICAÇÃO DO LOCALSTORAGE (BACKUP/FALLBACK)
    async checkLocalStorageSession() {
        try {
            const sessionKey = 'jsfitapp_session';
            const userSessionKey = 'jsfitapp_user';
            
            // Tentar sessão global primeiro
            let sessionData = null;
            
            const globalSession = localStorage.getItem(sessionKey);
            if (globalSession) {
                sessionData = JSON.parse(globalSession);
            } else {
                // Fallback para sessão de usuário
                const userSession = localStorage.getItem(userSessionKey);
                if (userSession) {
                    const userData = JSON.parse(userSession);
                    if (userData.sessionActive) {
                        sessionData = userData;
                    }
                }
            }

            if (!sessionData || !sessionData.uid) {
                return null;
            }

            // Verificar expiração
            if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
                console.log('Sessão localStorage expirada');
                this.clearExpiredSession();
                return null;
            }

            // Verificar idade da sessão (máximo 7 dias)
            const sessionAge = Date.now() - (sessionData.createdAt || 0);
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

            if (sessionAge > maxAge) {
                console.log('Sessão localStorage muito antiga');
                this.clearExpiredSession();
                return null;
            }

            console.log('Sessão válida encontrada no localStorage:', sessionData.email);
            
            return {
                uid: sessionData.uid,
                email: sessionData.email,
                displayName: sessionData.displayName,
                source: 'localStorage',
                requiresReauth: sessionAge > (3 * 24 * 60 * 60 * 1000) // > 3 dias
            };

        } catch (error) {
            console.warn('Erro ao verificar localStorage:', error);
            return null;
        }
    }

    // DEFINIR SESSÃO DO USUÁRIO
    async setUserSession(userData, source) {
        try {
            console.log(`Definindo sessão do usuário (fonte: ${source})`);
            
            // Atualizar propriedades da aplicação
            this.app.currentUser = userData;
            this.app.currentUserId = userData.uid;
            this.app.userEmail = userData.email;
            this.app.userDisplayName = userData.displayName || userData.email?.split('@')[0] || 'Usuário';
            this.app.isUserAuthenticated = true;

            // Salvar sessão atualizada no localStorage
            this.saveSessionToStorage(userData, source);

            // Marcar como restaurada
            this.sessionRestored = true;

            // Se foi restaurada do localStorage, tentar reautenticar silenciosamente
            if (source === 'localStorage' && userData.requiresReauth) {
                this.attemptSilentReauth(userData);
            }

            console.log(`Sessão definida: ${userData.email} (${source})`);
            return true;

        } catch (error) {
            console.error('Erro ao definir sessão:', error);
            return false;
        }
    }

    // SALVAR SESSÃO NO LOCALSTORAGE
    saveSessionToStorage(userData, source) {
        try {
            const sessionData = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                source: source,
                createdAt: Date.now(),
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 dias
                lastActivity: Date.now()
            };

            // Salvar em múltiplas chaves para compatibilidade
            localStorage.setItem('jsfitapp_session', JSON.stringify(sessionData));
            localStorage.setItem('jsfitapp_user', JSON.stringify({
                ...sessionData,
                sessionActive: true
            }));

            console.log('Sessão salva no localStorage');

        } catch (error) {
            console.warn('Erro ao salvar sessão:', error);
        }
    }

    // TENTATIVA DE REAUTENTICAÇÃO SILENCIOSA
    async attemptSilentReauth(userData) {
        try {
            console.log('Tentando reautenticação silenciosa...');
            
            // Se AuthManager disponível, tentar refresh
            if (window.authManager && typeof window.authManager.refreshToken === 'function') {
                await window.authManager.refreshToken();
                console.log('Token refreshed via AuthManager');
            }
            
            // Se Firebase disponível, tentar reload do user
            if (window.firebaseAuth?.currentUser) {
                await window.firebaseAuth.currentUser.reload();
                console.log('Usuário recarregado no Firebase');
            }

        } catch (error) {
            console.warn('Reautenticação silenciosa falhou:', error);
            // Não é crítico - continuar com sessão cached
        }
    }

    // LIMPAR SESSÃO EXPIRADA
    clearExpiredSession() {
        try {
            localStorage.removeItem('jsfitapp_session');
            localStorage.removeItem('jsfitapp_user');
            console.log('Sessão expirada removida');
        } catch (error) {
            console.warn('Erro ao limpar sessão:', error);
        }
    }

    // UTILITÁRIO: SLEEP
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // MÉTODO PARA ATUALIZAR ATIVIDADE (CHAMAR EM AÇÕES DO USUÁRIO)
    updateActivity() {
        try {
            const session = localStorage.getItem('jsfitapp_session');
            if (session) {
                const sessionData = JSON.parse(session);
                sessionData.lastActivity = Date.now();
                localStorage.setItem('jsfitapp_session', JSON.stringify(sessionData));
            }
        } catch (error) {
            console.warn('Erro ao atualizar atividade:', error);
        }
    }

// LIMPAR SESSÃO MANUALMENTE - Versão Aprimorada
clearSession() {
    try {
        console.log('🧹 Iniciando limpeza completa da sessão...');
        
        // Limpar localStorage com todas as chaves possíveis
        const sessionKeys = [
            'jsfitapp_session',
            'jsfitapp_user',
            'jsfit_user_session',
            'authManager_session',
            'firebase_session'
        ];
        
        sessionKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ SessionManager removeu: ${key}`);
            }
        });
        
        // Limpar propriedades da aplicação
        if (this.app) {
            this.app.currentUser = null;
            this.app.currentUserId = null;
            this.app.userEmail = null;
            this.app.userDisplayName = null;
            this.app.isUserAuthenticated = false;
        }
        
        // Resetar flags do SessionManager
        this.sessionRestored = false;
        this.sessionCheckInProgress = false;
        
        // Tentar logout do Firebase se disponível
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            window.firebaseAuth.signOut().catch(error => {
                console.warn('⚠️ Erro ao fazer signOut do Firebase:', error);
            });
        }
        
        console.log('✅ Sessão limpa completamente pelo SessionManager');
        
    } catch (error) {
        console.error('❌ Erro ao limpar sessão:', error);
    }
}

    // VERIFICAR SE SESSÃO AINDA É VÁLIDA
    isSessionValid() {
        try {
            const session = localStorage.getItem('jsfitapp_session');
            if (!session) return false;

            const sessionData = JSON.parse(session);
            
            // Verificar se ainda não expirou
            if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
                return false;
            }

            // Verificar se tem dados mínimos
            return !!(sessionData.uid && sessionData.email);

        } catch (error) {
            console.warn('Erro ao verificar validade da sessão:', error);
            return false;
        }
    }

    // ESTATÍSTICAS DA SESSÃO
    getSessionInfo() {
        try {
            const session = localStorage.getItem('jsfitapp_session');
            if (!session) return null;

            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            return {
                email: sessionData.email,
                source: sessionData.source,
                ageInHours: Math.floor((now - sessionData.createdAt) / (1000 * 60 * 60)),
                hoursUntilExpiration: Math.floor((sessionData.expiresAt - now) / (1000 * 60 * 60)),
                lastActivityHours: Math.floor((now - sessionData.lastActivity) / (1000 * 60 * 60)),
                isValid: this.isSessionValid()
            };

        } catch (error) {
            console.warn('Erro ao obter info da sessão:', error);
            return null;
        }
    }
}

// Disponibilizar globalmente se necessário
if (typeof window !== 'undefined') {
    window.SessionRestoreManager = SessionRestoreManager;
}

// Export para módulos ES6 se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionRestoreManager;
}