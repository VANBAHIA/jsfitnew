// =============================================
// JS FIT APP - PERSONAL TRAINER SYSTEM
// Sistema Completo de Criação de Planos de Treino
// Usando JSFitCore compartilhado
// =============================================
// ADICIONAR NO INÍCIO DO ARQUIVO personal.js:

// Gerenciador Global de Loading
class LoadingManager {
    constructor() {
        this.isActive = false;
        this.currentOperation = null;
        this.progress = 0;
        this.overlay = null;
        this.elements = {};
        
        this.initializeElements();
    }
    
    initializeElements() {
        this.overlay = document.getElementById('globalLoadingOverlay');
        this.elements = {
            title: document.getElementById('loadingTitle'),
            message: document.getElementById('loadingMessage'),
            progress: document.getElementById('loadingProgress'),
            percentage: document.getElementById('loadingPercentage')
        };
    }
    
    show(title = 'Carregando...', message = 'Processando...') {
        if (!this.overlay) {
            console.warn('Loading overlay não encontrado');
            return;
        }
        
        this.isActive = true;
        this.progress = 0;
        
        this.updateContent(title, message);
        this.updateProgress(0);
        this.overlay.classList.add('active');
        
        console.log(`🔄 Loading iniciado: ${title}`);
    }
    
    hide() {
        if (!this.overlay) return;
        
        this.isActive = false;
        this.currentOperation = null;
        this.overlay.classList.remove('active');
        
        console.log('✅ Loading finalizado');
    }
    
    updateContent(title, message) {
        if (this.elements.title) {
            this.elements.title.textContent = title;
        }
        if (this.elements.message) {
            this.elements.message.textContent = message;
        }
    }
    
    updateProgress(percentage, message) {
        this.progress = Math.min(100, Math.max(0, percentage));
        
        if (this.elements.progress) {
            this.elements.progress.style.width = this.progress + '%';
        }
        if (this.elements.percentage) {
            this.elements.percentage.textContent = Math.round(this.progress) + '%';
        }
        if (message && this.elements.message) {
            this.elements.message.textContent = message;
        }
    }
    
    setOperation(operation, steps) {
        this.currentOperation = {
            name: operation,
            steps: steps,
            currentStep: 0,
            stepProgress: 0
        };
    }
    
    nextStep(stepName) {
        if (!this.currentOperation) return;
        
        this.currentOperation.currentStep++;
        this.currentOperation.stepProgress = 0;
        
        const totalSteps = this.currentOperation.steps.length;
        const stepProgress = (this.currentOperation.currentStep / totalSteps) * 100;
        
        this.updateProgress(stepProgress, stepName);
    }
    
    // Método para operações com promise
    async withLoading(title, message, operation) {
        try {
            this.show(title, message);
            const result = await operation();
            return result;
        } finally {
            this.hide();
        }
    }
}


class PersonalApp {

    // Adicionar à classe PersonalApp
showOperationLoading(element, text = 'Carregando...') {
    if (!element) return;
    
    element.classList.add('operation-loading');
    element.setAttribute('data-original-text', element.textContent);
    element.textContent = text;
    element.disabled = true;
}

hideOperationLoading(element) {
    if (!element) return;
    
    element.classList.remove('operation-loading');
    const originalText = element.getAttribute('data-original-text');
    if (originalText) {
        element.textContent = originalText;
        element.removeAttribute('data-original-text');
    }
    element.disabled = false;
}


    constructor() {
            // Inicializar loading manager
    this.loadingManager = new LoadingManager();


        this.currentUser = null;
        this.isAuthenticated = false;
        this.auth = null;
        
        // Garantir inicialização de todas as propriedades
        this.isUserAuthenticated = false;
        this.currentUserId = null;
        this.userEmail = null;
        this.userDisplayName = null;
        this.savedPlans = [];
        this.deletePlan = this.deletePlan.bind(this);

        // Recuperar estado imediatamente se disponível
        this.recoverAuthStateOnInit();

               // Configurações de tipos de plano usando core
               this.planTypeConfiguration = {
                days: 3,
                configuration: {},
                muscleGroups: [
                    { id: 'antebraco', name: 'ANTEBRAÇO', icon: '💪' },
                    { id: 'abdome', name: 'ABDOME', icon: '🎯' },
                    { id: 'biceps', name: 'BÍCEPS', icon: '💪' },
                    { id: 'triceps', name: 'TRÍCEPS', icon: '🔥' },
                    { id: 'peito', name: 'PEITO', icon: '💥' },
                    { id: 'perna', name: 'PERNA', icon: '🦵' },
                    { id: 'gluteo', name: 'GLÚTEO', icon: '🍑' },
                    { id: 'costas', name: 'COSTAS', icon: '🏔️' },
                    { id: 'ombro', name: 'OMBRO', icon: '🚁' },
                    { id: 'corpo', name: 'CORPO TODO', icon: '🏋️' }
                ],
                presetConfigurations: {
                    1: {
                        A: { name: 'Treino Corpo Inteiro', groups: ['peito', 'costas', 'perna', 'ombro', 'biceps', 'triceps'] }
                    },
                    2: {
                        A: { name: 'Membros Superiores', groups: ['peito', 'costas', 'ombro', 'biceps', 'triceps'] },
                        B: { name: 'Membros Inferiores', groups: ['perna', 'gluteo', 'abdome'] }
                    },
                    3: {
                        A: { name: 'Peito e Tríceps', groups: ['peito', 'triceps'] },
                        B: { name: 'Costas e Bíceps', groups: ['costas', 'biceps'] },
                        C: { name: 'Pernas e Ombros', groups: ['perna', 'gluteo', 'ombro', 'abdome'] }
                    },
                    4: {
                        A: { name: 'Peito e Tríceps', groups: ['peito', 'triceps'] },
                        B: { name: 'Costas e Bíceps', groups: ['costas', 'biceps'] },
                        C: { name: 'Ombros e Abdome', groups: ['ombro', 'abdome'] },
                        D: { name: 'Pernas e Glúteos', groups: ['perna', 'gluteo'] }
                    },
                    5: {
                        A: { name: 'Peito', groups: ['peito'] },
                        B: { name: 'Costas', groups: ['costas'] },
                        C: { name: 'Ombros', groups: ['ombro'] },
                        D: { name: 'Braços', groups: ['biceps', 'triceps', 'antebraco'] },
                        E: { name: 'Pernas', groups: ['perna', 'gluteo', 'abdome'] }
                    },
                    6: {
                        A: { name: 'Peito', groups: ['peito'] },
                        B: { name: 'Costas', groups: ['costas'] },
                        C: { name: 'Ombros', groups: ['ombro'] },
                        D: { name: 'Bíceps', groups: ['biceps', 'antebraco'] },
                        E: { name: 'Tríceps', groups: ['triceps'] },
                        F: { name: 'Pernas', groups: ['perna', 'gluteo', 'abdome'] }
                    }
                }
            };
    
            // Estado da configuração de músculos da IA
            this.aiMuscleConfig = {
                enabled: false,
                days: 3,
                workouts: {}
            };
    
            // Base de técnicas avançadas
            this.tecnicasDatabase = {
                // Técnicas existentes
                'pre-exaustao': 'Exercício de isolamento antes do composto para pré-fadigar o músculo alvo',
                'pos-exaustao': 'Exercício de isolamento após o composto para finalizar o músculo',
                'bi-set': 'Dois exercícios executados em sequência sem descanso',
                'tri-set': 'Três exercícios executados em sequência sem descanso',
                'drop-set': 'Redução progressiva da carga na mesma série',
                'rest-pause': 'Pause breves durante a série para completar mais repetições',
                'serie-queima': 'Repetições parciais no final da série até a falha',
                'tempo-controlado': 'Execução lenta e controlada (3-4 segundos na fase excêntrica)',
                'pausa-contracao': 'Pausa de 1-2 segundos na contração máxima',
                
                // Novas técnicas
                'super-set-antagonista': 'Dois exercícios para músculos antagonistas executados sem descanso',
                'super-set-mesmo-musculo': 'Dois exercícios para o mesmo músculo executados sem descanso',
                'cluster-set': 'Série dividida em mini-séries com descansos curtos entre elas',
                'mecanico-drop-set': 'Mudança de exercício do mais difícil para o mais fácil sem descanso',
                'strip-set': 'Remoção de peso progressiva usando anilhas menores',
                'negativas': 'Foco na fase excêntrica com carga superior ao 1RM concêntrico',
                'forcadas': 'Repetições assistidas pelo parceiro após atingir a falha',
                'parciais': 'Repetições em amplitude reduzida, geralmente no ponto forte',
                '21s': 'Série de 21 repetições: 7 parciais baixas + 7 parciais altas + 7 completas',
                'iso-hold': 'Contração isométrica sustentada por tempo determinado',
                'meta-contracao': 'Contração isométrica máxima sem movimento articular',
                'explosivas': 'Execução com máxima velocidade na fase concêntrica',
                'ondulatorio': 'Variação da carga dentro da mesma série (ex: 12-10-8-6)',
                'piramide-crescente': 'Aumento progressivo da carga e redução das repetições',
                'piramide-decrescente': 'Redução progressiva da carga e aumento das repetições',
                'piramide-dupla': 'Pirâmide crescente seguida de decrescente na mesma série',
                'rest-pause-cluster': 'Combinação de rest-pause com micro-pausas planejadas',
                'tempo-contraste': 'Alternância entre repetições lentas e explosivas',
                'pausa-stretch': 'Pausa na posição de maior alongamento muscular',
                'serie-composta': 'Exercício composto seguido de isolamento para o mesmo músculo',
                'serie-reversa': 'Exercício de isolamento seguido de composto (pré-exaustão)',
                'circuito': 'Sequência de exercícios executados com mínimo descanso',
                'escada-ascendente': 'Aumento progressivo das repetições (1,2,3,4...)',
                'escada-descendente': 'Redução progressiva das repetições (10,9,8,7...)',
                'myo-reps': 'Série principal seguida de mini-séries com descansos de 15 segundos',
                'dante-trudel': 'Rest-pause específico: série até falha + 15s + repetições até falha',
                'static-holds': 'Sustentação isométrica em pontos específicos da amplitude',
                'velocidade-compensatoria': 'Máxima velocidade intencional com cargas submáximas',
                'contrast-loading': 'Alternância entre carga alta e baixa para potencialização',
                'wave-loading': 'Ondulação da intensidade em ciclos dentro do treino',
                'accommodating-resistance': 'Uso de elásticos ou correntes para variar resistência',
                'intra-set-stretching': 'Alongamento ativo entre repetições da mesma série',
                'mechanical-advantage': 'Exploração de vantagens mecânicas em diferentes amplitudes',
                'pre-stretch': 'Alongamento passivo imediatamente antes da série',
                'post-activation-potentiation': 'Ativação com carga alta seguida de exercício explosivo',
                'blood-flow-restriction': 'Restrição do fluxo sanguíneo com cargas leves',
                'eccentric-overload': 'Sobrecarga específica na fase excêntrica',
                'pause-reps': 'Pausa completa em ponto específico da amplitude',
                'tempo-emphasis': 'Ênfase em fase específica do movimento (concêntrica/excêntrica)',
                'range-of-motion-partials': 'Parciais em diferentes amplitudes de movimento',
                'antagonist-paired-sets': 'Séries alternadas entre músculos antagonistas',
                'density-training': 'Máximo volume em tempo fixo determinado',
                'volume-loading': 'Alto volume com intensidade moderada para sobrecarga metabólica'
            };


    }
    
    
    async init() {
        try {
            console.log('🚀 Iniciando aplicação JSFit...');
            
            // Evitar múltiplas inicializações
            if (this.initializationInProgress) {
                console.log('⏸️ Inicialização já em progresso');
                return;
            }
            
            if (this.initializationComplete) {
                console.log('✅ Aplicação já inicializada');
                return;
            }
            
            this.initializationInProgress = true;
            
            // INICIAR LOADING
            this.loadingManager.show('🚀 Inicializando JS Fit', 'Carregando componentes...');
            
            // Definir etapas da inicialização
            const initSteps = [
                'Verificando dependências',
                'Inicializando JSFitCore',
                'Configurando autenticação',
                'Carregando exercícios',
                'Verificando sessão',
                'Finalizando'
            ];
            
            this.loadingManager.setOperation('init', initSteps);
            
            // 1. Verificar dependências
            this.loadingManager.nextStep('Verificando dependências...');
            await this.waitForDependencies();
            
            // 2. Garantir instância AuthManager válida
            this.loadingManager.updateProgress(20, 'Configurando autenticação...');
            if (!window.authManager || !window.authManager._isAuthManagerInstance) {
                console.log('🔄 Recriando AuthManager...');
                window.authManager = new AuthManager();
            }
            
            // 3. Inicializar JSFitCore
            this.loadingManager.updateProgress(40, 'Inicializando JSFitCore...');
            try {
                if (!this.core && window.JSFitCore) {
                    console.log('🔧 Inicializando JSFitCore...');
                    this.core = new window.JSFitCore();
                    await this.core.initializeFirebase();
                    console.log('✅ JSFitCore inicializado');
                }
            } catch (coreError) {
                console.warn('⚠️ JSFitCore falhou, criando fallback:', coreError.message);
                this.core = this.createFallbackCore();
            }
    
            // 4. Carregar exercícios
            this.loadingManager.updateProgress(60, 'Carregando base de exercícios...');
            if (this.core) {
                await this.core.loadExerciseDatabase();
                console.log('✅ Base de exercícios carregada');
            }
            
            // 5. Inicializar AuthManager
            this.loadingManager.updateProgress(75, 'Configurando autenticação...');
            let authInitialized = false;
            
            if (window.authManager.isUserAuthenticated && window.authManager.isUserAuthenticated()) {
                console.log('✅ AuthManager já funcionando com usuário logado');
                authInitialized = true;
            } else if (window.authManager.isInitialized) {
                console.log('✅ AuthManager já inicializado');
                authInitialized = true;
            } else {
                try {
                    console.log('🔐 Inicializando AuthManager...');
                    await window.authManager.initialize();
                    authInitialized = true;
                    console.log('✅ AuthManager inicializado');
                } catch (authError) {
                    console.warn('❌ Falha na inicialização do AuthManager:', authError.message);
                }
            }
            
            // 6. Verificar sessão
            this.loadingManager.updateProgress(90, 'Verificando sessão...');
            if (authInitialized) {
                try {
                    const sessionRestored = await window.authManager.checkAndRestoreSession();
                    
                    if (sessionRestored) {
                        console.log('✅ Sessão restaurada');
                        const currentUser = window.authManager.getCurrentUser();
                        if (currentUser) {
                            await this.initializeAuthenticatedUser(currentUser);
                        }
                    } else {
                        console.log('👤 Mostrando tela de login');
                        this.showAuthenticationScreen();
                    }
                } catch (sessionError) {
                    console.error('❌ Erro na verificação de sessão:', sessionError);
                    this.showAuthenticationScreen();
                }
            } else {
                console.log('❌ AuthManager indisponível, mostrando login');
                this.showAuthenticationScreen();
            }
            
            // 7. Finalizar
            this.loadingManager.updateProgress(100, 'Finalizando...');
            this.setupEventListeners();
            this.initializationComplete = true;
            this.initializationInProgress = false;
            
            // Aguardar um pouco antes de ocultar o loading
            setTimeout(() => {
                this.loadingManager.hide();
            }, 500);
            
            console.log('✅ Aplicação inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro crítico na inicialização:', error);
            this.loadingManager.updateContent('❌ Erro na Inicialização', error.message);
            
            setTimeout(() => {
                this.loadingManager.hide();
                this.initializeEmergencyMode();
            }, 2000);
            
            this.initializationInProgress = false;
        }
    }
    debugUserAndPlans() {
        console.log('🔍 === DIAGNÓSTICO COMPLETO ===');
        console.log('CurrentUserId:', this.currentUserId);
        console.log('SavedPlans total:', this.savedPlans.length);
        
        this.savedPlans.forEach((plan, i) => {
            console.log(`Plano ${i}: ${plan.nome}`);
            console.log(`  - ID: ${plan.id}`);
            console.log(`  - UserID: ${plan.userId}`);
            console.log(`  - Match: ${plan.userId === this.currentUserId}`);
        });
    }

    async loadSavedPlansWithVerification() {
        console.log('🔍 DIAGNÓSTICO loadSavedPlansWithVerification:');
        console.log('- this.isUserAuthenticated:', this.isUserAuthenticated);
        console.log('- this.currentUserId:', this.currentUserId);
        console.log('- AuthManager userId:', window.authManager?.getCurrentUser()?.uid);
        console.log('- Firebase Auth userId:', window.firebaseAuth?.currentUser?.uid);
        
        if (!this.isUserAuthenticated) {
            console.warn('Usuário não autenticado, não carregando planos');
            this.savedPlans = [];
            return;
        }
        
        try {
            if (this.core && this.core.firebaseConnected) {
                const firebasePlans = await this.core.loadPlansFromFirebase();
                if (firebasePlans && Array.isArray(firebasePlans)) {
                    this.savedPlans = firebasePlans;
                    console.error('PLANOS CARREGADOS AQUI;11:', error);
                    return;
                }
            }
            
            this.savedPlans = [];
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
            this.savedPlans = [];
        }
    }


 // Método auxiliar para mostrar aplicação principal
showMainApplication() {
    try {
        // Usar AuthManager se disponível
        if (window.authManager && typeof window.authManager.showMainApp === 'function') {
            window.authManager.showMainApp();
        } else {
            // Fallback manual
            const authContainer = document.getElementById('authContainer');
            const mainContainer = document.querySelector('.container');
            
            if (authContainer) {
                authContainer.style.display = 'none';
            }
            if (mainContainer) {
                mainContainer.style.display = 'block';
            }
        }
        
     
        
    } catch (error) {
        console.error('❌ Erro ao mostrar aplicação principal:', error);
    }
}

// Método auxiliar para salvar no localStorage do usuário específico
async saveToUserLocalStorage() {
    try {
        if (!this.currentUserId) {
            throw new Error('UserId não disponível para localStorage');
        }
        
        const storageKey = `jsfitapp_plans_${this.currentUserId}`;
        const dataToSave = {
            userId: this.currentUserId,
            userEmail: this.userEmail,
            plans: this.savedPlans,
            savedAt: new Date().toISOString(),
            version: '2.0'
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log(`💾 ${this.savedPlans.length} planos salvos no localStorage do usuário`);
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage específico:', error);
        throw error;
    }
}


// CORREÇÃO 2: Modificar continueInitialization para não chamar populateGroupFilter
async continueInitialization() {
    try {
        if (this.authenticationComplete) {
            console.log('⚠️ Inicialização já concluída, ignorando...');
            return;
        }
        
        this.authenticationComplete = true;
        
        // GARANTIR savedPlans existe
        this.savedPlans = this.savedPlans || [];
        
        this.setDefaultDates();
        this.setupEventListeners();
        await this.loadPlanTypeConfiguration();
        
        // Carregar planos com verificação
        try {
            await this.loadSavedPlansWithVerification();
        } catch (loadError) {
            console.warn('Erro ao carregar planos:', loadError);
            this.savedPlans = []; // Fallback seguro
        }
        

       
        
        console.log('✅ Inicialização completa finalizada');
       
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        this.savedPlans = this.savedPlans || [];
        this.showPlanList();
    }
}
    
    // Método para mostrar tela de autenticação
    showAuthenticationScreen() {
        try {
            console.log('🔐 Exibindo tela de autenticação');
            
            const authContainer = document.getElementById('authContainer');
            const mainContainer = document.querySelector('.container');
            
            if (authContainer) {
                authContainer.style.display = 'flex';
            }
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            
            // Focar no campo de email
            setTimeout(() => {
                const emailField = document.getElementById('loginEmail');
                if (emailField) {
                    emailField.focus();
                }
            }, 200);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar tela de auth:', error);
        }
    }
    
    // Método de fallback melhorado
    async initializeFallbackMode() {
        console.log('🚨 Modo fallback ativado');
        
        try {
            // Criar core básico se não existir
            if (!this.core) {
                this.core = this.createFallbackCore();
            }
            
            // Mostrar interface básica
            this.showAuthenticationScreen();
            
            // Configurar listeners básicos
            this.setupBasicEventListeners();
            
            console.log('✅ Modo fallback inicializado');
            
        } catch (error) {
            console.error('❌ Erro no fallback:', error);
            throw error;
        }
    }
    
    // Modo de emergência
    initializeEmergencyMode() {
        console.log('🆘 Modo de emergência ativado');
        
        try {
            // Mostrar mensagem de erro
            const body = document.body;
            if (body) {
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                               background: rgba(0,0,0,0.9); color: white; display: flex; 
                               align-items: center; justify-content: center; z-index: 9999;
                               font-family: Arial, sans-serif;">
                        <div style="text-align: center; padding: 2rem; max-width: 500px;">
                            <h2>🆘 Erro de Inicialização</h2>
                            <p>A aplicação encontrou um erro crítico durante a inicialização.</p>
                            <p>Por favor, recarregue a página ou entre em contato com o suporte.</p>
                            <button onclick="window.location.reload()" 
                                    style="margin-top: 1rem; padding: 0.5rem 1rem; 
                                           background: #007bff; color: white; border: none; 
                                           border-radius: 4px; cursor: pointer;">
                                🔄 Recarregar Página
                            </button>
                        </div>
                    </div>
                `;
                body.appendChild(errorDiv);
            }
            
            console.log('🆘 Interface de emergência exibida');
            
        } catch (emergencyError) {
            console.error('❌ Erro crítico no modo de emergência:', emergencyError);
            // Último recurso: alert
            alert('Erro crítico na aplicação. Por favor, recarregue a página.');
        }
    }
    
    // Método para configurar listeners básicos
    setupBasicEventListeners() {
        try {
            // Event listener para formulário de login
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (window.authManager && typeof window.authManager.login === 'function') {
                        window.authManager.login(e);
                    } else {
                        console.error('❌ AuthManager não disponível para login');
                    }
                });
            }
            
            // Outros listeners básicos podem ser adicionados aqui
            console.log('✅ Event listeners básicos configurados');
            
        } catch (error) {
            console.error('❌ Erro ao configurar listeners básicos:', error);
        }
    }
    
    // Método para criar core de fallback
    createFallbackCore() {
        console.log('🔧 Criando JSFitCore de fallback');
        
        return {
            showNotification: (message, type = 'info') => {
                console.log(`${type.toUpperCase()}: ${message}`);
                
                // Tentar mostrar notificação visual simples
                try {
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed; top: 20px; right: 20px; z-index: 1000;
                        padding: 1rem; border-radius: 4px; color: white;
                        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
                        max-width: 300px; word-wrap: break-word;
                    `;
                    notification.textContent = message;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 5000);
                } catch (notificationError) {
                    console.warn('⚠️ Erro ao mostrar notificação visual:', notificationError);
                }
            },
            
            loadUserData: async (userId) => {
                console.log('📊 Fallback: loadUserData chamado para', userId);
                // Implementação básica ou vazia
                return {};
            },
            
            isInitialized: true,
            version: 'fallback-1.0'
        };
    }

  // MÉTODO AUXILIAR: getEmptyPlan
    // =============================================
    getEmptyPlan() {
        return {
            id: null,
            nome: '',
            aluno: { 
                nome: '', 
                idade: 25, 
                altura: '1,75m', 
                peso: '75kg',
                dataNascimento: '',
                cpf: ''
            },
            dias: 1,
            dataInicio: '',
            dataFim: '',
            perfil: { 
                objetivo: 'Hipertrofia e ganho de massa muscular',
                idade: 25,
                altura: '1,75m',
                peso: '75kg',
                porte: 'médio'
            },
            observacoes: {},
            treinos: [],
            tecnicas_aplicadas: {}
        };
    }
  




// Método auxiliar para limpar dados
clearUserData() {
    console.log('🧹 Limpando dados do usuário...');
    this.savedPlans = [];
    
    if (this.updatePlansList) {
        this.updatePlansList();
    }
    
    if (this.core?.showNotification) {
        this.core.showNotification('Sessão encerrada. Faça login para acessar seus planos.', 'info');
    }
}

// Flags de controle
setLoginInProgress(inProgress = true) {
    this.isLoginInProgress = inProgress;
    console.log('🔄 Login progress flag:', inProgress);
}

// Método que deve ser chamado após tentativas de login
async onLoginAttempt() {
    console.log('🔄 Tentativa de login detectada, verificando status...');
    
    // Marcar que login não está mais em progresso
    this.setLoginInProgress(false);
    
    // Aguardar um tempo para o Firebase processar
    setTimeout(async () => {
        const loginSuccess = await this.checkUserLoginStatus();
        if (!loginSuccess) {
            console.log('🔄 Primeira verificação falhou, tentando novamente...');
            setTimeout(async () => {
                const secondAttempt = await this.checkUserLoginStatus();
                if (!secondAttempt) {
                    console.log('🔄 Segunda verificação falhou, forçando verificação direta...');
                    this.forceAuthCheck();
                }
            }, 1000);
        }
    }, 500);
}

// Método para forçar verificação direta do Firebase
async forceAuthCheck() {
    console.log('🔍 Forçando verificação direta do Firebase...');
    
    try {
        // Verificar se há um usuário autenticado no Firebase diretamente
        if (window.authManager && window.authManager.auth && window.authManager.auth.currentUser) {
            const firebaseUser = window.authManager.auth.currentUser;
            console.log('🎯 Usuário encontrado diretamente no Firebase:', firebaseUser.uid);
            
            if (firebaseUser.uid && firebaseUser.uid.trim() !== '') {
                await this.onUserAuthenticated(firebaseUser);
                return true;
            }
        }
        
        // Tentar recarregar o usuário atual
        if (window.authManager && window.authManager.reloadCurrentUser) {
            await window.authManager.reloadCurrentUser();
            const reloadedUser = window.authManager.getCurrentUser();
            
            if (reloadedUser && reloadedUser.uid && reloadedUser.uid.trim() !== '') {
                console.log('🎯 Usuário recarregado com sucesso:', reloadedUser.uid);
                await this.onUserAuthenticated(reloadedUser);
                return true;
            }
        }
        
        console.log('❌ Nenhum usuário válido encontrado na verificação forçada');
        return false;
        
    } catch (error) {
        console.error('❌ Erro na verificação forçada:', error);
        return false;
    }
}

async waitForAuth() {
    // Primeiro aguardar auth existir
    let attempts = 0;
    while (!window.authManager && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Depois inicializar se necessário
    if (window.authManager && typeof window.authManager.initialize === 'function') {
        await window.authManager.initialize();
    }
}

    
    // Métodos auxiliares que você precisa implementar:
    async finishInitialization() {
        if (window.authManager?.isUserAuthenticated()) {
            await this.onUserAuthenticated(window.authManager.getCurrentUser());
        } else {
            this.hideInitializationLoading?.();
            this.showAuthContainer?.();
        }
    }
    
 
    

    showInitializationLoading(message) {
        // Implementar loading screen
        console.log('Loading:', message);
    }
    

    
    hideInitializationLoading() {
        console.log('Ocultando loading...');
    }
    
    showMainApp() {
        console.log('Mostrando app principal...');
    }
    
    showAuthContainer() {
        console.log('Mostrando tela de login...');
    }

    
    // MÉTODO AUXILIAR: Mostrar mensagem de forma segura
    showMessage(message, type = 'info', duration = 4000) {
        try {
            // Verificar se core existe e tem o método
            if (this.core && typeof this.core.showNotification === 'function') {
                this.core.showNotification(message, type, duration);
            } else {
                // Fallback: usar método próprio ou console
                console.log(`[${type.toUpperCase()}] ${message}`);
                this.createSimpleNotification(message, type);
            }
        } catch (error) {
            console.error('Erro ao mostrar mensagem:', error);
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Último recurso: alert para erros críticos
            if (type === 'error') {
                alert(message);
            }
        }
    }

 
    async initializeAuthenticatedUser(user) {
        try {
            console.log('👤 Inicializando dados do usuário:', user.uid);
            
            // Definir propriedades de autenticação
            this.currentUser = user;
            this.isUserAuthenticated = true;
            this.currentUserId = user.uid;
            this.userEmail = user.email;
            this.userDisplayName = user.displayName || user.email?.split('@')[0] || 'Usuário';
            
            // CORREÇÃO CRÍTICA: Garantir que o core está disponível
            if (!this.core) {
                console.log('🔧 Core não encontrado, buscando instância...');
                this.core = this.findCoreInstance();
            }
            

            
            // Mostrar aplicação principal diretamente
            this.showMainApplication();
            
            console.log('✅ Usuário inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar usuário:', error);
        }
    }

    // 2. MÉTODO PARA ENCONTRAR A INSTÂNCIA DO CORE
findCoreInstance() {
    // Estratégia 1: Verificar se já existe globalmente
    if (window.app && window.app.core) {
        console.log('✅ Core encontrado em window.app.core');
        return window.app.core;
    }
    
    // Estratégia 2: Verificar outras localizações globais
    if (window.core) {
        console.log('✅ Core encontrado em window.core');
        return window.core;
    }
    
    // Estratégia 3: Criar nova instância se JSFitCore está disponível
    if (window.JSFitCore && typeof window.JSFitCore === 'function') {
        console.log('🔧 Criando nova instância do JSFitCore...');
        try {
            const newCore = new window.JSFitCore();
            // Inicializar se necessário
            if (typeof newCore.initializeFirebase === 'function') {
                newCore.initializeFirebase();
            }
            window.core = newCore; // Salvar globalmente
            return newCore;
        } catch (error) {
            console.error('❌ Erro ao criar JSFitCore:', error);
        }
    }
    
    console.warn('⚠️ Nenhuma instância do Core encontrada');
    return null;
}


// 4. MÉTODO DELETEPLANS CORRIGIDO COM BUSCA DINÂMICA DO CORE

async deletePlan(planId) {
    return this.loadingManager.withLoading(
        '📋 Carregando Planos',
        'Buscando seus treinos...',
        async () => {
            try {
                               
                this.loadingManager.updateProgress(30, 'Verificando autenticação...');
                if (!planId || !this.canPerformAction()) {
                    return;
                }
            
                // BUSCAR E DIAGNOSTICAR O PLANO
                const planToDelete = this.savedPlans.find(p => 
                    p.id === planId && p.userId === this.currentUserId
                );
            
                if (!planToDelete) {
                    console.error('❌ Plano não encontrado na lista local');
                    this.showMessage('Plano não encontrado', 'error');
                    return;
                }
            
                const planName = planToDelete.nome || 'Plano sem nome';
                if (!confirm(`Tem certeza que deseja excluir "${planName}"?`)) {
                    return;
                }
            
                try {
                    this.showMessage('Excluindo plano...', 'info');
            
                    // CORREÇÃO CRÍTICA: BUSCA DINÂMICA DO CORE
                    let coreInstance = this.core;
                    
                    if (!coreInstance) {
                        console.log('🔍 Core não encontrado, buscando dinamicamente...');
                        coreInstance = this.findCoreInstance();
                        
                        if (coreInstance) {
                            this.core = coreInstance; // Atualizar referência
                            console.log('✅ Core encontrado e atualizado');
                        }
                    }
            
                    console.log('🔥 === DIAGNÓSTICO FIREBASE ===');
                    console.log('Core existe:', !!coreInstance);
                    console.log('Core conectado:', coreInstance?.firebaseConnected);
                    console.log('Método deletePlanFromFirebase existe:', typeof coreInstance?.deletePlanFromFirebase === 'function');
            
                    let firebaseDeleted = false;
                    let firebaseError = null;
                    let firebaseAttempted = false;
            
                    // TENTAR DELETAR DO FIREBASE
                    if (coreInstance && coreInstance.firebaseConnected) {
                        if (typeof coreInstance.deletePlanFromFirebase === 'function') {
                            try {
                                console.log('🔥 Iniciando deleção Firebase...');
                                firebaseAttempted = true;
                                
                                await coreInstance.deletePlanFromFirebase(planId);
                                firebaseDeleted = true;
                                console.log('✅ Deletado do Firebase com sucesso');
                                
                            } catch (error) {
                                firebaseError = error;
                                console.error('❌ Erro na deleção Firebase:', error);
                                
                                if (error.code === 'not-found' || 
                                    error.message?.includes('not found')) {
                                    console.log('ℹ️ Plano não existe no Firebase (sucesso)');
                                    firebaseDeleted = true;
                                    firebaseError = null;
                                }
                            }
                        } else {
                            console.error('❌ Método deletePlanFromFirebase não existe');
                            firebaseError = new Error('Método deletePlanFromFirebase não disponível');
                        }
                    } else {
                        console.warn('⚠️ Firebase não conectado ou core indisponível');
                    }
            
                    // DELETAR LOCALMENTE
                    console.log('💾 === DELEÇÃO LOCAL ===');
                    const initialLength = this.savedPlans.length;
                    this.savedPlans = this.savedPlans.filter(plan => 
                        !(plan.id === planId && plan.userId === this.currentUserId)
                    );
                    
                    const localDeleted = this.savedPlans.length < initialLength;
                    
                    if (localDeleted) {
                        await this.saveToUserLocalStorage();
                        console.log('✅ Backup localStorage atualizado');
                    }
            
                    // ATUALIZAR INTERFACE
                    this.renderPlanList();
            
                    // MENSAGENS DE RESULTADO
                    console.log('📊 === RELATÓRIO FINAL ===');
                    console.log('Firebase tentado:', firebaseAttempted);
                    console.log('Firebase deletado:', firebaseDeleted);
                    console.log('Local deletado:', localDeleted);
                    
                    if (firebaseDeleted && localDeleted) {
                        this.showMessage(`✅ "${planName}" excluído completamente!`, 'success');
                    } else if (localDeleted && !firebaseDeleted) {
                        this.showMessage(`⚠️ "${planName}" excluído localmente. ${firebaseError?.message || 'Firebase indisponível'}`, 'warning');
                    } else if (firebaseDeleted && !localDeleted) {
                        this.showMessage(`❌ Problema: deletado do Firebase mas não localmente`, 'error');
                    } else {
                        this.showMessage(`❌ Erro ao excluir "${planName}"`, 'error');
                    }
                    
                } catch (criticalError) {
                    console.error('💥 ERRO CRÍTICO:', criticalError);
                    this.showMessage(`Erro crítico: ${criticalError.message}`, 'error');
                }
                // ... verificações de auth ...
                
                this.loadingManager.updateProgress(60, 'Carregando do Firebase...');
                // ... carregamento Firebase ...
                
                this.loadingManager.updateProgress(80, 'Atualizando interface...');
                // ... renderização ...
                
                this.loadingManager.updateProgress(100, 'Pronto!');
                
            } catch (error) {
                throw error;
            }
        }
    );
    


   
}

// 3. MÉTODO DELETEPLANTFROMFIREBASE PARA O JSFITCORE (adicionar ao jsfitcore.js)
async deletePlanFromFirebase(planId) {
    try {
        console.log(`🗑️ Deletando plano ${planId} do Firebase...`);
        
        if (!this.firebaseConnected) {
            throw new Error('Firebase não conectado');
        }
        
        if (!planId) {
            throw new Error('Plan ID é obrigatório');
        }
        
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const planRef = doc(window.db, 'plans', planId);
        await deleteDoc(planRef);
        
        console.log(`✅ Plano ${planId} deletado do Firebase`);
        
    } catch (error) {
        console.error('❌ Erro ao deletar plano do Firebase:', error);
        throw error;
    }
}

async onUserAuthenticated(user) {
    try {
        console.log('✅ Usuário autenticado via AuthManager:', user.email);
        
        // CORREÇÃO CRÍTICA: Limpar TODOS os dados do usuário anterior
        this.savedPlans = [];
        this.currentPlan = this.getEmptyPlan();
        
        // Verificar se mudou de usuário
        const previousUserId = this.currentUserId;
        const newUserId = user.uid;
        
        if (previousUserId && previousUserId !== newUserId) {
            console.log(`🔄 Mudança de usuário detectada: ${previousUserId} → ${newUserId}`);
            
            // Limpar localStorage do usuário anterior
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('jsfitapp_plans_') && key.includes(previousUserId)) {
                        localStorage.removeItem(key);
                        console.log(`🗑️ Removido dados antigos: ${key}`);
                    }
                });
            } catch (cleanupError) {
                console.warn('⚠️ Erro na limpeza de dados antigos:', cleanupError);
            }
        }
        
        // ATUALIZAR todas as propriedades de autenticação IMEDIATAMENTE
        this.currentUser = user;
        this.isUserAuthenticated = true;
        this.currentUserId = user.uid;
        this.userEmail = user.email;
        this.userDisplayName = user.displayName || user.email?.split('@')[0] || 'Usuário';
        
        // Verificar se já está processando para evitar múltiplas chamadas
        if (this.isProcessingAuthentication) {
            console.log('⏸️ Já processando autenticação, ignorando...');
            return;
        }
        
        this.isProcessingAuthentication = true;
        
        try {
            // Ocultar loading se existir
            if (typeof this.hideInitializationLoading === 'function') {
                this.hideInitializationLoading();
            }
            
            // Mostrar aplicação principal
            this.showMainApplication();
            
            // Carregar dados específicos do usuário atual
            await this.loadUserSpecificData();
            
            console.log('✅ Usuário inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro no processamento de autenticação:', error);
            this.showMessage('Erro ao carregar dados do usuário', 'error');
        } finally {
            // Garantir que flag é resetada
            setTimeout(() => {
                this.isProcessingAuthentication = false;
            }, 1000);
        }
        
    } catch (criticalError) {
        console.error('💥 Erro crítico no onUserAuthenticated:', criticalError);
        this.showMessage('Erro crítico na autenticação', 'error');
        this.isProcessingAuthentication = false;
    }
}

    // Método auxiliar para carregar dados específicos do usuário
