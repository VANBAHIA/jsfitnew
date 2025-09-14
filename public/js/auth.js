// auth.js - VERSÃO FINAL CORRIGIDA
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.auth = null;
        this.isInitialized = false;
        this.isProcessingAuthChange = false;
        this.authStateListenerSetup = false;
        this.initializationPromise = null;
        this.intentionalLogout = false;
        this.firebaseAuthReady = false;
        this.authStateResolver = null;
        this.authStatePromise = new Promise(resolve => {
            this.authStateResolver = resolve;
        });
        
        // IMPORTANTE: Marcar a instância como válida
        this._isAuthManagerInstance = true;
        this.version = '2.0';
        
        console.log('🔧 AuthManager instance criada');
    }

    async initialize() {
        console.log('🔄 initialize() chamado, estado atual:', {
            hasPromise: !!this.initializationPromise,
            isInitialized: this.isInitialized
        });
        
        if (this.initializationPromise) {
            console.log('⏳ Aguardando inicialização em progresso...');
            return this.initializationPromise;
        }

        if (this.isInitialized) {
            console.log('✅ AuthManager já inicializado');
            return true;
        }

        this.initializationPromise = this._doInitialize();
        return this.initializationPromise;
    }

    async _doInitialize() {
        try {
            console.log('🚀 Executando inicialização do AuthManager...');
            
            // Aguardar Firebase com timeout maior
            let attempts = 0;
            const maxAttempts = 100; // Aumentado
            
            console.log('⏳ Aguardando Firebase...');
            while (!window.firebaseApp && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
                if (attempts % 20 === 0) {
                    console.log(`⏳ Aguardando Firebase... tentativa ${attempts}/${maxAttempts}`);
                }
            }
            
            if (!window.firebaseApp) {
                throw new Error('Firebase não inicializado após timeout');
            }
            
            console.log('✅ Firebase encontrado, configurando Auth...');
            
            // Configurar Firebase Auth
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
            this.auth = getAuth(window.firebaseApp);
            
            console.log('🔍 Verificando sessão local...');
            
            // Verificar sessão local ANTES do listener
            const storedUser = this.getUserFromStorage();
            if (storedUser && !this.intentionalLogout) {
                console.log('📱 Sessão local válida encontrada:', storedUser.email);
                this.currentUser = {
                    uid: storedUser.uid,
                    email: storedUser.email,
                    displayName: storedUser.displayName
                };
                this.isAuthenticated = true;
                this.showMainApp();
            }
            
            // Configurar listener APENAS UMA VEZ
            if (!this.authStateListenerSetup) {
                await this.setupAuthStateListener();
                this.authStateListenerSetup = true;
            }
            
            // Aguardar primeira verificação do Firebase Auth
            console.log('⏳ Aguardando verificação Firebase Auth...');
            const firebaseUser = await this.authStatePromise;
            console.log('✅ Primeira verificação Firebase concluída:', firebaseUser ? firebaseUser.uid : 'sem usuário');
            
            this.isInitialized = true;
            this.firebaseAuthReady = true;
            console.log('✅ AuthManager totalmente inicializado');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização do AuthManager:', error);
            this.initializationPromise = null;
            throw error;
        }
    }

    async setupAuthStateListener() {
        try {
            const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'); 
            
            onAuthStateChanged(this.auth, (user) => {
                console.log('🔔 Auth state changed:', user ? user.uid : 'null');
                
                // Resolver promise na primeira chamada
                if (this.authStateResolver) {
                    this.authStateResolver(user);
                    this.authStateResolver = null;
                }
                
                if (this.isProcessingAuthChange) { 
                    console.log('⏸️ Auth change já sendo processado, ignorando...');
                    return;
                }
                
                this.handleAuthStateChange(user);
            });
            
            console.log('🔗 Auth state listener configurado');
        } catch (error) {
            console.error('❌ Erro ao configurar listener:', error);
            throw error;
        }
    }

    handleAuthStateChange(user) {
        this.isProcessingAuthChange = true;
        console.log('🔄 Processando mudança de estado:', user ? user.uid : 'logout');
        
        try {
            const wasAuthenticated = this.isAuthenticated;
            const previousUserId = this.currentUser?.uid;
            const storedUser = this.getUserFromStorage();
            
            if (user && user.uid) {
                // USUÁRIO LOGADO
                console.log('👤 Firebase confirmou usuário:', user.uid);
                
                // Verificar se é o mesmo usuário
                if (previousUserId === user.uid && wasAuthenticated) {
                    console.log('ℹ️ Mesmo usuário, atualizando dados...');
                    this.currentUser = user;
                    this.saveUserToStorage();
                    return;
                }
                
                this.currentUser = user;
                this.isAuthenticated = true;
                this.saveUserToStorage();
                
                if (!wasAuthenticated || !storedUser) {
                    this.showMainApp();
                }
                
                // Notificar aplicação
                if (window.app && typeof window.app.onUserAuthenticated === 'function') {
                    setTimeout(() => {
                        window.app.onUserAuthenticated(user);
                    }, 100);
                }
                
            } else {
                // USUÁRIO DESLOGADO
                console.log('🚪 Firebase reportou logout');
                
                // Verificar se foi logout intencional
                if (!this.intentionalLogout && storedUser) {
                    console.log('⚠️ Logout não intencional, tentando manter sessão...');
                    
                    setTimeout(() => {
                        if (this.getUserFromStorage() && !this.intentionalLogout) {
                            console.log('🔄 Mantendo sessão local por enquanto...');
                            return;
                        }
                        this.performLogout();
                    }, 3000); // 3 segundos de graça
                    
                    return;
                }
                
                this.performLogout();
            }
            
        } catch (error) {
            console.error('❌ Erro no handleAuthStateChange:', error);
        } finally {
            setTimeout(() => {
                this.isProcessingAuthChange = false;
            }, 1000);
        }
    }

    performLogout() {
        console.log('🚪 Executando logout completo...');
        
        const wasAuthenticated = this.isAuthenticated;
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.clearUserFromStorage();
        this.showAuthScreen();
        
        if (wasAuthenticated && window.app && typeof window.app.onUserLoggedOut === 'function') {
            window.app.onUserLoggedOut();
        }
    }

    async login(event) {
        if (event) event.preventDefault();
        
        console.log('🔑 Iniciando processo de login...');
        
        if (!this.isInitialized) {
            console.log('⏳ AuthManager não inicializado, inicializando...');
            try {
                await this.initialize();
            } catch (error) {
                console.error('❌ Falha na inicialização para login:', error);
                this.showMessage('Erro na inicialização. Recarregue a página.', 'error');
                return;
            }
        }
        
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            this.showMessage('Preencha email e senha', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Email inválido', 'error');
            return;
        }

        const btn = event?.target;
        if (btn) this.setLoading(btn, true);

        try {
            this.intentionalLogout = false;
            
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
            
            console.log('🔐 Tentando autenticar com Firebase...');
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('✅ Login Firebase realizado:', userCredential.user.uid);
            
            this.showMessage('Login realizado com sucesso!', 'success');
            this.clearLoginForm();
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showMessage(this.getAuthErrorMessage(error), 'error');
        } finally {
            if (btn) this.setLoading(btn, false);
        }
    }


    async logout() {
        if (!confirm('Deseja realmente sair?')) {
            return;
        }
        try {
            console.log('🚪 Executando logout intencional...');
            
            this.intentionalLogout = true;
            
            // 1. PRIMEIRO: Verificar e guardar referência do auth ANTES da limpeza
            const authInstance = this.auth;
            console.log('🔍 Auth instance:', authInstance ? 'encontrada' : 'não encontrada');
            
            if (!authInstance) {
                console.warn('⚠️ Auth instance não encontrada, mas continuando com limpeza...');
                // Mesmo sem auth, continuar com limpeza local
                this.showMessage('Sessão finalizada localmente', 'info');
                return;
            }
            
            // 2. SEGUNDO: Fazer logout do Firebase ANTES de limpar dados locais
            try {
                const firebaseAuth = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
                console.log('🔥 Fazendo signOut do Firebase...');
                await firebaseAuth.signOut(authInstance);
                console.log('✅ SignOut do Firebase realizado');
            } catch (firebaseError) {
                console.error('❌ Erro no signOut do Firebase:', firebaseError);
                // Continuar mesmo com erro do Firebase
            }
            
            this.showMessage('Logout realizado com sucesso', 'success');
            
        } catch (error) {
            console.error('❌ Erro geral no logout:', error);
            this.showMessage('Erro ao fazer logout, mas sessão será limpa', 'warning');
        } finally {
            // 3. TERCEIRO: Garantir limpeza final
            setTimeout(() => {
                this.intentionalLogout = false;
            }, 3000);
        }
    }

    // Persistência melhorada
    saveUserToStorage() {
        try {
            const userData = {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                lastLogin: Date.now(),
                sessionActive: true,
                version: '2.0',
                timestamp: Date.now()
            };
            
            localStorage.setItem('jsfitapp_user', JSON.stringify(userData));
            console.log('💾 Sessão salva para:', userData.email);
            
        } catch (error) {
            console.warn('⚠️ Erro ao salvar sessão:', error);
        }
    }

    getUserFromStorage() {
        try {
            const stored = localStorage.getItem('jsfitapp_user');
            
            if (!stored) {
                return null;
            }
            
            const userData = JSON.parse(stored);
            const lastLogin = userData.lastLogin || userData.timestamp;
            const now = Date.now();
            
            // Sessão válida por 7 dias
            const sessionDuration = 7 * 24 * 60 * 60 * 1000;
            
            if (userData.sessionActive && lastLogin && (now - lastLogin < sessionDuration)) {
                return userData;
            } else {
                console.log('⏰ Sessão expirada');
                this.clearUserFromStorage();
                return null;
            }
            
        } catch (error) {
            console.warn('⚠️ Erro ao ler sessão:', error);
            this.clearUserFromStorage();
            return null;
        }
    }

    clearUserFromStorage() {
        try {
            localStorage.removeItem('jsfitapp_user');
            console.log('🗑️ Sessão limpa');
        } catch (error) {
            console.warn('⚠️ Erro ao limpar sessão:', error);
        }
    }

    // NOVO: Método específico para verificar e restaurar sessão na inicialização
    async checkAndRestoreSession() {
        console.log('🔍 Verificando sessão existente...');
        
        const storedUser = this.getUserFromStorage();
        
        if (!storedUser) {
            console.log('❌ Nenhuma sessão local encontrada');
            this.showAuthScreen();
            return false;
        }
        
        console.log('📱 Sessão local encontrada para:', storedUser.email);
        
        try {
            // Aguardar AuthManager estar pronto
            if (!this.isInitialized) {
                console.log('⏳ Aguardando AuthManager...');
                await this.initialize();
            }
            
            // Verificar com Firebase
            await this.authStatePromise;
            
            const firebaseUser = this.auth?.currentUser;
            
            if (firebaseUser && firebaseUser.uid === storedUser.uid) {
                console.log('✅ Sessão confirmada pelo Firebase');
                this.currentUser = firebaseUser;
                this.isAuthenticated = true;
                this.showMainApp();
                return true;
            } else {
                console.log('❌ Sessão não confirmada pelo Firebase');
                this.clearUserFromStorage();
                this.showAuthScreen();
                return false;
            }
            
        } catch (error) {
            console.error('❌ Erro na verificação de sessão:', error);
            this.showAuthScreen();
            return false;
        }
    }

    // Métodos de interface
    showMainApp() {
        console.log('🖥️ Mostrando aplicação principal');
        const authContainer = document.getElementById('authContainer');
        const mainContainer = document.querySelector('.container');
        
        if (authContainer) authContainer.style.display = 'none';
        if (mainContainer) {
            mainContainer.style.display = 'block';
            this.updateUserInfoInHeader();
        }
    }

    showAuthScreen() {
        console.log('🔐 Mostrando tela de autenticação');
        const authContainer = document.getElementById('authContainer');
        const mainContainer = document.querySelector('.container');
        
        if (authContainer) {
            authContainer.style.display = 'flex';
            this.showLogin();
        }
        if (mainContainer) mainContainer.style.display = 'none';
    }

    showLogin() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const passwordResetForm = document.getElementById('passwordResetForm');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (passwordResetForm) passwordResetForm.style.display = 'none';
        
        setTimeout(() => {
            document.getElementById('loginEmail')?.focus();
        }, 100);
    }

    updateUserInfoInHeader() {
        if (!this.currentUser) return;
        
        let userInfoDiv = document.getElementById('userInfo');
        if (!userInfoDiv) {
            userInfoDiv = document.createElement('div');
            userInfoDiv.id = 'userInfo';
            userInfoDiv.className = 'user-info';
            
            const header = document.querySelector('.header');
            if (header) {
                const mainActions = header.querySelector('.main-actions');
                if (mainActions) {
                    header.insertBefore(userInfoDiv, mainActions);
                } else {
                    header.appendChild(userInfoDiv);
                }
            }
        }
    
        const displayName = this.currentUser.displayName || 
                           (this.currentUser.email ? this.currentUser.email.split('@')[0] : '') ||
                           'Usuário';
        
        const email = this.currentUser.email || 'Email não disponível';
        const avatar = displayName.charAt(0).toUpperCase();
    
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <div class="user-avatar">${avatar}</div>
                <div class="user-text">
                    <div class="user-name">${displayName}</div>
                    <div class="user-email">${email}</div>
                </div>
            </div>
            <button class="btn btn-outline logout-btn" onclick="app.logout()">
                🚪 Sair
            </button>
        `;
    }

    // Métodos utilitários
    setLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('auth-loading');
            button.disabled = true;
        } else {
            button.classList.remove('auth-loading');
            button.disabled = false;
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    clearLoginForm() {
        const emailField = document.getElementById('loginEmail');
        const passwordField = document.getElementById('loginPassword');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
    }

    getAuthErrorMessage(error) {
        const errorMessages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-not-found': 'Email não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde antes de tentar novamente',
            'auth/invalid-credential': 'Email ou senha incorretos',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
        };
        return errorMessages[error.code] || `Erro: ${error.message}`;
    }

    showMessage(message, type = 'info') {
        if (window.app?.core?.showNotification) {
            window.app.core.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Métodos públicos para compatibilidade
    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    getUserId() {
        return this.currentUser?.uid || null;
    }

    getUserEmail() {
        return this.currentUser?.email || null;
    }

    checkExistingSession() {
        return this.getUserFromStorage();
    }
}

// IMPORTANTE: Certificar-se de que a instância está disponível globalmente
if (typeof window !== 'undefined') {
    window.authManager = new AuthManager();
    console.log('✅ AuthManager instanciado globalmente');
    
    // Adicionar método de verificação para o sistema de inicialização
    window.authManager.isReady = function() {
        return this._isAuthManagerInstance && typeof this.initialize === 'function';
    };
    
    console.log('🔧 AuthManager versão 2.0 carregado e pronto');
} else {
    console.warn('⚠️ Window não disponível para AuthManager');
}

// 1. MODIFICAR auth.js - Adicionar no final do arquivo:

// Proteção contra sobrescrita acidental
Object.defineProperty(window, 'auth', {
    value: window.auth,
    writable: false,
    configurable: false
});

// Verificação e recuperação automática
window.ensureAuthInstance = function() {
    if (!window.auth || typeof window.auth.login !== 'function') {
        console.log('🔄 Recuperando instância AuthManager...');
        window.auth = new AuthManager();
    }
    return window.auth;
};