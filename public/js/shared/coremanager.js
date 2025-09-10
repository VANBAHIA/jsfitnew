// core-manager.js - Gerenciador Singleton do Core
class CoreManager {
    constructor() {
        this.core = null;
        this.initializationPromise = null;
        this.isInitializing = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.healthCheckInterval = null;
        
        console.log('🔧 CoreManager inicializado');
    }

    /**
     * Obter instância do core (sempre retorna a mesma instância)
     */
    async getCore() {
        // Se já temos uma instância válida, retornar
        if (this.core && this.isValidCore(this.core)) {
            return this.core;
        }

        // Se está inicializando, aguardar
        if (this.initializationPromise) {
            console.log('⏳ Aguardando inicialização em progresso...');
            return this.initializationPromise;
        }

        // Inicializar nova instância
        return this.initializeCore();
    }

    /**
     * Inicializar core com retry automático
     */
    async initializeCore() {
        if (this.isInitializing) {
            console.warn('⚠️ Inicialização já em progresso');
            return this.initializationPromise;
        }

        this.isInitializing = true;
        this.initializationPromise = this._doInitialize();

        try {
            const core = await this.initializationPromise;
            this.startHealthCheck();
            return core;
        } catch (error) {
            console.error('❌ Falha na inicialização do core:', error);
            this.initializationPromise = null;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Inicialização real do core
     */
    async _doInitialize() {
        console.log('🚀 Inicializando JSFitCore...');

        // Aguardar JSFitCore estar disponível
        await this.waitForJSFitCore();

        // Criar nova instância
        this.core = new window.JSFitCore();
        
        // Garantir que a instância seja globally acessível
        window.coreManager = this;
        window.globalCore = this.core;

        // Inicializar Firebase
        await this.core.initializeFirebase();

        // Carregar base de exercícios
        if (typeof this.core.loadExerciseDatabase === 'function') {
            await this.core.loadExerciseDatabase();
        }

        // Adicionar método de health check
        this.core._lastHealthCheck = Date.now();
        this.core._coreManagerId = this.generateId();

        console.log('✅ Core inicializado com sucesso:', this.core._coreManagerId);
        return this.core;
    }

    /**
     * Aguardar JSFitCore estar disponível
     */
    async waitForJSFitCore() {
        const timeout = 10000; // 10 segundos
        const startTime = Date.now();

        while (!window.JSFitCore && (Date.now() - startTime < timeout)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.JSFitCore) {
            throw new Error('JSFitCore não disponível após timeout');
        }

        console.log('✅ JSFitCore encontrado');
    }

    /**
     * Verificar se core é válido
     */
    isValidCore(core) {
        return core && 
               typeof core === 'object' &&
               typeof core.generateId === 'function' &&
               typeof core.savePlanToFirebase === 'function' &&
               core._coreManagerId && // Nosso ID único
               core.firebaseConnected;
    }

    /**
     * Reconectar core se necessário
     */
    async reconnectIfNeeded() {
        if (!this.core || !this.isValidCore(this.core)) {
            console.log('🔄 Core perdido, reconectando...');
            this.core = null;
            this.initializationPromise = null;
            return this.getCore();
        }

        // Verificar conexão Firebase
        if (!this.core.firebaseConnected) {
            console.log('🔄 Reconectando Firebase...');
            try {
                await this.core.initializeFirebase();
                return this.core;
            } catch (error) {
                console.error('❌ Falha na reconexão Firebase:', error);
                return this.initializeCore();
            }
        }

        return this.core;
    }

    /**
     * Health check automático
     */
    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                if (!this.isValidCore(this.core)) {
                    console.warn('⚠️ Health check falhou - core inválido');
                    await this.reconnectIfNeeded();
                } else {
                    this.core._lastHealthCheck = Date.now();
                    // console.log('💓 Health check OK');
                }
            } catch (error) {
                console.error('❌ Erro no health check:', error);
            }
        }, 30000); // A cada 30 segundos
    }

    /**
     * Parar health check
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Força reinicialização
     */
    async forceReset() {
        console.log('🔄 Forçando reset do core...');
        
        this.stopHealthCheck();
        this.core = null;
        this.initializationPromise = null;
        this.isInitializing = false;
        this.retryCount = 0;

        return this.getCore();
    }

    /**
     * Obter status detalhado
     */
    getStatus() {
        return {
            hasCore: !!this.core,
            isValid: this.core ? this.isValidCore(this.core) : false,
            firebaseConnected: this.core ? this.core.firebaseConnected : false,
            exerciseDatabaseLoaded: this.core ? this.core.exerciseDatabaseLoaded : false,
            coreId: this.core ? this.core._coreManagerId : null,
            lastHealthCheck: this.core ? this.core._lastHealthCheck : null,
            isInitializing: this.isInitializing,
            retryCount: this.retryCount
        };
    }

    /**
     * Gerar ID único
     */
    generateId() {
        return 'core_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Método de fallback seguro
     */
    createSafeCore() {
        console.log('🆘 Criando core de emergência...');
        return {
            firebaseConnected: false,
            exerciseDatabaseLoaded: false,
            showNotification: (message, type) => {
                console.log(`${type.toUpperCase()}: ${message}`);
            },
            generateId: () => Date.now().toString() + Math.random().toString(36).substr(2, 9),
            savePlanToFirebase: async () => {
                throw new Error('Firebase não disponível no core de emergência');
            },
            isEmergencyCore: true,
            _coreManagerId: 'emergency_' + Date.now()
        };
    }

    /**
     * Destruir instância
     */
    destroy() {
        this.stopHealthCheck();
        this.core = null;
        this.initializationPromise = null;
        console.log('🗑️ CoreManager destruído');
    }
}

// Criar instância global única
if (typeof window !== 'undefined') {
    window.coreManager = new CoreManager();
    console.log('✅ CoreManager global criado');
}