async loadUserSpecificData() {
    try {
        console.log(`📊 Carregando dados específicos para usuário: ${this.currentUserId}`);
        
        // 1. Carregar planos do usuário atual
        if (this.core && this.core.firebaseConnected) {
            try {
                const firebasePlans = await this.core.loadPlansFromFirebase();
                if (firebasePlans && Array.isArray(firebasePlans)) {
                    // FILTRO RIGOROSO por userId
                    this.savedPlans = firebasePlans.filter(plan => 
                        plan.userId === this.currentUserId
                    );
                    console.log(`✅ ${this.savedPlans.length} planos carregados do Firebase`);
                    
                    // Criar backup local
                    await this.saveToUserLocalStorage();
                    return;
                }
            } catch (firebaseError) {
                console.warn('⚠️ Erro Firebase, usando localStorage:', firebaseError);
            }
        }
        
        // 2. Fallback para localStorage específico do usuário
        await this.loadFromUserLocalStorage();
        
        console.log(`📋 Total de planos carregados: ${this.savedPlans.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do usuário:', error);
        this.savedPlans = [];
    }
}


    // MÉTODO AUXILIAR: Modo fallback para funcionamento offline
    initializeFallbackMode() {
        try {
            console.log('🔄 Iniciando modo fallback...');
            
            // Tentar criar core mínimo se ainda não existe
            if (!this.core) {
                try {
                    
                    console.log('⚠️ JSFitCore criado em modo offline');
                } catch (coreError) {
                    console.error('❌ Falha ao criar JSFitCore em modo fallback:', coreError);
                }
            }
            
            // Configurar interface básica
            this.setupEventListeners();
            
            // Carregar dados locais se possível
            this.loadLocalData();
            
            // Mostrar interface com funcionalidade limitada
            this.showMainInterface();
            
            this.showMessage('Aplicação iniciada em modo offline. Algumas funcionalidades podem estar limitadas.', 'warning');
            
        } catch (error) {
            console.error('❌ Erro crítico no modo fallback:', error);
            alert('Erro crítico na aplicação. Por favor, recarregue a página.');
        }
    }
    

    // Método melhorado para aguardar AuthManager
async waitForAuthManager() {
    
    
    console.log('⏳ Aguardando AuthManager ficar disponível...');
    
    const timeout = 5000; // 5 segundos
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        if (window.authManager && 
            typeof window.authManager === 'object' &&
            (typeof window.authManager.initialize === 'function' || 
             typeof window.authManager.getCurrentUser === 'function')) {
            console.log('✅ AuthManager detectado e pronto');
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('⚠️ Timeout aguardando AuthManager');
    return false;
}


async waitForDependencies() {
    console.log('🔍 Verificando dependências...');
    
    const timeout = 8000; // Reduzido para 8 segundos
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        // Verificações corrigidas
        const jsfitCoreReady = typeof window.JSFitCore === 'function';
        
        // CORREÇÃO: Verificação mais flexível do AuthManager
        const authReady = !!(window.authManager && (
            typeof window.authManager.initialize === 'function' ||
            typeof window.authManager.getCurrentUser === 'function' ||
            window.authManager.constructor.name === 'AuthManager'
        ));
        
        const domReady = document.readyState === 'complete' || document.readyState === 'interactive';
        
        // Log apenas a cada 2 segundos para evitar spam
        if ((Date.now() - startTime) % 2000 < 200) {
            console.log('📋 Status das dependências:', {
                JSFitCore: jsfitCoreReady ? '✅' : '❌',
                AuthManager: authReady ? '✅' : '❌', 
                DOM: domReady ? '✅' : '❌'
            });
        }
        
        // MUDANÇA: Continuar se JSFitCore e DOM estão prontos
        // AuthManager é opcional agora
        if (jsfitCoreReady && domReady) {
            if (authReady) {
                console.log('✅ Todas as dependências carregadas');
            } else {
                console.log('⚠️ Continuando sem AuthManager inicializado');
            }
            return true;
        }
        
        // Aguardar menos tempo entre verificações
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.warn('⚠️ Timeout nas dependências, forçando continuação...');
    return false;
}


async checkCurrentUser() {
    const timeout = 2000; // Apenas 2 segundos
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        if (window.authManager && window.authManager.getCurrentUser) {
            const user = window.authManager.getCurrentUser();
            if (user && user.uid) {
                return user;
            }
        }
        
        // Verificar também no Firebase Auth diretamente
        if (window.authManager && window.authManager.auth && window.authManager.auth.currentUser) {
            const firebaseUser = window.authManager.auth.currentUser;
            if (firebaseUser.uid) {
                return firebaseUser;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return null;
}


// ========================================
// MÉTODO showMainInterface SEGURO
// ========================================

showMainInterface() {
    try {
        // Esconder tela de autenticação
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        // Mostrar container principal
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
        
        // Ir para lista de planos
        this.showPlanList();
        
    } catch (error) {
        console.error('Erro ao mostrar interface principal:', error);
    }
}

// 3. MÉTODO DE FALLBACK CORRIGIDO
async initializeFallbackModeFixed() {
    try {
        console.log('🔄 Iniciando modo fallback corrigido...');
        
        // Garantir que core existe
        if (!this.core) {
            this.core = {
                firebaseConnected: false,
                exerciseDatabaseLoaded: false,
                showNotification: (message, type) => {
                    console.log(`${type.toUpperCase()}: ${message}`);
                    this.createSimpleNotification(message, type);
                }
            };
        }
        
        // Garantir propriedades mínimas
        this.savedPlans = this.savedPlans || [];
        this.isUserAuthenticated = false;
        this.currentUserId = null;
        
        // Configurar interface básica
        this.setupEventListeners();
        
        // Carregar dados locais se possível
        this.loadLocalData();
        
        // Mostrar interface
        this.showMainInterface();
        
        this.core.showNotification('Aplicação iniciada em modo offline. Algumas funcionalidades podem estar limitadas.', 'warning');
        
        console.log('✅ Modo fallback inicializado');
        
    } catch (error) {
        console.error('❌ Erro no modo fallback:', error);
        throw error;
    }
}


// 5. MÉTODO loadLocalData MELHORADO
loadLocalData() {
    try {
        // Tentar carregar planos do localStorage
        const localPlans = localStorage.getItem('jsfitapp_plans');
        if (localPlans) {
            this.savedPlans = JSON.parse(localPlans);
            console.log(`📋 ${this.savedPlans.length} planos carregados do localStorage`);
        } else {
            this.savedPlans = [];
        }
        
        this.updatePlansList();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados locais:', error);
        this.savedPlans = [];
    }
}


// 7. MÉTODO updatePlansList SEGURO
updatePlansList() {
    try {
        if (typeof this.renderPlanList === 'function') {
            this.renderPlanList();
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar lista de planos:', error);
    }
}

// 8. MÉTODO createSimpleNotification MELHORADO
createSimpleNotification(message, type = 'info') {
    try {
        // Remover notificações anteriores
        document.querySelectorAll('.simple-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `simple-notification notification-${type}`;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background-color: ${colors[type] || colors.info};
            font-family: Arial, sans-serif;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remover após 4 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
        
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        // Fallback para console
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

updateLoadingMessage(message) {
    this.loadingMessage = message;
    const messageElement = document.getElementById('initLoadingMessage');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    // Simular progresso baseado na mensagem
    const progressElement = document.getElementById('initProgressFill');
    if (progressElement) {
        const progressMap = {
            'Inicializando sistema...': 10,
            'Conectando ao Firebase...': 25,
            'Configurando autenticação...': 40,
            'Carregando configurações...': 55,
            'Carregando tipos de plano...': 65,
            'Carregando seus planos...': 75,
            'Carregando base de exercícios...': 85,
            'Configurando interface...': 90,
            'Sincronizando dados...': 95
        };
        
        const progress = progressMap[message] || 50;
        progressElement.style.width = progress + '%';
    }
}


async checkAndMigrateUserData() {
    try {
        if (!this.isUserAuthenticated) return;
        
        // Verificar se já foi feita migração para este usuário
        const migrationKey = `jsfitapp_migration_${this.currentUserId}`;
        const migrationDone = localStorage.getItem(migrationKey);
        
        if (!migrationDone) {
            console.log('🔄 Primeira vez do usuário, verificando migração...');
            
            // Verificar se há dados antigos para migrar
            const oldData = localStorage.getItem('jsfitapp_plans');
            if (oldData) {
                console.log('📦 Encontrados dados antigos, iniciando migração...');
                await this.migrateOldDataToUser(oldData);
            }
            
            // Migrar planos no Firebase se necessário
            const result = await this.core.migrateExistingPlansToUser();
            if (result.migrated > 0) {
                console.log(`✅ ${result.migrated} planos migrados do Firebase`);
                // Recarregar planos após migração
                await this.loadSavedPlansWithVerification();
                this.renderPlanList();
            }
            
            // Marcar migração como concluída
            localStorage.setItem(migrationKey, new Date().toISOString());
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação/migração:', error);
    }
}

async migrateOldDataToUser(oldDataString) {
    try {
        const oldPlans = JSON.parse(oldDataString);
        if (Array.isArray(oldPlans) && oldPlans.length > 0) {
            
            const shouldMigrate = confirm(
                `Encontramos ${oldPlans.length} plano(s) de uso anterior.\n\n` +
                `Deseja importar estes planos para sua conta?\n\n` +
                `(Recomendado: SIM)`
            );
            
            if (shouldMigrate) {
                let migratedCount = 0;
                
                for (const plan of oldPlans) {
                    try {
                        // Adicionar à lista atual
                        plan.migrated_from_old = true;
                        plan.migrated_at = new Date().toISOString();
                        this.savedPlans.push(plan);
                        migratedCount++;
                    } catch (error) {
                        console.error('Erro ao migrar plano individual:', error);
                    }
                }
                
                if (migratedCount > 0) {
                    // Salvar planos migrados
                    this.savePlansToStorage();
                    
                    // Tentar salvar no Firebase
                    if (this.core && this.core.firebaseConnected) {
                        for (const plan of this.savedPlans.filter(p => p.migrated_from_old)) {
                            try {
                                await this.savePlan(plan);
                            } catch (error) {
                                console.warn('Erro ao salvar plano migrado no Firebase:', error);
                            }
                        }
                    }
                    
                    this.showMessage(`${migratedCount} plano(s) importado(s) para sua conta!`, 'success');
                    
                    // Remover dados antigos após migração bem-sucedida
                    localStorage.removeItem('jsfitapp_plans');
                }
            }
        }
    } catch (error) {
        console.error('Erro na migração de dados antigos:', error);
    }
}





clearOldUserData() {
    try {
        const keys = Object.keys(localStorage);
        const currentUserId = this.currentUserId;
        
        keys.forEach(key => {
            // Remover dados de outros usuários (opcional)
            if (key.startsWith('jsfitapp_plans_') && !key.includes(currentUserId)) {
                const confirmClear = confirm(
                    'Foram encontrados dados de outro usuário. Deseja removê-los para liberar espaço?'
                );
                if (confirmClear) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.warn('Erro na limpeza de dados antigos:', error);
    }
}




getConfigStorageKey() {
    const userId = this.currentUserId || 'anonymous';
    return `jsfitapp_plan_configuration_${userId}`;
}

// 7. CORRIGIR MÉTODO DE CARREGAMENTO DE PLANOS
async loadSavedPlansWithVerification() {
    if (!this.isUserAuthenticated) {
        console.warn('Usuário não autenticado, não carregando planos');
        this.savedPlans = [];
        return;
    }
    
   
}

async importPlan(event) {

    return this.loadingManager.withLoading(
        '📋 Importando Planos',
        'Buscando seus treinos...',
        async () => {
            try {
                // ... código existente ...
                
                this.loadingManager.updateProgress(30, 'Verificando autenticação...');
                const file = event.target.files[0];
                if (!file) return;
            
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        this.showMessage('Importando e salvando no Firebase...', 'info');
                        
                        const importedData = JSON.parse(e.target.result);
                        
                        let plansToImport = [];
                        
                        if (importedData.planos) {
                            plansToImport = importedData.planos;
                        } else if (Array.isArray(importedData)) {
                            plansToImport = importedData;
                        } else {
                            plansToImport = [importedData];
                        }
                        
                        const results = {
                            firebase_success: 0,
                            localStorage_only: 0,
                            errors: 0
                        };
                        
                        // Verificar e garantir que this.core existe
                        if (!this.core) {
                            console.warn('Core não disponível, tentando acessar via window');
                            this.core = window.app?.core || window.core;
                            
                            if (!this.core) {
                                console.error('Core não encontrado, criando objeto mínimo');
                                this.core = {
                                    generateId: () => Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                    firebaseConnected: false,
                                    savePlanToFirebase: null
                                };
                            }
                        }
                        
                        // Garantir que savedPlans existe
                        if (!this.savedPlans) {
                            this.savedPlans = [];
                            console.warn('savedPlans não existia, inicializando array vazio');
                        }
                        
                        for (const planData of plansToImport) {
                            try {
                                // Função inline para gerar ID seguro
                                const generateId = () => {
                                    if (this.core && typeof this.core.generateId === 'function') {
                                        try {
                                            return this.core.generateId();
                                        } catch (error) {
                                            console.warn('Erro no generateId do core, usando fallback');
                                            return Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                        }
                                    }
                                    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
                                };
                                
                                // Preparar dados
                                planData.id = null;
                                planData.nome = planData.nome + ' (Importado)';
                                planData.imported_at = new Date().toISOString();
                                
                                // Normalizar estrutura se método existir
                                if (typeof this.normalizePlanStructure === 'function') {
                                    this.normalizePlanStructure(planData);
                                }
                                
                                // TENTAR FIREBASE PRIMEIRO
                                let savedToFirebase = false;
                                
                                if (this.core && 
                                    this.core.firebaseConnected && 
                                    typeof this.core.savePlanToFirebase === 'function') {
                                    try {
                                        const firebaseId = await this.core.savePlanToFirebase(planData);
                                        
                                        if (firebaseId) {
                                            planData.id = firebaseId;
                                            planData.saved_in_firebase = true;
                                            savedToFirebase = true;
                                            results.firebase_success++;
                                            console.log(`Plano ${planData.nome} salvo no Firebase: ${firebaseId}`);
                                        }
                                        
                                    } catch (firebaseError) {
                                        console.error(`Erro Firebase para ${planData.nome}:`, firebaseError);
                                        savedToFirebase = false;
                                    }
                                }
                                
                                // BACKUP LOCAL se Firebase falhou
                                if (!savedToFirebase) {
                                    planData.id = generateId();
                                    planData.saved_in_localstorage_only = true;
                                    planData.retry_firebase = true;
                                    results.localStorage_only++;
                                    console.log(`Plano ${planData.nome} salvo apenas localmente: ${planData.id}`);
                                } else {
                                    planData.backup_in_localstorage = true;
                                }
                                
                                // Adicionar à lista local sempre
                                this.savedPlans.push(planData);
                                
                            } catch (planError) {
                                console.error('Erro ao processar plano individual:', planError);
                                results.errors++;
                            }
                        }
                        
                        // Salvar backup local com fallbacks
                        try {
                            if (typeof this.saveToLocalStorageAsBackup === 'function') {
                                this.saveToLocalStorageAsBackup();
                            } else {
                                // Fallback manual para localStorage
                                const userId = this.getCurrentUserId ? this.getCurrentUserId() : 
                                              (this.core && this.core.getUserId ? this.core.getUserId() : null);
                                
                                if (userId && this.savedPlans) {
                                    const storageKey = `jsfitapp_plans_${userId}`;
                                    localStorage.setItem(storageKey, JSON.stringify(this.savedPlans));
                                    console.log('Backup manual do localStorage realizado');
                                }
                            }
                        } catch (backupError) {
                            console.error('Erro no backup:', backupError);
                        }
                        
                        // Atualizar interface com fallbacks
                        try {
                            if (typeof this.renderPlanList === 'function') {
                                this.renderPlanList();
                            } else if (typeof this.updatePlansList === 'function') {
                                this.updatePlansList();
                            } else if (typeof this.showPlanList === 'function') {
                                this.showPlanList();
                            } else {
                                console.warn('Nenhum método de renderização encontrado');
                            }
                        } catch (uiError) {
                            console.error('Erro ao atualizar interface:', uiError);
                        }
                        
                        // Mensagem de resultado
                        if (results.errors === 0) {
                            if (results.firebase_success === plansToImport.length) {
                                this.showMessage(`${results.firebase_success} planos importados e salvos no Firebase!`, 'success');
                            } else if (results.firebase_success > 0) {
                                this.showMessage(
                                    `${results.firebase_success} salvos no Firebase, ${results.localStorage_only} apenas localmente`, 
                                    'warning'
                                );
                            } else {
                                this.showMessage(`${results.localStorage_only} planos salvos localmente (Firebase indisponível)`, 'warning');
                            }
                        } else {
                            this.showMessage(
                                `Import parcial: ${results.firebase_success + results.localStorage_only}/${plansToImport.length} planos`, 
                                'warning'
                            );
                        }
                        
                        // Agendar retry se método existir
                        if (typeof this.scheduleFailedPlansRetry === 'function') {
                            this.scheduleFailedPlansRetry();
                        }
                        
                    } catch (error) {
                        console.error('Erro geral ao importar:', error);
                        this.showMessage('Erro ao importar arquivo. Verifique o formato.', 'error');
                    }
                };
                
                reader.readAsText(file);
                event.target.value = '';
            
                
                this.loadingManager.updateProgress(60, 'Carregando do Firebase...');
                // ... carregamento Firebase ...
                
                this.loadingManager.updateProgress(80, 'Atualizando interface...');
                // ... renderização ...
                
                this.loadingManager.updateProgress(100, 'Pronto!');
                
            } catch (error) {
                throw error;
            }
        }
    );

}

    savePlansToStorage() {
        
        if (!this.isUserAuthenticated) {
            console.warn('Usuário não autenticado, não salvando no localStorage');
            return;
        }
        
        try {
            const key = this.getLocalStorageKey();
            const dataToSave = {
                plans: this.savedPlans,
                userId: this.currentUserId,
                savedAt: new Date().toISOString(),
                userEmail: this.userEmail
            };
            
            localStorage.setItem(key, JSON.stringify(dataToSave));
            console.log(`💾 ${this.savedPlans.length} planos salvos no localStorage para usuário ${this.currentUserId}`);
        } catch (error) {
            console.error('❌ Erro ao salvar no localStorage:', error);
        }
    }


// ============================================
// MÉTODO PARA AGUARDAR PROCESSAMENTO DE LOGIN
// ============================================
async waitForLoginProcessing() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 120; // 12 segundos
        
        const checkProcessing = () => {
            // Se não existe AuthManager, resolver imediatamente
            if (!window.authManager) {
                console.log('⚠️ AuthManager não encontrado, pulando aguardo de processamento');
                resolve();
                return;
            }
            
            // Verificar se o processamento foi finalizado
            if (window.authManager.loginInProgress === false) {
                console.log('✅ Processamento de login finalizado');
                resolve();
                return;
            }
            
            // Verificar timeout
            attempts++;
            if (attempts >= maxAttempts) {
                console.log('⏰ Timeout no processamento de login, continuando...');
                resolve();
                return;
            }
            
            // Log de progresso a cada 2 segundos
            if (attempts % 20 === 0) {
                console.log(`🔄 Aguardando processamento... (${attempts/10}s)`);
            }
            
            setTimeout(checkProcessing, 100);
        };
        
        // Aguardar 1 segundo antes de começar a verificar
        // para dar tempo do AuthManager inicializar
        setTimeout(checkProcessing, 1000);
    });
}


// ============================================
// MÉTODO SEGURO PARA CARREGAR EXERCÍCIOS
// ============================================




onUserLogout() {
    console.log('🚪 Callback: Usuário deslogado');
    
    // Limpar estado
    this.currentUserId = null;
    this.isUserAuthenticated = false;
    this.userDisplayName = '';
    this.userEmail = '';
    this.savedPlans = [];
    
    // Limpar interface
    this.showAuthenticationScreen();
    this.updatePlansList();
    
    // Mostrar mensagem
    if (this.core?.showNotification) {
        this.core.showNotification('Sessão encerrada', 'info');
    }
}


// ============================================
// MÉTODO APRIMORADO PARA VERIFICAR AUTHMANAGER
// ============================================
async checkAuthManager() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos
        
        const checkAuth = () => {
            attempts++;
            
            if (window.authManager && typeof window.authManager.initialize === 'function') {
                console.log('✅ AuthManager encontrado');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.log('⚠️ Timeout: AuthManager não encontrado - continuando sem auth');
                resolve(false);
            } else {
                // Log de progresso a cada segundo
                if (attempts % 10 === 0) {
                    console.log(`🔍 Procurando AuthManager... (${attempts/10}s)`);
                }
                setTimeout(checkAuth, 100);
            }
        };
        
        checkAuth();
    });
}






// ============================================
// MÉTODO AUXILIAR: loadUserPlans
// ============================================
async loadUserPlans() {
    try {
        console.log('📊 Carregando planos do usuário...');
        
        if (this.core && this.core.firebaseConnected) {
            // Tentar carregar do Firebase primeiro
            try {
                const firebasePlans = await this.core.loadPlansFromFirebase();
                if (firebasePlans && Array.isArray(firebasePlans)) {
                    this.savedPlans = firebasePlans;
                    console.log(`✅ ${firebasePlans.length} planos carregados do Firebase`);
                    
                    // Criar backup local
                    this.saveToLocalStorageAsBackup();
                    return;
                }
            } catch (firebaseError) {
                console.warn('⚠️ Erro ao carregar do Firebase:', firebaseError);
            }
        }
        
        // Fallback: carregar do localStorage
        console.log('📂 Carregando backup do localStorage...');
        await this.loadFromLocalStorageAsBackup();
        
    } catch (error) {
        console.error('❌ Erro ao carregar planos:', error);
        this.savedPlans = [];
    }
}


onUserLoggedOut() {
    console.log('👋 Callback: Usuário deslogado');
    
    // Limpar estado da aplicação
    this.currentUserId = null;
    this.isUserAuthenticated = false;
    this.currentUser = null;
    this.userDisplayName = '';
    this.userEmail = '';
    this.savedPlans = [];
    
    // Mostrar tela de login
    this.showAuthenticationScreen();
    this.updatePlansList();
    
    if (this.core?.showNotification) {
        this.core.showNotification('Sessão encerrada', 'info');
    }
}





showCriticalError(error) {
    console.error('💥 ERRO CRÍTICO:', error);
    
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: monospace;
    `;
    
    errorContainer.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 20px;">
            <h2>❌ Erro Crítico na Inicialização</h2>
            <p style="margin: 20px 0;">${error.message}</p>
            <button onclick="location.reload()" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            ">
                🔄 Recarregar Página
            </button>
        </div>
    `;
    
    document.body.appendChild(errorContainer);
}

// ============================================
// MÉTODOS AUXILIARES DE INTERFACE

hideAuthContainer() {
    const authContainer = document.getElementById('authContainer');
    if (authContainer) {
        authContainer.style.display = 'none';
    }
}

loadPlansFromLocalStorage() {
    try {
        const userId = this.currentUserId || 'anonymous';
        const storageKey = `jsfitapp_plans_${userId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            this.savedPlans = JSON.parse(stored);
            console.log(`✅ ${this.savedPlans.length} planos carregados do localStorage`);
        } else {
            this.savedPlans = [];
            console.log('ℹ️ Nenhum plano encontrado no localStorage');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar do localStorage:', error);
        this.savedPlans = [];
    }
}

// Método para carregar dados do usuário
async loadUserData() {
    try {
        console.log('📊 Carregando dados do usuário...');
        
        // Carregar planos salvos se método existir
        if (typeof this.loadSavedPlans === 'function') {
            await this.loadSavedPlans();
        }
        
        // Carregar configurações se método existir
        if (this.core?.loadPlanTypeConfiguration) {
            await this.core.loadPlanTypeConfiguration();
        }
        
        // Migrar planos existentes se método existir
        if (this.core?.migrateExistingPlansToUser) {
            await this.core.migrateExistingPlansToUser();
        }
        
        console.log('✅ Dados do usuário carregados');
        
    } catch (error) {
        console.warn('⚠️ Erro ao carregar dados do usuário:', error);
    }
}


// Método para verificação adicional no constructor/inicialização
ensureJSFitCoreExists() {
    if (!this.core.JSFitCore) {
        console.error('❌ JSFitCore não foi carregado. Verifique se o arquivo shared/jsfitcore.js está sendo importado.');
        throw new Error('JSFitCore não está disponível. Verifique o carregamento do arquivo jsfitcore.js');
    }
    
    if (!this.core) {
        console.log('🔧 Criando nova instância do JSFitCore...');
        this.core = new JSFitCore();
    }
}

// 1. INICIALIZAÇÃO AUTOMÁTICA DA SINCRONIZAÇÃO
startAutoSync() {
    // Sync inicial após 10 segundos
    setTimeout(() => {
        this.syncAllPendingOperations();
    }, 10000);

    // Auto-sync a cada 5 minutos
    this.autoSyncInterval = setInterval(async () => {
        if (this.core && this.core.firebaseConnected) {
            const status = this.getSyncStatus();
            if (!status.isFullySynced) {
                console.log('Auto-sync executando...');
                await this.syncAllPendingOperations();
            }
        }
    }, 5 * 60 * 1000);

    // Limpeza de deleções pendentes antigas a cada 30 minutos
    this.cleanupInterval = setInterval(() => {
        this.cleanupPendingDeletions();
    }, 30 * 60 * 1000);

    // Atualização do painel debug a cada minuto
    this.debugUpdateInterval = setInterval(() => {
        if (document.getElementById('debugPanel').style.display !== 'none') {
            this.updateDebugInfo();
        }
    }, 60 * 1000);

    console.log('Auto-sync iniciado (Firebase prioritário)');
}

stopAutoSync() {
    if (this.autoSyncInterval) {
        clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = null;
    }
    
    if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
    }
    
    if (this.debugUpdateInterval) {
        clearInterval(this.debugUpdateInterval);
        this.debugUpdateInterval = null;
    }
    
    console.log('Auto-sync parado');
}

// 2. HANDLER PARA RECONEXÃO COM FIREBASE
async handleFirebaseReconnection() {
    try {
        console.log('Firebase reconectado - iniciando sincronização...');
        this.showMessage('Firebase reconectado - sincronizando dados...', 'info');
        
        // Sync completo após reconexão
        await this.syncAllPendingOperations();
        
        // Recarregar dados do Firebase para verificar se há novos
        await this.mergeFirebaseData();
        
        this.showMessage('Sincronização completa!', 'success');
        
    } catch (error) {
        console.error('Erro na sincronização pós-reconexão:', error);
        this.showMessage('Erro na sincronização', 'warning');
    }
}

// 3. MERGE DE DADOS DO FIREBASE COM DADOS LOCAIS
async mergeFirebaseData() {
    try {
        if (!this.core || !this.core.firebaseConnected) {
            return;
        }

        const firebasePlans = await this.core.loadPlansFromFirebase();
        if (!firebasePlans || firebasePlans.length === 0) {
            return;
        }

        const localPlanIds = new Set(this.savedPlans.map(p => p.id));
        const newPlansFromFirebase = firebasePlans.filter(fp => !localPlanIds.has(fp.id));

        if (newPlansFromFirebase.length > 0) {
            console.log(`${newPlansFromFirebase.length} novos planos encontrados no Firebase`);
            
            newPlansFromFirebase.forEach(plan => {
                plan.loaded_from_firebase = true;
                this.savedPlans.push(plan);
            });

            // Salvar backup local atualizado
            this.saveToLocalStorageAsBackup();
            
            // Atualizar interface
            this.renderPlanList();
            
            this.showMessage(`${newPlansFromFirebase.length} planos sincronizados do Firebase`, 'success');
        }

    } catch (error) {
        console.error('Erro no merge de dados:', error);
    }
}

// 4. MÉTODO PARA FORÇAR UPLOAD COMPLETO PARA FIREBASE
async forceUploadAllToFirebase() {
    if (!confirm('Isso irá forçar o upload de todos os planos para o Firebase. Continuar?')) {
        return;
    }

    try {
        this.showMessage('Fazendo upload completo para Firebase...', 'info');
        
        let successCount = 0;
        let errorCount = 0;

        for (const plan of this.savedPlans) {
            try {
                // Remover flags locais antes do upload
                const cleanPlan = { ...plan };
                delete cleanPlan.saved_in_localstorage_only;
                delete cleanPlan.retry_firebase;
                delete cleanPlan.firebase_save_failed;
                delete cleanPlan.loaded_from_backup;
                
                const firebaseId = await this.core.savePlanToFirebase(cleanPlan);
                
                // Atualizar plano original
                plan.id = firebaseId;
                plan.saved_in_firebase = true;
                plan.backup_in_localstorage = true;
                plan.forced_upload_at = new Date().toISOString();
                
                // Limpar flags de erro
                delete plan.retry_firebase;
                delete plan.firebase_save_failed;
                delete plan.saved_in_localstorage_only;
                
                successCount++;
                
            } catch (error) {
                console.error(`Erro no upload forçado de ${plan.nome}:`, error);
                errorCount++;
            }
        }

        // Salvar backup atualizado
        this.saveToLocalStorageAsBackup();

        if (errorCount === 0) {
            this.showMessage(`${successCount} planos enviados para Firebase com sucesso!`, 'success');
        } else {
            this.showMessage(`Upload parcial: ${successCount} ok, ${errorCount} erros`, 'warning');
        }

        // Atualizar debug
        this.updateDebugInfo();

    } catch (error) {
        console.error('Erro no upload forçado:', error);
        this.showMessage('Erro no upload para Firebase', 'error');
    }
}

// 5. VALIDAÇÃO DE INTEGRIDADE FIREBASE vs LOCAL
async validateFirebaseIntegrity() {
    try {
        this.showMessage('Validando integridade Firebase vs Local...', 'info');

        if (!this.core || !this.core.firebaseConnected) {
            this.showMessage('Firebase não conectado', 'warning');
            return;
        }

        const firebasePlans = await this.core.loadPlansFromFirebase();
        const localPlans = this.savedPlans;

        const report = {
            localCount: localPlans.length,
            firebaseCount: firebasePlans ? firebasePlans.length : 0,
            onlyLocal: [],
            onlyFirebase: [],
            conflicts: []
        };

        // Encontrar planos apenas locais
        localPlans.forEach(localPlan => {
            const inFirebase = firebasePlans?.find(fp => fp.id === localPlan.id);
            if (!inFirebase && !localPlan.retry_firebase) {
                report.onlyLocal.push(localPlan.nome);
            }
        });

        // Encontrar planos apenas no Firebase
        if (firebasePlans) {
            firebasePlans.forEach(firebasePlan => {
                const inLocal = localPlans.find(lp => lp.id === firebasePlan.id);
                if (!inLocal) {
                    report.onlyFirebase.push(firebasePlan.nome);
                }
            });
        }

        // Relatório
        let message = `=== RELATÓRIO DE INTEGRIDADE ===\n`;
        message += `Local: ${report.localCount} planos\n`;
        message += `Firebase: ${report.firebaseCount} planos\n\n`;

        if (report.onlyLocal.length > 0) {
            message += `Apenas locais (${report.onlyLocal.length}):\n`;
            report.onlyLocal.forEach(name => message += `- ${name}\n`);
            message += '\n';
        }

        if (report.onlyFirebase.length > 0) {
            message += `Apenas no Firebase (${report.onlyFirebase.length}):\n`;
            report.onlyFirebase.forEach(name => message += `- ${name}\n`);
        }

        if (report.onlyLocal.length === 0 && report.onlyFirebase.length === 0) {
            message += 'INTEGRIDADE OK - Dados sincronizados!';
            this.showMessage('Integridade validada - dados sincronizados!', 'success');
        } else {
            this.showMessage('Inconsistências encontradas - verifique o console', 'warning');
        }

        alert(message);
        console.log('Relatório de integridade:', report);

    } catch (error) {
        console.error('Erro na validação de integridade:', error);
        this.showMessage('Erro na validação', 'error');
    }
}


// 7. MÉTODO PARA BACKUP COMPLETO ANTES DE OPERAÇÕES CRÍTICAS
createPreOperationBackup(operation) {
    try {
        const backupData = {
            operation: operation,
            timestamp: new Date().toISOString(),
            plans: JSON.parse(JSON.stringify(this.savedPlans)), // Deep copy
            pendingDeletions: this.pendingDeletions || [],
            syncStatus: this.getSyncStatus()
        };

        const backupKey = `jsfitapp_pre_${operation}_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        console.log(`Backup pré-operação criado: ${backupKey}`);
        return backupKey;

    } catch (error) {
        console.error('Erro ao criar backup pré-operação:', error);
        return null;
    }
}

// 8. LIMPEZA DE BACKUPS ANTIGOS
cleanupOldBackups() {
    try {
        const keys = Object.keys(localStorage);
        const backupKeys = keys.filter(key => 
            key.startsWith('jsfitapp_backup_') || 
            key.startsWith('jsfitapp_pre_')
        );

        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
        let cleaned = 0;

        backupKeys.forEach(key => {
            try {
                const parts = key.split('_');
                const timestamp = parseInt(parts[parts.length - 1]);
                
                if (!isNaN(timestamp) && (now - timestamp > maxAge)) {
                    localStorage.removeItem(key);
                    cleaned++;
                }
            } catch (error) {
                // Se não conseguir processar, remover backup suspeito
                localStorage.removeItem(key);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`${cleaned} backups antigos removidos`);
        }

    } catch (error) {
        console.error('Erro na limpeza de backups:', error);
    }
}

// MÉTODO AUXILIAR PARA SETUP COMPLETO DOS EVENT LISTENERS
setupEventListeners() {
    // Event listeners existentes...
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.savePlan();
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.showPlanCreator();
        }
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            this.showAIPlanCreator();
        }
        // NOVO: Ctrl+D para debug
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            this.debugDataState();
        }
        // NOVO: Ctrl+R para recarregar dados
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            this.reloadData();
        }
    });

    // Exercise name change handler
    const exerciseSelect = document.getElementById('exerciseName');
    if (exerciseSelect) {
        exerciseSelect.addEventListener('change', this.updateExerciseDescription.bind(this));
    }

    // Technique change handler
    const techniqueSelect = document.getElementById('exerciseTechnique');
    if (techniqueSelect) {
        techniqueSelect.addEventListener('change', this.updateTechniqueDescription.bind(this));
    }
    
    // NOVO: Storage event listener para detectar mudanças em outras abas
    window.addEventListener('storage', (e) => {
        if (e.key === 'jsfitapp_plans') {
            console.log('Detectada mudança nos planos em outra aba');
            this.handleStorageChange(e);
        }
    });
    
    // NOVO: Online/Offline events
    window.addEventListener('online', () => {
        console.log('Conexão restaurada');
        this.handleOnlineStatusChange(true);
    });
    
    window.addEventListener('offline', () => {
        console.log('Conexão perdida');
        this.handleOnlineStatusChange(false);
    });
}

// MÉTODOS PARA CONTROLAR O PAINEL DE DEBUG - ADICIONAR À CLASSE PersonalApp

toggleDebugPanel() {
    const panel = document.getElementById('debugPanel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        
        // Atualizar informações quando abrir
        if (!isVisible) {
            this.updateDebugInfo();
        }
    }
}

updateDebugInfo() {
    const status = this.getSyncStatus();
    
    // Elementos básicos
    const planCountElement = document.getElementById('debugPlanCount');
    const firebaseCountElement = document.getElementById('debugFirebaseCount');
    const pendingCountElement = document.getElementById('debugPendingCount');
    const progressBarElement = document.getElementById('syncProgressBar');
    const syncStatusElement = document.getElementById('syncStatus');
    
    if (planCountElement) {
        planCountElement.textContent = status.totalPlans;
    }
    
    if (firebaseCountElement) {
        firebaseCountElement.textContent = status.firebasePlans;
    }
    
    if (pendingCountElement) {
        pendingCountElement.textContent = status.pendingSaves + status.pendingDeletions;
    }
    
    if (progressBarElement) {
        progressBarElement.style.width = status.syncPercentage + '%';
    }
    
    if (syncStatusElement) {
        let statusText = '';
        let statusClass = 'sync-status';
        
        if (status.isFullySynced) {
            statusText = 'Totalmente sincronizado';
            statusClass += ' synced';
        } else if (status.pendingSaves > 0 || status.pendingDeletions > 0) {
            statusText = `${status.pendingSaves + status.pendingDeletions} operações pendentes`;
            statusClass += ' pending';
        } else if (status.localOnlyPlans > 0) {
            statusText = `${status.localOnlyPlans} apenas locais`;
            statusClass += ' partial';
        } else {
            statusText = 'Firebase indisponível';
            statusClass += ' offline';
        }
        
        syncStatusElement.textContent = statusText;
        syncStatusElement.className = statusClass;
    }
}

// VERSÃO MELHORADA DO debugDataState COM INFORMAÇÕES DE SINCRONIZAÇÃO
debugDataState() {
    const status = this.getSyncStatus();
    
    console.log('=== DEBUG: Estado dos dados (Firebase Prioritário) ===');
    console.log('Total de planos:', status.totalPlans);
    console.log('Salvos no Firebase:', status.firebasePlans);
    console.log('Apenas locais:', status.localOnlyPlans);
    console.log('Salvamentos pendentes:', status.pendingSaves);
    console.log('Deleções pendentes:', status.pendingDeletions);
    console.log('Sincronização:', status.syncPercentage + '%');
    console.log('Firebase conectado:', this.core?.firebaseConnected || false);
    
    let message = `=== RELATÓRIO DE SINCRONIZAÇÃO ===\n`;
    message += `Total de planos: ${status.totalPlans}\n`;
    message += `Sincronizados com Firebase: ${status.firebasePlans}\n`;
    message += `Apenas locais: ${status.localOnlyPlans}\n`;
    message += `Operações pendentes: ${status.pendingSaves + status.pendingDeletions}\n`;
    message += `Percentual sincronizado: ${status.syncPercentage}%\n`;
    message += `Status: ${status.isFullySynced ? 'TOTALMENTE SINCRONIZADO' : 'SINCRONIZAÇÃO PARCIAL'}\n\n`;
    
    if (this.savedPlans && this.savedPlans.length > 0) {
        message += `=== DETALHES DOS PLANOS ===\n`;
        this.savedPlans.forEach((plan, index) => {
            let planStatus = '';
            if (plan.saved_in_firebase) {
                planStatus = '✅ Firebase';
            } else if (plan.retry_firebase) {
                planStatus = '⏳ Pendente';
            } else if (plan.saved_in_localstorage_only) {
                planStatus = '💾 Local';
            } else {
                planStatus = '❓ Indefinido';
            }
            
            const planInfo = `${index + 1}. ${plan.nome} - ${planStatus}`;
            console.log(planInfo);
           // message += `${planInfo}\n`;
        });
    }
    
    // Verificar localStorage
    try {
        const localData = localStorage.getItem('jsfitapp_plans');
        if (localData) {
            const localPlans = JSON.parse(localData);
            message += `\nBackup localStorage: ${localPlans.length} planos`;
            console.log(`LocalStorage backup: ${localPlans.length} planos`);
        } else {
            message += '\nLocalStorage backup: vazio';
            console.log('LocalStorage backup: vazio');
        }
    } catch (error) {
        message += '\nLocalStorage backup: erro ao ler';
        console.log('LocalStorage backup: erro ao ler');
    }
    
    // Verificar deleções pendentes
    if (this.pendingDeletions && this.pendingDeletions.length > 0) {
        message += `\n\n=== DELEÇÕES PENDENTES ===\n`;
        this.pendingDeletions.forEach(del => {
            message += `- ${del.name} (${del.retryCount || 0} tentativas)\n`;
        });
    }
    
    // Mostrar alerta com resumo
    console.log(message);
    
    // Atualizar painel de debug
    this.updateDebugInfo();
}


   // Usar métodos do core para exercícios
    findExerciseByName(name) {
        return this.core.findExerciseByName(name);
    }

    getExercisesByGroupAndLevel(grupo, nivel) {
        return this.core.getExercisesByGroupAndLevel(grupo, nivel);
    }

    getAllExerciseGroups() {
        return this.core.getAllExerciseGroups();
    }

    getExerciseGif(exerciseName) {
        return this.core.findExerciseGif(exerciseName);
    }

    exerciseExists(exerciseName) {
        return this.core.exerciseExists(exerciseName);
    }

 


// 2. MÉTODO PARA BACKUP SECUNDÁRIO NO LOCALSTORAGE

saveToLocalStorageAsBackup() {
    if (!this.isUserAuthenticated) {
        console.warn('Usuário não autenticado, não salvando no localStorage');
        return false;
    }
    
    try {
        const key = this.getLocalStorageKey();
        const dataToSave = {
            plans: this.savedPlans,
            userId: this.currentUserId,
            savedAt: new Date().toISOString(),
            userEmail: this.userEmail,
            backup_type: 'secondary',
            firebase_primary: true
        };
        
        localStorage.setItem(key, JSON.stringify(dataToSave));
        console.log(`💾 Backup local criado com ${this.savedPlans.length} planos`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar backup localStorage:', error);
        return false;
    }
}

// 10. ADICIONAR MÉTODO DE MIGRAÇÃO DE ESTRUTURA
migratePlanStructure(plan) {
    // Garantir estrutura mínima do plano
    if (!plan.aluno) {
        plan.aluno = {
            nome: plan.perfil?.nome || '',
            dataNascimento: '',
            cpf: '',
            idade: plan.perfil?.idade || 25,
            altura: plan.perfil?.altura || '1,75m',
            peso: plan.perfil?.peso || '75kg'
        };
    }
    
    // Garantir que exercícios tenham todos os campos
    if (plan.treinos) {
        plan.treinos.forEach(treino => {
            if (treino.exercicios) {
                treino.exercicios.forEach(ex => {
                    if (!ex.descanso) ex.descanso = '90 segundos';
                    if (!ex.observacoesEspeciais) ex.observacoesEspeciais = '';
                    if (!ex.tecnica) ex.tecnica = '';
                });
            }
        });
    }
    
    // Garantir técnicas aplicadas
    if (!plan.tecnicas_aplicadas) {
        plan.tecnicas_aplicadas = {};
    }
    
    // Garantir porte no perfil
    if (plan.perfil && !plan.perfil.porte) {
        plan.perfil.porte = this.calculateBodyType(
            plan.perfil.altura || plan.aluno?.altura || '1,75m',
            plan.perfil.peso || plan.aluno?.peso || '75kg'
        );
    }
    
    return plan;
}

// 4. MÉTODO PARA NORMALIZAR ESTRUTURA DE PLANOS
normalizePlanStructure(planData) {
    // Estrutura do aluno
    if (!planData.aluno) {
        planData.aluno = {
            nome: planData.perfil?.nome || '',
            dataNascimento: '',
            cpf: '',
            idade: planData.perfil?.idade || 25,
            altura: planData.perfil?.altura || '1,75m',
            peso: planData.perfil?.peso || '75kg'
        };
    }
    
    // Exercícios
    if (planData.treinos) {
        planData.treinos.forEach(treino => {
            if (treino.exercicios) {
                treino.exercicios.forEach(ex => {
                    if (!ex.descanso) ex.descanso = '90 segundos';
                    if (!ex.observacoesEspeciais) ex.observacoesEspeciais = '';
                    if (!ex.tecnica) ex.tecnica = '';
                });
            }
        });
    }
    
    // Técnicas aplicadas
    if (!planData.tecnicas_aplicadas) {
        planData.tecnicas_aplicadas = {};
    }
    
    // Porte
    if (planData.perfil && !planData.perfil.porte) {
        planData.perfil.porte = this.calculateBodyType(
            planData.perfil.altura || planData.aluno?.altura || '1,75m',
            planData.perfil.peso || planData.aluno?.peso || '75kg'
        );
    }
}

// 5. SISTEMA DE RETRY PARA FIREBASE
scheduleFirebaseRetry(planId) {
    // Retry em 30 segundos
    setTimeout(async () => {
        await this.retryFirebaseSave(planId);
    }, 30000);
}


async retryFirebaseSave(planId) {
    try {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan || !plan.retry_firebase) {
            return;
        }
        
        if (this.core && this.core.firebaseConnected) {
            console.log(`Tentando retry Firebase para: ${plan.nome}`);
            
            const firebaseId = await this.core.savePlanToFirebase(plan);
            
            // Atualizar dados do plano
            plan.id = firebaseId;
            plan.saved_in_firebase = true;
            plan.retry_firebase = false;
            delete plan.firebase_save_failed;
            delete plan.firebase_error;
            delete plan.saved_in_localstorage_only;
            plan.backup_in_localstorage = true;
            plan.synced_at = new Date().toISOString();
            
            // Salvar backup atualizado
            this.saveToLocalStorageAsBackup();
            
            console.log(`Retry Firebase bem-sucedido para: ${plan.nome}`);
            this.showMessage(`Plano "${plan.nome}" sincronizado com Firebase`, 'success');
            
        }
    } catch (error) {
        console.error('Erro no retry Firebase:', error);
        // Agendar novo retry em 2 minutos
        setTimeout(() => this.retryFirebaseSave(planId), 120000);
    }
}

scheduleFailedPlansRetry() {
    const failedPlans = this.savedPlans.filter(p => p.retry_firebase);
    
    failedPlans.forEach((plan, index) => {
        // Retry escalonado: 1min, 2min, 3min...
        setTimeout(() => {
            this.retryFirebaseSave(plan.id);
        }, (index + 1) * 60000);
    });
}

// 6. CARREGAMENTO MODIFICADO PARA PRIORIZAR FIREBASE
async loadSavedPlans() {
    try {
        console.log('Carregando planos (Firebase prioritário)...');
        
        // PRIORIDADE 1: TENTAR FIREBASE
        if (this.core && this.core.firebaseConnected) {
            try {
                console.log('Carregando do Firebase...');
                const firebasePlans = await this.core.loadPlansFromFirebase();
                
                if (firebasePlans && Array.isArray(firebasePlans) && firebasePlans.length > 0) {
                    this.savedPlans = firebasePlans;
                    console.log(`${firebasePlans.length} planos carregados do Firebase`);
                    
                    // Criar backup local dos dados do Firebase
                    this.saveToLocalStorageAsBackup();
                    
                    return; // Sucesso Firebase, não precisa do localStorage
                }
            } catch (firebaseError) {
                console.warn('Erro ao carregar do Firebase (usando backup local):', firebaseError);
            }
        }

        // PRIORIDADE 2: FALLBACK PARA LOCALSTORAGE
        console.log('Carregando backup do localStorage...');
        await this.loadFromLocalStorageAsBackup();
        
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        this.savedPlans = [];
    }
}

// CORREÇÃO 2: Modificar loadFromLocalStorageAsBackup para aceitar estado recuperado
async loadFromLocalStorageAsBackup() {
    // Verificar autenticação com fallback
    const isAuthenticated = this.isUserAuthenticated || 
                           (window.authManager && window.authManager.isUserAuthenticated()) ||
                           localStorage.getItem('jsfitapp_user');
    
    if (!isAuthenticated) {
        console.warn('⚠️ Usuário não autenticado, tentando carregar dados gerais...');
        
        // Como último recurso, tentar carregar qualquer dado disponível
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('jsfitapp_plans_'));
        
        for (const key of allKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.plans && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
                        this.savedPlans = parsed.plans;
                        console.log(`📂 Dados carregados de ${key}:`, this.savedPlans.length);
                        return;
                    }
                }
            } catch (e) {
                console.warn(`Erro ao tentar ${key}:`, e);
            }
        }
        
        this.savedPlans = [];
        return;
    }
    
    // Resto do método existente...
    try {
        const userId = this.currentUserId || window.authManager?.getCurrentUser()?.uid;
        if (!userId) {
            console.warn('UserId não encontrado');
            return;
        }
        
        const key = `jsfitapp_plans_${userId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            const data = JSON.parse(stored);
            
            if (data.plans && Array.isArray(data.plans)) {
                this.savedPlans = data.plans;
                console.log(`📂 ${this.savedPlans.length} planos carregados do backup localStorage`);
            } else {
                console.log('ℹ️ Estrutura de dados inválida no localStorage');
                this.savedPlans = [];
            }
        } else {
            console.log('ℹ️ Nenhum backup local encontrado');
            this.savedPlans = [];
        }
    } catch (error) {
        console.error('❌ Erro ao carregar backup localStorage:', error);
        this.savedPlans = [];
    }
}

// CORREÇÃO 4: Método para recuperar estado na inicialização
recoverAuthStateOnInit() {
    try {
        // Verificar AuthManager
        if (window.authManager && window.authManager.isUserAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            if (user) {
                this.isUserAuthenticated = true;
                this.currentUserId = user.uid;
                this.currentUser = user;
                this.userEmail = user.email;
                console.log('🔄 Estado recuperado na inicialização:', user.email);
            }
        }
        
        // Verificar localStorage como backup
        if (!this.isUserAuthenticated) {
            const storedUser = localStorage.getItem('jsfitapp_user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                if (userData.sessionActive) {
                    this.isUserAuthenticated = true;
                    this.currentUserId = userData.uid;
                    this.userEmail = userData.email;
                    console.log('🔄 Estado recuperado do localStorage:', userData.email);
                }
            }
        }
    } catch (error) {
        console.warn('⚠️ Erro ao recuperar estado na inicialização:', error);
    }
}





// SISTEMA DE RETRY PARA DELEÇÕES FALHADAS
scheduleFirebaseDeletionRetry(planId, planName) {
    // Armazenar na lista de deleções pendentes
    if (!this.pendingDeletions) {
        this.pendingDeletions = [];
    }
    
    this.pendingDeletions.push({
        id: planId,
        name: planName,
        timestamp: new Date(),
        retryCount: 0
    });
    
    // Tentar em 30 segundos
    setTimeout(() => {
        this.retryFirebaseDeletion(planId);
    }, 30000);
}

async retryFirebaseDeletion(planId) {
    try {
        const pendingItem = this.pendingDeletions?.find(p => p.id === planId);
        if (!pendingItem) return;

        if (this.core && this.core.firebaseConnected) {
            console.log(`Retry deleção Firebase: ${pendingItem.name}`);
            
            await this.core.deletePlanFromFirebase(planId);
            
            // Remover da lista de pendências
            this.pendingDeletions = this.pendingDeletions.filter(p => p.id !== planId);
            
            console.log(`Deleção Firebase bem-sucedida no retry: ${pendingItem.name}`);
            this.showMessage(`"${pendingItem.name}" excluído do Firebase`, 'success');
            
        }
    } catch (error) {
        console.error('Erro no retry de deleção Firebase:', error);
        
        const pendingItem = this.pendingDeletions?.find(p => p.id === planId);
        if (pendingItem) {
            pendingItem.retryCount = (pendingItem.retryCount || 0) + 1;
            
            // Máximo 3 tentativas
            if (pendingItem.retryCount < 3) {
                // Retry com backoff exponencial
                const delay = Math.pow(2, pendingItem.retryCount) * 60000; // 2min, 4min, 8min
                setTimeout(() => this.retryFirebaseDeletion(planId), delay);
            } else {
                console.error(`Falha definitiva na deleção Firebase: ${pendingItem.name}`);
                // Remover da lista de pendências após 3 falhas
                this.pendingDeletions = this.pendingDeletions.filter(p => p.id !== planId);
            }
        }
    }
}

// LIMPEZA DE DELEÇÕES PENDENTES (EXECUTAR PERIODICAMENTE)
cleanupPendingDeletions() {
    if (!this.pendingDeletions) return;
    
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    const initialCount = this.pendingDeletions.length;
    
    this.pendingDeletions = this.pendingDeletions.filter(pending => {
        const age = now - pending.timestamp;
        return age < maxAge;
    });
    
    const cleaned = initialCount - this.pendingDeletions.length;
    if (cleaned > 0) {
        console.log(`${cleaned} deleções pendentes antigas removidas`);
    }
}


// 2. VERIFICAR E RESTAURAR PLANOS PERDIDOS
async verifyAndRestorePlans() {
    try {
        const localPlans = this.getLocalStoragePlans();
        const currentPlans = this.savedPlans || [];
        
        // Verificar se há planos locais que não estão na lista atual
        const missingPlans = localPlans.filter(localPlan => 
            !currentPlans.some(currentPlan => currentPlan.id === localPlan.id)
        );
        
        if (missingPlans.length > 0) {
            console.log(`Restaurando ${missingPlans.length} plano(s) perdido(s)`);
            
            missingPlans.forEach(plan => {
                // Marcar como restaurado
                plan.restored_from_backup = true;
                plan.restored_at = new Date().toISOString();
                this.savedPlans.push(plan);
            });
            
            // Salvar dados restaurados
            this.saveToLocalStorageAsBackup();
            
            this.renderPlanList();
            this.showMessage(`${missingPlans.length} plano(s) restaurado(s)`, 'success');
        }
        
    } catch (error) {
        console.error('Erro ao verificar planos perdidos:', error);
    }
}

// 3. OBTER PLANOS DO LOCALSTORAGE
getLocalStoragePlans() {
    try {
        const stored = localStorage.getItem('jsfitapp_plans');
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (error) {
        console.error('Erro ao ler localStorage:', error);
        return [];
    }
}

// 4. SINCRONIZAÇÃO AUTOMÁTICA APÓS IMPORTAÇÃO
async syncAfterImport() {
    try {
        console.log('Sincronizando dados após importação...');
        
        // Salvar no Firebase se disponível
        if (this.core && this.core.firebaseConnected) {
            for (const plan of this.savedPlans) {
                if (plan.importado && !plan.synced_to_firebase) {
                    try {
                        const firebaseId = await this.core.savePlanToFirebase(plan);
                        plan.id = firebaseId;
                        plan.synced_to_firebase = true;
                        console.log(`Plano ${plan.nome} sincronizado com Firebase`);
                    } catch (error) {
                        console.warn(`Erro ao sincronizar ${plan.nome}:`, error);
                    }
                }
            }
        }
        
        // Salvar backup local atualizado
        this.saveToLocalStorageAsBackup();
        
        console.log('Sincronização concluída');
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

// 5. VERIFICAR INTEGRIDADE DOS DADOS APÓS INICIALIZAÇÃO
verifyDataIntegrity() {
    console.log('Verificando integridade dos dados...');
    
    const issues = [];
    
    // Verificar estrutura dos planos
    if (this.savedPlans && Array.isArray(this.savedPlans)) {
        this.savedPlans.forEach((plan, index) => {
            if (!plan.id) {
                issues.push(`Plano ${index + 1} sem ID`);
            }
            if (!plan.nome) {
                issues.push(`Plano ${index + 1} sem nome`);
            }
            if (!plan.treinos || !Array.isArray(plan.treinos)) {
                issues.push(`Plano ${index + 1} sem treinos válidos`);
            }
            // Verificar se tem flags de sincronização inconsistentes
            if (plan.saved_in_firebase && plan.retry_firebase) {
                issues.push(`Plano ${plan.nome} com flags inconsistentes`);
                // Corrigir automaticamente
                delete plan.retry_firebase;
            }
        });
    } else {
        issues.push('savedPlans não é um array válido');
    }
    
    // Verificar base de exercícios
    if (!this.core.exerciseDatabaseLoaded) {
        issues.push('Base de exercícios não carregada');
    }
    
    // Verificar configuração de tipos de plano
    if (!this.planTypeConfiguration.muscleGroups) {
        issues.push('Configuração de grupos musculares ausente');
    }
    
    // Verificar estado de sincronização
    const syncStatus = this.getSyncStatus();
    if (syncStatus.pendingSaves > 10) {
        issues.push(`Muitos salvamentos pendentes: ${syncStatus.pendingSaves}`);
    }
    
    if (this.pendingDeletions && this.pendingDeletions.length > 5) {
        issues.push(`Muitas deleções pendentes: ${this.pendingDeletions.length}`);
    }
    
    // Log dos problemas encontrados
    if (issues.length > 0) {
        console.warn('Problemas de integridade encontrados:');
        issues.forEach(issue => console.warn(`  - ${issue}`));
        
        // Tentar correções automáticas
        this.performAutomaticFixes(issues);
    } else {
        console.log('Integridade dos dados verificada com sucesso');
    }
    
    return issues.length === 0;
}

// 6. CORREÇÕES AUTOMÁTICAS DE INTEGRIDADE
performAutomaticFixes(issues) {
    let fixesApplied = 0;
    
    // Corrigir planos sem ID
    this.savedPlans.forEach(plan => {
        if (!plan.id) {
            plan.id = this.core.generateId();
            plan.fixed_missing_id = true;
            fixesApplied++;
        }
    });
    
    // Corrigir savedPlans se não for array
    if (!Array.isArray(this.savedPlans)) {
        this.savedPlans = [];
        fixesApplied++;
    }
    
    // Inicializar pendingDeletions se não existe
    if (!this.pendingDeletions) {
        this.pendingDeletions = [];
        fixesApplied++;
    }
    
    if (fixesApplied > 0) {
        console.log(`${fixesApplied} correção(ões) automática(s) aplicada(s)`);
        this.saveToLocalStorageAsBackup();
    }
}

// 8. BASE DE EXERCÍCIOS MÍNIMA PARA FALLBACK
initializeFallbackExerciseDatabase() {
    // Base mínima de exercícios para garantir funcionamento
    this.fallbackExercises = [
        // Peito
        { nome: 'Supino Reto', grupo: 'peito', nivel: 'intermediario', descricao: 'Exercício básico para peito' },
        { nome: 'Flexão de Braços', grupo: 'peito', nivel: 'iniciante', descricao: 'Exercício com peso corporal' },
        
        // Costas
        { nome: 'Puxada Frontal', grupo: 'costas', nivel: 'intermediario', descricao: 'Exercício para latíssimo' },
        { nome: 'Remada Curvada', grupo: 'costas', nivel: 'intermediario', descricao: 'Exercício para dorsal' },
        
        // Pernas
        { nome: 'Agachamento Livre', grupo: 'quadriceps', nivel: 'intermediario', descricao: 'Exercício básico para pernas' },
        { nome: 'Leg Press', grupo: 'quadriceps', nivel: 'iniciante', descricao: 'Exercício seguro para quadríceps' },
        
        // Ombros
        { nome: 'Desenvolvimento com Halteres', grupo: 'ombros', nivel: 'intermediario', descricao: 'Exercício para deltoides' },
        { nome: 'Elevação Lateral', grupo: 'ombros', nivel: 'iniciante', descricao: 'Isolamento para ombros' },
        
        // Braços
        { nome: 'Rosca Direta', grupo: 'biceps', nivel: 'iniciante', descricao: 'Exercício básico para bíceps' },
        { nome: 'Tríceps Testa', grupo: 'triceps', nivel: 'intermediario', descricao: 'Exercício para tríceps' }
    ];
    
    // Sobrescrever métodos do core se necessário
    if (!this.core.exerciseDatabaseLoaded) {
        this.core.exerciseDatabase = this.fallbackExercises;
        this.core.exerciseDatabaseLoaded = true;
        console.log('Base de exercícios de fallback carregada');
    }
}

// 9. AUTO-SAVE LOCAL APENAS (PARA MODO FALLBACK)
startLocalOnlyAutoSave() {
    // Auto-save local a cada 2 minutos
    this.localAutoSaveInterval = setInterval(() => {
        if (this.savedPlans && this.savedPlans.length > 0) {
            this.saveToLocalStorageAsBackup();
            console.log('Auto-save local executado');
        }
    }, 2 * 60 * 1000);
}

// 10. CONFIGURAR HANDLER ANTES DE SAIR DA PÁGINA
setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (event) => {
        // Salvar dados antes de sair
        this.saveToLocalStorageAsBackup();
        
        // Criar backup de emergência se há dados não salvos
        if (this.savedPlans && this.savedPlans.length > 0) {
            this.createEmergencyBackup();
        }
        
        // Parar auto-save
        this.stopAutoSync();
        
        // Limpar intervalos
        if (this.localAutoSaveInterval) {
            clearInterval(this.localAutoSaveInterval);
        }
        
        console.log('Dados salvos antes de sair da página');
    });
}

// 11. DETECTAR QUANDO A PÁGINA FICA VISÍVEL NOVAMENTE
setupVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            // Página ficou visível - verificar se dados foram perdidos
            console.log('Página ficou visível, verificando dados...');
            
            if (!this.savedPlans || this.savedPlans.length === 0) {
                console.log('Dados perdidos detectados, tentando restaurar...');
                await this.verifyAndRestorePlans();
            }
            
            // Tentar reconectar Firebase se disponível
            if (this.core && !this.core.firebaseConnected) {
                try {
                    await this.core.initializeFirebase();
                    if (this.core.firebaseConnected) {
                        console.log('Firebase reconectado');
                        this.handleFirebaseReconnection();
                    }
                } catch (error) {
                    console.warn('Erro ao reconectar Firebase:', error);
                }
            }
        }
    });
}

// 12. MÉTODO DE BACKUP DE EMERGÊNCIA
createEmergencyBackup() {
    try {
        const backupData = {
            plans: this.savedPlans,
            configuration: this.planTypeConfiguration,
            timestamp: new Date().toISOString(),
            version: '1.0',
            type: 'emergency_backup'
        };
        
        const backupKey = `jsfitapp_emergency_backup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        console.log(`Backup de emergência criado: ${backupKey}`);
        return backupKey;
        
    } catch (error) {
        console.error('Erro ao criar backup de emergência:', error);
        return null;
    }
}

// 13. MÉTODO PARA RECARREGAR DADOS SE NECESSÁRIO
async reloadData() {
    try {
        console.log('Recarregando dados...');
        this.showMessage('Recarregando dados...', 'info');
        
        await this.loadSavedPlansWithVerification();
        this.renderPlanList();
        
        this.showMessage('Dados recarregados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao recarregar dados:', error);
        this.showMessage('Erro ao recarregar dados', 'error');
    }
}

updateExerciseList(workoutIndex) {
    console.log(`🔄 Atualizando lista de exercícios para treino ${workoutIndex}`);
    
    // VALIDAÇÃO CRÍTICA
    if (workoutIndex === null || workoutIndex === undefined || workoutIndex === '') {
        console.error('❌ updateExerciseList: workoutIndex inválido!', { workoutIndex });
        return;
    }
    
    // VALIDAÇÃO DA ESTRUTURA
    if (!this.currentPlan || !this.currentPlan.treinos || !this.currentPlan.treinos[workoutIndex]) {
        console.error('❌ Estrutura de dados inválida');
        return;
    }
    
    // ENCONTRAR CONTAINER
    const containerId = `exerciseList${workoutIndex}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`❌ Container ${containerId} não encontrado no DOM`);
        // Tentar recriar o DOM
        this.recreateWorkoutEditor(workoutIndex);
        return;
    }
    
    const workout = this.currentPlan.treinos[workoutIndex];
    console.log(`📋 Renderizando ${workout.exercicios.length} exercícios`);
    
    try {
        // RENDERIZAR E ATUALIZAR
        const newHTML = this.renderExercises(workout.exercicios, workoutIndex);
        container.innerHTML = newHTML;
        
        // FORÇAR REPAINT
        container.style.display = 'none';
        container.offsetHeight; // Trigger reflow
        container.style.display = '';
        
        console.log('✅ Lista atualizada com sucesso');
        
        // DEBUG: Verificar se realmente foi atualizado
        setTimeout(() => {
            const items = container.querySelectorAll('.exercise-item');
            console.log(`🔍 Verificação: ${items.length} itens encontrados no DOM`);
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao renderizar:', error);
        container.innerHTML = `<p class="error-message">Erro: ${error.message}</p>`;
    }
}

recreateWorkoutEditor(workoutIndex) {
    console.log(`🔧 Recriando editor para treino ${workoutIndex}`);
    
    const workoutEditor = document.getElementById('workoutEditor');
    if (!workoutEditor) {
        console.error('❌ workoutEditor não encontrado');
        return;
    }
    
    const workout = this.currentPlan.treinos[workoutIndex];
    if (!workout) return;
    
    // Recriar apenas este treino
    const workoutHTML = `
        <div class="workout-editor">
            <div class="workout-header">
                <h3 class="workout-title">${workout.nome}</h3>
                <button class="btn btn-primary btn-small" onclick="app.addExercise(${workoutIndex})">
                    ➕ Adicionar Exercício
                </button>
            </div>
            <div class="exercise-list" id="exerciseList${workoutIndex}">
                ${this.renderExercises(workout.exercicios, workoutIndex)}
            </div>
        </div>
    `;
    
    // Substituir ou adicionar
    const existingWorkout = workoutEditor.querySelector(`#exerciseList${workoutIndex}`);
    if (existingWorkout) {
        existingWorkout.closest('.workout-editor').outerHTML = workoutHTML;
    } else {
        workoutEditor.insertAdjacentHTML('beforeend', workoutHTML);
    }
}


// 15. MÉTODO PARA LIMPAR TODOS OS INTERVALOS
stopAllIntervals() {
    if (this.autoSyncInterval) {
        clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = null;
    }
    
    if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
    }
    
    if (this.debugUpdateInterval) {
        clearInterval(this.debugUpdateInterval);
        this.debugUpdateInterval = null;
    }
    
    if (this.localAutoSaveInterval) {
        clearInterval(this.localAutoSaveInterval);
        this.localAutoSaveInterval = null;
    }
    
    console.log('Todos os intervalos parados');
}

// SINCRONIZAR TODAS AS OPERAÇÕES PENDENTES
async syncAllPendingOperations() {
    try {
        this.showMessage('Sincronizando operações pendentes...', 'info');
        
        let syncResults = {
            saves: 0,
            deletions: 0,
            errors: 0
        };

        // 1. SINCRONIZAR SALVAMENTOS PENDENTES
        const pendingSaves = this.savedPlans.filter(p => p.retry_firebase);
        for (const plan of pendingSaves) {
            try {
                await this.retryFirebaseSave(plan.id);
                syncResults.saves++;
            } catch (error) {
                console.error(`Erro sync save ${plan.nome}:`, error);
                syncResults.errors++;
            }
        }

        // 2. SINCRONIZAR DELEÇÕES PENDENTES
        if (this.pendingDeletions && this.pendingDeletions.length > 0) {
            for (const deletion of [...this.pendingDeletions]) {
                try {
                    await this.retryFirebaseDeletion(deletion.id);
                    syncResults.deletions++;
                } catch (error) {
                    console.error(`Erro sync deletion ${deletion.name}:`, error);
                    syncResults.errors++;
                }
            }
        }

        // RESULTADO
        if (syncResults.errors === 0) {
            if (syncResults.saves + syncResults.deletions > 0) {
                this.showMessage(
                    `Sincronização concluída: ${syncResults.saves} salvamentos, ${syncResults.deletions} deleções`,
                    'success'
                );
            } else {
                this.showMessage('Nenhuma operação pendente encontrada', 'info');
            }
        } else {
            this.showMessage(
                `Sync parcial: ${syncResults.saves + syncResults.deletions} ok, ${syncResults.errors} erros`,
                'warning'
            );
        }

    } catch (error) {
        console.error('Erro na sincronização geral:', error);
        this.showMessage('Erro na sincronização', 'error');
    }
}

// STATUS DE SINCRONIZAÇÃO
getSyncStatus() {
    const pendingSaves = this.savedPlans.filter(p => p.retry_firebase).length;
    const pendingDeletions = this.pendingDeletions ? this.pendingDeletions.length : 0;
    const totalPlans = this.savedPlans.length;
    const firebasePlans = this.savedPlans.filter(p => p.saved_in_firebase).length;
    
    return {
        totalPlans,
        firebasePlans,
        localOnlyPlans: totalPlans - firebasePlans,
        pendingSaves,
        pendingDeletions,
        isFullySynced: pendingSaves === 0 && pendingDeletions === 0,
        syncPercentage: totalPlans > 0 ? Math.round((firebasePlans / totalPlans) * 100) : 100
    };
}

// MOSTRAR STATUS DE SINCRONIZAÇÃO NA INTERFACE
updateSyncStatusDisplay() {
    const status = this.getSyncStatus();
    const statusElement = document.getElementById('syncStatus');
    
    if (statusElement) {
        let statusText = `${status.firebasePlans}/${status.totalPlans} no Firebase`;
        let statusClass = 'sync-status';
        
        if (status.isFullySynced) {
            statusClass += ' synced';
        } else if (status.pendingSaves > 0 || status.pendingDeletions > 0) {
            statusClass += ' pending';
            statusText += ` (${status.pendingSaves + status.pendingDeletions} pendentes)`;
        } else if (status.localOnlyPlans > 0) {
            statusClass += ' partial';
        }
        
        statusElement.textContent = statusText;
        statusElement.className = statusClass;
    }
}


    // =============================================
    // MÉTODOS DE INTERFACE E CONFIGURAÇÃO
    // =============================================

    setDefaultDates() {
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6);

        const startInput = document.getElementById('planStartDate');
        const endInput = document.getElementById('planEndDate');

        if (startInput) startInput.value = today.toISOString().split('T')[0];
        if (endInput) endInput.value = endDate.toISOString().split('T')[0];
    }

  // HANDLER PARA MUDANÇAS NO STORAGE (OUTRAS ABAS)
async handleStorageChange(event) {
    try {
        if (event.newValue) {
            const newPlans = JSON.parse(event.newValue);
            if (Array.isArray(newPlans) && newPlans.length > this.savedPlans.length) {
                console.log('Novos planos detectados em outra aba');
                this.savedPlans = newPlans;
                this.renderPlanList();
                this.showMessage('Dados atualizados de outra aba', 'info');
            }
        }
    } catch (error) {
        console.error('Erro ao processar mudança de storage:', error);
    }
}

// HANDLER PARA MUDANÇAS DE STATUS ONLINE/OFFLINE
async handleOnlineStatusChange(isOnline) {
    if (isOnline && this.core) {
        // Quando volta online, tentar sincronizar
        this.showMessage('Conexão restaurada - sincronizando...', 'info');
        try {
            await this.core.initializeFirebase();
            await this.syncAfterImport();
            this.showMessage('Dados sincronizados', 'success');
        } catch (error) {
            console.error('Erro na sincronização:', error);
        }
    } else {
        // Quando fica offline, criar backup
        this.createEmergencyBackup();
        this.showMessage('Modo offline - dados salvos localmente', 'warning');
    }
}

// MÉTODO PARA FORÇAR SINCRONIZAÇÃO MANUAL
async forceSyncAllPlans() {
    try {
        this.showMessage('Forçando sincronização de todos os planos...', 'info');
        
        let syncedCount = 0;
        let errorCount = 0;
        
        for (const plan of this.savedPlans) {
            try {
                if (this.core && this.core.firebaseConnected) {
                    const firebaseId = await this.core.savePlanToFirebase(plan);
                    plan.id = firebaseId;
                    plan.synced_to_firebase = true;
                    syncedCount++;
                } else {
                    throw new Error('Firebase não conectado');
                }
            } catch (error) {
                console.error(`Erro ao sincronizar ${plan.nome}:`, error);
                errorCount++;
            }
        }
        
        // Salvar atualizações
        this.savePlansToStorage();
        
        if (errorCount === 0) {
            this.showMessage(`${syncedCount} planos sincronizados com sucesso`, 'success');
        } else {
            this.showMessage(`${syncedCount} sincronizados, ${errorCount} com erro`, 'warning');
        }
        
    } catch (error) {
        console.error('Erro na sincronização forçada:', error);
        this.showMessage('Erro na sincronização', 'error');
    }
}


// CORREÇÃO 1: Modificar populateGroupFilter para ser defensivo
populateGroupFilter() {
    const groupFilter = document.getElementById('exerciseGroupFilter');
    if (!groupFilter) {
        console.log('ℹ️ exerciseGroupFilter não disponível no momento');
        return; // Sair silenciosamente sem erro
    }

    // Salvar valor atual
    const currentValue = groupFilter.value;

    // Limpar opções (exceto "todos")
    groupFilter.innerHTML = '<option value="todos">📋 Todos os Grupos</option>';

    try {
        // Resto do código original permanece igual...
        if (!this.core) {
            console.warn('⚠️ Core não disponível, usando grupos padrão');
            this.populateDefaultGroups(groupFilter);
            return;
        }

        if (!this.core.exerciseDatabaseLoaded || !this.core.exerciseDatabase) {
            console.warn('⚠️ Base de exercícios não carregada, usando grupos padrão');
            this.populateDefaultGroups(groupFilter);
            return;
        }

        // Continuar com o código original...
        const groups = this.getExerciseGroupsFromDatabase();
        
        if (!groups || groups.length === 0) {
            console.warn('⚠️ Nenhum grupo encontrado, usando grupos padrão');
            this.populateDefaultGroups(groupFilter);
            return;
        }

        groups.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.toLowerCase();
            option.textContent = `💪 ${this.capitalizeGroup(grupo)}`;
            groupFilter.appendChild(option);
        });

        console.log(`✅ ${groups.length} grupos adicionados ao filtro`);

    } catch (error) {
        console.error('❌ Erro ao popular grupos:', error);
        this.populateDefaultGroups(groupFilter);
    }

    // Restaurar valor se ainda existe
    if (currentValue && currentValue !== '') {
        const optionExists = Array.from(groupFilter.options).some(opt => opt.value === currentValue);
        if (optionExists) {
            groupFilter.value = currentValue;
        }
    }
}



// MÉTODO AUXILIAR: Obter grupos da base de exercícios de forma segura
getExerciseGroupsFromDatabase() {
    try {
        if (!this.core?.exerciseDatabase || !Array.isArray(this.core.exerciseDatabase)) {
            return null;
        }

        const groups = new Set();
        
        this.core.exerciseDatabase.forEach(exercise => {
            if (exercise && exercise.grupo) {
                groups.add(exercise.grupo);
            }
        });

        return Array.from(groups).sort();

    } catch (error) {
        console.error('❌ Erro ao extrair grupos da base:', error);
        return null;
    }
}

// MÉTODO AUXILIAR: Grupos padrão como fallback
populateDefaultGroups(groupFilter) {
    const defaultGroups = [
        'peito', 'costas', 'ombro', 'biceps', 'triceps', 
        'perna', 'gluteo', 'abdome', 'antebraco'
    ];

    defaultGroups.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.toLowerCase();
        option.textContent = `💪 ${this.capitalizeGroup(grupo)}`;
        groupFilter.appendChild(option);
    });

    console.log('✅ Grupos padrão carregados como fallback');
}

// MÉTODO AUXILIAR: Capitalizar nome do grupo de forma segura
capitalizeGroup(grupo) {
    if (!grupo || typeof grupo !== 'string') {
        return 'Grupo';
    }

    const exceptions = {
        'biceps': 'Bíceps',
        'triceps': 'Tríceps',
        'quadriceps': 'Quadríceps',
        'panturrilha': 'Panturrilha',
        'antebraco': 'Antebraço',
        'gluteo': 'Glúteo'
    };

    const lowerGroup = grupo.toLowerCase();
    return exceptions[lowerGroup] || 
           grupo.charAt(0).toUpperCase() + grupo.slice(1).toLowerCase();
}


// MÉTODO AUXILIAR: Fallback quando core não está disponível

    filterExercisesByGroup() {
        const groupFilter = document.getElementById('exerciseGroupFilter');
        const selectedGroup = groupFilter ? groupFilter.value : 'todos';
        this.populateExerciseSelect(selectedGroup);
    }

    updateExerciseDescription() {
        const exerciseSelect = document.getElementById('exerciseName');
        const customGroup = document.getElementById('customExerciseGroup');
        const descriptionTextarea = document.getElementById('exerciseDescription');
        const gifGroup = document.getElementById('exerciseGifGroup');
        const gifElement = document.getElementById('exerciseGif');
        const gifError = document.getElementById('exerciseGifError');

        if (!exerciseSelect || !customGroup || !descriptionTextarea) return;

        if (exerciseSelect.value === 'custom') {
            customGroup.style.display = 'block';
            descriptionTextarea.value = '';
            
            if (gifGroup) {
                gifGroup.style.display = 'none';
            }
        } else {
            customGroup.style.display = 'none';

            // Usar core para buscar descrição
            const exercise = this.findExerciseByName(exerciseSelect.value);
            const descricao = exercise?.descricao || 'Descrição não disponível';

            descriptionTextarea.value = descricao.charAt(0).toUpperCase() + descricao.slice(1).toLowerCase();
            
            // Buscar e exibir GIF via core
            this.loadExerciseGif(exerciseSelect.value, gifGroup, gifElement, gifError);
        }
    }

    loadExerciseGif(exerciseName, gifGroup, gifElement, gifError) {
        if (!gifGroup || !gifElement || !gifError) return;

        // Usar core para buscar GIF
        const gifPath = this.getExerciseGif(exerciseName);
        
        if (gifPath && gifPath.trim() !== '') {
            gifError.style.display = 'none';
            gifElement.style.display = 'block';
            
            gifElement.src = gifPath;
            gifElement.alt = `Demonstração: ${exerciseName}`;
            
            gifElement.onerror = () => {
                console.warn(`⚠️ Erro ao carregar GIF: ${gifPath}`);
                gifElement.style.display = 'none';
                gifError.style.display = 'block';
                gifError.textContent = `GIF não encontrado: ${exerciseName}`;
            };
            
            gifElement.onload = () => {
                console.log(`✅ GIF carregado: ${exerciseName}`);
            };
            
            gifGroup.style.display = 'block';
            
        } else {
            gifElement.style.display = 'none';
            gifError.style.display = 'block';
            gifError.textContent = 'GIF não disponível para este exercício';
            gifGroup.style.display = 'block';
        }
    }

    showPlanCreator(planId = null) {
        document.getElementById('planCreator').style.display = 'block';
        document.getElementById('aiPlanCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
        document.getElementById('planDetails').style.display = 'none';
    
        if (planId) {
            this.loadPlanForEditing(planId);
        } else {
            this.resetPlanForm();
        }
        
        // CORREÇÃO: Aguardar mais tempo e verificar se elementos existem

    }


    showAIPlanCreator() {
        document.getElementById('aiPlanCreator').style.display = 'block';
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
        document.getElementById('planDetails').style.display = 'none';
    }

 
    
    // ADICIONAR ESTE MÉTODO na classe:
syncDataFromCore() {
    if (this.core.JSFitCore && this.core.JSFitCore.getUserPlans) {
        this.savedPlans = this.core.JSFitCore.getUserPlans();
        console.log('🔄 Dados sincronizados do JSFitCore:', this.savedPlans?.length || 0);
        return true;
    }
    return false;
}


    backToPlanList() {
        this.showPlanList();
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
        this.closeInlineEditor();
    }


        // Função para atualizar indicadores visuais
        updatePlanConfigIndicators() {
            const hasConfig = Object.keys(this.planTypeConfiguration.configuration).length > 0;
            const days = this.planTypeConfiguration.days;
    
            // Atualizar botão de configuração avançada
            const advancedBtn = document.getElementById('advancedConfigBtn');
            const statusElement = document.getElementById('planConfigStatus');
    
            if (hasConfig && advancedBtn && statusElement) {
                advancedBtn.style.display = 'inline-flex';
                statusElement.innerHTML = '<span>✅ Configuração personalizada ativa</span>';
                statusElement.className = 'form-hint success';
    
                // Mostrar indicador no botão ativo
                const buttons = document.querySelectorAll('.plan-type-btn');
                buttons.forEach((btn, index) => {
                    const indicator = btn.querySelector('.plan-configured-indicator');
                    if (indicator) {
                        indicator.style.display = (index + 1) === days ? 'flex' : 'none';
                    }
                });
            } else if (statusElement) {
                statusElement.innerHTML = '<span>💡 Clique em um tipo de plano para configurar os grupos musculares</span>';
                statusElement.className = 'form-hint';
    
                if (advancedBtn) {
                    advancedBtn.style.display = 'none';
                }
            }
        }

        closeInlineQuickConfig() {
            const configSection = document.getElementById('inlineQuickConfig');
            if (configSection) {
                configSection.style.display = 'none';
            }
        }

            // Gerar foco do treino baseado nos grupos
    generateWorkoutFocusFromGroups(groups) {
        if (groups.length === 0) return 'Treino geral';

        const groupNames = groups.map(groupId => {
            const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
            return group ? group.name : groupId;
        });

        if (groupNames.length === 1) {
            return `Foco: ${groupNames[0]}`;
        } else if (groupNames.length <= 3) {
            return `Foco: ${groupNames.join(', ')}`;
        } else {
            return `Foco: ${groupNames.slice(0, 2).join(', ')} e mais ${groupNames.length - 2} grupos`;
        }
    }


    setDefaultValues(currentExercise, configuredGroups) {
        // Definir grupo padrão como 'contextual' (mostra todos os grupos do treino)
        const groupFilter = document.getElementById('exerciseGroupFilter');
        if (groupFilter) {
            groupFilter.value = 'contextual';
        }

        // Aguardar um pouco e definir o nome do exercício
        setTimeout(() => {
            this.setDefaultExerciseName(currentExercise);
        }, 150);
    }

    
    populateContextualGroupFilter(configuredGroups, workout) {
        const groupFilter = document.getElementById('exerciseGroupFilter');
        if (!groupFilter) return;

        console.log(`🎯 Populando filtro contextual com ${configuredGroups.length} grupos`);

        groupFilter.innerHTML = '';

        // Opção para todos os grupos do treino
        const allOption = document.createElement('option');
        allOption.value = 'contextual';
        allOption.textContent = `🏋️ Todos os grupos do treino ${workout.id}`;
        groupFilter.appendChild(allOption);

        // Grupos configurados
        configuredGroups.forEach(groupId => {
            const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
            if (group) {
                const option = document.createElement('option');
                option.value = group.id.toLowerCase();
                option.textContent = `${group.icon} ${group.name}`;
                groupFilter.appendChild(option);
            }
        });

        // Separador
        const separatorOption = document.createElement('option');
        separatorOption.disabled = true;
        separatorOption.textContent = '─────────────────';
        groupFilter.appendChild(separatorOption);

        // Ver todos
        const allGroupsOption = document.createElement('option');
        allGroupsOption.value = 'todos';
        allGroupsOption.textContent = '📋 Ver todos os grupos disponíveis';
        groupFilter.appendChild(allGroupsOption);

        groupFilter.value = 'contextual';
        this.showContextualFilterInfo(workout, configuredGroups);
    }
    

    // =============================================
    // MÉTODOS BÁSICOS DE EXERCÍCIOS E TREINOS
    // =============================================

    generateWorkoutEditor(days) {
        const editor = document.getElementById('workoutEditor');
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const workoutNames = {
            1: ['A - Corpo Inteiro'],
            2: ['A - Membros Superiores', 'B - Membros Inferiores'],
            3: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Pernas e Ombros'],
            4: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Ombros', 'D - Pernas'],
            5: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Ombros e Trapézio', 'D - Pernas (Quadríceps)', 'E - Posterior e Core'],
            6: ['A - Peito', 'B - Costas', 'C - Ombros', 'D - Braços', 'E - Pernas (Quadríceps)', 'F - Posterior e Core']
        };

        let html = '<div class="form-section"><h2>🏋️ Treinos</h2>';

        this.currentPlan.treinos = [];

        for (let i = 0; i < days; i++) {
            const workout = {
                id: letters[i],
                nome: workoutNames[days][i],
                foco: workoutNames[days][i].split(' - ')[1] || 'Treino geral',
                exercicios: [
                    {
                        id: i * 10 + 1,
                        nome: 'Aquecimento',
                        descricao: 'Aquecimento geral de 5-10 minutos',
                        series: 1,
                        repeticoes: '8-10 min',
                        carga: 'Leve',
                        descanso: '0',
                        observacoesEspeciais: '',
                        tecnica: '',
                        concluido: false
                    }
                ],
                concluido: false,
                execucoes: 0
            };

            this.currentPlan.treinos.push(workout);

            html += `
                <div class="workout-editor">
                    <div class="workout-header">
                        <h3 class="workout-title">${workout.nome}</h3>
                        <button class="btn btn-primary btn-small" onclick="app.addExercise(${i})">
                            ➕ Adicionar Exercício
                        </button>
                    </div>
                    <div class="exercise-list" id="exerciseList${i}">
                        ${this.renderExercises(workout.exercicios, i)}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        editor.innerHTML = html;
    }



    // Corrigir getLocalStorageKey() para ser mais específico:
getLocalStorageKey() {
    if (!this.currentUserId) {
        console.error('❌ Tentativa de gerar chave sem usuário autenticado');
        return null;
    }
    return `jsfitapp_plans_${this.currentUserId}`;
}


//cORREÇÃO 2: Novo método para forçar carregamento de todas as fontes
async forceLoadPlansFromAllSources() {
    console.log('🔍 Forçando carregamento de planos de todas as fontes...');
    
    try {
        // FONTE 1: Método loadSavedPlans se existir
        if (typeof this.loadSavedPlans === 'function') {
            console.log('📥 Tentativa 1: loadSavedPlans()');
            await this.loadSavedPlans();
            if (this.savedPlans && this.savedPlans.length > 0) {
                console.log(`✅ Carregados via loadSavedPlans: ${this.savedPlans.length} planos`);
                return;
            }
        }
        
        // FONTE 2: Firebase direto se disponível
        if (this.core && this.core.firebaseConnected) {
            console.log('📥 Tentativa 2: Firebase direto');
            try {
                const firebasePlans = await this.core.loadPlansFromFirebase();
                if (firebasePlans && Array.isArray(firebasePlans) && firebasePlans.length > 0) {
                    this.savedPlans = firebasePlans;
                    console.log(`✅ Carregados do Firebase: ${firebasePlans.length} planos`);
                    return;
                }
            } catch (fbError) {
                console.warn('⚠️ Erro Firebase:', fbError);
            }
        }
        
        // FONTE 3: LocalStorage com chave do usuário
        if (this.currentUserId) {
            console.log('📥 Tentativa 3: localStorage do usuário');
            const userKey = `jsfitapp_plans_${this.currentUserId}`;
            const userData = localStorage.getItem(userKey);
            
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    if (parsed.plans && Array.isArray(parsed.plans)) {
                        this.savedPlans = parsed.plans;
                        console.log(`✅ Carregados do localStorage usuário: ${this.savedPlans.length} planos`);
                        return;
                    }
                } catch (parseError) {
                    console.warn('⚠️ Erro ao parsear dados do usuário:', parseError);
                }
            }
        }
        
        // FONTE 4: LocalStorage geral (fallback)
        console.log('📥 Tentativa 4: localStorage geral');
        const generalData = localStorage.getItem('jsfitapp_plans');
        if (generalData) {
            try {
                const parsed = JSON.parse(generalData);
                if (Array.isArray(parsed)) {
                    this.savedPlans = parsed;
                    console.log(`✅ Carregados do localStorage geral: ${this.savedPlans.length} planos`);
                    return;
                }
            } catch (parseError) {
                console.warn('⚠️ Erro ao parsear dados gerais:', parseError);
            }
        }
        
        // FONTE 5: Procurar em todas as chaves do localStorage
        console.log('📥 Tentativa 5: Busca em todas as chaves');
        const allKeys = Object.keys(localStorage).filter(key => key.includes('jsfit') || key.includes('plans'));
        
        for (const key of allKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    
                    // Verificar se é array de planos
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.savedPlans = parsed;
                        console.log(`✅ Encontrados em ${key}: ${parsed.length} planos`);
                        return;
                    }
                    
                    // Verificar se tem propriedade plans
                    if (parsed.plans && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
                        this.savedPlans = parsed.plans;
                        console.log(`✅ Encontrados em ${key}.plans: ${parsed.plans.length} planos`);
                        return;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao processar ${key}:`, error);
            }
        }
        
        console.log('ℹ️ Nenhum plano encontrado em qualquer fonte');
        this.savedPlans = [];
        
    } catch (error) {
        console.error('❌ Erro no carregamento forçado:', error);
        this.savedPlans = [];
    }
}

// CORREÇÃO 3: Modificar renderPlanList para ser mais defensivo
renderPlanList() {
    console.log('🎨 Renderizando lista de planos...');
    
    const container = document.getElementById('planListContent');
    if (!container) {
        console.error('❌ Container planListContent não encontrado');
        return;
    }
    
    // VALIDAÇÕES DEFENSIVAS CRÍTICAS
    if (!this.savedPlans) {
        console.warn('⚠️ savedPlans é null, inicializando como array vazio');
        this.savedPlans = [];
    }
    
    if (!Array.isArray(this.savedPlans)) {
        console.warn('⚠️ savedPlans não é um array, convertendo:', typeof this.savedPlans);
        this.savedPlans = [];
    }
    
    console.log(`📊 Renderizando ${this.savedPlans.length} planos`);
    
    // CASO LISTA VAZIA
    if (this.savedPlans.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <div class="workout-icon">🏋️</div>
                </div>
                <h3 class="empty-state-title">Nenhum plano encontrado</h3>
                <p class="empty-state-description">
                    Crie seu primeiro plano de treino personalizado!
                </p>
                <div class="empty-state-actions">
                    <button class="btn btn-primary btn-large" onclick="app.showAIPlanCreator()">
                        🤖 Criar com IA
                    </button>
                    <button class="btn btn-secondary btn-large" onclick="app.showPlanCreator()">
                        ✏️ Criar Manualmente
                    </button>
                </div>
                <div class="debug-info" style="margin-top: 20px; font-size: 12px; color: #666;">
                    <details>
                        <summary>Informações de Debug</summary>
                        <p>savedPlans.length: ${this.savedPlans ? this.savedPlans.length : 'undefined'}</p>
                        <p>currentUserId: ${this.currentUserId || 'null'}</p>
                        <p>isUserAuthenticated: ${this.isUserAuthenticated || false}</p>
                        <p>localStorage keys: ${Object.keys(localStorage).filter(k => k.includes('jsfit')).length}</p>
                        <button onclick="app.debugDataState()" class="btn btn-sm" style="margin-top: 5px;">
                            Debug Completo
                        </button>
                    </details>
                </div>
            </div>
        `;
        return;
    }
    
    // RENDERIZAR PLANOS EXISTENTES
    try {
        const validPlans = this.savedPlans.filter(plan => {
            if (!plan) {
                console.warn('⚠️ Plano nulo encontrado');
                return false;
            }
            if (!plan.id) {
                console.warn('⚠️ Plano sem ID:', plan.nome || 'Nome indefinido');
                // Não remover, apenas avisar
                return true;
            }
            return true;
        });
        
        if (validPlans.length !== this.savedPlans.length) {
            console.log(`🧹 ${this.savedPlans.length - validPlans.length} planos inválidos encontrados (mantidos para debug)`);
        }
        
        // Gerar HTML dos planos
        const plansHTML = validPlans.map(plan => this.renderSinglePlan(plan)).join('');
        
        // Header da lista
        const headerHTML = `
            <div class="plan-list-header">
                <div class="plan-list-title">
                    <h2>Seus Planos de Treino</h2>
                    <span class="plan-count">${validPlans.length} plano${validPlans.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="plan-list-actions">
                    <button class="btn btn-primary btn-small" onclick="app.showAIPlanCreator()">
                        🤖 Novo com IA
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="app.showPlanCreator()">
                        ✏️ Novo Manual
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = '<div class="plan-list-grid">'  + plansHTML + headerHTML + '</div>';
        
        console.log(`✅ ${validPlans.length} planos renderizados com sucesso`);
        
    } catch (renderError) {
        console.error('❌ Erro ao renderizar planos:', renderError);
        
        // Fallback com informações de debug
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar planos</h3>
                <p>Dados encontrados mas houve erro na renderização.</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="app.forceLoadPlansFromAllSources().then(() => app.renderPlanList())">
                        🔄 Tentar Recarregar
                    </button>
                    <button class="btn btn-secondary" onclick="app.debugDataState()">
                        🔧 Debug Completo
                    </button>
                </div>
                <details class="error-details" style="margin-top: 15px;">
                    <summary>Detalhes do Erro</summary>
                    <code>${renderError.message}</code>
                    <br><br>
                    <small>savedPlans: ${this.savedPlans ? this.savedPlans.length : 'undefined'} itens</small>
                </details>
            </div>
        `;
    }
}

// CORREÇÃO 4: Método para verificar estado dos dados
debugDataState() {
    console.log('🔬 === DIAGNÓSTICO DETALHADO ===');
    
    // Estado da aplicação
    console.log('📊 Estado da Aplicação:');
    console.log('- this.savedPlans:', this.savedPlans);
    console.log('- this.savedPlans.length:', this.savedPlans?.length);
    console.log('- this.isUserAuthenticated:', this.isUserAuthenticated);
    console.log('- this.currentUserId:', this.currentUserId);
    
    // localStorage
    const allKeys = Object.keys(localStorage);
    const jsfitKeys = allKeys.filter(key => key.includes('jsfit'));
    console.log('💾 LocalStorage:');
    console.log('- Todas as chaves:', allKeys);
    console.log('- Chaves JSFit:', jsfitKeys);
    
    jsfitKeys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`- ${key}:`, {
                    length: data.length,
                    type: typeof parsed,
                    isArray: Array.isArray(parsed),
                    plansCount: parsed.plans ? parsed.plans.length : 'N/A'
                });
            }
        } catch (e) {
            console.log(`- ${key}: ERRO ao parsear`);
        }
    });
    
    // Core e Firebase
    console.log('🔥 Firebase/Core:');
    console.log('- this.core exists:', !!this.core);
    console.log('- this.core.firebaseConnected:', this.core?.firebaseConnected);
    console.log('- window.db:', !!window.db);
    
    // Tentativa de recuperação
    console.log('🚨 === TENTANDO RECUPERAÇÃO AUTOMÁTICA ===');
    this.forceLoadPlansFromAllSources().then(() => {
        console.log('✅ Recuperação concluída');
        console.log('📊 Novo estado - savedPlans:', this.savedPlans?.length);
        this.renderPlanList();
    });
}

// CORREÇÃO 5: Adicionar este método de inicialização mais robusta
async initializeWithRecovery() {
    try {
        console.log('🚀 Inicialização com recuperação...');
        
        // Garantir estruturas básicas
        this.savedPlans = this.savedPlans || [];
        
        // Tentar carregar dados imediatamente
        await this.forceLoadPlansFromAllSources();
        
        // Configurar interface
        this.setDefaultDates();
        this.setupEventListeners();
        
        // Mostrar lista
        this.showPlanList();
        
        console.log('✅ Inicialização com recuperação concluída');
        
    } catch (error) {
        console.error('❌ Erro na inicialização com recuperação:', error);
    }
}

// =============================================
// MÉTODO AUXILIAR: renderSinglePlan
// =============================================
renderSinglePlan(plan, coreExists = true) {
    // Verificações de segurança para dados do plano
    const planName = this.sanitizeText(plan.nome) || 'Plano sem nome';
    const studentName = this.sanitizeText(plan.aluno?.nome) || 'Não informado';
    const objective = this.sanitizeText(plan.perfil?.objetivo) || 'Não especificado';
    const days = parseInt(plan.dias) || 1;
    
    // Formatação segura de datas
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Não definido';
        
        if (coreExists && window.Core.formatDate) {
            try {
                return window.Core.formatDate(dateStr);
            } catch (formatError) {
                console.warn('Erro na formatação de data:', formatError);
            }
        }
        
        // Fallback manual
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
        } catch (dateError) {
            return dateStr; // Retornar string original se falhar
        }
    };
    
    const startDate = formatDate(plan.dataInicio);
    const endDate = formatDate(plan.dataFim);
    
    // Informações de sincronização
    const getSyncStatus = () => {
        if (plan.saved_in_firebase) {
            return '<span class="sync-status synced" title="Sincronizado com Firebase">☁️</span>';
        } else if (plan.retry_firebase) {
            return '<span class="sync-status pending" title="Aguardando sincronização">⏳</span>';
        } else if (plan.saved_in_localstorage_only) {
            return '<span class="sync-status local" title="Salvo apenas localmente">💾</span>';
        }
        return '';
    };
    
    // Status de compartilhamento
    const shareSection = plan.shareId ? `
        <div class="share-status">
            <span class="share-badge">🔗 ID: ${plan.shareId}</span>
            <small>Compartilhado e disponível para importação</small>
        </div>
    ` : '';
    
    // Botões de ação com base no status
    const getActionButtons = () => {
        let buttons = `
            <button class="btn btn-primary btn-small" onclick="app.viewPlan('${plan.id}')" title="Visualizar plano">
                👁️ Visualizar
            </button>
            <button class="btn btn-secondary btn-small" onclick="app.editPlan('${plan.id}')" title="Editar plano">
                ✏️ Editar
            </button>
        `;
        
        if (plan.shareId) {
            buttons += `
                <button class="btn btn-success btn-small" onclick="app.copyShareId('${plan.shareId}')" title="Copiar ID de compartilhamento">
                    📋 Copiar ID
                </button>
                <button class="btn btn-warning btn-small" onclick="app.stopSharing('${plan.id}')" title="Parar compartilhamento">
                    🔒 Parar Compartilhar
                </button>
            `;
        } else {
            buttons += `
                <button class="btn btn-success btn-small" onclick="app.sharePlan('${plan.id}')" title="Compartilhar plano">
                    🔗 Compartilhar
                </button>
            `;
        }
        
        buttons += `
            <button class="btn btn-danger btn-small" onclick="app.deletePlan('${plan.id}')" title="Excluir plano">
                🗑️ Excluir
            </button>
        `;
        
        return buttons;
    };
    
    // Informações adicionais
    const additionalInfo = [];
    if (plan.aluno?.idade) {
        additionalInfo.push(`${plan.aluno.idade} anos`);
    }
    if (plan.aluno?.altura) {
        additionalInfo.push(plan.aluno.altura);
    }
    if (plan.aluno?.peso) {
        additionalInfo.push(plan.aluno.peso);
    }
    
    const personalInfo = additionalInfo.length > 0 ? 
        `<p class="plan-personal-info"><strong>Perfil:</strong> ${additionalInfo.join(' • ')}</p>` : '';
    
    // Template do plano
    return `
        <div class="plan-card" data-plan-id="${plan.id}">
            <div class="plan-card-header">
                <div class="plan-title-section">
                    <h3 class="plan-title">${planName}</h3>
                    ${getSyncStatus()}
                </div>
                <div class="plan-meta">
                    <span class="plan-frequency">${days} dia${days !== 1 ? 's' : ''}/semana</span>
                </div>
            </div>
            
            <div class="plan-card-body">
                <div class="plan-info-grid">
                    <div class="plan-info-item">
                        <span class="plan-info-label">Aluno:</span>
                        <span class="plan-info-value">${studentName}</span>
                    </div>
                    <div class="plan-info-item">
                        <span class="plan-info-label">Período:</span>
                        <span class="plan-info-value">${startDate} até ${endDate}</span>
                    </div>
                    <div class="plan-info-item">
                        <span class="plan-info-label">Objetivo:</span>
                        <span class="plan-info-value">${objective}</span>
                    </div>
                </div>
                
                ${personalInfo}
                ${shareSection}
                
                ${plan.treinos && plan.treinos.length > 0 ? `
                    <div class="plan-workouts-preview">
                        <small class="workouts-count">
                            ${plan.treinos.length} treino${plan.treinos.length !== 1 ? 's' : ''} configurado${plan.treinos.length !== 1 ? 's' : ''}
                        </small>
                    </div>
                ` : ''}
            </div>
            
            <div class="plan-card-actions">
                ${getActionButtons()}
            </div>
        </div>
    `;
}

// =============================================
// MÉTODO AUXILIAR: sanitizeText (se não existir)
// =============================================
sanitizeText(text) {
    if (text === null || text === undefined) {
        return '';
    }
    
    // Converter para string e limpar
    const str = String(text).trim();
    
    // Escapar caracteres HTML para prevenir XSS
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}



// 4. Gerar ID de compartilhamento de 6 caracteres
generateShareId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


async saveSharedPlanToFirebase(shareId, planData) {
    try {
        console.log('💾 Iniciando salvamento do plano compartilhado...');
        console.log('Share ID:', shareId);
        console.log('Plan Data:', planData?.nome || 'Nome não disponível');

        // DIAGNÓSTICO COMPLETO DO FIREBASE
        console.log('🔍 DIAGNÓSTICO FIREBASE:');
        console.log('- this.core existe:', !!this.core);
        console.log('- this.core.firebaseConnected:', this.core?.firebaseConnected);
        console.log('- window.db existe:', !!window.db);
        console.log('- window.firebaseApp existe:', !!window.firebaseApp);
        console.log('- window.firebaseAuth existe:', !!window.firebaseAuth);

        // BUSCAR CORE SE NECESSÁRIO
        let coreInstance = this.core;
        if (!coreInstance) {
            console.log('Core não encontrado, buscando...');
            coreInstance = this.findCoreInstance();
            if (coreInstance) {
                this.core = coreInstance;
                console.log('Core encontrado e atualizado');
            }
        }

        // VERIFICAÇÕES DE PRÉ-REQUISITOS
        if (!shareId || typeof shareId !== 'string' || shareId.length !== 6) {
            throw new Error('Share ID inválido');
        }

        if (!planData || !planData.nome) {
            throw new Error('Dados do plano inválidos');
        }

        // VERIFICAÇÃO DE FIREBASE MÚLTIPLA
        let firebaseReady = false;

        // Método 1: Via core
        if (coreInstance && coreInstance.firebaseConnected) {
            firebaseReady = true;
            console.log('Firebase disponível via core');
        }
        // Método 2: Via globals do Firebase
        else if (window.db && window.firebaseApp) {
            firebaseReady = true;
            console.log('Firebase disponível via window globals');
        }
        // Método 3: Tentar inicializar se core existe
        else if (coreInstance && typeof coreInstance.initializeFirebase === 'function') {
            console.log('Tentando inicializar Firebase...');
            try {
                await coreInstance.initializeFirebase();
                if (coreInstance.firebaseConnected) {
                    firebaseReady = true;
                    console.log('Firebase inicializado com sucesso');
                }
            } catch (initError) {
                console.error('Falha na inicialização:', initError);
            }
        }

        if (!firebaseReady) {
            throw new Error('Firebase não está disponível ou conectado');
        }

        // IMPORTAR FUNÇÕES DO FIRESTORE
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        if (!doc || !setDoc) {
            throw new Error('Funções do Firestore não puderam ser importadas');
        }

        // PREPARAR DADOS DO COMPARTILHAMENTO
        const shareData = {
            shareId: shareId,
            planData: planData,
            createdAt: new Date(),
            isActive: true,
            expiresAt: this.getDefaultExpirationDate(),
            accessCount: 0,
            lastAccessedAt: null,
            createdBy: this.currentUserId,
            createdByEmail: this.userEmail,
            version: '1.0',
            platform: 'web'
        };

        console.log('📝 Dados preparados para salvamento:', {
            shareId: shareData.shareId,
            planName: shareData.planData.nome,
            createdBy: shareData.createdBy,
            expiresAt: shareData.expiresAt
        });

        // SALVAR NO FIREBASE
        console.log('🔥 Salvando no Firebase...');
        const shareRef = doc(window.db, 'shared_plans', shareId);
        
        await setDoc(shareRef, shareData);

        console.log('✅ Plano compartilhado salvo no Firebase com sucesso');
        console.log('- Collection: shared_plans');
        console.log('- Document ID:', shareId);
        console.log('- Plan Name:', planData.nome);

        return shareId;

    } catch (error) {
        console.error('❌ ERRO DETALHADO no saveSharedPlanToFirebase:');
        console.error('- Tipo do erro:', error.constructor.name);
        console.error('- Mensagem:', error.message);
        console.error('- Stack:', error.stack);
        console.error('- Código Firebase:', error.code);
        
        // LOG DO CONTEXTO DO ERRO
        console.error('- Contexto:');
        console.error('  * shareId:', shareId);
        console.error('  * planData existe:', !!planData);
        console.error('  * planData.nome:', planData?.nome);
        console.error('  * currentUserId:', this.currentUserId);
        console.error('  * userEmail:', this.userEmail);
        console.error('  * window.db:', !!window.db);

        // CATEGORIZAR E RELANÇAR ERRO COM MENSAGEM AMIGÁVEL
        let friendlyMessage;
        
        if (error.code === 'permission-denied') {
            friendlyMessage = 'Sem permissão para salvar compartilhamento. Verifique se está logado.';
        } else if (error.code === 'unavailable' || error.message.includes('offline')) {
            friendlyMessage = 'Firebase temporariamente indisponível. Tente novamente.';
        } else if (error.message.includes('Firebase não está')) {
            friendlyMessage = 'Sistema de compartilhamento não está conectado. Aguarde alguns segundos e tente novamente.';
        } else if (error.message.includes('importadas')) {
            friendlyMessage = 'Erro no carregamento do sistema. Recarregue a página.';
        } else if (error.message.includes('Share ID inválido')) {
            friendlyMessage = 'Erro interno: ID de compartilhamento inválido.';
        } else {
            friendlyMessage = `Erro no compartilhamento: ${error.message}`;
        }

        throw new Error(friendlyMessage);
    }
}


// 6. Mostrar informações de compartilhamento rapidamente
showQuickShareInfo(shareId, planName) {
    // Remover notificações anteriores
    document.querySelectorAll('.share-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification share-notification';
    notification.innerHTML = `
        <div class="share-quick-info">
            <div class="share-header">
                <strong>🔗 Plano "${planName}" compartilhado!</strong>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">×</button>
            </div>
            <div class="share-id-display">
                <label>ID para o aluno:</label>
                <div class="id-copy-group">
                    <input type="text" value="${shareId}" readonly class="share-id-input">
                    <button onclick="app.copyShareId('${shareId}')" class="btn btn-small btn-primary">Copiar</button>
                </div>
            </div>
            <div class="share-instructions">
                <small>
                    📱 <strong>Instruções:</strong> Envie o ID <strong>${shareId}</strong> para seu aluno. 
                    Ele deve usar o app JS Fit Student e clicar em "Importar por ID".
                </small>
            </div>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #28a745;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto-remover após 15 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 15000);
}



// 9. Desativar plano compartilhado no Firebase
async deactivateSharedPlan(shareId) {
    try {
        await this.core.initializeFirebase();

        if (!this.core.firebaseConnected) {
            console.warn('Firebase não conectado - apenas removendo localmente');
            return;
        }

        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        const shareRef = doc(window.db, 'shared_plans', shareId);
        await updateDoc(shareRef, {
            isActive: false,
            deactivatedAt: new Date()
        });

        console.log(`Plano ${shareId} desativado no Firebase`);

    } catch (error) {
        console.warn('Erro ao desativar no Firebase:', error);
        // Não impedir a operação local se Firebase falhar
    }
}

// 10. Data de expiração padrão (30 dias)
getDefaultExpirationDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
}


// ✅ NOVA FUNÇÃO: Sincronizar configuração
async syncPlanConfiguration() {
    try {
        this.showMessage('🔄 Sincronizando configuração...', 'info');
        
        const firebaseConfig = await this.loadPlanConfigFromFirebase();
        
        if (firebaseConfig) {
            this.planTypeConfiguration.days = firebaseConfig.days;
            this.planTypeConfiguration.configuration = firebaseConfig.configuration;
            
            // Atualizar localStorage também
            localStorage.setItem('jsfitapp_plan_configuration', JSON.stringify(firebaseConfig));
            
            this.showMessage('✅ Configuração sincronizada!', 'success');
            this.updatePlanConfigIndicators();
        }
        
    } catch (error) {
        console.error('❌ Erro ao sincronizar configuração:', error);
        this.showMessage('❌ Erro ao sincronizar configuração', 'error');
    }
}

    // Abrir modal de configuração de tipos de plano
    showPlanTypeConfiguration() {
        this.showPlanTypeConfigModal();
    }

    // Mostrar modal de configuração (substitui o selectPlanType original)
    selectPlanType(days, letters, element) {
        // Validar se o número de dias é suportado
        if (days < 1 || days > 6) {
            console.error(`Número de dias inválido: ${days}`);
            this.showMessage('Tipo de plano não suportado', 'error');
            return;
        }
    
        // Verificar se o elemento está desabilitado
        if (element.classList.contains('disabled')) {
            console.warn(`Tipo de plano ${days} dias está desabilitado`);
            this.showMessage('Este tipo de plano não está disponível', 'warning');
            return;
        }
    
        // Aplicar configuração padrão se não existe configuração personalizada
        if (!this.planTypeConfiguration.configuration[Object.keys(this.planTypeConfiguration.presetConfigurations[days])[0]]) {
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[days];
            this.planTypeConfiguration.days = days;
        }
    
        console.log(`Selecionado plano de ${days} dias`);
        this.selectedDays = days;
        
        // Remover classe active de todos os botões
        document.querySelectorAll('.plan-type-btn').forEach(btn => btn.classList.remove('active'));
        
        // Adicionar classe active ao botão selecionado
        element.classList.add('active');
        
        // Gerar editor de treinos
        this.generateWorkoutEditor(days);
        
        // Atualizar indicadores visuais
        this.updatePlanConfigIndicators();
    }

    showInlineQuickConfig() {
        const configSection = document.getElementById('inlineQuickConfig');
        const content = document.getElementById('inlineQuickConfigContent');
        
        if (!configSection || !content) {
            console.error('Elementos de configuração inline não encontrados');
            return;
        }
        
        const days = this.selectedDays || this.planTypeConfiguration.days;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        let html = '<div class="quick-config-grid">';
        
        for (let i = 0; i < days; i++) {
            const letter = letters[i];
            const config = this.planTypeConfiguration.configuration[letter] || { 
                name: `Treino ${letter}`, 
                groups: [] 
            };
            
            html += `
                <div class="quick-config-item">
                    <h4>Treino ${letter}</h4>
                    <input type="text" 
                           class="form-input workout-name-input" 
                           placeholder="Nome do treino"
                           value="${config.name}"
                           data-letter="${letter}"
                           onchange="app.updateInlineConfigName('${letter}', this.value)"
                           style="margin-bottom: 15px;">
                    <div class="quick-muscle-groups">
                        ${this.planTypeConfiguration.muscleGroups.map(group => `
                            <label class="quick-muscle-check">
                                <input type="checkbox" 
                                       name="inline-${letter}" 
                                       value="${group.id}"
                                       ${config.groups.includes(group.id) ? 'checked' : ''}
                                       onchange="app.updateInlineConfigGroups()">
                                <span>${group.icon} ${group.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        content.innerHTML = html;
        
        // Mostrar seção com animação
        configSection.style.display = 'block';
        configSection.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Interface de configuração inline criada');
    }



    // Atualizar nome na configuração inline
    updateInlineConfigName(letter, name) {
        if (!this.planTypeConfiguration.configuration[letter]) {
            this.planTypeConfiguration.configuration[letter] = { name: '', groups: [] };
        }
        this.planTypeConfiguration.configuration[letter].name = name.trim();
        console.log(`Nome do treino ${letter} atualizado para: ${name}`);
    }


// Criar modal de configuração de tipos de plano
showPlanTypeConfigModal() {
    const existingModal = document.getElementById('planTypeConfigModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'planTypeConfigModal';
    modal.className = 'modal active';
    modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
            <h2>⚙️ Configurar Tipos de Plano</h2>
            <button class="close-btn" onclick="app.closePlanTypeConfigModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-info">
                <strong>💡 Personalizar treinos:</strong> Configure quais grupos musculares cada treino deve trabalhar. 
                Você pode escolher um ou vários grupos por treino.
            </div>
            
            <div class="plan-type-config-section">
                <h3>📅 Plano de ${this.planTypeConfiguration.days} dias</h3>
                <div id="planConfigWorkouts" class="plan-config-workouts">
                    ${this.generatePlanConfigHTML()}
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="app.savePlanTypeConfigAndGenerate()">
                ✅ Aplicar e Continuar
            </button>
            <button class="btn btn-secondary" onclick="app.loadPresetPlanConfig()">
                📋 Usar Modelo Padrão
            </button>
            <button class="btn btn-outline" onclick="app.closePlanTypeConfigModal()">
                ❌ Cancelar
            </button>
        </div>
    </div>
`;

    document.body.appendChild(modal);
}
    
    addExercise(workoutIndex) {
        const newExercise = {
            id: this.core.generateId(),
            nome: 'Novo Exercício',
            descricao: 'Descrição do exercício',
            series: 3,
            repeticoes: '10-12',
            carga: '20kg',
            descanso: '90 segundos',
            observacoesEspeciais: '',
            tecnica: '',
            concluido: false
        };
    
        // Verificar se o treino existe
        if (!this.currentPlan.treinos[workoutIndex]) {
            console.error(`Treino ${workoutIndex} não encontrado`);
            return;
        }
    
        // Adicionar exercício ao treino
        this.currentPlan.treinos[workoutIndex].exercicios.push(newExercise);
        
        // Atualizar a lista na interface
        this.updateExerciseList(workoutIndex);
        
        // Mostrar mensagem de sucesso
        this.showMessage('Exercício adicionado com sucesso!', 'success');
        
        console.log(`Exercício adicionado ao treino ${workoutIndex}:`, newExercise);
    }


    editExercise(workoutIndex, exerciseIndex) {
        // Salvar posição atual do scroll
        this.currentScrollPosition = window.scrollY;
        
        // Fechar editor existente se houver
        this.closeInlineEditor();
        
        // Definir índices atuais PRIMEIRO (propriedades da classe)
        this.currentWorkoutIndex = workoutIndex;
        this.currentExerciseIndex = exerciseIndex;
    
        // Verificar se exercício existe usando os índices
        if (!this.currentPlan.treinos[this.currentWorkoutIndex] || 
            !this.currentPlan.treinos[this.currentWorkoutIndex].exercicios[this.currentExerciseIndex]) {
            this.showMessage('Exercício não encontrado', 'error');
            return;
        }
    
        // Obter dados usando os índices salvos
        const exercise = this.currentPlan.treinos[this.currentWorkoutIndex].exercicios[this.currentExerciseIndex];
        const workout = this.currentPlan.treinos[this.currentWorkoutIndex];
    
        // Criar e mostrar editor fullscreen
        this.createFullscreenEditor(exercise, this.currentWorkoutIndex, workout);
        
        // Popular dados após inserir no DOM usando os índices salvos na classe
        setTimeout(() => {
            // Buscar dados novamente usando as propriedades da classe para evitar problemas de escopo
            const currentExercise = this.currentPlan.treinos[this.currentWorkoutIndex].exercicios[this.currentExerciseIndex];
            const currentWorkout = this.currentPlan.treinos[this.currentWorkoutIndex];
            
            // Verificação adicional de segurança
            if (!currentExercise || !currentWorkout) {
                console.error('Erro: dados do exercício não encontrados no setTimeout');
                this.showMessage('Erro ao carregar dados do exercício', 'error');
                return;
            }
            
            this.populateInlineEditor(currentExercise, this.currentWorkoutIndex, currentWorkout);
        }, 100);
        
        console.log(`Editando exercício: ${exercise.nome} (Treino ${workout.id})`);
    }


    createFullscreenEditor(exercise, workoutIndex, workout) {
        // Criar HTML do editor
        const editorHTML = this.createInlineEditorHTML(exercise);
        
        // Criar container fullscreen
        const editorContainer = document.createElement('div');
        editorContainer.innerHTML = editorHTML;
        
        // Buscar o editor criado e adicionar classe fullscreen
        const editor = editorContainer.querySelector('.exercise-inline-editor');
        editor.classList.add('fullscreen-mode');
        
        // Adicionar ao body
        document.body.appendChild(editor);
        
        // Adicionar classe ao body para ocultar outros elementos
        document.body.classList.add('editor-fullscreen');
        
        // Popular dados após inserir no DOM
        setTimeout(() => {
            this.populateInlineEditor(exercise, workoutIndex, workout);
        }, 100);
    }
    
    createInlineEditorHTML(exercise) {
        return `
            <div class="exercise-inline-editor" id="inlineEditor">
                <div class="inline-editor-header">
                    <h3 class="inline-editor-title">Editar Exercício</h3>
                    <button class="inline-editor-close" onclick="app.closeInlineEditor()">&times;</button>
                </div>
                <div class="inline-editor-form">
                    <div class="form-group">
                        <label class="form-label">Grupo Muscular</label>
                        <select id="exerciseGroupFilter" class="form-select" onchange="app.filterExercisesByGroup()">
                            <option value="todos">Todos os Grupos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nome do Exercício</label>
                        <select id="exerciseName" class="form-select" onchange="app.updateExerciseDescription()">
                            <option value="custom">Exercício Personalizado</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="exerciseGifGroup" style="display: none;">
                        <label class="form-label">Demonstração Visual</label>
                        <div class="exercise-gif-container">
                            <img id="exerciseGif" 
                                src="" 
                                alt="Demonstração do exercício" 
                                style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px; border: 2px solid var(--border-color);">
                            <div id="exerciseGifError" style="display: none; color: var(--text-secondary); font-size: 12px; margin-top: 5px;">
                                GIF não disponível para este exercício
                            </div>
                        </div>
                    </div>
                                    
                    <div class="form-group" id="customExerciseGroup" style="display: none;">
                        <label class="form-label">Nome Personalizado</label>
                        <input type="text" id="customExerciseName" class="form-input" placeholder="Digite o nome do exercício">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Séries</label>
                        <input type="number" id="exerciseSets" class="form-input" min="1" placeholder="3">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Repetições</label>
                        <input type="text" id="exerciseReps" class="form-input" placeholder="8-12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Carga</label>
                        <input type="text" id="exerciseWeight" class="form-input" placeholder="20kg">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descanso</label>
                        <input type="text" id="exerciseRest" class="form-input" placeholder="90 segundos">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Técnica Avançada</label>
                       <select id="exerciseTechnique" class="form-select" onchange="app.updateTechniqueDescription()">
                        <option value="">Nenhuma</option>
                        
                        <!-- Técnicas de Intensidade -->
                        <optgroup label="🔥 Técnicas de Intensidade">
                            <option value="drop-set">Drop-set <span class="category-label intensity">Intensidade</span></option>
                            <option value="strip-set">Strip-set</option>
                            <option value="rest-pause">Rest-pause</option>
                            <option value="forcadas">Repetições Forçadas</option>
                            <option value="negativas">Repetições Negativas</option>
                            <option value="cluster-set">Cluster Set</option>
                            <option value="myo-reps">Myo-reps</option>
                            <option value="dante-trudel">Dante Trudel (DC)</option>
                        </optgroup>
                        
                        <!-- Técnicas de Volume -->
                        <optgroup label="📈 Técnicas de Volume">
                            <option value="bi-set">Bi-set</option>
                            <option value="tri-set">Tri-set</option>
                            <option value="super-set-antagonista">Super-set Antagonista</option>
                            <option value="super-set-mesmo-musculo">Super-set Mesmo Músculo</option>
                            <option value="circuito">Circuito</option>
                            <option value="density-training">Treino de Densidade</option>
                            <option value="volume-loading">Volume Loading</option>
                        </optgroup>
                        
                        <!-- Técnicas de Tempo/Tensão -->
                        <optgroup label="⏱️ Técnicas de Tempo/Tensão">
                            <option value="tempo-controlado">Tempo Controlado</option>
                            <option value="pausa-contracao">Pausa na Contração</option>
                            <option value="iso-hold">Iso Hold</option>
                            <option value="static-holds">Static Holds</option>
                            <option value="pausa-stretch">Pausa no Alongamento</option>
                            <option value="pause-reps">Pause Reps</option>
                            <option value="tempo-emphasis">Ênfase Temporal</option>
                        </optgroup>
                        
                        <!-- Técnicas de Pré/Pós Fadiga -->
                        <optgroup label="🎯 Técnicas de Fadiga">
                            <option value="pre-exaustao">Pré-exaustão</option>
                            <option value="pos-exaustao">Pós-exaustão</option>
                            <option value="serie-composta">Série Composta</option>
                            <option value="serie-reversa">Série Reversa</option>
                        </optgroup>
                        
                        <!-- Técnicas Mecânicas -->
                        <optgroup label="⚙️ Técnicas Mecânicas">
                            <option value="mecanico-drop-set">Drop-set Mecânico</option>
                            <option value="parciais">Repetições Parciais</option>
                            <option value="21s">Série 21s</option>
                            <option value="range-of-motion-partials">Parciais por Amplitude</option>
                            <option value="accommodating-resistance">Resistência Acomodativa</option>
                            <option value="mechanical-advantage">Vantagem Mecânica</option>
                            <option value="eccentric-overload">Sobrecarga Excêntrica</option>
                        </optgroup>
                        
                        <!-- Técnicas de Progressão -->
                        <optgroup label="📊 Técnicas de Progressão">
                            <option value="piramide-crescente">Pirâmide Crescente</option>
                            <option value="piramide-decrescente">Pirâmide Decrescente</option>
                            <option value="piramide-dupla">Pirâmide Dupla</option>
                            <option value="ondulatorio">Ondulátório</option>
                            <option value="wave-loading">Wave Loading</option>
                            <option value="escada-ascendente">Escada Ascendente</option>
                            <option value="escada-descendente">Escada Descendente</option>
                        </optgroup>
                        
                        <!-- Técnicas Neurológicas -->
                        <optgroup label="🧠 Técnicas Neurológicas">
                            <option value="explosivas">Repetições Explosivas</option>
                            <option value="velocidade-compensatoria">Velocidade Compensatória</option>
                            <option value="contrast-loading">Contrast Loading</option>
                            <option value="post-activation-potentiation">PAP (Potencialização)</option>
                            <option value="meta-contracao">Meta Contração</option>
                        </optgroup>
                        
                        <!-- Técnicas Metabólicas -->
                        <optgroup label="💥 Técnicas Metabólicas">
                            <option value="serie-queima">Série Queima</option>
                            <option value="blood-flow-restriction">BFR (Oclusão Vascular)</option>
                            <option value="tempo-contraste">Tempo Contraste</option>
                            <option value="rest-pause-cluster">Rest-Pause Cluster</option>
                            <option value="intra-set-stretching">Alongamento Intra-série</option>
                        </optgroup>
                        
                        <!-- Técnicas Especiais -->
                        <optgroup label="✨ Técnicas Especiais">
                            <option value="antagonist-paired-sets">Séries Antagonistas Pareadas</option>
                            <option value="pre-stretch">Pré-alongamento</option>
                            <option value="mechanical-drop-set">Drop-set por Mecânica</option>
                        </optgroup>
                    </select>
                    </div>
                    <div class="form-group" id="techniqueDescriptionGroup" style="display: none;">
                        <label class="form-label">Descrição da Técnica</label>
                        <textarea id="techniqueDescription" class="form-textarea" readonly></textarea>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label">Descrição/Técnica</label>
                        <textarea id="exerciseDescription" class="form-textarea" placeholder="Instruções técnicas do exercício..."></textarea>
                    </div>
                </div>
                <div class="exercise-actions">
                    <button class="btn btn-primary" onclick="app.saveInlineExercise()">
                        Salvar
                    </button>
                    <button class="btn btn-outline" onclick="app.closeInlineEditor()">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
    }
    
    populateInlineEditor(exercise, workoutIndex, workout) {
        // Configurar filtro contextual
        this.setupContextualGroupFilter(workoutIndex, workout, exercise);
    
        // Popular campos básicos
        const setsInput = document.getElementById('exerciseSets');
        const repsInput = document.getElementById('exerciseReps');
        const weightInput = document.getElementById('exerciseWeight');
        const restInput = document.getElementById('exerciseRest');
        const descriptionTextarea = document.getElementById('exerciseDescription');
        const techniqueSelect = document.getElementById('exerciseTechnique');
        const VworkoutIndex = workoutIndex;
    
        // Definir valores dos campos
        if (setsInput) setsInput.value = exercise.series || 3;
        if (repsInput) repsInput.value = exercise.repeticoes || '10-12';
        if (weightInput) weightInput.value = exercise.carga || 'A definir';
        if (restInput) restInput.value = exercise.descanso || '90 segundos';
        if (descriptionTextarea) descriptionTextarea.value = exercise.descricao || '';
    
        // Configurar técnica avançada
        if (techniqueSelect) {
            if (exercise.tecnica && this.tecnicasDatabase[exercise.tecnica]) {
                techniqueSelect.value = exercise.tecnica;
            } else {
                techniqueSelect.value = '';
            }
            this.updateTechniqueDescription();
        }
    
        // Configurar nome do exercício com delay
        setTimeout(() => {
            this.setDefaultExerciseName(exercise);
        }, 150);
    }
    
    setupContextualGroupFilter(workoutIndex, workout, currentExercise = null) {
        console.log(`Configurando filtro contextual para treino ${workout.id}`);
    
        const configuredGroups = this.getConfiguredGroupsForWorkout(workoutIndex, workout);
    
        if (configuredGroups.length > 0) {
            setTimeout(() => {
                this.populateContextualGroupFilter(configuredGroups, workout);
                
                // CORREÇÃO: Buscar core dinamicamente se perdido
                this.ensureCoreAvailable();
                
                this.populateExerciseSelect('contextual');
    
                if (currentExercise) {
                    this.setDefaultValues(currentExercise, configuredGroups);
                }
            }, 100);
        } else {
            setTimeout(() => {
                this.populateGroupFilter();
                
                // CORREÇÃO: Buscar core dinamicamente se perdido
                this.ensureCoreAvailable();
                
                this.populateExerciseSelect('todos');
    
                if (currentExercise) {
                    this.setDefaultExerciseName(currentExercise);
                }
            }, 100);
        }
    }

// CORREÇÃO PARA O MÉTODO populateExerciseSelect
populateExerciseSelect(filterGroup = 'todos') {
    const exerciseSelect = document.getElementById('exerciseName');
    
    // CORREÇÃO CRÍTICA: Verificar se o elemento existe
    if (!exerciseSelect) {
        console.warn('⚠️ exerciseName select não encontrado - pulando população');
        return; // SAIR SILENCIOSAMENTE
    }

    console.log(`📋 Populando exercícios para grupo: ${filterGroup}`);

    // Verificar se base está carregada
    if (!this.core || !this.core.exerciseDatabaseLoaded || !this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
        console.error('❌ Base de exercícios não carregada ou vazia');
        exerciseSelect.innerHTML = '<option value="custom">✏️ Base de exercícios não disponível</option>';
        return;
    }

    console.log(`📊 Base disponível: ${this.core.exerciseDatabase.length} exercícios`);

    // Salvar valor atual
    const currentValue = exerciseSelect.value;

    // Limpar e adicionar opção custom
    exerciseSelect.innerHTML = '';
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = '✏️ Exercício Personalizado';
    exerciseSelect.appendChild(customOption);

    try {
        let exercisesToShow = [];

        if (filterGroup === 'todos' || filterGroup === 'contextual') {
            // Mostrar todos os exercícios
            exercisesToShow = [...this.core.exerciseDatabase];
        } else {
            // Filtrar por grupo específico usando os nomes EXATOS do banco
            const targetGroup = this.normalizeGroupName(filterGroup);
            console.log(`🔍 Buscando exercícios do grupo: ${targetGroup}`);
            
            exercisesToShow = this.core.exerciseDatabase.filter(exercise => {
                const exerciseGroup = this.normalizeGroupName(exercise.grupo);
                const match = exerciseGroup === targetGroup;
                
                // Debug para alguns exercícios
                if (exercisesToShow.length < 3) {
                    console.log(`🔍 ${exercise.nome}: grupo="${exercise.grupo}" normalizado="${exerciseGroup}" match=${match}`);
                }
                
                return match;
            });
        }

        console.log(`📊 Exercícios filtrados: ${exercisesToShow.length}`);

        if (exercisesToShow.length > 0) {
            // Ordenar alfabeticamente
            exercisesToShow.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            
            // Adicionar todos os exercícios encontrados
            exercisesToShow.forEach(exercise => {
                if (exercise.nome && exercise.nome.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = exercise.nome.trim();
                    option.textContent = exercise.nome.trim();
                    exerciseSelect.appendChild(option);
                }
            });
            
            console.log(`✅ ${exercisesToShow.length} exercícios do banco adicionados ao select`);
            
            // Log dos primeiros exercícios para debug
            const firstFew = exercisesToShow.slice(0, 5).map(e => e.nome).join(', ');
            console.log(`📋 Primeiros exercícios: ${firstFew}`);
        } else {
            console.warn(`⚠️ Nenhum exercício encontrado no banco para grupo: ${filterGroup}`);
            
            // Mostrar quais grupos existem no banco
            this.showAvailableGroups();
            
            // Adicionar mensagem informativa
            const noExerciseOption = document.createElement('option');
            noExerciseOption.value = '';
            noExerciseOption.textContent = `Nenhum exercício encontrado para: ${filterGroup}`;
            noExerciseOption.disabled = true;
            exerciseSelect.appendChild(noExerciseOption);
        }

        // Restaurar valor se ainda existe
        if (currentValue && currentValue !== '') {
            const optionExists = Array.from(exerciseSelect.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                exerciseSelect.value = currentValue;
                console.log(`🔄 Valor restaurado: ${currentValue}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao processar exercícios do banco:', error);
        
        // Em caso de erro, mostrar apenas a opção custom
        exerciseSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = 'custom';
        errorOption.textContent = '✏️ Erro - Use exercício personalizado';
        exerciseSelect.appendChild(errorOption);
    }
}
    
    // MÉTODO AUXILIAR: Normalizar nomes de grupos para comparação
    normalizeGroupName(groupName) {
        if (!groupName) return '';
        
        return groupName
            .toString()
            .toUpperCase()
            .trim()
            .replace(/S$/, ''); // Remove plural (OMBROS → OMBRO)
    }
    
    // MÉTODO AUXILIAR: Mostrar grupos disponíveis no banco (para debug)
    showAvailableGroups() {
        if (!this.core.exerciseDatabase) return;
        
        const uniqueGroups = [...new Set(this.core.exerciseDatabase.map(ex => ex.grupo))].sort();
        console.log('📊 Grupos disponíveis no banco:', uniqueGroups);
        
        // Contar exercícios por grupo
        const groupCounts = {};
        this.core.exerciseDatabase.forEach(ex => {
            const group = ex.grupo || 'SEM_GRUPO';
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
        
        console.log('📊 Exercícios por grupo no banco:');
        Object.entries(groupCounts).forEach(([group, count]) => {
            console.log(`  ${group}: ${count} exercícios`);
        });
    }
    
   
    


    ensureCoreAvailable() {
        // Se core não existe, tentar recuperar
        if (!this.core) {
            console.warn('🔄 Core perdido, tentando recuperar...');
            
            // Estratégia 1: Buscar em window.app
            if (window.app && window.app.core) {
                this.core = window.app.core;
                console.log('✅ Core recuperado de window.app');
                return;
            }
            
            // Estratégia 2: Buscar em window global
            if (window.core) {
                this.core = window.core;
                console.log('✅ Core recuperado de window.core');
                return;
            }
            
            // Estratégia 3: Criar novo se necessário
            if (window.JSFitCore) {
                this.core = new window.JSFitCore();
                console.log('✅ Novo core criado');
            }
        }
        
        // Verificar se base está carregada
        if (this.core && !this.core.exerciseDatabaseLoaded) {
            console.warn('⚠️ Base não carregada no core recuperado');
        }
    }

    
    
    setDefaultExerciseName(currentExercise) {
        const exerciseSelect = document.getElementById('exerciseName');
        const customGroup = document.getElementById('customExerciseGroup');
        const customInput = document.getElementById('customExerciseName');
    
        if (exerciseSelect) {
            // Verificar se exercício existe no select
            const option = Array.from(exerciseSelect.options).find(opt => opt.value === currentExercise.nome);
    
            if (option) {
                // Exercício encontrado na lista
                exerciseSelect.value = currentExercise.nome;
                customGroup.style.display = 'none';
            } else {
                // Exercício não encontrado, usar modo personalizado
                exerciseSelect.value = 'custom';
                customGroup.style.display = 'block';
                if (customInput) {
                    customInput.value = currentExercise.nome;
                }
            }
    
            // Disparar evento change para atualizar descrição
            exerciseSelect.dispatchEvent(new Event('change'));
        }
    }



saveInlineExercise() {
    console.log('🚀 DEBUG: Iniciando saveInlineExercise');
    
    // ARMAZENAR workoutIndex ANTES DE QUALQUER OPERAÇÃO
    const workoutIndex = this.currentWorkoutIndex;
    const exerciseIndex = this.currentExerciseIndex;
    
    // 1. VALIDAÇÃO ROBUSTA DOS ÍNDICES
    if (workoutIndex === null || workoutIndex === undefined || 
        exerciseIndex === null || exerciseIndex === undefined) {
        this.showMessage('Erro: exercício não identificado', 'error');
        console.error('❌ Índices inválidos:', { 
            workoutIndex: workoutIndex, 
            exerciseIndex: exerciseIndex 
        });
        return;
    }

    console.log(`🎯 Salvando exercício - Workout: ${workoutIndex}, Exercise: ${exerciseIndex}`);

    // 2. VALIDAÇÃO DA ESTRUTURA DE DADOS
    if (!this.currentPlan?.treinos?.[workoutIndex]?.exercicios?.[exerciseIndex]) {
        this.showMessage('Erro: estrutura de dados inválida', 'error');
        console.error('❌ Estrutura inválida - dados não encontrados');
        return;
    }

    // 3. COLETAR E VALIDAR DADOS DO FORMULÁRIO
    const formData = this.collectAndValidateFormData();
    if (!formData) {
        console.error('❌ Dados do formulário inválidos');
        return;
    }

    try {
        // 4. ATUALIZAR DADOS NO MODELO
        const workout = this.currentPlan.treinos[workoutIndex];
        const exercise = workout.exercicios[exerciseIndex];

        // Log antes da atualização
        console.log('🔍 DEBUG: Exercício antes:', JSON.stringify(exercise, null, 2));
        console.log('🔍 DEBUG: Novos dados:', JSON.stringify(formData, null, 2));

        // ATUALIZAÇÃO DIRETA
        Object.keys(formData).forEach(key => {
            exercise[key] = formData[key];
        });

        // Log após atualização
        console.log('✅ DEBUG: Exercício após:', JSON.stringify(exercise, null, 2));

        // 5. FECHAR EDITOR
        this.closeInlineEditor();
        
        // 6. USAR workoutIndex ARMAZENADO PARA ATUALIZAÇÃO
        console.log(`🔄 Chamando forceCompleteUIUpdate com workoutIndex: ${workoutIndex}`);
        this.forceCompleteUIUpdate(workoutIndex); // ← USAR VALOR ARMAZENADO
        
        this.clearEditingIndices(); // ← Adicionar esta linha

        this.showMessage('Exercício salvo com sucesso!', 'success');
        console.log('✅ DEBUG: Processo concluído com sucesso');

    } catch (error) {
        console.error('❌ Erro ao salvar exercício:', error);
        this.showMessage('Erro ao salvar exercício. Tente novamente.', 'error');
    }
}

// MÉTODO AUXILIAR PARA COLETAR E VALIDAR DADOS
collectAndValidateFormData() {
    const elements = {
        exerciseSelect: document.getElementById('exerciseName'),
        customInput: document.getElementById('customExerciseName'),
        setsInput: document.getElementById('exerciseSets'),
        repsInput: document.getElementById('exerciseReps'),
        weightInput: document.getElementById('exerciseWeight'),
        restInput: document.getElementById('exerciseRest'),
        descriptionTextarea: document.getElementById('exerciseDescription'),
        techniqueSelect: document.getElementById('exerciseTechnique')
    };

    // Validar elementos obrigatórios
    const requiredElements = ['exerciseSelect', 'setsInput', 'repsInput', 'weightInput', 'restInput', 'descriptionTextarea'];
    for (const elementName of requiredElements) {
        if (!elements[elementName]) {
            this.showMessage(`Erro: campo ${elementName} não encontrado`, 'error');
            return null;
        }
    }

    // Determinar nome do exercício
    let exerciseName;
    if (elements.exerciseSelect.value === 'custom') {
        if (!elements.customInput || !elements.customInput.value.trim()) {
            this.showMessage('Por favor, digite o nome do exercício personalizado', 'warning');
            elements.customInput?.focus();
            return null;
        }
        exerciseName = elements.customInput.value.trim();
    } else {
        exerciseName = elements.exerciseSelect.value;
    }

    // Validações
    if (!exerciseName) {
        this.showMessage('Nome do exercício é obrigatório', 'warning');
        return null;
    }

    const series = parseInt(elements.setsInput.value);
    if (!series || series < 1) {
        this.showMessage('Número de séries deve ser maior que zero', 'warning');
        elements.setsInput.focus();
        return null;
    }

    const repeticoes = elements.repsInput.value.trim();
    if (!repeticoes) {
        this.showMessage('Repetições são obrigatórias', 'warning');
        elements.repsInput.focus();
        return null;
    }

    // Retornar dados validados
    const technique = elements.techniqueSelect ? elements.techniqueSelect.value : '';
    
    return {
        nome: exerciseName,
        series: series,
        repeticoes: repeticoes,
        carga: elements.weightInput.value.trim() || 'A definir',
        descanso: elements.restInput.value.trim() || '90 segundos',
        descricao: elements.descriptionTextarea.value.trim() || 'Sem descrição',
        tecnica: technique,
        observacoesEspeciais: this.getObservacaoEspecial(technique, exerciseName)
    };
}

// VERSÃO CORRIGIDA DO forceCompleteUIUpdate
forceCompleteUIUpdate(workoutIndex) {
    console.log('🔄 Forçando atualização completa da UI...');
    
    // VALIDAÇÃO CRÍTICA DO PARÂMETRO
    if (workoutIndex === null || workoutIndex === undefined) {
        console.error('❌ forceCompleteUIUpdate: workoutIndex é obrigatório!', { workoutIndex });
        this.showMessage('Erro interno: índice do treino inválido', 'error');
        return;
    }
    
    // VALIDAÇÃO DA ESTRUTURA DE DADOS
    if (!this.currentPlan || !this.currentPlan.treinos || !this.currentPlan.treinos[workoutIndex]) {
        console.error('❌ forceCompleteUIUpdate: estrutura de dados inválida', { 
            workoutIndex, 
            planExists: !!this.currentPlan,
            treinosExists: !!(this.currentPlan && this.currentPlan.treinos),
            workoutExists: !!(this.currentPlan && this.currentPlan.treinos && this.currentPlan.treinos[workoutIndex])
        });
        this.showMessage('Erro: treino não encontrado', 'error');
        return;
    }
    
    console.log(`✅ Iniciando atualização para workout ${workoutIndex}`);
    
    // MÉTODO MAIS DIRETO - SEM MÚLTIPLOS TIMEOUTS
    setTimeout(() => {
        try {
            // 1. Atualizar lista de exercícios
            this.updateExerciseList(workoutIndex);
            
            // 2. Forçar re-renderização do container
            const container = document.getElementById(`exerciseList${workoutIndex}`);
            if (container) {
                console.log(`✅ Container exerciseList${workoutIndex} encontrado`);
                
                // Força reflow completo
                const currentDisplay = container.style.display;
                container.style.display = 'none';
                container.offsetHeight; // Força reflow
                container.style.display = currentDisplay || '';
                
                // Re-renderizar conteúdo
                const workout = this.currentPlan.treinos[workoutIndex];
                if (workout && workout.exercicios) {
                    const newHTML = this.renderExercises(workout.exercicios, workoutIndex);
                    container.innerHTML = newHTML;
                    console.log('✅ Interface atualizada com sucesso');
                } else {
                    console.warn('⚠️ Workout ou exercícios não encontrados para re-renderização');
                }
            } else {
                console.error(`❌ Container exerciseList${workoutIndex} não encontrado após updateExerciseList`);
            }
            
            // 3. Verificação final (com delay menor)
            setTimeout(() => {
                this.verifyUIUpdate(workoutIndex);
            }, 50);
            
        } catch (error) {
            console.error('❌ Erro durante forceCompleteUIUpdate:', error);
            this.showMessage('Erro ao atualizar interface', 'error');
        }
    }, 10); // Delay reduzido
}

// MÉTODO PARA VERIFICAR SE A ATUALIZAÇÃO FOI BEM-SUCEDIDA
verifyUIUpdate(workoutIndex) {
    const container = document.getElementById(`exerciseList${workoutIndex}`);
    if (!container) {
        console.error('Container não encontrado após atualização');
        return;
    }

    const exerciseItems = container.querySelectorAll('.exercise-item');
    const expectedCount = this.currentPlan.treinos[workoutIndex].exercicios.length;
    
    if (exerciseItems.length !== expectedCount) {
        console.warn(`Discrepância na UI: esperado ${expectedCount}, encontrado ${exerciseItems.length}`);
        // Tentar nova atualização
        this.updateExerciseList(workoutIndex);
    } else {
        console.log('✅ Verificação da UI concluída com sucesso');
    }
}



// 2. MÉTODO PARA COLETAR DADOS DO FORMULÁRIO DE FORMA ROBUSTA
collectFormData() {
    // Coletar elementos do formulário
    const exerciseSelect = document.getElementById('exerciseName');
    const customInput = document.getElementById('customExerciseName');
    const setsInput = document.getElementById('exerciseSets');
    const repsInput = document.getElementById('exerciseReps');
    const weightInput = document.getElementById('exerciseWeight');
    const restInput = document.getElementById('exerciseRest');
    const descriptionTextarea = document.getElementById('exerciseDescription');
    const techniqueSelect = document.getElementById('exerciseTechnique');

    // Validar elementos obrigatórios
    if (!exerciseSelect || !setsInput || !repsInput || !weightInput || !restInput || !descriptionTextarea) {
        this.showMessage('Erro: campos do formulário não encontrados', 'error');
        console.error('Elementos não encontrados:', {
            exerciseSelect: !!exerciseSelect,
            setsInput: !!setsInput,
            repsInput: !!repsInput,
            weightInput: !!weightInput,
            restInput: !!restInput,
            descriptionTextarea: !!descriptionTextarea
        });
        return null;
    }

    // Determinar nome do exercício
    let exerciseName;
    if (exerciseSelect.value === 'custom') {
        if (!customInput || !customInput.value.trim()) {
            this.showMessage('Por favor, digite o nome do exercício personalizado', 'warning');
            customInput?.focus();
            return null;
        }
        exerciseName = customInput.value.trim();
    } else {
        exerciseName = exerciseSelect.value;
    }

    // Validar nome do exercício
    if (!exerciseName) {
        this.showMessage('Nome do exercício é obrigatório', 'warning');
        exerciseSelect.focus();
        return null;
    }

    // Validar séries
    const series = parseInt(setsInput.value);
    if (!series || series < 1) {
        this.showMessage('Número de séries deve ser maior que zero', 'warning');
        setsInput.focus();
        return null;
    }

    // Validar repetições
    const repeticoes = repsInput.value.trim();
    if (!repeticoes) {
        this.showMessage('Repetições são obrigatórias', 'warning');
        repsInput.focus();
        return null;
    }

    // Retornar dados coletados
    return {
        nome: exerciseName,
        series: series,
        repeticoes: repeticoes,
        carga: weightInput.value.trim() || 'A definir',
        descanso: restInput.value.trim() || '90 segundos',
        descricao: descriptionTextarea.value.trim() || 'Sem descrição',
        tecnica: techniqueSelect ? techniqueSelect.value : '',
        observacoesEspeciais: this.getObservacaoEspecial(
            techniqueSelect ? techniqueSelect.value : '', 
            exerciseName
        )
    };
}

// VERSÃO CORRIGIDA E MELHORADA DO renderExercises()
renderExercises(exercicios, workoutIndex) {
    console.log(`🎨 Iniciando renderExercises - workoutIndex: ${workoutIndex}`);
    
    // VALIDAÇÃO DOS PARÂMETROS
    if (workoutIndex === null || workoutIndex === undefined) {
        console.error('❌ renderExercises: workoutIndex é obrigatório!', { workoutIndex });
        return '<p class="error-message">Erro: índice do treino inválido</p>';
    }
    
    if (!exercicios) {
        console.warn('⚠️ renderExercises: exercicios é null/undefined');
        return '<p class="no-exercises">Nenhum exercício adicionado</p>';
    }
    
    if (!Array.isArray(exercicios)) {
        console.error('❌ renderExercises: exercicios não é um array', { exercicios });
        return '<p class="error-message">Erro: formato de exercícios inválido</p>';
    }
    
    if (exercicios.length === 0) {
        console.log('ℹ️ renderExercises: array de exercícios vazio');
        return '<p class="no-exercises">Nenhum exercício adicionado</p>';
    }

    console.log(`🎨 Renderizando ${exercicios.length} exercícios para treino ${workoutIndex}`);
    
    try {
        const htmlArray = exercicios.map((ex, exIndex) => {
            // VALIDAÇÃO DE CADA EXERCÍCIO
            if (!ex) {
                console.warn(`⚠️ Exercício ${exIndex} é null/undefined`);
                return `<div class="exercise-item error">Exercício ${exIndex + 1}: Dados inválidos</div>`;
            }
            
            // Log detalhado do exercício
            console.log(`  📋 Renderizando exercício ${exIndex}: ${ex.nome || 'Nome não definido'}`);
            
            // SANITIZAÇÃO DOS DADOS (previne XSS e erros)
            const nome = this.sanitizeText(ex.nome) || 'Exercício sem nome';
            const descricao = this.sanitizeText(ex.descricao) || '';
            const tecnica = this.sanitizeText(ex.tecnica) || '';
            const observacoes = this.sanitizeText(ex.observacoesEspeciais) || '';
            const series = this.sanitizeText(ex.series) || '0';
            const repeticoes = this.sanitizeText(ex.repeticoes) || '0';
            const carga = this.sanitizeText(ex.carga) || 'Não definida';
            const descanso = this.sanitizeText(ex.descanso) || '60s';
            
            return `
                <div class="exercise-item" 
                     data-workout="${workoutIndex}" 
                     data-exercise="${exIndex}"
                     id="exercise-${workoutIndex}-${exIndex}">
                    <div class="exercise-info">
                        <div class="exercise-header">
                            <div class="exercise-name" title="${nome}">${nome}</div>
                            ${descricao ? `<div class="exercise-description">${descricao}</div>` : ''}
                            ${tecnica ? `<div class="exercise-special-notes technique-note">🎯 ${tecnica.replace(/[-_]/g, ' ').toUpperCase()}</div>` : ''}
                            ${observacoes ? `<div class="exercise-special-notes observation-note">💡 ${observacoes}</div>` : ''}
                        </div>
                        <div class="exercise-details">
                            <div class="detail-item">
                                <span class="detail-label">Séries:</span> 
                                <span class="detail-value">${series}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Reps:</span> 
                                <span class="detail-value">${repeticoes}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Carga:</span> 
                                <span class="detail-value">${carga}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Descanso:</span> 
                                <span class="detail-value">${descanso}</span>
                            </div>
                        </div>
                    </div>
                    <div class="exercise-actions">
                        <button class="btn btn-outline btn-small edit-btn" 
                                onclick="app.editExercise(${workoutIndex}, ${exIndex})"
                                title="Editar exercício"
                                data-workout="${workoutIndex}" 
                                data-exercise="${exIndex}">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-small remove-btn" 
                                onclick="app.removeExercise(${workoutIndex}, ${exIndex})"
                                title="Remover exercício"
                                data-workout="${workoutIndex}" 
                                data-exercise="${exIndex}">
                            🗑️ Remover
                        </button>
                    </div>
                </div>
            `;
        });
        
        const finalHTML = htmlArray.join('');
        console.log(`✅ renderExercises concluído - ${exercicios.length} exercícios renderizados`);
        
        return finalHTML;
        
    } catch (error) {
        console.error('❌ Erro durante renderExercises:', error);
        return `<p class="error-message">Erro ao renderizar exercícios: ${error.message}</p>`;
    }
}


// 6. MÉTODO PARA FORÇAR ATUALIZAÇÃO COMPLETA
forceUIUpdate(workoutIndex) {
    console.log('🔄 Forçando atualização completa da UI...');
    
    // Aguardar próximo tick do event loop
    setTimeout(() => {
        // Atualizar lista de exercícios
        this.updateExerciseList(workoutIndex);
        
        // Força repaint do browser
        const container = document.getElementById(`exerciseList${workoutIndex}`);
        if (container) {
            container.style.display = 'none';
            container.offsetHeight; // Força reflow
            container.style.display = '';
        }
        
        console.log('✅ UI atualizada com sucesso');
    }, 0);
}

    getObservacaoEspecial(tecnica, nomeExercicio) {
        if (!tecnica || !this.tecnicasDatabase[tecnica]) return '';
    
        const observacoes = {
            'pre-exaustao': 'Executar antes do exercício principal para pré-fadigar o músculo',
            'pos-exaustao': 'Exercício final para esgotamento completo do músculo',
            'bi-set': 'Executar em sequência com próximo exercício, sem descanso',
            'tri-set': 'Executar em sequência com próximos 2 exercícios, sem descanso',
            'drop-set': 'Reduzir carga imediatamente após falha e continuar',
            'rest-pause': 'Pausar 10-15s após falha e continuar até nova falha',
            'serie-queima': 'Após falha, fazer repetições parciais até esgotamento',
            'tempo-controlado': '3-4 segundos na descida, 1-2 segundos na subida',
            'pausa-contracao': 'Pausar 2 segundos na contração máxima'
        };
    
        return observacoes[tecnica] || this.tecnicasDatabase[tecnica];
    }

    removeExercise(workoutIndex, exerciseIndex) {
        // TODO: Implementar remoção de exercício
        if (confirm('Tem certeza que deseja remover este exercício?')) {
            this.currentPlan.treinos[workoutIndex].exercicios.splice(exerciseIndex, 1);
            this.updateExerciseList(workoutIndex);
        }
    }



    
    generatePlanGeneralInfo(plan) {
        return `
            <div class="plan-general-info">
                <h3>Informações Gerais</h3>
                <div class="plan-info-grid">
                    <div class="plan-info-item">
                        <span class="plan-info-label">Aluno</span>
                        <span class="plan-info-value">${plan.aluno?.nome || 'Não informado'}</span>
                    </div>
                    <div class="plan-info-item">
                        <span class="plan-info-label">Frequência</span>
                        <span class="plan-info-value">${plan.dias} dias por semana</span>
                    </div>
                    <div class="plan-info-item">
                        <span class="plan-info-label">Período</span>
                        <span class="plan-info-value">${this.core.formatDate(plan.dataInicio)} até ${this.core.formatDate(plan.dataFim)}</span>
                    </div>
                    <div class="plan-info-item">
                        <span class="plan-info-label">Objetivo</span>
                        <span class="plan-info-value">${plan.perfil?.objetivo || 'Não especificado'}</span>
                    </div>
                    ${plan.aluno?.idade ? `
                    <div class="plan-info-item">
                        <span class="plan-info-label">Idade</span>
                        <span class="plan-info-value">${plan.aluno.idade} anos</span>
                    </div>` : ''}
                    ${plan.aluno?.altura ? `
                    <div class="plan-info-item">
                        <span class="plan-info-label">Altura</span>
                        <span class="plan-info-value">${plan.aluno.altura}</span>
                    </div>` : ''}
                    ${plan.aluno?.peso ? `
                    <div class="plan-info-item">
                        <span class="plan-info-label">Peso</span>
                        <span class="plan-info-value">${plan.aluno.peso}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }
    
    generatePlanWorkoutTabs(plan) {
        return `
            <div class="plan-workout-tabs">
                ${plan.treinos.map((treino, index) => `
                    <div class="plan-workout-tab ${index === 0 ? 'active' : ''}" onclick="app.switchPlanWorkoutTab(${index})">
                        ${treino.id || treino.nome}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    generatePlanWorkoutContents(plan) {
        return plan.treinos.map((treino, index) => `
            <div class="plan-workout-content ${index === 0 ? 'active' : ''}" id="planWorkoutContent${index}">
                <div class="workout-editor">
                    <div class="workout-header" style="margin-bottom: var(--space-lg);">
                        <h3 class="workout-title">${treino.nome}</h3>
                        <p style="color: var(--text-secondary); margin: var(--space-sm) 0;">
                            <strong>Foco:</strong> ${treino.foco}
                        </p>
                    </div>
                    
                    ${treino.exercicios ? treino.exercicios.map(ex => `
                        <div class="exercise-card">
                            <div class="exercise-header">
                                <strong style="font-size: var(--font-size-lg); color: var(--text-primary);">
                                    ${ex.nome}
                                </strong>
                                ${ex.tecnica ? `
                                    <div class="exercise-special-display">
                                        Técnica: ${ex.tecnica.replace('-', ' ').toUpperCase()}
                                    </div>
                                ` : ''}
                                ${ex.observacoesEspeciais ? `
                                    <div class="exercise-special-display">
                                        ${ex.observacoesEspeciais}
                                    </div>
                                ` : ''}
                            </div>
                            <p style="margin: var(--space-md) 0; color: var(--text-secondary); line-height: 1.6;">
                                ${ex.descricao}
                            </p>
                            <div class="exercise-specs">
                                <div class="spec-item">
                                    <span class="spec-label">Séries</span>
                                    <span class="spec-value">${ex.series}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Reps</span>
                                    <span class="spec-value">${ex.repeticoes}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Carga</span>
                                    <span class="spec-value">${ex.carga}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Descanso</span>
                                    <span class="spec-value">${ex.descanso || '90s'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: var(--text-secondary); padding: var(--space-xl);">Nenhum exercício configurado</p>'}
                </div>
            </div>
        `).join('');
    }
    
    generatePlanTechniques(plan) {
        return `
            <div class="plan-techniques-section">
                <h3>Técnicas Aplicadas no Plano</h3>
                <div class="technique-grid">
                    ${Object.entries(plan.tecnicas_aplicadas).map(([tecnica, descricao]) => `
                        <div class="technique-card">
                            <div class="technique-name">${tecnica.replace('-', ' ')}</div>
                            <div class="technique-description">${descricao}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    generatePlanObservations(plan) {
        return `
            <div class="plan-observations-section">
                <h3>Observações</h3>
                ${Object.entries(plan.observacoes).map(([key, value]) =>
                    value ? `
                        <div class="observation-item">
                            <div class="observation-label">${this.getObservationLabel(key)}</div>
                            <div class="observation-value">${value}</div>
                        </div>
                    ` : ''
                ).join('')}
            </div>
        `;
    }
    
    switchPlanWorkoutTab(index) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.plan-workout-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.plan-workout-content').forEach(content => content.classList.remove('active'));
    
        // Add active class to selected tab and content
        document.querySelectorAll('.plan-workout-tab')[index].classList.add('active');
        document.getElementById(`planWorkoutContent${index}`).classList.add('active');
    }
    
    getObservationLabel(key) {
        const labels = {
            frequencia: 'Frequência',
            progressao: 'Progressão',
            descanso: 'Descanso',
            hidratacao: 'Hidratação',
            alimentacao: 'Alimentação',
            suplementacao: 'Suplementação',
            sono: 'Sono',
            aquecimento: 'Aquecimento',
            tecnica: 'Técnica',
            periodizacao: 'Periodização',
            consulta: 'Consulta',
            geral: 'Observações Gerais'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }




    generateAIPlan() {
        // Coletar dados do formulário
        const aiData = {
            nome: document.getElementById('aiStudentName')?.value,
            dataNascimento: document.getElementById('aiStudentBirthDate')?.value,
            cpf: document.getElementById('aiStudentCpf')?.value,
            altura: document.getElementById('aiStudentHeight')?.value || '1,75m',
            peso: document.getElementById('aiStudentWeight')?.value || '75kg',
            objetivo: document.getElementById('aiPlanObjective')?.value,
            nivel: document.getElementById('aiExperienceLevel')?.value,
            dias: parseInt(document.getElementById('aiAvailableDays')?.value),
            tempo: parseInt(document.getElementById('aiSessionTime')?.value),
            equipamentos: document.getElementById('aiEquipment')?.value,
            foco: document.getElementById('aiMusclePreference')?.value,
            limitacoes: document.getElementById('aiLimitations')?.value,
            observacoes: document.getElementById('aiSpecialNotes')?.value
        };
    
        // Calcular idade
        aiData.idade = aiData.dataNascimento ? this.core.calculateAge(aiData.dataNascimento) : 25;
    
        // Validações básicas
        if (!aiData.nome) {
            this.showMessage('Por favor, preencha o nome do aluno', 'error');
            return;
        }
    
        if (!aiData.dias || aiData.dias < 1 || aiData.dias > 6) {
            this.showMessage('Selecione um número válido de dias (1-6)', 'error');
            return;
        }
    
        console.log('Gerando plano com IA para:', aiData);
    
        // Verificar se configuração personalizada está habilitada
        if (this.aiMuscleConfig.enabled) {
            if (!this.validateAICompleteConfig()) {
                return; // Interrompe se configuração inválida
            }
    
            console.log('Usando configuração personalizada de músculos na IA');
    
            // Aplicar configuração personalizada ao sistema
            this.planTypeConfiguration.days = aiData.dias;
            this.planTypeConfiguration.configuration = { ...this.aiMuscleConfig.workouts };
            this.savePlanTypeConfiguration();
    
        } else {
            // Lógica original: usar configuração padrão baseada no número de dias
            const hasCustomConfig = this.planTypeConfiguration.days === aiData.dias &&
                Object.keys(this.planTypeConfiguration.configuration).length > 0;
    
            if (!hasCustomConfig) {
                console.log(`Criando configuração padrão para ${aiData.dias} dias`);
                this.planTypeConfiguration.days = aiData.dias;
                this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[aiData.dias] || {};
                this.savePlanTypeConfiguration();
            }
        }
    
        // Mostrar indicador de progresso
        this.showGeneratingIndicator();
    
        // Simular processamento da IA com timeout
        setTimeout(() => {
            try {
                const aiGeneratedPlan = this.createAIPlanWithCustomConfig(aiData);
    
                // Adicionar informação sobre configuração personalizada usada
                if (this.aiMuscleConfig.enabled) {
                    aiGeneratedPlan.configuracao_personalizada_ia = {
                        habilitada: true,
                        configuracao_aplicada: { ...this.aiMuscleConfig.workouts },
                        gerado_em: new Date().toISOString()
                    };
                }
    
                // Atualizar lista de planos
                const existingIndex = this.savedPlans.findIndex(p => p.id === aiGeneratedPlan.id);
                if (existingIndex >= 0) {
                    this.savedPlans[existingIndex] = { ...aiGeneratedPlan };
                } else {
                    this.savedPlans.push({ ...aiGeneratedPlan });
                }
    
                this.savePlansToStorage();
                this.hideGeneratingIndicator();
    
                // Resetar configuração temporária se foi usada
                if (this.aiMuscleConfig.enabled) {
                    this.resetAIMuscleConfigAfterGeneration();
                }
    
                this.showMessage('Plano gerado com sucesso pela IA!', 'success');
    
                setTimeout(() => {
                    this.showPlanList();
                }, 1500);
    
            } catch (error) {
                console.error('Erro ao gerar plano:', error);
                this.hideGeneratingIndicator();
                this.showMessage('Erro ao gerar plano. Tente novamente.', 'error');
            }
    
        }, 2000 + Math.random() * 2000); // 2-4 segundos
    }
    
    showGeneratingIndicator() {
        const indicator = document.getElementById('generatingIndicator');
        const progressFill = document.getElementById('progressFill');
        
        if (!indicator || !progressFill) return;
    
        indicator.classList.add('active');
    
        let progress = 0;
        this.progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 200);
    }
    
    hideGeneratingIndicator() {
        const indicator = document.getElementById('generatingIndicator');
        const progressFill = document.getElementById('progressFill');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    
        if (progressFill) {
            progressFill.style.width = '100%';
        }
    
        if (indicator) {
            indicator.classList.remove('active');
        }
    }
    
    createAIPlanWithCustomConfig(aiData) {
        const plan = {
            id: this.core.generateId(),
            nome: `${aiData.nome} - Treino ${this.getWorkoutLetters(aiData.dias)} (${aiData.nivel.charAt(0).toUpperCase() + aiData.nivel.slice(1)}) ${aiData.objetivo.split(' ')[0]}`,
            aluno: {
                nome: aiData.nome,
                dataNascimento: aiData.dataNascimento,
                cpf: aiData.cpf,
                idade: aiData.idade,
                altura: aiData.altura,
                peso: aiData.peso
            },
            dias: aiData.dias,
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses
            perfil: {
                idade: aiData.idade,
                altura: aiData.altura,
                peso: aiData.peso,
                porte: this.calculateBodyType(aiData.altura, aiData.peso),
                objetivo: aiData.objetivo
            },
            treinos: this.generateAIWorkoutsWithCustomConfig(aiData),
            observacoes: this.generateObservations(aiData),
            tecnicas_aplicadas: this.getUsedTechniques(aiData.nivel),
            // Salvar configuração utilizada
            configuracao_utilizada: {
                ...this.planTypeConfiguration.configuration,
                dias: aiData.dias,
                gerado_em: new Date().toISOString()
            }
        };
    
        return plan;
    }
    
    generateAIWorkoutsWithCustomConfig(aiData) {
        const workouts = [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const config = this.planTypeConfiguration.configuration;
    
        console.log(`Gerando treinos IA com configuração personalizada para ${aiData.dias} dias`);
    
        // Iterar sobre cada dia configurado
        for (let i = 0; i < aiData.dias; i++) {
            const letter = letters[i];
            const workoutConfig = config[letter];
    
            if (!workoutConfig) {
                console.warn(`Configuração não encontrada para treino ${letter}`);
                continue;
            }
    
            console.log(`Criando treino ${letter}: ${workoutConfig.name}`);
    
            const exercises = this.generateExercisesForAIWithCustomGroups(
                workoutConfig.groups,
                aiData.nivel,
                aiData.objetivo,
                aiData.equipamentos,
                aiData.foco,
                aiData.limitacoes,
                i + 1
            );
    
            workouts.push({
                id: letter,
                nome: workoutConfig.name,
                foco: this.generateWorkoutFocusFromGroups(workoutConfig.groups),
                exercicios: exercises,
                gruposMusculares: workoutConfig.groups,
                configuracao_original: workoutConfig,
                concluido: false,
                execucoes: 0
            });
        }
    
        console.log(`${workouts.length} treinos gerados com sucesso`);
        return workouts;
    }
    
    generateExercisesForAIWithCustomGroups(customGroups, nivel, objetivo, equipamentos, foco, limitacoes, workoutNumber) {
        const exercises = [];
        let exerciseId = workoutNumber * 10;
    
        console.log(`Gerando exercícios para grupos: ${customGroups.join(', ')}`);
    
        // 1. AQUECIMENTO ESPECÍFICO
        exercises.push({
            id: exerciseId++,
            nome: this.getSmartWarmupForGroups(customGroups, equipamentos),
            descricao: this.getWarmupDescriptionForGroups(customGroups),
            series: 1,
            repeticoes: "8-10 min",
            carga: this.getWarmupIntensity(),
            descanso: '0',
            observacoesEspeciais: 'Aquecimento progressivo e específico',
            tecnica: '',
            concluido: false,
            categoria: 'aquecimento'
        });
    
        // 2. EXERCÍCIOS PRINCIPAIS POR GRUPO
        const exerciseDistribution = this.calculateExerciseDistribution(customGroups, objetivo, foco);
    
        customGroups.forEach((grupoId, index) => {
            const mappedGroup = this.mapCustomGroupToSystemGroup(grupoId);
            const numExercises = exerciseDistribution[grupoId] || 2;
    
            console.log(`Adicionando ${numExercises} exercícios para ${grupoId} (${mappedGroup})`);
    
            // Obter exercícios do grupo via core
            const groupExercises = this.getExercisesByGroupAndLevel(mappedGroup, nivel);
    
            if (groupExercises.length > 0) {
                // Selecionar exercícios de forma inteligente
                const selectedExercises = this.selectSmartExercises(
                    groupExercises,
                    numExercises,
                    objetivo,
                    equipamentos,
                    limitacoes,
                    index === 0
                );
    
                selectedExercises.forEach((baseExercise, exIndex) => {
                    const tecnicaSelecionada = this.getTecnicaForExercise(
                        exercises.length - 1,
                        nivel,
                        mappedGroup
                    );
    
                    exercises.push({
                        id: exerciseId++,
                        nome: baseExercise.nome,
                        descricao: this.findExerciseByName(baseExercise.nome)?.descricao || 'Descrição não disponível',
                        series: this.getSmartSeries(baseExercise, objetivo, nivel, exIndex === 0),
                        repeticoes: this.getSmartReps(baseExercise, objetivo, nivel),
                        carga: this.adjustLoadForLevel(baseExercise.carga || 'A definir', nivel),
                        descanso: this.getSmartRest(objetivo, tecnicaSelecionada),
                        observacoesEspeciais: this.getObservacaoEspecial(tecnicaSelecionada, baseExercise.nome),
                        tecnica: tecnicaSelecionada,
                        concluido: false,
                        grupo_muscular: grupoId,
                        categoria: exIndex === 0 ? 'principal' : 'auxiliar'
                    });
                });
            } else {
                console.warn(`Nenhum exercício encontrado para grupo ${mappedGroup}`);
    
                // Exercício fallback
                exercises.push({
                    id: exerciseId++,
                    nome: this.getFallbackExercise(grupoId),
                    descricao: `Exercício básico para ${grupoId}`,
                    series: 3,
                    repeticoes: '10-12',
                    carga: 'A definir',
                    descanso: this.getRestByObjective(objetivo),
                    observacoesEspeciais: 'Exercício substituto - ajustar conforme necessário',
                    tecnica: '',
                    concluido: false,
                    grupo_muscular: grupoId,
                    categoria: 'substituto'
                });
            }
        });
    
        // 3. ALONGAMENTO ESPECÍFICO
        if (exercises.length > 1) {
            exercises.push({
                id: exerciseId++,
                nome: this.getSmartCooldownForGroups(customGroups),
                descricao: "Relaxamento e flexibilidade dos grupos musculares trabalhados",
                series: 1,
                repeticoes: "8-10 min",
                carga: "Peso corporal",
                descanso: '0',
                observacoesEspeciais: 'Foco nos grupos trabalhados no treino',
                tecnica: '',
                concluido: false,
                categoria: 'alongamento'
            });
        }
    
        console.log(`${exercises.length} exercícios criados (${exercises.filter(e => e.categoria === 'principal').length} principais)`);
        return exercises;
    }
    
    getWorkoutLetters(days) {
        const letters = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF'];
        return letters[days - 1] || 'A';
    }
    
    // Métodos auxiliares para geração inteligente de exercícios
    calculateExerciseDistribution(groups, objetivo, foco) {
        const distribution = {};
        const totalGroups = groups.length;
        let baseExercises = totalGroups <= 2 ? 4 : totalGroups <= 3 ? 3 : 2;
    
        if (objetivo.includes('Hipertrofia')) {
            baseExercises = Math.max(baseExercises, 3);
        } else if (objetivo.includes('Força')) {
            baseExercises = Math.max(baseExercises, 2);
        }
    
        groups.forEach(group => {
            distribution[group] = baseExercises;
    
            if (foco === 'superior' && ['peito', 'costas', 'ombro', 'biceps', 'triceps'].includes(group)) {
                distribution[group] += 1;
            } else if (foco === 'inferior' && ['perna', 'gluteo'].includes(group)) {
                distribution[group] += 1;
            }
    
            if (['peito', 'costas', 'perna'].includes(group)) {
                distribution[group] = Math.max(distribution[group], 3);
            }
        });
    
        return distribution;
    }
    
    selectSmartExercises(availableExercises, numNeeded, objetivo, equipamentos, limitacoes, isPrimaryGroup) {
        let selected = [];
        const limitations = limitacoes ? limitacoes.toLowerCase() : '';
    
        let filteredExercises = availableExercises.filter(ex => {
            if (!limitations) return true;
    
            const exerciseName = ex.nome.toLowerCase();
            if (limitations.includes('joelho') && exerciseName.includes('agachamento')) return false;
            if (limitations.includes('ombro') && exerciseName.includes('desenvolvimento')) return false;
            if (limitations.includes('lombar') && exerciseName.includes('terra')) return false;
    
            return true;
        });
    
        if (filteredExercises.length === 0) filteredExercises = availableExercises;
    
        if (isPrimaryGroup) {
            const compostos = filteredExercises.filter(ex =>
                ex.nome.includes('Supino') || ex.nome.includes('Agachamento') ||
                ex.nome.includes('Terra') || ex.nome.includes('Remada') ||
                ex.nome.includes('Desenvolvimento')
            );
    
            if (compostos.length > 0) {
                selected.push(compostos[0]);
                numNeeded--;
            }
        }
    
        const remaining = filteredExercises.filter(ex =>
            !selected.some(sel => sel.nome === ex.nome)
        );
    
        for (let i = 0; i < Math.min(numNeeded, remaining.length); i++) {
            selected.push(remaining[i]);
        }
    
        return selected;
    }
    
    getSmartSeries(exercise, objetivo, nivel, isPrimary) {
        let baseSeries = exercise.series || 3;
    
        if (objetivo.includes('Força')) {
            baseSeries = isPrimary ? 5 : 3;
        } else if (objetivo.includes('Hipertrofia')) {
            baseSeries = isPrimary ? 4 : 3;
        } else if (objetivo.includes('Resistência')) {
            baseSeries = 2;
        }
    
        if (nivel === 'iniciante') {
            baseSeries = Math.max(2, baseSeries - 1);
        } else if (nivel === 'avancado') {
            baseSeries = Math.min(5, baseSeries + 1);
        }
    
        return baseSeries;
    }
    
    getSmartReps(exercise, objetivo, nivel) {
        if (objetivo.includes('Força')) {
            return nivel === 'iniciante' ? '6-8' : '4-6';
        } else if (objetivo.includes('Hipertrofia')) {
            return '8-12';
        } else if (objetivo.includes('Resistência')) {
            return '12-15';
        } else if (objetivo.includes('Perda de peso')) {
            return '10-15';
        }
    
        return exercise.repeticoes || '10-12';
    }
    
    getSmartRest(objetivo, tecnica) {
        let baseRest = this.getRestByObjective(objetivo);
    
        if (tecnica && ['drop-set', 'rest-pause', 'bi-set', 'tri-set'].includes(tecnica)) {
            return '120-180 segundos';
        }
    
        return baseRest;
    }
    
    getRestByObjective(objetivo) {
        if (objetivo.includes('Hipertrofia')) {
            return "90-120 segundos";
        } else if (objetivo.includes('Força')) {
            return "180-300 segundos";
        } else if (objetivo.includes('Perda de peso')) {
            return "60-90 segundos";
        } else {
            return "90 segundos";
        }
    }
      
    
    getTecnicaForExercise(exerciseIndex, nivel, grupo) {
        const tecnicasDisponiveis = this.tecnicasPorNivel[nivel] || this.tecnicasPorNivel.intermediario;
    
        if (exerciseIndex === 0) {
            return Math.random() > 0.7 ? 'pre-exaustao' : 'tempo-controlado';
        } else if (exerciseIndex === 1) {
            return nivel === 'avancado' && Math.random() > 0.5 ? 'rest-pause' : '';
        } else {
            const tecnicasFinais = tecnicasDisponiveis.filter(t =>
                ['pos-exaustao', 'drop-set', 'serie-queima', 'bi-set'].includes(t)
            );
            return Math.random() > 0.6 ?
                tecnicasFinais[Math.floor(Math.random() * tecnicasFinais.length)] || '' : '';
        }
    }
    
    adjustLoadForLevel(baseCarga, nivel) {
        if (typeof baseCarga !== 'string') return baseCarga;
    
        const multipliers = {
            iniciante: 0.7,
            intermediario: 1.0,
            avancado: 1.3
        };
    
        const multiplier = multipliers[nivel] || 1.0;
    
        return baseCarga.replace(/(\d+)/g, (match) => {
            const num = parseInt(match);
            const adjusted = Math.round(num * multiplier);
            return adjusted.toString();
        });
    }
    
    generateObservations(aiData) {
        return {
            frequencia: `${aiData.dias}x por semana com ${7 - aiData.dias} dia${7 - aiData.dias > 1 ? 's' : ''} de descanso por semana`,
            progressao: this.getProgressionByLevel(aiData.nivel),
            descanso: this.getRestByObjective(aiData.objetivo),
            hidratacao: "Beba pelo menos 2,5-3L de água por dia, especialmente durante os treinos",
            alimentacao: this.getNutritionByObjective(aiData.objetivo),
            suplementacao: "Considere whey protein, creatina e multivitamínico (consulte nutricionista)",
            sono: "Durma 7-9 horas por noite para recuperação muscular adequada",
            aquecimento: "Sempre faça aquecimento específico antes dos exercícios principais",
            tecnica: "Priorize a execução perfeita sobre cargas altas",
            periodizacao: "A cada 6-8 semanas, faça uma semana de deload com 60% da carga",
            consulta: "Acompanhamento profissional é essencial para ajustes e progressão segura",
            geral: aiData.observacoes || ''
        };
    }
    
    getProgressionByLevel(nivel) {
        const progressions = {
            iniciante: "Aumente a carga em 2,5kg quando conseguir executar todas as séries no limite superior de repetições",
            intermediario: "Aumente a carga em 2,5-5kg quando conseguir executar todas as séries no limite superior de repetições",
            avancado: "Aumente a carga em 2,5-5kg ou use técnicas avançadas quando conseguir executar todas as séries facilmente"
        };
        return progressions[nivel] || progressions.intermediario;
    }
    
    getNutritionByObjective(objetivo) {
        if (objetivo.includes('Hipertrofia')) {
            return "Consuma 2,0-2,2g de proteína por kg de peso corporal diariamente para hipertrofia";
        } else if (objetivo.includes('Perda de peso')) {
            return "Mantenha déficit calórico moderado com 1,8-2,0g de proteína por kg de peso";
        } else if (objetivo.includes('Força')) {
            return "Consuma 1,8-2,0g de proteína por kg de peso com carboidratos adequados para energia";
        } else {
            return "Siga uma dieta balanceada com 1,6-2,0g de proteína por kg de peso corporal";
        }
    }
    
    getUsedTechniques(nivel) {
        const tecnicasUsadas = {};
        const tecnicasDisponiveis = this.tecnicasPorNivel[nivel] || this.tecnicasPorNivel.intermediario;
    
        tecnicasDisponiveis.forEach(tecnica => {
            if (this.tecnicasDatabase[tecnica]) {
                tecnicasUsadas[tecnica] = this.tecnicasDatabase[tecnica];
            }
        });
    
        return tecnicasUsadas;
    }
    
    validateAICompleteConfig() {
        if (!this.aiMuscleConfig.enabled) {
            return true;
        }
    
        const letters = Object.keys(this.aiMuscleConfig.workouts);
        const expectedDays = this.aiMuscleConfig.days;
        const expectedLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, expectedDays);
    
        for (const letter of expectedLetters) {
            const workout = this.aiMuscleConfig.workouts[letter];
            if (!workout || !workout.groups || workout.groups.length === 0) {
                this.showMessage(`Treino ${letter} não tem grupos musculares selecionados!`, 'error');
                return false;
            }
        }
    
        return true;
    }
    
    resetAIMuscleConfigAfterGeneration() {
        const checkbox = document.getElementById('aiUseCustomMuscleConfig');
        const section = document.getElementById('aiMuscleConfigSection');
    
        if (checkbox) checkbox.checked = false;
        if (section) {
            section.style.display = 'none';
            section.classList.remove('active');
        }
    
        this.aiMuscleConfig.enabled = false;
        this.aiMuscleConfig.workouts = {};
    
        console.log('Configuração de músculos IA resetada após geração');
    }
    
    // Métodos auxiliares para exercícios específicos
    getSmartWarmupForGroups(groups, equipamentos) {
        if (groups.includes('perna') || groups.includes('gluteo')) {
            return equipamentos === 'peso_corporal' ? 'Aquecimento Dinâmico de Pernas' : 'Bicicleta Ergométrica';
        } else if (groups.includes('costas')) {
            return equipamentos === 'peso_corporal' ? 'Mobilização de Ombros' : 'Remo Ergômetro';
        } else if (groups.includes('peito')) {
            return equipamentos === 'peso_corporal' ? 'Aquecimento Dinâmico Superior' : 'Esteira';
        }
    
        return equipamentos === 'peso_corporal' ? 'Aquecimento Dinâmico Geral' : 'Esteira';
    }
    
    getWarmupDescriptionForGroups(groups) {
        const groupNames = groups.map(g => {
            const group = this.planTypeConfiguration.muscleGroups.find(mg => mg.id === g);
            return group ? group.name.toLowerCase() : g;
        });
    
        return `Aquecimento específico para ${groupNames.join(', ')} em ritmo moderado`;
    }
    
    getWarmupIntensity() {
        return "Intensidade moderada";
    }
    
    getSmartCooldownForGroups(groups) {
        const groupNames = groups.map(g => {
            const group = this.planTypeConfiguration.muscleGroups.find(mg => mg.id === g);
            return group ? group.name.toLowerCase() : g;
        });
    
        return `Alongamento - ${groupNames.join(', ')}`;
    }
    
    getFallbackExercise(grupoId) {
        const fallbacks = {
            'peito': 'Flexão de Braços',
            'costas': 'Remada com Elástico',
            'ombro': 'Elevação Lateral',
            'biceps': 'Rosca Direta',
            'triceps': 'Tríceps Pulley',
            'perna': 'Agachamento Livre',
            'gluteo': 'Hip Thrust',
            'abdome': 'Abdominal Tradicional',
            'antebraco': 'Rosca Punho'
        };
    
        return fallbacks[grupoId] || 'Exercício Personalizado';
    }

    loadPlanForEditing(planId) {
        // Buscar plano na lista 
       const plan = this.savedPlans.find(p => p.id == planId);
        if (!plan) {
            this.showMessage('Plano não encontrado', 'error');
            console.error(`Plano com ID ${planId} não encontrado`);
            return;
        }
    
        console.log(`Carregando plano para edição: ${plan.nome} (ID: ${planId})`);
    
        // Definir estado de edição
        this.isEditing = true;
        this.currentPlan = this.deepClone(plan); // Clone profundo para evitar mutações
    
        // Preencher campos básicos do formulário
        this.populateBasicPlanFields(plan);
    
        // Configurar tipo de plano e treinos
        this.configurePlanType(plan);
    
        // Mostrar botão de cancelar edição
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
        }
    
        // Definir ID atual no campo oculto
        const currentPlanIdField = document.getElementById('currentPlanId');
        if (currentPlanIdField) {
            currentPlanIdField.value = planId;
        }
    
        this.showMessage('Modo de edição ativado', 'success');
        console.log('Plano carregado para edição:', this.currentPlan);
    }
    
    populateBasicPlanFields(plan) {
        // Campos do aluno
        this.setFieldValue('studentName', plan.aluno?.nome || '');
        this.setFieldValue('studentBirthDate', plan.aluno?.dataNascimento || '');
        this.setFieldValue('studentCpf', plan.aluno?.cpf || '');
        this.setFieldValue('studentHeight', plan.aluno?.altura || plan.perfil?.altura || '');
        this.setFieldValue('studentWeight', plan.aluno?.peso || plan.perfil?.peso || '');
    
        // Campos do plano
        this.setFieldValue('planName', plan.nome || '');
        this.setFieldValue('planObjective', plan.perfil?.objetivo || '');
        this.setFieldValue('planStartDate', plan.dataInicio || '');
        this.setFieldValue('planEndDate', plan.dataFim || '');
        this.setFieldValue('planObservations', plan.observacoes?.geral || '');
    
        console.log('Campos básicos preenchidos');
    }
    
    configurePlanType(plan) {
        // Configurar número de dias
        this.selectedDays = plan.dias || 3;
    
        // Ativar botão correto de tipo de plano
        document.querySelectorAll('.plan-type-btn').forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`.plan-type-btn:nth-child(${plan.dias})`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    
        // Carregar configuração se existir no plano
        if (plan.configuracao_utilizada) {
            this.planTypeConfiguration.days = plan.configuracao_utilizada.dias || plan.dias;
            this.planTypeConfiguration.configuration = plan.configuracao_utilizada || {};
            console.log('Configuração de tipos de plano restaurada do plano');
        }
    
        // Gerar editor de treinos com os dados existentes
        this.generateWorkoutEditorForEdit(plan.dias);
    }
    
    generateWorkoutEditorForEdit(days) {
        const editor = document.getElementById('workoutEditor');
        let html = '<div class="form-section"><h2>🏋️ Treinos</h2>';

        for (let i = 0; i < days; i++) {
            const workout = this.currentPlan.treinos[i] || {
                id: String.fromCharCode(65 + i),
                nome: `Treino ${String.fromCharCode(65 + i)}`,
                foco: 'Treino geral',
                exercicios: []
            };

            if (workout.exercicios) {
                workout.exercicios.forEach(ex => {
                    if (!ex.tecnica) ex.tecnica = '';
                });
            }

            html += `
                <div class="workout-editor">
                    <div class="workout-header">
                        <h3 class="workout-title">${workout.nome}</h3>
                        <button class="btn btn-primary btn-small" onclick="app.addExercise(${i})">
                            ➕ Adicionar Exercício
                        </button>
                    </div>
                    <div class="exercise-list" id="exerciseList${i}">
                        ${this.renderExercises(workout.exercicios, i)}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        editor.innerHTML = html;
    }

// Carregar configuração padrão inline
loadInlinePresetConfig() {
    const days = this.planTypeConfiguration.days;
    const preset = this.planTypeConfiguration.presetConfigurations[days];
    
    if (preset) {
        this.planTypeConfiguration.configuration = JSON.parse(JSON.stringify(preset));
        this.showInlineQuickConfig(); // Recarregar interface
        this.showMessage('Configuração padrão aplicada!', 'success');
    }
}

    // Método original de geração de treinos (para fallback)
    generateAIWorkoutsOriginal(aiData) {
        const workouts = [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        const workoutSplits = {
            2: [
                { nome: 'A - Membros Superiores', grupos: ['peito', 'costas', 'ombros', 'biceps', 'triceps'] },
                { nome: 'B - Membros Inferiores e Core', grupos: ['quadriceps', 'posterior', 'panturrilha'] }
            ],
            3: [
                { nome: 'A - Peito e Tríceps', grupos: ['peito', 'triceps'] },
                { nome: 'B - Costas e Bíceps', grupos: ['costas', 'biceps'] },
                { nome: 'C - Pernas e Ombros', grupos: ['quadriceps', 'posterior', 'ombros', 'panturrilha'] }
            ],
            4: [
                { nome: 'A - Peito e Tríceps', grupos: ['peito', 'triceps'] },
                { nome: 'B - Costas e Bíceps', grupos: ['costas', 'biceps'] },
                { nome: 'C - Ombros', grupos: ['ombros'] },
                { nome: 'D - Pernas', grupos: ['quadriceps', 'posterior', 'panturrilha'] }
            ],
            5: [
                { nome: 'A - Peito e Tríceps', grupos: ['peito', 'triceps'] },
                { nome: 'B - Costas e Bíceps', grupos: ['costas', 'biceps'] },
                { nome: 'C - Ombros e Trapézio', grupos: ['ombros'] },
                { nome: 'D - Pernas (Quadríceps e Glúteos)', grupos: ['quadriceps'] },
                { nome: 'E - Posterior de Coxa e Core', grupos: ['posterior', 'panturrilha'] }
            ],
            6: [
                { nome: 'A - Peito', grupos: ['peito'] },
                { nome: 'B - Costas', grupos: ['costas'] },
                { nome: 'C - Ombros', grupos: ['ombros'] },
                { nome: 'D - Braços', grupos: ['biceps', 'triceps'] },
                { nome: 'E - Pernas (Quadríceps)', grupos: ['quadriceps'] },
                { nome: 'F - Posterior e Core', grupos: ['posterior', 'panturrilha'] }
            ]
        };

        const split = workoutSplits[aiData.dias];

        split.forEach((workout, index) => {
            const exercises = this.generateExercisesForMuscleGroups(
                workout.grupos,
                aiData.nivel,
                aiData.objetivo,
                aiData.equipamentos,
                index + 1
            );

            workouts.push({
                id: letters[index],
                nome: workout.nome,
                foco: `Hipertrofia - ${workout.grupos.join(', ')}`,
                exercicios: exercises,
                concluido: false,
                execucoes: 0
            });
        });

        return workouts;
    }

    // Função para resetar configuração de tipos de plano
    resetPlanTypeConfiguration() {
        if (confirm('Tem certeza que deseja resetar a configuração de tipos de plano?')) {
            this.planTypeConfiguration.configuration = {};
            this.planTypeConfiguration.days = 3;

            // Remover do localStorage
            localStorage.removeItem('jsfitapp_plan_configuration');

            // Atualizar interface
            this.updatePlanConfigIndicators();

            this.showMessage('🔄 Configuração de tipos de plano resetada!', 'info');
        }
    }

    // Função para exportar configuração de tipos de plano
    exportPlanTypeConfiguration() {
        const config = {
            days: this.planTypeConfiguration.days,
            configuration: this.planTypeConfiguration.configuration,
            muscleGroups: this.planTypeConfiguration.muscleGroups,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `plan_configuration_${config.days}dias.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showMessage('📤 Configuração exportada com sucesso!', 'success');
    }


    // Função para duplicar configuração entre tipos de plano
    duplicatePlanConfiguration(fromDays, toDays) {
        const fromConfig = this.planTypeConfiguration.presetConfigurations[fromDays];
        if (!fromConfig) return;

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const newConfig = {};

        // Duplicar configuração existente
        for (let i = 0; i < Math.min(fromDays, toDays); i++) {
            const letter = letters[i];
            if (fromConfig[letter]) {
                newConfig[letter] = { ...fromConfig[letter] };
            }
        }

        // Adicionar treinos extras se necessário
        if (toDays > fromDays) {
            const remainingGroups = ['abdome', 'antebraco'];
            for (let i = fromDays; i < toDays; i++) {
                const letter = letters[i];
                newConfig[letter] = {
                    name: `Treino ${letter}`,
                    groups: remainingGroups.slice(0, 1) || ['corpo']
                };
            }
        }

        this.planTypeConfiguration.configuration = newConfig;
        this.planTypeConfiguration.days = toDays;
        this.savePlanTypeConfiguration();
    }

    // Função para validar configuração antes de gerar treinos
    validatePlanConfiguration() {
        const config = this.planTypeConfiguration.configuration;
        const days = this.planTypeConfiguration.days;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        const errors = [];
        const warnings = [];

        // Verificar se há configuração para todos os dias
        for (let i = 0; i < days; i++) {
            const letter = letters[i];
            if (!config[letter]) {
                errors.push(`Configuração faltando para Treino ${letter}`);
                continue;
            }

            // Verificar se há grupos selecionados
            if (!config[letter].groups || config[letter].groups.length === 0) {
                errors.push(`Treino ${letter} não tem grupos musculares selecionados`);
            }

            // Verificar se há nome
            if (!config[letter].name || config[letter].name.trim() === '') {
                warnings.push(`Treino ${letter} não tem nome definido`);
            }
        }

        // Verificar sobreposição de grupos
        const allGroups = [];
        Object.values(config).forEach(c => {
            if (c.groups) {
                allGroups.push(...c.groups);
            }
        });

        const groupCount = {};
        allGroups.forEach(group => {
            groupCount[group] = (groupCount[group] || 0) + 1;
        });

        Object.entries(groupCount).forEach(([group, count]) => {
            if (count > Math.ceil(days / 2)) {
                warnings.push(`Grupo ${group} está sendo trabalhado em muitos treinos (${count}/${days})`);
            }
        });

        return { errors, warnings, isValid: errors.length === 0 };
    }

    // Função para otimizar automaticamente a configuração
    optimizePlanConfiguration() {
        const days = this.planTypeConfiguration.days;
        const config = { ...this.planTypeConfiguration.configuration };

        // Aplicar otimizações baseadas em boas práticas
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        // Regras de otimização
        const optimizationRules = {
            2: {
                A: { preferredGroups: ['peito', 'ombro', 'triceps'], avoid: ['perna'] },
                B: { preferredGroups: ['perna', 'gluteo', 'costas', 'biceps'], avoid: ['peito'] }
            },
            3: {
                A: { preferredGroups: ['peito', 'triceps'], avoid: ['costas', 'biceps'] },
                B: { preferredGroups: ['costas', 'biceps'], avoid: ['peito', 'triceps'] },
                C: { preferredGroups: ['perna', 'gluteo', 'ombro'], avoid: [] }
            },
            4: {
                A: { preferredGroups: ['peito', 'triceps'], avoid: ['costas', 'biceps'] },
                B: { preferredGroups: ['costas', 'biceps'], avoid: ['peito', 'triceps'] },
                C: { preferredGroups: ['ombro'], avoid: [] },
                D: { preferredGroups: ['perna', 'gluteo'], avoid: [] }
            }
        };

        const rules = optimizationRules[days];
        if (!rules) return;

        // Aplicar regras
        Object.entries(rules).forEach(([letter, rule]) => {
            if (config[letter]) {
                // Remover grupos que devem ser evitados
                config[letter].groups = config[letter].groups.filter(
                    group => !rule.avoid.includes(group)
                );

                // Adicionar grupos preferidos se não existirem
                rule.preferredGroups.forEach(preferredGroup => {
                    if (!config[letter].groups.includes(preferredGroup)) {
                        // Verificar se não está em outro treino incompatível
                        const canAdd = true; // Lógica mais complexa pode ser adicionada aqui
                        if (canAdd) {
                            config[letter].groups.push(preferredGroup);
                        }
                    }
                });
            }
        });

        this.planTypeConfiguration.configuration = config;
        this.savePlanTypeConfiguration();
        this.showMessage('🔧 Configuração otimizada automaticamente!', 'success');
    }

    // Função para obter sugestões de configuração
    getPlanConfigurationSuggestions(days) {
        const suggestions = {
            1: [
                {
                    name: 'Corpo Inteiro Básico',
                    description: 'Treino completo para iniciantes',
                    config: {
                        A: { name: 'Treino Corpo Inteiro', groups: ['peito', 'costas', 'perna', 'ombro'] }
                    }
                },
                {
                    name: 'Corpo Inteiro Avançado',
                    description: 'Treino completo com todos os grupos',
                    config: {
                        A: { name: 'Treino Completo', groups: ['peito', 'costas', 'perna', 'ombro', 'biceps', 'triceps', 'abdome'] }
                    }
                }
            ],
            2: [
                {
                    name: 'Superior/Inferior',
                    description: 'Divisão clássica entre membros superiores e inferiores',
                    config: {
                        A: { name: 'Membros Superiores', groups: ['peito', 'costas', 'ombro', 'biceps', 'triceps'] },
                        B: { name: 'Membros Inferiores', groups: ['perna', 'gluteo', 'abdome'] }
                    }
                },
                {
                    name: 'Push/Pull',
                    description: 'Divisão por padrões de movimento',
                    config: {
                        A: { name: 'Empurrar + Pernas', groups: ['peito', 'ombro', 'triceps', 'perna'] },
                        B: { name: 'Puxar + Core', groups: ['costas', 'biceps', 'abdome', 'gluteo'] }
                    }
                }
            ],
            3: [
                {
                    name: 'Push/Pull/Legs',
                    description: 'Divisão clássica de 3 dias',
                    config: {
                        A: { name: 'Empurrar', groups: ['peito', 'ombro', 'triceps'] },
                        B: { name: 'Puxar', groups: ['costas', 'biceps'] },
                        C: { name: 'Pernas', groups: ['perna', 'gluteo', 'abdome'] }
                    }
                },
                {
                    name: 'Peito-Costas-Pernas',
                    description: 'Foco nos grandes grupos musculares',
                    config: {
                        A: { name: 'Peito e Tríceps', groups: ['peito', 'triceps'] },
                        B: { name: 'Costas e Bíceps', groups: ['costas', 'biceps'] },
                        C: { name: 'Pernas e Ombros', groups: ['perna', 'gluteo', 'ombro', 'abdome'] }
                    }
                }
            ]
        };

        return suggestions[days] || [];
    }

    saveInlineQuickConfig() {
        console.log('Salvando configuração inline...');
        
        // 1. CAPTURAR DIAS SELECIONADOS DA INTERFACE
        const activePlanBtn = document.querySelector('.plan-type-btn.active');
        if (!activePlanBtn) {
            this.showMessage('Erro: Nenhum tipo de plano selecionado', 'error');
            return false;
        }
        
        // Extrair número de dias do botão ativo
        const btnText = activePlanBtn.textContent.trim();
        const selectedDaysFromUI = parseInt(btnText.match(/(\d+)/)?.[1]) || 0;
        
        if (selectedDaysFromUI < 1 || selectedDaysFromUI > 6) {
            this.showMessage('Erro: Número de dias inválido', 'error');
            return false;
        }
        
        console.log(`Dias selecionados na interface: ${selectedDaysFromUI}`);
        
        // 2. SINCRONIZAR ESTADO INTERNO
        this.selectedDays = selectedDaysFromUI;
        this.planTypeConfiguration.days = selectedDaysFromUI;
        
        // 3. ATUALIZAR CONFIGURAÇÃO COM DADOS ATUAIS
        this.updateInlineConfigGroups();
        
        // 4. VALIDAR CONFIGURAÇÃO APENAS PARA OS DIAS SELECIONADOS
        const validation = this.validateInlineConfigurationForDays(selectedDaysFromUI);
        if (!validation.isValid) {
            this.showMessage(`Erro: ${validation.errors.join(', ')}`, 'error');
            return false;
        }
        
        // 5. LIMPAR CONFIGURAÇÕES EXTRAS (importante!)
        this.cleanupExtraWorkoutConfigs(selectedDaysFromUI);
    
        // 6. SALVAR CONFIGURAÇÃO
        try {
            this.savePlanTypeConfiguration();
            console.log('Configuração salva para', selectedDaysFromUI, 'dias:', this.planTypeConfiguration);
            
            // 7. FECHAR INTERFACE INLINE
            this.closeInlineQuickConfig();
            
            // 8. GERAR EDITOR COM CONFIGURAÇÃO CORRETA
            this.generateWorkoutEditorWithConfig(selectedDaysFromUI);
            
            // 9. ATUALIZAR INDICADORES VISUAIS
            this.updatePlanConfigIndicators();
            
            this.showMessage(`Configuração aplicada para ${selectedDaysFromUI} dias!`, 'success');
            return true;
            
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            this.showMessage('Erro ao salvar configuração', 'error');
            return false;
        }
    }

    // Validação específica para número de dias
validateInlineConfigurationForDays(targetDays) {
    const errors = [];
    const warnings = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    console.log(`Validando configuração para ${targetDays} dias`);
    
    // Verificar apenas os treinos necessários
    for (let i = 0; i < targetDays; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter];
        
        if (!config) {
            errors.push(`Configuração faltando para treino ${letter}`);
            continue;
        }
        
        if (!config.name || config.name.trim() === '') {
            warnings.push(`Treino ${letter} sem nome definido`);
            config.name = `Treino ${letter}`; // Corrigir automaticamente
        }
        
        if (!config.groups || config.groups.length === 0) {
            errors.push(`Treino ${letter} não tem grupos musculares selecionados`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0
    };
}

// Limpar configurações desnecessárias
cleanupExtraWorkoutConfigs(targetDays) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const configKeys = Object.keys(this.planTypeConfiguration.configuration);
    
    console.log(`Limpando configurações extras. Target: ${targetDays} dias`);
    
    // Remover configurações além do número de dias selecionados
    configKeys.forEach(key => {
        const letterIndex = letters.indexOf(key);
        if (letterIndex >= targetDays) {
            console.log(`Removendo configuração extra do treino ${key}`);
            delete this.planTypeConfiguration.configuration[key];
        }
    });
}



generateWorkoutEditorWithConfig(days) {
    console.log(`🔧 Gerando editor para ${days} dias`);
        // Verificar se days corresponde ao estado atual
        if (days !== this.selectedDays) {
            console.warn(`⚠️ Discrepância detectada: days=${days}, selectedDays=${this.selectedDays}`);
            days = this.selectedDays; // Usar o valor correto
        }
    const editor = document.getElementById('workoutEditor');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    console.log(`🔧 Gerando editor para ${days} dias`);
    


    let html = '<div class="form-section"><h2>🏋️ Treinos Configurados</h2>';

    this.currentPlan.treinos = [];

    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter];

        if (!config) {
            console.warn(`Configuração não encontrada para treino ${letter}`);
            continue;
        }

        const workout = {
            id: letter,
            nome: config.name,
            foco: this.generateWorkoutFocusFromGroups(config.groups),
            exercicios: [
                {
                    id: i * 10 + 1,
                    nome: 'Aquecimento',
                    descricao: 'Aquecimento específico para os grupos trabalhados',
                    series: 1,
                    repeticoes: '8-10 min',
                    carga: 'Leve',
                    descanso: '0',
                    observacoesEspeciais: '',
                    tecnica: '',
                    concluido: false
                }
            ],
            gruposMusculares: config.groups, // Novo campo
            concluido: false,
            execucoes: 0
        };

        this.currentPlan.treinos.push(workout);

        html += `
        <div class="workout-editor">
            <div class="workout-header">
                <h3 class="workout-title">${workout.nome}</h3>
                <div class="workout-muscle-groups">
                    ${config.groups.map(groupId => {
            const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
            return `<span class="muscle-group-badge">${group.icon} ${group.name}</span>`;
        }).join('')}
                </div>
                <button class="btn btn-primary btn-small" onclick="app.addExercise(${i})">
                    ➕ Adicionar Exercício
                </button>
            </div>
            <div class="exercise-list" id="exerciseList${i}">
                ${this.renderExercises(workout.exercicios, i)}
            </div>
        </div>
    `;
    }

    html += '</div>';
    editor.innerHTML = html;
    console.log(`✅ Editor gerado com ${this.currentPlan.treinos.length} treinos para ${days} dias`);

}


updateInlineConfigGroups() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    // Usar selectedDays em vez de planTypeConfiguration.days
    const days = this.selectedDays || this.planTypeConfiguration.days;
    
    console.log(`Atualizando configuração para ${days} dias...`);
    
    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        
        const checkboxes = document.querySelectorAll(`input[name="inline-${letter}"]:checked`);
        const selectedGroups = Array.from(checkboxes).map(cb => cb.value);
        
        const nameInput = document.querySelector(`input[onchange*="updateInlineConfigName('${letter}'"]`);
        const workoutName = nameInput ? nameInput.value.trim() : `Treino ${letter}`;
        
        if (!this.planTypeConfiguration.configuration[letter]) {
            this.planTypeConfiguration.configuration[letter] = { name: '', groups: [] };
        }
        
        this.planTypeConfiguration.configuration[letter].name = workoutName || `Treino ${letter}`;
        this.planTypeConfiguration.configuration[letter].groups = selectedGroups;
        
        console.log(`Treino ${letter}: ${workoutName} - Grupos: [${selectedGroups.join(', ')}]`);
    }
}

validateInlineConfiguration() {
    const errors = [];
    const warnings = [];
    const days = this.planTypeConfiguration.days;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Verificar cada treino configurado
    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter];
        
        if (!config) {
            errors.push(`Configuração missing para treino ${letter}`);
            continue;
        }
        
        // Verificar nome
        if (!config.name || config.name.trim() === '') {
            warnings.push(`Treino ${letter} sem nome definido`);
            config.name = `Treino ${letter}`; // Aplicar nome padrão
        }
        
        // Verificar grupos
        if (!config.groups || config.groups.length === 0) {
            errors.push(`Treino ${letter} não tem grupos musculares selecionados`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0
    };
}
    
    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        } else {
            console.warn(`Campo ${fieldId} não encontrado`);
        }
    }
    
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
    
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
    
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
    
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    
        return obj;
    }
    
    cancelEdit() {
        if (this.isEditing) {
            const confirmCancel = confirm(
                'Tem certeza que deseja cancelar a edição? Todas as alterações não salvas serão perdidas.'
            );
            
            if (!confirmCancel) {
                return;
            }
        }
    
        // Resetar estado de edição
        this.isEditing = false;
        this.currentPlan = {
            id: null,
            nome: '',
            aluno: { nome: '', idade: 25, altura: '1,75m', peso: '75kg' },
            dias: 1,
            dataInicio: '',
            dataFim: '',
            perfil: { objetivo: 'Hipertrofia e ganho de massa muscular' },
            observacoes: {},
            treinos: []
        };
    
        // Ocultar botão de cancelar
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    
        // Limpar campo de ID
        const currentPlanIdField = document.getElementById('currentPlanId');
        if (currentPlanIdField) {
            currentPlanIdField.value = '';
        }
    
        // Voltar para lista de planos
        this.showPlanList();
        this.showMessage('Edição cancelada', 'info');
        
        console.log('Edição cancelada, voltando para lista de planos');
    }


    resetPlanForm() {
        console.log('Resetando formulário de plano');
    
        // Resetar todos os campos de input, textarea e select do formulário
        const planCreatorInputs = document.querySelectorAll('#planCreator input, #planCreator textarea, #planCreator select');
        planCreatorInputs.forEach(input => {
            if (input.type === 'number') {
                input.value = input.placeholder || '';
            } else if (input.type === 'date') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0; // Primeira opção
            } else {
                input.value = '';
            }
        });
    
        // Definir datas padrão (hoje + 6 meses)
        this.setDefaultDates();
    
        // Resetar estado do plano atual
        this.currentPlan = {
            id: null,
            nome: '',
            aluno: { 
                nome: '', 
                idade: 25, 
                altura: '1,75m', 
                peso: '75kg',
                dataNascimento: '',
                cpf: ''
            },
            dias: 1,
            dataInicio: '',
            dataFim: '',
            perfil: { 
                objetivo: 'Hipertrofia e ganho de massa muscular',
                idade: 25,
                altura: '1,75m',
                peso: '75kg',
                porte: 'médio'
            },
            observacoes: {},
            treinos: []
        };
    
        // Resetar configurações de tipo de plano
        this.selectedDays = 1;
        this.planTypeConfiguration.days = 1;
    
        // Resetar estado de edição
        this.isEditing = false;
    
        // Ocultar botão de cancelar edição
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    
        // Limpar campo de ID oculto
        const currentPlanIdField = document.getElementById('currentPlanId');
        if (currentPlanIdField) {
            currentPlanIdField.value = '';
        }
    
        // Resetar seleção de tipo de plano (ativar primeiro botão)
        this.resetPlanTypeSelection();
    
        // Limpar editor de treinos
        const workoutEditor = document.getElementById('workoutEditor');
        if (workoutEditor) {
            workoutEditor.innerHTML = '';
        }
    
        // Resetar configuração inline se estiver visível
        this.closeInlineQuickConfig();
    
        // Resetar filtros de exercícios
        this.resetExerciseFilters();
    
        console.log('Formulário de plano resetado completamente');
    }
    
    resetPlanTypeSelection() {
        // Remover active de todos os botões
        document.querySelectorAll('.plan-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    
        // Ativar primeiro botão (1 dia)
        const firstBtn = document.querySelector('.plan-type-btn:first-child');
        if (firstBtn) {
            firstBtn.classList.add('active');
        }
    
        // Resetar configuração de tipos de plano para padrão
        this.planTypeConfiguration.configuration = {};
        this.planTypeConfiguration.days = 1;
    
        // Atualizar indicadores visuais
        setTimeout(() => {
            this.updatePlanConfigIndicators();
        }, 100);
    }
    
    resetExerciseFilters() {
        // Resetar filtro de grupos musculares
        const groupFilter = document.getElementById('exerciseGroupFilter');
        if (groupFilter) {
            groupFilter.value = 'todos';
        }
    
        // Re-popular os selects de exercícios
        setTimeout(() => {
            this.populateGroupFilter();
            this.populateExerciseSelect('todos');
        }, 100);
    }
    
    // Método auxiliar para definir valores padrão em campos específicos
    setDefaultFieldValues() {
        // Objetivo padrão
        const objectiveField = document.getElementById('planObjective');
        if (objectiveField) {
            objectiveField.value = 'Hipertrofia e ganho de massa muscular';
        }
    
        // Altura e peso padrão se estiverem vazios
        const heightField = document.getElementById('studentHeight');
        if (heightField && !heightField.value) {
            heightField.placeholder = '1,75m';
        }
    
        const weightField = document.getElementById('studentWeight');
        if (weightField && !weightField.value) {
            weightField.placeholder = '75kg';
        }
    
        console.log('Valores padrão definidos nos campos');
    }
    
    // Método para validar se o reset foi bem sucedido
    validateReset() {
        const issues = [];
    
        // Verificar se campos principais estão vazios
        const nameField = document.getElementById('studentName');
        if (nameField && nameField.value !== '') {
            issues.push('Nome do estudante não foi limpo');
        }
    
        const planNameField = document.getElementById('planName');
        if (planNameField && planNameField.value !== '') {
            issues.push('Nome do plano não foi limpo');
        }
    
        // Verificar se estado interno foi resetado
        if (this.isEditing) {
            issues.push('Estado de edição não foi resetado');
        }
    
        if (this.currentPlan.treinos.length > 0) {
            issues.push('Treinos não foram limpos');
        }
    
        if (issues.length > 0) {
            console.warn('Problemas detectados no reset:', issues);
            return false;
        }
    
        console.log('Reset validado com sucesso');
        return true;
    }
    
    // Método para reset completo com validação
    performFullReset() {
        this.resetPlanForm();
        this.setDefaultFieldValues();
        
        // Validar reset
        const isValid = this.validateReset();
        
        if (!isValid) {
            console.error('Reset não foi executado corretamente');
            // Tentar reset novamente
            setTimeout(() => {
                this.resetPlanForm();
            }, 100);
        }
        
        return isValid;
    }


    closeInlineEditor() {
        // Remover editor do DOM
        const editor = document.querySelector('.exercise-inline-editor');
        if (editor) {
            editor.remove();
        }
        
        // Remover classe do body
        document.body.classList.remove('editor-fullscreen');
        
        // Restaurar posição do scroll
        if (this.currentScrollPosition !== undefined) {
            setTimeout(() => {
                window.scrollTo(0, this.currentScrollPosition);
            }, 100);
        }
        
        // NÃO RESETAR ÍNDICES IMEDIATAMENTE - deixar para depois da atualização
        // this.currentWorkoutIndex = null;
        // this.currentExerciseIndex = null;
        
        // Garantir que a tela de criação esteja visível
        const planCreator = document.getElementById('planCreator');
        if (planCreator && planCreator.style.display === 'none') {
            planCreator.style.display = 'block';
        }
        
        console.log('Editor inline fechado');
    }

    clearEditingIndices() {
        this.currentWorkoutIndex = null;
        this.currentExerciseIndex = null;
    }

updateTechniqueDescription() {
    const techniqueSelect = document.getElementById('exerciseTechnique');
    const descriptionGroup = document.getElementById('techniqueDescriptionGroup');
    const descriptionTextarea = document.getElementById('techniqueDescription');

    if (!techniqueSelect || !descriptionGroup || !descriptionTextarea) {
        console.warn('Elementos da técnica não encontrados');
        return;
    }

    const selectedTechnique = techniqueSelect.value;

    if (selectedTechnique && this.tecnicasDatabase[selectedTechnique]) {
        // Mostrar descrição da técnica
        descriptionGroup.style.display = 'flex';
        descriptionTextarea.value = this.tecnicasDatabase[selectedTechnique];
        
        console.log(`Técnica selecionada: ${selectedTechnique}`);
    } else {
        // Ocultar descrição se nenhuma técnica selecionada
        descriptionGroup.style.display = 'none';
        descriptionTextarea.value = '';
    }
}

// =============================================
// MÉTODOS STUB IMPLEMENTADOS PARA PERSONAL.JS
// =============================================

async loadPlanTypeConfiguration() {
    try {
        console.log('⚙️ Carregando configuração de tipos de plano...');
        
        // REMOVER tentativa do Firebase por enquanto
        // Usar apenas localStorage
        if (this.isUserAuthenticated) {
            const configKey = this.getConfigStorageKey();
            const stored = localStorage.getItem(configKey);
            if (stored) {
                const config = JSON.parse(stored);
                if (config.userId === this.currentUserId) {
                    this.planTypeConfiguration.days = config.days || 3;
                    this.planTypeConfiguration.configuration = config.configuration || {};
                    console.log('✅ Configuração carregada do localStorage');
                    return;
                }
            }
        }
        
        // Usar configuração padrão
        console.log('ℹ️ Usando configuração padrão');
        this.planTypeConfiguration.days = 3;
        this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3] || {};
        
    } catch (error) {
        console.error('❌ Erro ao carregar configuração:', error);
        // Garantir valores padrão mesmo com erro
        this.planTypeConfiguration.days = 3;
        this.planTypeConfiguration.configuration = {};
    }
}

// Método auxiliar para carregar do Firebase (se disponível)
async loadPlanConfigFromFirebase() {
    try {
        // Simular estrutura do Firebase - ajustar conforme implementação real
        if (!window.db) return null;
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const configRef = doc(window.db, 'plan_configurations', 'default');
        const configDoc = await getDoc(configRef);
        
        if (configDoc.exists()) {
            return configDoc.data();
        }
        
        return null;
        
    } catch (error) {
        console.error('Erro ao carregar configuração do Firebase:', error);
        return null;
    }
}

// Método auxiliar para migrar configuração para Firebase
async migratePlanConfigToFirebase(localConfig) {
    try {
        if (!window.db) return;
        
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const configData = {
            ...localConfig,
            migratedAt: new Date(),
            migrated_from_local: true
        };
        
        const configRef = doc(window.db, 'plan_configurations', 'default');
        await setDoc(configRef, configData, { merge: true });
        
        console.log('Configuração migrada para Firebase');
        
    } catch (error) {
        console.warn('Erro na migração para Firebase:', error);
    }
}

async savePlan() {

    return this.loadingManager.withLoading(
    '💾 Salvando Plano',
    'Preparando dados...',
    async () => {
        try {
                      // Atualizar progresso durante o salvamento
                      this.loadingManager.updateProgress(25, 'Validando dados...');
      
            try {
                console.log('💾 Iniciando processo de salvamento do plano...');
                
                // 1. VERIFICAÇÃO OBRIGATÓRIA DE AUTENTICAÇÃO
                if (!this.isUserAuthenticated || !this.currentUserId) {
                    this.showMessage('Você precisa estar logado para salvar planos', 'error');
                    this.showAuthenticationScreen();
                    return;
                }
                
                console.log(`👤 Salvando plano para usuário: ${this.currentUserId}`);
                
                // 2. OBTER DADOS DO FORMULÁRIO
                const currentPlanId = document.getElementById('currentPlanId')?.value;
                const isEditingPlan = this.isEditing && currentPlanId;
                
                const birthDate = document.getElementById('studentBirthDate')?.value;
                const calculatedAge = birthDate ? this.calculateAge(birthDate) : 25;
                
                // 3. CONSTRUIR OBJETO DO PLANO COM DADOS OBRIGATÓRIOS
                const planData = {
                    // ID: manter existente se editando, senão será gerado
                    id: isEditingPlan ? currentPlanId : null,
                    
                    // DADOS OBRIGATÓRIOS DE USUÁRIO
                    userId: this.currentUserId,  // ESSENCIAL
                    userEmail: this.userEmail || 'unknown',
                    userDisplayName: this.userDisplayName || 'Usuário',
                    
                    // DADOS DO PLANO
                    nome: document.getElementById('planName')?.value?.trim() || '',
                    
                    // DADOS DO ALUNO
                    aluno: {
                        nome: document.getElementById('studentName')?.value?.trim() || '',
                        dataNascimento: birthDate || '',
                        cpf: document.getElementById('studentCpf')?.value?.trim() || '',
                        idade: calculatedAge,
                        altura: document.getElementById('studentHeight')?.value?.trim() || '1,75m',
                        peso: document.getElementById('studentWeight')?.value?.trim() || '75kg'
                    },
                    
                    // CONFIGURAÇÕES DO PLANO
                    dias: this.selectedDays || 1,
                    dataInicio: document.getElementById('planStartDate')?.value || new Date().toISOString().split('T')[0],
                    dataFim: document.getElementById('planEndDate')?.value || '',
                    
                    // PERFIL DERIVADO
                    perfil: {
                        idade: calculatedAge,
                        altura: document.getElementById('studentHeight')?.value?.trim() || '1,75m',
                        peso: document.getElementById('studentWeight')?.value?.trim() || '75kg',
                        porte: this.calculateBodyType(
                            document.getElementById('studentHeight')?.value || '1,75m',
                            document.getElementById('studentWeight')?.value || '75kg'
                        ),
                        objetivo: document.getElementById('planObjective')?.value || 'Condicionamento geral'
                    },
                    
                    // TREINOS (cópia profunda para evitar referências)
                    treinos: JSON.parse(JSON.stringify(this.currentPlan?.treinos || [])),
                    
                    // OBSERVAÇÕES
                    observacoes: {
                        geral: document.getElementById('planObservations')?.value?.trim() || ''
                    },
                    
                    // METADADOS DE CONTROLE
                    created_at: isEditingPlan ? 
                        (this.currentPlan?.created_at || new Date().toISOString()) : 
                        new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    version: '2.0'
                };
                
                // 4. VALIDAÇÕES ESSENCIAIS
                if (!planData.nome) {
                    this.showMessage('Nome do plano é obrigatório', 'error');
                    document.getElementById('planName')?.focus();
                    return;
                }
                
                if (!planData.aluno.nome) {
                    this.showMessage('Nome do aluno é obrigatório', 'error');
                    document.getElementById('studentName')?.focus();
                    return;
                }
                
                if (!planData.treinos || planData.treinos.length === 0) {
                    this.showMessage('O plano deve ter pelo menos um treino configurado', 'error');
                    return;
                }
                
                console.log('✅ Dados validados:', {
                    nome: planData.nome,
                    aluno: planData.aluno.nome,
                    userId: planData.userId,
                    treinos: planData.treinos.length
                });
                
                // 5. DEBUG FIREBASE - AGORA COM planData DISPONÍVEL
                console.log('🔍 DEBUG SAVE - Estado inicial:');
                console.log('- Core existe:', !!this.core);
                console.log('- Firebase conectado:', this.core?.firebaseConnected);
                console.log('- Método savePlanToFirebase existe:', typeof this.core?.savePlanToFirebase);
                console.log('- UserID atual:', this.currentUserId);
                console.log('- Dados do plano:', {
                    nome: planData.nome,
                    userId: planData.userId,
                    treinos: planData.treinos?.length
                });
                
                // 6. INICIAR PROCESSO DE SALVAMENTO
                this.showMessage('Salvando plano...', 'info');
                
                let firebaseSuccess = false;
                let firebaseId = null;
                let localBackupSuccess = false;
                
                // 7. TENTATIVA DE SALVAMENTO NO FIREBASE (PRIORITÁRIO)
                if (this.core) {
                    try {
                        console.log('🔥 Tentando salvar no Firebase...');
                        
                        // Verificar conexão Firebase
                        if (!this.core.firebaseConnected) {
                            console.log('🔄 Firebase desconectado, tentando reconectar...');
                            await this.core.initializeFirebase();
                        }
                        
                        // Verificar autenticação Firebase
                        const firebaseUserId = this.core.getUserId();
                        if (!firebaseUserId) {
                            throw new Error('Usuário não autenticado no Firebase');
                        }
                        
                        if (firebaseUserId !== this.currentUserId) {
                            console.warn('⚠️ Discrepância de userId:', {
                                local: this.currentUserId,
                                firebase: firebaseUserId
                            });
                            // Usar o ID do Firebase como autoridade
                            planData.userId = firebaseUserId;
                            this.currentUserId = firebaseUserId;
                        }
                        
                        // Salvar no Firebase
                        console.log('💾 Salvando no Firebase...');
                        firebaseId = await this.core.savePlanToFirebase(planData);
                        
                        // Atualizar dados do plano com resposta do Firebase
                        planData.id = firebaseId;
                        planData.saved_in_firebase = true;
                        planData.firebase_timestamp = new Date().toISOString();
                        planData.sync_status = 'synced';
                        
                        firebaseSuccess = true;
                        console.log(`✅ Plano salvo no Firebase: ${firebaseId}`);
                        
                    } catch (firebaseError) {
                        console.error('❌ Erro ao salvar no Firebase:', firebaseError);
                        
                        // Marcar para retry posterior
                        planData.firebase_save_failed = true;
                        planData.firebase_error = firebaseError.message;
                        planData.firebase_error_code = firebaseError.code || 'unknown';
                        planData.retry_firebase = true;
                        planData.sync_status = 'pending';
                        
                        firebaseSuccess = false;
                    }
                } else {
                    console.warn('⚠️ JSFitCore não disponível');
                    planData.core_missing = true;
                    planData.sync_status = 'core_unavailable';
                }
                
                // 8. BACKUP LOCAL OBRIGATÓRIO (SEMPRE EXECUTAR)
                try {
                    console.log('💿 Criando backup local...');
                    
                    // Gerar ID local se necessário
                    if (!planData.id) {
                        planData.id = this.generateLocalId();
                        planData.local_id_generated = true;
                    }
                    
                    // Marcar origem dos dados
                    if (firebaseSuccess) {
                        planData.backup_in_localstorage = true;
                        planData.primary_source = 'firebase';
                    } else {
                        planData.saved_in_localstorage_only = true;
                        planData.needs_firebase_sync = true;
                        planData.primary_source = 'localstorage';
                    }
                    
                    // Atualizar lista em memória
                    if (isEditingPlan) {
                        const existingIndex = this.savedPlans.findIndex(p => 
                            p.id === planData.id || (currentPlanId && p.id === currentPlanId)
                        );
                        
                        if (existingIndex >= 0) {
                            // Preservar dados de criação original
                            const existingPlan = this.savedPlans[existingIndex];
                            planData.original_created_at = existingPlan.created_at;
                            planData.edit_count = (existingPlan.edit_count || 0) + 1;
                            planData.edited_at = new Date().toISOString();
                            
                            this.savedPlans[existingIndex] = planData;
                            console.log('🔄 Plano existente atualizado na lista');
                        } else {
                            // Plano não encontrado na lista, adicionar
                            this.savedPlans.push(planData);
                            console.log('➕ Plano adicionado à lista (não encontrado para edição)');
                        }
                    } else {
                        // Novo plano
                        planData.edit_count = 0;
                        this.savedPlans.push(planData);
                        console.log('🆕 Novo plano adicionado à lista');
                    }
                    
                    // Salvar no localStorage específico do usuário
                    await this.saveToUserLocalStorage();
                    localBackupSuccess = true;
                    
                    console.log('✅ Backup local criado com sucesso');
                    
                } catch (localError) {
                    console.error('❌ ERRO CRÍTICO no backup local:', localError);
                    
                    if (!firebaseSuccess) {
                        this.showMessage('ERRO CRÍTICO: Não foi possível salvar o plano!', 'error');
                        return;
                    } else {
                        console.warn('⚠️ Backup local falhou, mas Firebase foi bem-sucedido');
                        localBackupSuccess = false;
                    }
                }
                
                // 9. FINALIZAÇÃO E LIMPEZA
                this.isEditing = false;
                this.currentPlan = this.getEmptyPlan();
                
                // Ocultar botão de cancelar edição
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
                
                // Limpar campo de ID
                const currentPlanIdField = document.getElementById('currentPlanId');
                if (currentPlanIdField) {
                    currentPlanIdField.value = '';
                }
                
                // 10. MENSAGEM DE RESULTADO
                if (firebaseSuccess && localBackupSuccess) {
                    this.showMessage('Plano salvo com sucesso no Firebase!', 'success');
                    console.log('🎉 Salvamento completo: Firebase + Backup local');
                } else if (firebaseSuccess) {
                    this.showMessage('Plano salvo no Firebase (backup local falhou)', 'warning');
                    console.log('⚠️ Salvamento parcial: Firebase OK, backup local falhou');
                } else if (localBackupSuccess) {
                    this.showMessage('Plano salvo localmente (Firebase indisponível)', 'warning');
                    console.log('💿 Salvamento local: Firebase falhou, backup local OK');
                    
                    // Agendar retry do Firebase
                    if (typeof this.scheduleFirebaseRetry === 'function') {
                        this.scheduleFirebaseRetry(planData.id);
                    }
                } else {
                    this.showMessage('Erro crítico: não foi possível salvar o plano', 'error');
                    console.error('💥 Falha total no salvamento');
                    return;
                }
                
                // 11. LOG FINAL E NAVEGAÇÃO
                console.log('📊 Resultado do salvamento:', {
                    planId: planData.id,
                    planName: planData.nome,
                    userId: planData.userId,
                    firebaseSuccess: firebaseSuccess,
                    localBackupSuccess: localBackupSuccess,
                    isEditing: isEditingPlan,
                    timestamp: new Date().toISOString()
                });
                
                // Voltar para lista de planos
                setTimeout(() => {
                    this.showPlanList();
                }, 1500);
                
            } catch (criticalError) {
                console.error('💥 ERRO CRÍTICO no savePlan:', criticalError);
                this.showMessage(`Erro crítico ao salvar: ${criticalError.message}`, 'error');
                
                // Log detalhado para debug
                console.error('🔍 Detalhes do erro crítico:', {
                    message: criticalError.message,
                    stack: criticalError.stack,
                    userId: this.currentUserId,
                    isAuthenticated: this.isUserAuthenticated,
                    timestamp: new Date().toISOString()
                });
            }
            // ... todo o código existente do savePlan ...
 1           
        
            // ... validações ...
            
            this.loadingManager.updateProgress(50, 'Salvando no Firebase...');
            
            // ... salvamento Firebase ...
            
            this.loadingManager.updateProgress(75, 'Criando backup local...');
            
            // ... backup local ...
            
            this.loadingManager.updateProgress(100, 'Concluído!');
            
        } catch (error) {
            // Error já será tratado pelo withLoading
            throw error;
        }
    }

)
}

// Método auxiliar para gerar ID local
generateLocalId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


// ====================================
// MÉTODOS COM CONTROLE DE USUÁRIO
// ====================================

async showPlanList() {

    return this.loadingManager.withLoading(
        '📋 Carregando Planos',
        'Buscando seus treinos...',
        async () => {
            try {
                
                
                this.loadingManager.updateProgress(30, 'Verificando autenticação...');
                try {
                    console.log('📋 Iniciando showPlanList...');
                    this.ensureCoreAvailable()
                    
                    // CORREÇÃO CRÍTICA: Sempre obter userId atual dinamicamente
                    const currentUserId = this.getUserId() || 
                                         window.authManager?.getCurrentUser()?.uid ||
                                         window.firebaseAuth?.currentUser?.uid;
                    
                    const isAuthenticated = !!(currentUserId && 
                                             (window.authManager?.isUserAuthenticated() || 
                                              window.firebaseAuth?.currentUser));
                    
                    if (!currentUserId || !isAuthenticated) {
                        console.warn('❌ Usuário não autenticado para visualizar planos');
                        this.showMessage('Você precisa estar logado para ver seus planos', 'warning');
                        this.showAuthenticationScreen();
                        return;
                    }
                    
                    // ATUALIZAR propriedades da classe com dados atuais
                    this.currentUserId = currentUserId;
                    this.isUserAuthenticated = isAuthenticated;
                    this.userEmail = window.authManager?.getCurrentUser()?.email || 
                                    window.firebaseAuth?.currentUser?.email || 
                                    'unknown';
                    this.userDisplayName = window.authManager?.getCurrentUser()?.displayName ||
                                          this.userEmail?.split('@')[0] ||
                                          'Usuário';
                    
                    console.log(`👤 Carregando planos para usuário: ${currentUserId}`);
                    
                    // LIMPAR dados anteriores sempre
                    this.savedPlans = [];
                    
                    // Carregar planos específicos do usuário atual
                    try {
                        // Prioridade 1: Firebase com filtro rigoroso por usuário
                        if (this.core && this.core.firebaseConnected) {
                            console.log('🔥 Carregando do Firebase...');
                            const firebasePlans = await this.core.loadPlansFromFirebase();
                            
                            if (firebasePlans && Array.isArray(firebasePlans)) {
                                // FILTRO RIGOROSO: só planos do usuário atual
                                this.savedPlans = firebasePlans.filter(plan => 
                                    plan.userId === currentUserId
                                );
                                console.log(`✅ ${this.savedPlans.length} planos carregados do Firebase`);
                                
                                // Criar backup local
                                await this.saveToUserLocalStorage();
                            } else {
                                console.log('ℹ️ Nenhum plano encontrado no Firebase');
                            }
                        } else {
                            console.warn('⚠️ Firebase não conectado, carregando do localStorage');
                            await this.loadFromUserLocalStorage();
                        }
                    } catch (loadError) {
                        console.error('❌ Erro ao carregar planos:', loadError);
                        this.savedPlans = [];
                    }
                    
                    console.log(`📊 Exibindo ${this.savedPlans.length} planos do usuário`);
                    
                    // Navegação
                    document.getElementById('planCreator').style.display = 'none';
                    document.getElementById('aiPlanCreator').style.display = 'none';
                    document.getElementById('planDetails').style.display = 'none';
                    document.getElementById('planList').style.display = 'block';
                    
                    // Renderizar lista
                    this.renderPlanList();
                    
                    console.log('✅ showPlanList concluído');
                    
                } catch (error) {
                    console.error('❌ Erro em showPlanList:', error);
                    this.showMessage('Erro ao carregar lista de planos', 'error');
                    this.savedPlans = [];
                    this.renderPlanList();
                }
            
                
                this.loadingManager.updateProgress(60, 'Carregando do Firebase...');
                // ... carregamento Firebase ...
                
                this.loadingManager.updateProgress(80, 'Atualizando interface...');
                // ... renderização ...
                
                this.loadingManager.updateProgress(100, 'Pronto!');
                
            } catch (error) {
                throw error;
            }
        }
    );

}


async loadUserSpecificPlans() {
    try {
        console.log(`🔄 Carregando planos específicos para usuário: ${this.currentUserId}`);
        
        // PRIORIDADE 1: Firebase com filtro de usuário
        if (this.core && this.core.firebaseConnected) {
            try {
                const firebasePlans = await this.core.loadPlansFromFirebase();
                if (firebasePlans && Array.isArray(firebasePlans)) {
                    // Filtro duplo de segurança
                    this.savedPlans = firebasePlans.filter(plan => 
                        plan.userId === this.currentUserId
                    );
                    console.log(`✅ ${this.savedPlans.length} planos carregados do Firebase`);
                    
                    // Criar backup local
                    await this.saveToUserLocalStorage();
                    return;
                }
            } catch (firebaseError) {
                console.warn('⚠️ Erro Firebase, usando localStorage:', firebaseError);
            }
        }
        
        // PRIORIDADE 2: localStorage específico do usuário
        await this.loadFromUserLocalStorage();
        
    } catch (error) {
        console.error('❌ Erro ao carregar planos do usuário:', error);
        this.savedPlans = [];
    }
}

// Método auxiliar para carregar do localStorage do usuário específico
async loadFromUserLocalStorage() {
    try {
        const key = `jsfitapp_plans_${this.currentUserId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            const data = JSON.parse(stored);
            
            // Verificar se os dados são do usuário correto
            if (data.userId === this.currentUserId && data.plans) {
                this.savedPlans = data.plans.filter(plan => 
                    plan.userId === this.currentUserId
                );
                console.log(`✅ ${this.savedPlans.length} planos carregados do localStorage`);
            } else {
                console.warn('⚠️ Dados localStorage não correspondem ao usuário');
                this.savedPlans = [];
            }
        } else {
            console.log('ℹ️ Nenhum backup local encontrado');
            this.savedPlans = [];
        }
    } catch (error) {
        console.error('❌ Erro ao carregar localStorage:', error);
        this.savedPlans = [];
    }
}

viewPlan(planId) {
    try {
        // VERIFICAÇÃO DE AUTENTICAÇÃO
        if (!this.canPerformAction()) return;
        
        console.log(`👁️ Visualizando plano: ${planId}`);
        
        // Buscar plano NA LISTA DO USUÁRIO ATUAL
        const plan = this.savedPlans.find(p => 
            p.id === planId && p.userId === this.currentUserId
        );
        
        if (!plan) {
            console.warn(`❌ Plano ${planId} não encontrado ou não pertence ao usuário`);
            this.showMessage('Plano não encontrado ou você não tem permissão para visualizá-lo', 'error');
            return;
        }
        
        console.log(`✅ Exibindo plano: ${plan.nome} (Usuário: ${plan.userId})`);
    
        // Ocultar outras telas
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('aiPlanCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
    
        // Mostrar tela de detalhes
        const planDetailsDiv = document.getElementById('planDetails');
        planDetailsDiv.style.display = 'block';
    
        // Preencher título
        document.getElementById('planDetailsTitle').textContent = plan.nome;
    
        // Gerar conteúdo detalhado
        let content = this.generatePlanGeneralInfo(plan);
        
        if (plan.treinos && plan.treinos.length > 0) {
            content += this.generatePlanWorkoutTabs(plan);
            content += this.generatePlanWorkoutContents(plan);
        }
        
        if (plan.tecnicas_aplicadas && Object.keys(plan.tecnicas_aplicadas).length > 0) {
            content += this.generatePlanTechniques(plan);
        }
        
        if (plan.observacoes) {
            content += this.generatePlanObservations(plan);
        }
        
        document.getElementById('planDetailsContent').innerHTML = content;
        
    } catch (error) {
        console.error('❌ Erro ao visualizar plano:', error);
        this.showMessage('Erro ao abrir plano para visualização', 'error');
    }
}

editPlan(planId) {
    try {
        // VERIFICAÇÃO DE AUTENTICAÇÃO
        if (!this.canPerformAction()) return;
        
        console.log(`✏️ Iniciando edição do plano: ${planId}`);
        console.log(`🔍 DEBUG - currentUserId: ${this.currentUserId}`);
        console.log(`🔍 DEBUG - savedPlans total: ${this.savedPlans.length}`);
        
        // DIAGNÓSTICO: Mostrar todos os planos e seus userIds
        this.savedPlans.forEach((p, index) => {
            console.log(`🔍 Plano ${index}: ID=${p.id}, UserID=${p.userId}, Nome=${p.nome}`);
        });
        
        // BUSCA MAIS FLEXÍVEL - PRIMEIRO SÓ POR ID
        let plan = this.savedPlans.find(p => p.id === planId);
        
        if (!plan) {
            console.warn(`❌ Plano ${planId} não encontrado na lista`);
            this.showMessage('Plano não encontrado', 'error');
            return;
        }
        
        // VERIFICAÇÃO SECUNDÁRIA DE USUÁRIO (mais tolerante)
        if (plan.userId && plan.userId !== this.currentUserId) {
            console.warn(`⚠️ UserID mismatch: plano=${plan.userId}, atual=${this.currentUserId}`);
            
            // TENTAR CORRIGIR AUTOMATICAMENTE se os dados vieram do Firebase
            if (plan.saved_in_firebase || plan.loaded_from_firebase) {
                console.log(`🔧 Tentando corrigir userId do plano automaticamente`);
                plan.userId = this.currentUserId;
                // Salvar correção
                this.saveToUserLocalStorage();
            } else {
                this.showMessage('Plano não pertence ao usuário atual', 'error');
                return;
            }
        }
        
        console.log(`✅ Carregando plano para edição: ${plan.nome} (Usuário: ${plan.userId})`);
        
        // Chamar método de edição existente
        this.showPlanCreator(planId);
        
    } catch (error) {
        console.error('❌ Erro ao iniciar edição:', error);
        this.showMessage('Erro ao carregar plano para edição', 'error');
    }
}


async sharePlan(planId) {
    try {
        // VERIFICAÇÃO DE AUTENTICAÇÃO
        if (!this.canPerformAction()) return;
        
        console.log(`🔗 Iniciando compartilhamento do plano: ${planId}`);
        
        // Buscar plano NA LISTA DO USUÁRIO ATUAL
        const plan = this.savedPlans.find(p => 
            p.id === planId && p.userId === this.currentUserId
        );
        
        if (!plan) {
            console.warn(`❌ Plano ${planId} não encontrado ou não pertence ao usuário`);
            this.showMessage('Plano não encontrado ou você não tem permissão para compartilhá-lo', 'error');
            return;
        }

        // Verificar se já está compartilhado
        if (plan.shareId) {
            this.showMessage(`Plano "${plan.nome}" já está compartilhado`, 'info');
            this.showQuickShareInfo(plan.shareId, plan.nome);
            return;
        }

        console.log(`🔗 Preparando compartilhamento: ${plan.nome} (Usuário: ${plan.userId})`);
        this.showMessage('Preparando plano para compartilhamento...', 'info');

        // Validações do plano
        if (!plan.nome || !plan.aluno?.nome) {
            this.showMessage('Plano deve ter nome e nome do aluno para ser compartilhado', 'warning');
            return;
        }

        if (!plan.treinos || plan.treinos.length === 0) {
            this.showMessage('Plano deve ter pelo menos um treino para ser compartilhado', 'warning');
            return;
        }

        // Preparar dados para compartilhamento (remover dados sensíveis)
        const sharedPlan = this.preparePlanForSharing(plan);

        // Gerar ID de compartilhamento
        const shareId = this.generateShareId();

        // Verificar Firebase
        if (!this.core || !this.core.firebaseConnected) {
            this.showMessage('Compartilhamento requer conexão com Firebase', 'error');
            return;
        }

        // Salvar no Firebase
        await this.saveSharedPlanToFirebase(shareId, sharedPlan);

        // Atualizar plano local com ID de compartilhamento
        plan.shareId = shareId;
        plan.sharedAt = new Date().toISOString();
        plan.sharedBy = this.currentUserId;

        // Salvar alteração
        await this.saveToUserLocalStorage();
        
        // Atualizar no Firebase se possível
        if (this.core.firebaseConnected) {
            try {
                await this.core.savePlanToFirebase(plan);
                console.log('✅ Plano atualizado no Firebase com shareId');
            } catch (updateError) {
                console.warn('⚠️ Erro ao atualizar plano no Firebase:', updateError);
            }
        }

        // Mostrar resultado
        this.showQuickShareInfo(shareId, plan.nome);
        this.renderPlanList(); // Recarregar lista para mostrar novo status

        console.log(`✅ Plano compartilhado: ${plan.nome} (ID: ${shareId})`);

    } catch (error) {
        console.error('❌ Erro ao compartilhar plano:', error);
        this.showMessage(`Erro ao compartilhar: ${error.message}`, 'error');
    }
}



// MÉTODO AUXILIAR: BUSCA INTELIGENTE DO CORE
// ========================================
async findAndValidateCore() {
    // 1. Verificar this.core
    if (this.core && this.isValidCoreInstance(this.core)) {
        if (this.core.firebaseConnected) {
            return this.core;
        }
        // Tentar reconectar
        try {
            await this.core.initializeFirebase();
            if (this.core.firebaseConnected) {
                return this.core;
            }
        } catch (reconnectError) {
            console.warn('Erro ao reconectar this.core:', reconnectError);
        }
    }

    // 2. Buscar outras instâncias
    const globalCore = this.findGlobalCoreInstance();
    if (globalCore) {
        try {
            if (!globalCore.firebaseConnected) {
                await globalCore.initializeFirebase();
            }
            if (globalCore.firebaseConnected) {
                this.core = globalCore; // Atualizar referência
                return globalCore;
            }
        } catch (initError) {
            console.warn('Erro ao inicializar core global:', initError);
        }
    }

    // 3. Criar nova instância
    if (window.JSFitCore) {
        try {
            const newCore = new window.JSFitCore();
            await newCore.initializeFirebase();
            if (newCore.firebaseConnected) {
                this.core = newCore;
                return newCore;
            }
        } catch (createError) {
            console.error('Erro ao criar nova instância:', createError);
        }
    }

    console.warn('❌ Nenhuma instância válida do Core encontrada');
    return null;
}


async deactivateSharedPlanFixed(shareId, coreInstance) {
    try {
        console.log(`🗑️ Desativando compartilhamento: ${shareId}`);
        
        if (!coreInstance || !coreInstance.firebaseConnected) {
            throw new Error('Core/Firebase não disponível');
        }

        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        const shareRef = doc(window.db, 'shared_plans', shareId);
        
        await updateDoc(shareRef, {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: this.currentUserId
        });

        console.log(`✅ Compartilhamento ${shareId} desativado no Firebase`);

    } catch (error) {
        console.error('❌ Erro ao desativar no Firebase:', error);
        throw error;
    }
}


async stopSharing(planId) {
    try {
        // VERIFICAÇÃO DE AUTENTICAÇÃO
        if (!this.canPerformAction()) return;
        
        console.log(`🔒 Parando compartilhamento do plano: ${planId}`);
        
        // Buscar plano NA LISTA DO USUÁRIO ATUAL
        const plan = this.savedPlans.find(p => 
            p.id === planId && p.userId === this.currentUserId
        );
        
        if (!plan || !plan.shareId) {
            this.showMessage('Plano não encontrado ou não está compartilhado', 'error');
            return;
        }

        const confirmStop = confirm(
            `Deseja parar de compartilhar "${plan.nome}"?\n\n` +
            `O aluno não conseguirá mais importá-lo com o ID: ${plan.shareId}`
        );
        
        if (!confirmStop) return;

        this.showMessage('Removendo compartilhamento...', 'info');

        // ========================================
        // BUSCA INTELIGENTE DO CORE (CORRIGIDA)
        // ========================================
        let coreInstance = await this.findAndValidateCore();
        
        // Desativar no Firebase SE core disponível
        if (coreInstance && coreInstance.firebaseConnected) {
            try {
                await this.deactivateSharedPlanFixed(plan.shareId, coreInstance);
                console.log('✅ Compartilhamento desativado no Firebase');
            } catch (fbError) {
                console.warn('⚠️ Erro ao desativar no Firebase:', fbError);
            }
        } else {
            console.warn('⚠️ Core/Firebase indisponível - removendo apenas localmente');
        }

        // Remover dados de compartilhamento do plano
        const oldShareId = plan.shareId;
        delete plan.shareId;
        delete plan.sharedAt;
        delete plan.sharedBy;
        plan.sharingStoppedAt = new Date().toISOString();

        // Salvar alterações localmente
        await this.saveToUserLocalStorage();
        
        // Tentar atualizar no Firebase
        if (coreInstance && coreInstance.firebaseConnected) {
            try {
                await coreInstance.savePlanToFirebase(plan);
                console.log('✅ Plano atualizado no Firebase');
            } catch (updateError) {
                console.warn('⚠️ Erro ao atualizar plano no Firebase:', updateError);
            }
        }

        // Atualizar interface
        this.renderPlanList();
        this.showMessage(`Compartilhamento removido: "${plan.nome}"`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao parar compartilhamento:', error);
        this.showMessage('Erro ao remover compartilhamento', 'error');
    }
}

// =====================================
// MÉTODOS AUXILIARES PARA BUSCA DO CORE
// =====================================

isValidCoreInstance(coreInstance) {
    return coreInstance && 
           typeof coreInstance === 'object' && 
           typeof coreInstance.savePlanToFirebase === 'function' &&
           typeof coreInstance.getUserId === 'function';
}

findGlobalCoreInstance() {
    const possibleCores = [
        window.jsfitCore,
        window.jsfit,
        window.appCore,
        window.firebaseCore,
        this.jsfitCore,
        this.jsfit
    ];
    
    for (let possibleCore of possibleCores) {
        if (this.isValidCoreInstance(possibleCore)) {
            console.log('Core encontrado em:', possibleCore.constructor?.name || 'unknown global');
            return possibleCore;
        }
    }
    
    // Buscar por propriedades que possam conter instâncias do core
    const globalProperties = Object.getOwnPropertyNames(window);
    for (let prop of globalProperties) {
        if (prop.toLowerCase().includes('core') || prop.toLowerCase().includes('jsfit')) {
            const candidate = window[prop];
            if (this.isValidCoreInstance(candidate)) {
                console.log('Core encontrado na propriedade global:', prop);
                return candidate;
            }
        }
    }
    
    return null;
}

async initializeCoreInstance(coreInstance) {
    try {
        console.log('Inicializando nova instância do Core...');
        
        if (typeof coreInstance.initializeFirebase === 'function') {
            await coreInstance.initializeFirebase();
            console.log('Firebase inicializado na nova instância');
        }
        
        if (typeof coreInstance.loadExerciseDatabase === 'function') {
            await coreInstance.loadExerciseDatabase();
            console.log('Base de exercícios carregada na nova instância');
        }
        
        return true;
        
    } catch (initError) {
        console.error('Erro na inicialização da instância do Core:', initError);
        throw initError;
    }
}

async ensureFirebaseReady(coreInstance) {
    try {
        // Verificar se já está conectado
        if (coreInstance.firebaseConnected) {
            console.log('Firebase já conectado');
            return true;
        }
        
        // Tentar inicializar/reconectar
        console.log('Tentando conectar Firebase...');
        if (typeof coreInstance.initializeFirebase === 'function') {
            await coreInstance.initializeFirebase();
            
            if (coreInstance.firebaseConnected) {
                console.log('Firebase conectado com sucesso');
                return true;
            }
        }
        
        console.warn('Firebase não pôde ser conectado');
        return false;
        
    } catch (connectionError) {
        console.error('Erro ao conectar Firebase:', connectionError);
        return false;
    }
}

getCoreStrategy(coreInstance) {
    if (this.core === coreInstance) return 'this.core';
    if (window.core === coreInstance) return 'window.core';
    if (window.app && window.app.core === coreInstance) return 'window.app.core';
    if (window.jsfitCore === coreInstance) return 'window.jsfitCore';
    return 'created_new';
}

// MÉTODO AUXILIAR: Salvar especificamente no localStorage do usuário
async saveToUserLocalStorage() {
    try {
        if (!this.currentUserId) {
            throw new Error('UserId não disponível para localStorage');
        }
        
        const storageKey = `jsfitapp_plans_${this.currentUserId}`;
        const dataToSave = {
            userId: this.currentUserId,
            userEmail: this.userEmail,
            plans: this.savedPlans,
            savedAt: new Date().toISOString(),
            version: '2.0'
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log(`${this.savedPlans.length} planos salvos no localStorage do usuário`);
        
    } catch (error) {
        console.error('Erro ao salvar no localStorage específico:', error);
        throw error;
    }
}


getUserId() {
    // Prioridade 1: Firebase Auth atual
    if (window.firebaseAuth?.currentUser?.uid) {
        return window.firebaseAuth.currentUser.uid;
    }
    
    // Prioridade 2: AuthManager
    if (window.authManager?.getCurrentUser()?.uid) {
        return window.authManager.getCurrentUser().uid;
    }
    
    // Prioridade 3: localStorage como fallback
    try {
        const stored = localStorage.getItem('jsfitapp_user');
        if (stored) {
            const userData = JSON.parse(stored);
            if (userData.uid && userData.sessionActive) {
                return userData.uid;
            }
        }
    } catch (error) {
        console.warn('Erro ao ler userId do localStorage:', error);
    }
    
    console.warn('❌ getUserId(): Nenhum userId válido encontrado');
    return null;
}



async copyShareId(shareId) {
    try {
        console.log(`📋 Copiando share ID: ${shareId}`);
        
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareId);
            this.showMessage(`ID ${shareId} copiado!`, 'success');
        } else {
            // Fallback para navegadores mais antigos
            const tempInput = document.createElement('input');
            tempInput.value = shareId;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.showMessage(`ID ${shareId} copiado!`, 'success');
            } catch (err) {
                console.warn('⚠️ Fallback copy falhou:', err);
                this.showMessage(`Copie manualmente: ${shareId}`, 'info');
            }
            
            document.body.removeChild(tempInput);
        }
        
        console.log('✅ Share ID copiado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao copiar share ID:', error);
        this.showMessage(`Erro ao copiar. ID: ${shareId}`, 'warning');
    }
}

// MÉTODO AUXILIAR: Verificar se usuário pode realizar ação
canPerformAction() {
    if (!this.isUserAuthenticated || !this.currentUserId) {
        this.showMessage('Você precisa estar logado para realizar esta ação', 'warning');
        this.showAuthenticationScreen();
        return false;
    }
    return true;
}

// MÉTODO AUXILIAR: Preparar plano para compartilhamento (remover dados sensíveis)
preparePlanForSharing(plan) {
    return {
        nome: plan.nome,
        aluno: {
            nome: plan.aluno?.nome || '',
            dataNascimento: plan.aluno?.dataNascimento || '',
            idade: plan.aluno?.idade || null,
            altura: plan.aluno?.altura || '',
            peso: plan.aluno?.peso || ''
            // CPF removido por segurança
        },
        dias: plan.dias,
        dataInicio: plan.dataInicio,
        dataFim: plan.dataFim,
        perfil: {
            objetivo: plan.perfil?.objetivo || '',
            altura: plan.aluno?.altura || plan.perfil?.altura || '',
            peso: plan.aluno?.peso || plan.perfil?.peso || '',
            idade: plan.aluno?.idade || plan.perfil?.idade || null,
            porte: plan.perfil?.porte || ''
        },
        treinos: plan.treinos.map(treino => ({
            id: treino.id,
            nome: treino.nome,
            foco: treino.foco,
            exercicios: treino.exercicios.map(ex => ({
                id: ex.id,
                nome: ex.nome,
                descricao: ex.descricao,
                series: ex.series,
                repeticoes: ex.repeticoes,
                carga: ex.carga,
                descanso: ex.descanso,
                observacoesEspeciais: ex.observacoesEspeciais,
                tecnica: ex.tecnica
            }))
        })),
        observacoes: plan.observacoes || {},
        tecnicas_aplicadas: plan.tecnicas_aplicadas || {},
        sharedAt: new Date().toISOString(),
        originalUserId: plan.userId // Para auditoria, sem dados pessoais
    };
}




calculateBodyType(altura, peso) {
    try {
        const height = parseFloat(altura.replace('m', '').replace(',', '.'));
        const weight = parseFloat(peso.replace('kg', ''));
        const imc = weight / (height * height);

        if (imc < 18.5) return 'pequeno';
        if (imc < 25) return 'médio';
        return 'grande';
    } catch (error) {
        return 'médio';
    }
}

calculateAge(birthDate) {
    if (!birthDate) return null;
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    } catch (error) {
        return null;
    }
}



// 2. SAVEPLANTYPECONFIGURATION - Salva configuração de tipos de plano
async savePlanTypeConfiguration() {
    try {
        if (!this.isUserAuthenticated) {
            console.warn('Usuário não autenticado, não salvando configuração');
            return;
        }

        console.log('💾 Salvando configuração de tipos de plano...');
        
        const configToSave = {
            days: this.planTypeConfiguration.days,
            configuration: this.planTypeConfiguration.configuration,
            userId: this.currentUserId,
            savedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Tentar salvar no Firebase primeiro
        if (this.core && this.core.firebaseConnected) {
            try {
                await this.core.savePlanConfigToFirebase(configToSave);
                console.log('✅ Configuração salva no Firebase');
            } catch (firebaseError) {
                console.warn('⚠️ Erro ao salvar no Firebase:', firebaseError);
            }
        }

        // Backup local sempre
        try {
            const configKey = this.getConfigStorageKey();
            localStorage.setItem(configKey, JSON.stringify(configToSave));
            console.log('✅ Configuração salva no localStorage do usuário');
        } catch (localError) {
            console.error('❌ Erro ao salvar localmente:', localError);
        }
        
    } catch (error) {
        console.error('❌ Erro geral ao salvar configuração:', error);
    }
}



// Método auxiliar para salvar no Firebase
async savePlanConfigToFirebase(configData) {
    try {
        if (!window.db) throw new Error('Firebase não disponível');
        
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const configRef = doc(window.db, 'plan_configurations', 'default');
        await setDoc(configRef, configData, { merge: true });
        
    } catch (error) {
        console.error('Erro ao salvar configuração no Firebase:', error);
        throw error;
    }
}


// Método auxiliar para mostrar informações do filtro contextual
showContextualFilterInfo(workout, configuredGroups) {
    const statusElement = document.getElementById('exerciseSelectStatus');
    const countElement = document.getElementById('exerciseCount');

    if (!statusElement || !countElement) return;

    // Calcular total de exercícios para os grupos configurados
    let totalExercises = 0;
    configuredGroups.forEach(groupId => {
        const mappedGroup = this.mapCustomGroupToSystemGroup ? 
            this.mapCustomGroupToSystemGroup(groupId) : groupId;
        const groupExercises = this.getExercisesByGroupAndLevel(mappedGroup, 'intermediario');
        totalExercises += groupExercises.length;
    });

    // Criar nomes dos grupos para exibição
    const groupNames = configuredGroups.map(groupId => {
        const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
        return group ? group.name : groupId;
    }).join(', ');

    // Atualizar interface
    statusElement.className = 'form-hint contextual';
    countElement.innerHTML = `
        <div class="contextual-filter-info">
            <div class="contextual-title">Filtro contextual ativo</div>
            <div class="contextual-workout">Treino ${workout.id}: ${workout.nome}</div>
            <div class="contextual-groups">Grupos: ${groupNames}</div>
            <div class="contextual-count">${totalExercises} exercícios disponíveis</div>
        </div>
    `;
}


// 4. GETCONFIGUREDGROUPSFORWORKOUT - Obter grupos configurados para treino específico
getConfiguredGroupsForWorkout(workoutIndex, workout) {
    let configuredGroups = [];

    console.log(`Buscando grupos configurados para treino ${workout.id} (índice ${workoutIndex})`);

    // Método 1: Grupos definidos diretamente no treino
    if (workout.gruposMusculares && Array.isArray(workout.gruposMusculares) && workout.gruposMusculares.length > 0) {
        configuredGroups = [...workout.gruposMusculares];
        console.log(`Grupos encontrados no treino: ${configuredGroups.join(', ')}`);
        return configuredGroups;
    }

    // Método 2: Buscar na configuração de tipos de plano
    if (this.planTypeConfiguration && this.planTypeConfiguration.configuration) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const workoutLetter = letters[workoutIndex];
        const config = this.planTypeConfiguration.configuration[workoutLetter];

        if (config && config.groups && config.groups.length > 0) {
            configuredGroups = [...config.groups];
            console.log(`Grupos encontrados na configuração: ${configuredGroups.join(', ')}`);
            return configuredGroups;
        }
    }

    // Método 3: Inferir pelos exercícios existentes no treino
    if (workout.exercicios && workout.exercicios.length > 1) { // Mais de 1 para ignorar só aquecimento
        configuredGroups = this.inferGroupsFromExercises(workout.exercicios);
        if (configuredGroups.length > 0) {
            console.log(`Grupos inferidos dos exercícios: ${configuredGroups.join(', ')}`);
            return configuredGroups;
        }
    }

    // Método 4: Tentar extrair do nome/foco do treino
    if (workout.nome || workout.foco) {
        configuredGroups = this.inferGroupsFromWorkoutName(workout.nome, workout.foco);
        if (configuredGroups.length > 0) {
            console.log(`Grupos inferidos do nome/foco: ${configuredGroups.join(', ')}`);
            return configuredGroups;
        }
    }

    console.log('Nenhum grupo configurado encontrado para este treino');
    return configuredGroups;
}


// Método auxiliar para inferir grupos dos exercícios BOM 
inferGroupsFromExercises(exercises) {
    const inferredGroups = new Set();

    exercises.forEach(exercise => {
        // Pular aquecimento e alongamento
        const exerciseName = exercise.nome.toLowerCase();
        if (exerciseName.includes('aquecimento') || 
            exerciseName.includes('alongamento') || 
            exerciseName.includes('esteira') ||
            exerciseName.includes('bicicleta')) {
            return;
        }

        // Mapear nomes de exercícios para grupos musculares
        const groupMappings = {
            // Peito
            peito: ['supino', 'crucifixo', 'flexão', 'crossover', 'fly', 'peck deck'],
            // Costas  
            costas: ['puxada', 'remada', 'barra fixa', 'pullover', 'latíssimo'],
            // Ombros
            ombro: ['desenvolvimento', 'elevação lateral', 'elevação frontal', 'elevação posterior', 'arnold'],
            // Bíceps
            biceps: ['rosca direta', 'rosca alternada', 'rosca martelo', 'rosca scott', 'rosca concentrada'],
            // Tríceps
            triceps: ['tríceps testa', 'tríceps francês', 'tríceps pulley', 'tríceps corda', 'mergulho'],
            // Pernas
            perna: ['agachamento', 'leg press', 'extensão', 'afundo', 'hack squat'],
            // Posterior
            gluteo: ['stiff', 'flexão de pernas', 'mesa flexora', 'hip thrust', 'elevação pélvica'],
            // Abdome
            abdome: ['abdominal', 'prancha', 'elevação de pernas', 'russian twist'],
            // Panturrilha  
            panturrilha: ['panturrilha', 'gemelo', 'sóleo']
        };

        // Verificar cada grupo
        Object.entries(groupMappings).forEach(([grupo, keywords]) => {
            if (keywords.some(keyword => exerciseName.includes(keyword))) {
                inferredGroups.add(grupo);
            }
        });
    });

    return Array.from(inferredGroups);
}

// Método auxiliar para inferir grupos do nome/foco do treino
inferGroupsFromWorkoutName(nome, foco) {
    const inferredGroups = new Set();
    const text = `${nome} ${foco}`.toLowerCase();

    // Mapear palavras-chave do nome para grupos
    const nameMapping = {
        peito: ['peito', 'peitoral', 'chest'],
        costas: ['costas', 'back', 'dorsal'],
        ombro: ['ombro', 'ombros', 'shoulder', 'deltoide'],
        biceps: ['bíceps', 'biceps'],
        triceps: ['tríceps', 'triceps'],
        perna: ['perna', 'pernas', 'leg', 'quadríceps', 'coxa'],
        gluteo: ['glúteo', 'glúteos', 'posterior'],
        abdome: ['abdome', 'abdominal', 'core'],
        corpo: ['corpo', 'full body', 'inteiro']
    };

    Object.entries(nameMapping).forEach(([grupo, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
            inferredGroups.add(grupo);
        }
    });

    return Array.from(inferredGroups);
}

// Método auxiliar para mapear grupos customizados para grupos do sistema BOM
mapCustomGroupToSystemGroup(customGroupId) {
    const mapping = {
        'antebraco': 'antebraco',
        'abdome': 'abdome', 
        'biceps': 'biceps',
        'triceps': 'triceps',
        'peito': 'peito',
        'perna': 'quadriceps', // Mapear perna para quadriceps no sistema
        'gluteo': 'posterior', // Mapear glúteo para posterior no sistema  
        'costas': 'costas',
        'ombro': 'ombros', // Mapear ombro para ombros no sistema
        'corpo': 'corpo_inteiro'
    };

    return mapping[customGroupId] || customGroupId;
}   
}
const app = new PersonalApp();
window.app = app;


