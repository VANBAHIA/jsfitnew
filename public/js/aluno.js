// aluno.js - JS Fit Student App - Complete with Direct File Import
// Sistema modernizado compatível com PostgreSQL e Netlify Functions

class JSFitStudentApp {
    constructor() {
        // API Configuration
        this.config = {
            apiBase: window.location.hostname === 'localhost' ? 
                'http://localhost:8888/api' : 
                'https://jsfitapp.netlify.app/api',
            timeout: 10000,
            retries: 3,
            syncInterval: 30000
        };

        // App State
        this.state = {
            workoutPlans: [],
            currentPlan: null,
            currentWorkout: null,
            activeWorkoutSessions: new Map(),
            editingWeights: new Set(),
            connectionStatus: 'unknown',
            isOnline: navigator.onLine,
            user: null,
            token: null
        };

        // Initialize app
        this.init();

        // NOVA: Base de dados de exercícios integrada
        this.exerciseDatabase = []; // Array simples que será carregado do DATABASE.JSON
        this.loadExerciseDatabase(); // Novo método para carregar
        
         // Create hidden file input for direct import
        this.createFileInput();
    }

    // =============================================================================
    // INITIALIZATION & SETUP
    // =============================================================================

    async init() {
        console.log('🚀 Initializing JS Fit Student App - Backend Compatible');
        
        try {
            this.setupEventListeners();
            this.setupPWAFeatures();
            await this.loadFromStorage();
            
            // Aguardar carregamento da base de exercícios
            await this.loadExerciseDatabase();
            
            // Validar integridade após carregamento
            this.validateExerciseDatabase();
            
            await this.checkServerConnection();
            this.startPeriodicSync();
            this.renderHome();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showNotification('Erro ao inicializar aplicativo', 'error');
        }
    }


    setupEventListeners() {
        // Handle network status changes
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.checkServerConnection();
            this.showNotification('Conexão restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.updateConnectionStatus('offline');
            this.showNotification('Modo offline ativo', 'warning');
        });

        // Handle app lifecycle
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveToStorage();
            } else {
                this.checkServerConnection();
            }
        });
    }

    async loadExerciseDatabase() {
        try {
            console.log('🔄 Carregando base de dados de exercícios...');
            
            // Tentar carregar DATABASE.JSON
            const response = await fetch('data/DATABASE.JSON');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validar estrutura do arquivo
            if (!Array.isArray(data)) {
                throw new Error('DATABASE.JSON deve ser um array de exercícios');
            }
            
            // Validar se tem exercícios
            if (data.length === 0) {
                throw new Error('DATABASE.JSON está vazio');
            }
            
            // Validar estrutura básica de cada exercício
            const invalidExercises = data.filter(ex => 
                !ex.nome || !ex.Column4 || !ex.grupo
            );
            
            if (invalidExercises.length > 0) {
                console.warn(`⚠️ ${invalidExercises.length} exercícios com dados incompletos encontrados`);
            }
            
            this.exerciseDatabase = data;
            console.log(`✅ ${data.length} exercícios carregados com sucesso`);
            
            // Mostrar estatísticas
            this.logDatabaseStats();
            
        } catch (error) {
            console.error('❌ Erro ao carregar DATABASE.JSON:', error);
            
            // Fallback: usar dados de exemplo ou array vazio
            this.exerciseDatabase = [];
            
            // Mostrar notificação para o usuário
            setTimeout(() => {
                this.showNotification(
                    '⚠️ Erro ao carregar base de exercícios. Demonstrações podem não funcionar.',
                    'warning',
                    8000
                );
            }, 2000);
        }
    }
    
    // PASSO 3: MÉTODO PARA MOSTRAR ESTATÍSTICAS
    // ==========================================
    
    logDatabaseStats() {
        if (this.exerciseDatabase.length === 0) return;
        
        // Contar exercícios por grupo
        const groupStats = {};
        this.exerciseDatabase.forEach(ex => {
            const grupo = ex.grupo || 'Sem grupo';
            groupStats[grupo] = (groupStats[grupo] || 0) + 1;
        });
        
        console.log('📊 Estatísticas da base de exercícios:');
        console.log(`   Total: ${this.exerciseDatabase.length} exercícios`);
        console.log('   Por grupo:');
        Object.entries(groupStats).forEach(([grupo, count]) => {
            console.log(`     ${grupo}: ${count} exercícios`);
        });
    }


    // =============================================================================
    // DIRECT FILE IMPORT MANAGEMENT
    // =============================================================================

    createFileInput() {
        // Create a hidden file input for direct import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.id = 'hiddenFileInput';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleDirectFileImport(file);
            }
        });
        
        document.body.appendChild(fileInput);
    }

    // NOVA FUNÇÃO: Importação direta de arquivo
    openFileSelector() {
        const fileInput = document.getElementById('hiddenFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleDirectFileImport(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showNotification('❌ Apenas arquivos JSON são aceitos', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('❌ Arquivo muito grande. Máximo 10MB', 'error');
            return;
        }

        // Show loading notification
        this.showNotification('📄 Importando arquivo...', 'info', 2000);

        try {
            // Read and parse file
            const fileContent = await this.readFileContent(file);
            const planData = await this.parseJSONFile(fileContent);
            
            // Validate and process plan data
            const processedPlan = await this.processFileData(planData);
            
            // Check if plan already exists
            const existing = this.state.workoutPlans.find(p => 
                p.nome === processedPlan.nome && 
                p.aluno?.nome === processedPlan.aluno?.nome
            );
            
            if (existing) {
                const confirmed = confirm(
                    `Um plano com nome "${processedPlan.nome}" já existe.\n\nDeseja importar mesmo assim?`
                );
                if (!confirmed) {
                    return;
                }
            }

            // Add to plans and save
            this.state.workoutPlans.push(processedPlan);
            await this.saveToStorage();

            // Success feedback
            this.showNotification(`✅ Plano "${processedPlan.nome}" importado com sucesso!`, 'success');
            this.renderHome();

        } catch (error) {
            console.error('File import error:', error);
            this.showNotification(`❌ Erro ao importar: ${error.message}`, 'error');
        } finally {
            // Reset file input
            const fileInput = document.getElementById('hiddenFileInput');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler o arquivo'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    async parseJSONFile(content) {
        try {
            const data = JSON.parse(content);
            
            if (!data || typeof data !== 'object') {
                throw new Error('Arquivo JSON inválido');
            }
            
            // NOVA VALIDAÇÃO: verificar se tem array planos
            if (!data.planos || !Array.isArray(data.planos) || data.planos.length === 0) {
                throw new Error('Formato JSON inválido: deve conter array "planos" com pelo menos um plano');
            }
            
            // Retornar o primeiro plano do array
            return data.planos[0];
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error('Formato JSON inválido');
            }
            throw error;
        }
    }

    async processFileData(data) {
        // Validate required fields
        if (!data.nome && !data.name) {
            throw new Error('Nome do plano não encontrado no arquivo');
        }
    
        if (!data.treinos && !data.workouts) {
            throw new Error('Treinos não encontrados no arquivo');
        }
    
        // Generate unique ID for imported plan
        const processedPlan = {
            id: this.generateId(),
            nome: data.nome || data.name || 'Plano Importado',
            importedAt: new Date().toISOString(),
            importedFrom: 'file',
            execucoesPlanCompleto: 0,
            
            // Student data
            aluno: {
                nome: data.aluno?.nome || data.student?.name || '',
                dataNascimento: data.aluno?.dataNascimento || data.student?.birth_date || '',
                idade: data.aluno?.idade || data.student?.age || null,
                altura: data.aluno?.altura || data.student?.height || '',
                peso: data.aluno?.peso || data.student?.weight || '',
                cpf: data.aluno?.cpf || data.student?.cpf || ''
            },
            
            // Plan metadata
            dias: data.dias || data.frequency_per_week || 3,
            dataInicio: data.dataInicio || data.start_date || new Date().toISOString().split('T')[0],
            dataFim: data.dataFim || data.end_date || '',
            
            // Profile and objectives
            perfil: {
                objetivo: data.perfil?.objetivo || data.objective || 'Condicionamento geral',
                altura: data.aluno?.altura || data.student?.height || '',
                peso: data.aluno?.peso || data.student?.weight || '',
                idade: data.aluno?.idade || data.student?.age || null,
                porte: data.perfil?.porte || '' // NOVO CAMPO
            },
            
            // Convert workouts
            treinos: this.convertWorkoutsToFrontendFormat(data.treinos || data.workouts || []),
            
            // Observations
            observacoes: data.observacoes || data.observations || {},
            
            // NOVO: Técnicas aplicadas
            tecnicasAplicadas: data.tecnicas_aplicadas || {}
        };
    
        // Validate processed plan
        if (processedPlan.treinos.length === 0) {
            throw new Error('Nenhum treino válido encontrado no arquivo');
        }
    
        return processedPlan;
    }

    setupPWAFeatures() {
        // iOS viewport handling
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', this.debounce(setViewportHeight, 150));
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 500);
        });

        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
    }

    // =============================================================================
    // SERVER COMMUNICATION
    // =============================================================================

    async makeRequest(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(`${this.config.apiBase}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.state.token && { 'Authorization': `Bearer ${this.state.token}` }),
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    async checkServerConnection() {
        try {
            this.updateConnectionStatus('loading');
            const response = await this.makeRequest('/health');
            
            if (response.success !== false) {
                this.updateConnectionStatus('online');
                return true;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            console.warn('Server connection failed:', error);
            this.updateConnectionStatus('offline');
            return false;
        }
    }

    async importPlanById(shareId) {
        // Validate share ID
        if (!shareId || shareId.length !== 6) {
            throw new Error('ID deve ter 6 caracteres');
        }

        const normalizedId = shareId.toUpperCase();

        // Check if already imported
        const existing = this.state.workoutPlans.find(p => p.originalShareId === normalizedId);
        if (existing) {
            throw new Error('Este plano já foi importado');
        }

        try {
            // Try server first
            const serverData = await this.fetchFromServer(normalizedId);
            
            // Process and save the plan
            const processedPlan = this.processPlanData(serverData, normalizedId, 'server');
            
            return processedPlan;
        } catch (serverError) {
            console.warn('Server fetch failed, trying cache:', serverError);
            
            // Fallback to cache
            const cacheData = this.getPlanFromCache(normalizedId);
            if (!cacheData) {
                throw new Error('Plano não encontrado nem no servidor nem no cache');
            }
            
            const processedPlan = this.processPlanData(cacheData, normalizedId, 'cache');
            return processedPlan;
        }
    }

    async fetchFromServer(shareId) {
        try {
            const response = await this.makeRequest(`/share/${shareId}`);
            
            if (response.success && response.plan) {
                return response.plan;
            } else {
                throw new Error(response.error || 'Plano não encontrado no servidor');
            }
        } catch (error) {
            throw new Error(`Erro ao buscar do servidor: ${error.message}`);
        }
    }

    processPlanData(planData, shareId, source) {
        // Convert backend format to frontend format
        const processedPlan = {
            id: this.generateId(),
            nome: planData.nome || planData.name || 'Plano Importado',
            originalShareId: shareId,
            importedAt: new Date().toISOString(),
            importedFrom: source,
            execucoesPlanCompleto: 0,
            
            // Student data
            aluno: {
                nome: planData.aluno?.nome || planData.student?.name || '',
                dataNascimento: planData.aluno?.dataNascimento || planData.student?.birth_date || '',
                idade: planData.aluno?.idade || planData.student?.age || null,
                altura: planData.aluno?.altura || planData.student?.height || '',
                peso: planData.aluno?.peso || planData.student?.weight || '',
                cpf: planData.aluno?.cpf || planData.student?.cpf || ''
            },
            
            // Plan metadata
            dias: planData.dias || planData.frequency_per_week || 3,
            dataInicio: planData.dataInicio || planData.start_date || new Date().toISOString().split('T')[0],
            dataFim: planData.dataFim || planData.end_date || '',
            
            // Profile and objectives
            perfil: {
                objetivo: planData.perfil?.objetivo || planData.objective || 'Condicionamento geral',
                altura: planData.aluno?.altura || planData.student?.height || '',
                peso: planData.aluno?.peso || planData.student?.weight || '',
                idade: planData.aluno?.idade || planData.student?.age || null
            },
            
            // Convert workouts
            treinos: this.convertWorkoutsToFrontendFormat(planData.treinos || planData.workouts || []),
            
            // Observations
            observacoes: planData.observacoes || planData.observations || {}
        };

        return { plan: processedPlan, source };
    }

    convertWorkoutsToFrontendFormat(workouts) {
        return workouts.map((workout, index) => ({
            id: workout.id || String.fromCharCode(65 + index),
            nome: workout.nome || workout.name || `Treino ${String.fromCharCode(65 + index)}`,
            foco: workout.foco || workout.focus_area || 'Treino geral',
            concluido: false,
            execucoes: 0,
            exercicios: this.convertExercisesToFrontendFormat(workout.exercicios || workout.exercises || [])
        }));
    }

    convertExercisesToFrontendFormat(exercises) {
        return exercises.map((exercise, index) => ({
            id: exercise.id || this.generateId(),
            nome: exercise.nome || exercise.name || 'Exercício',
            descricao: exercise.descricao || exercise.description || '',
            series: exercise.series || exercise.sets || 3,
            repeticoes: exercise.repeticoes || exercise.reps || '10-12',
            carga: exercise.carga || exercise.weight || 'A definir',
            currentCarga: exercise.currentCarga || exercise.current_weight || exercise.carga || exercise.weight || 'A definir',
            descanso: exercise.descanso || exercise.rest_time || '90 segundos',
            observacoesEspeciais: exercise.observacoesEspeciais || exercise.special_instructions || '',
            tecnica: exercise.tecnica || '', // NOVO CAMPO
            concluido: false
        }));
    }

    // =============================================================================
    // WORKOUT MANAGEMENT
    // =============================================================================

    startWorkout(planId, workoutId) {
        const sessionKey = `${planId}-${workoutId}`;
        
        if (this.state.activeWorkoutSessions.has(sessionKey)) {
            this.showNotification('Este treino já está em andamento', 'warning');
            return;
        }

        const plan = this.findPlan(planId);
        const workout = plan?.treinos.find(t => t.id === workoutId);
        
        if (!workout) {
            this.showNotification('Treino não encontrado', 'error');
            return;
        }

        this.state.activeWorkoutSessions.set(sessionKey, {
            startTime: new Date(),
            planId,
            workoutId,
            completedExercises: 0
        });

        // Reset workout state
        workout.exercicios.forEach(ex => ex.concluido = false);
        workout.concluido = false;

        this.saveToStorage();
        this.renderCurrentView();
        this.showNotification('Treino iniciado! 💪', 'success');
    }

    completeExercise(planId, workoutId, exerciseId) {
        const sessionKey = `${planId}-${workoutId}`;
        const session = this.state.activeWorkoutSessions.get(sessionKey);
        
        if (!session) {
            this.showNotification('Inicie o treino primeiro', 'warning');
            return;
        }

        const plan = this.findPlan(planId);
        const workout = plan?.treinos.find(t => t.id === workoutId);
        const exercise = workout?.exercicios.find(e => e.id === exerciseId);

        if (!exercise) {
            this.showNotification('Exercício não encontrado', 'error');
            return;
        }

        if (exercise.concluido) {
            this.showNotification('Exercício já foi concluído', 'info');
            return;
        }

        exercise.concluido = true;
        session.completedExercises++;

        this.saveToStorage();
        this.renderCurrentView();
        this.showNotification(`✅ ${exercise.nome} concluído!`, 'success');

        // Check if all exercises are completed
        const allCompleted = workout.exercicios.every(ex => ex.concluido);
        if (allCompleted) {
            setTimeout(() => {
                this.showNotification('Todos os exercícios concluídos! Finalize o treino.', 'info', 6000);
            }, 1000);
        }
    }

    completeWorkout(planId, workoutId) {
        const sessionKey = `${planId}-${workoutId}`;
        const plan = this.findPlan(planId);
        const workout = plan?.treinos.find(t => t.id === workoutId);

        if (!workout) return;

        // Validate completion
        const incompleteExercises = workout.exercicios.filter(ex => !ex.concluido);
        if (incompleteExercises.length > 0) {
            this.showNotification(
                `Complete os exercícios restantes: ${incompleteExercises.map(ex => ex.nome).join(', ')}`, 
                'warning'
            );
            return;
        }

        // Complete workout
        workout.concluido = true;
        workout.execucoes += 1;
        
        // Remove active session
        this.state.activeWorkoutSessions.delete(sessionKey);

        // Check if plan cycle is complete
        this.checkPlanCycleCompletion(plan);

        this.saveToStorage();
        this.showNotification('🎉 Treino concluído com sucesso!', 'success');
        
        setTimeout(() => {
            this.showPlan(planId);
        }, 1500);
    }

    checkPlanCycleCompletion(plan) {
        const allWorkoutsCompleted = plan.treinos.every(t => t.concluido);
        
        if (allWorkoutsCompleted) {
            plan.execucoesPlanCompleto = (plan.execucoesPlanCompleto || 0) + 1;
            
            // Reset for next cycle
            plan.treinos.forEach(t => {
                t.concluido = false;
                t.exercicios.forEach(e => e.concluido = false);
            });

            setTimeout(() => {
                this.showNotification(
                    `🎊 Parabéns! Você completou o ciclo ${plan.execucoesPlanCompleto} do plano "${plan.nome}"!\n\nTodos os treinos foram resetados para o próximo ciclo.`,
                    'success',
                    8000
                );
            }, 2000);
        }
    }

    // =============================================================================
    // WEIGHT MANAGEMENT
    // =============================================================================

    startEditingWeight(exerciseId) {
        this.state.editingWeights.add(exerciseId);
        this.renderCurrentView();
    }

    cancelEditingWeight(exerciseId) {
        this.state.editingWeights.delete(exerciseId);
        this.renderCurrentView();
    }

    saveWeight(planId, workoutId, exerciseId, newWeight) {
        if (!newWeight?.trim()) {
            this.showNotification('Digite uma carga válida', 'warning');
            return;
        }

        const plan = this.findPlan(planId);
        const workout = plan?.treinos.find(t => t.id === workoutId);
        const exercise = workout?.exercicios.find(e => e.id === exerciseId);

        if (!exercise) {
            this.showNotification('Exercício não encontrado', 'error');
            return;
        }

        exercise.currentCarga = newWeight.trim();
        this.state.editingWeights.delete(exerciseId);

        this.saveToStorage();
        this.renderCurrentView();
        this.showNotification('Carga atualizada!', 'success');
    }

    // =============================================================================
    // DATA MANAGEMENT
    // =============================================================================

    generateId() {
        return Date.now() + Math.random();
    }

    findPlan(planId) {
        return this.state.workoutPlans.find(p => p.id === planId);
    }

    async saveToStorage() {
        try {
            const data = {
                workoutPlans: this.state.workoutPlans,
                activeWorkoutSessions: Array.from(this.state.activeWorkoutSessions.entries()),
                lastSaved: new Date().toISOString(),
                version: '3.1.0'
            };
            
            localStorage.setItem('jsfitapp_student_data', JSON.stringify(data));
        } catch (error) {
            console.error('Storage save failed:', error);
            this.showNotification('Erro ao salvar dados', 'error');
        }
    }

    async loadFromStorage() {
        try {
            const stored = localStorage.getItem('jsfitapp_student_data');
            if (!stored) return;

            const data = JSON.parse(stored);
            this.state.workoutPlans = data.workoutPlans || [];
            
            // Restore active sessions
            if (data.activeWorkoutSessions) {
                this.state.activeWorkoutSessions = new Map(data.activeWorkoutSessions);
            }

            // Migrate legacy data
            this.migrateLegacyData();
        } catch (error) {
            console.error('Storage load failed:', error);
            this.state.workoutPlans = [];
        }
    }

    migrateLegacyData() {
        // Migrate old localStorage key
        const oldData = localStorage.getItem('studentWorkoutPlans');
        if (oldData) {
            try {
                const plans = JSON.parse(oldData);
                plans.forEach(plan => {
                    // Convert old format to new format
                    if (!plan.aluno && plan.perfil) {
                        plan.aluno = {
                            nome: '',
                            dataNascimento: '',
                            idade: plan.perfil.idade || null,
                            altura: plan.perfil.altura || '',
                            peso: plan.perfil.peso || '',
                            cpf: ''
                        };
                    }
                    
                    // Add importedFrom if missing
                    if (!plan.importedFrom) {
                        plan.importedFrom = 'legacy';
                    }
                });
                
                this.state.workoutPlans = [...this.state.workoutPlans, ...plans];
                localStorage.removeItem('studentWorkoutPlans');
                this.saveToStorage();
            } catch (error) {
                console.warn('Legacy data migration failed:', error);
            }
        }

        // Ensure all exercises have IDs and proper structure
        this.state.workoutPlans.forEach(plan => {
            plan.treinos?.forEach(treino => {
                treino.exercicios?.forEach(ex => {
                    if (!ex.id) ex.id = this.generateId();
                    if (!ex.currentCarga) ex.currentCarga = ex.carga || '';
                });
            });
        });
    }

    savePlanToCache(shareId, planData) {
        try {
            const cache = this.getSharedPlansCache();
            cache[shareId] = planData;
            localStorage.setItem('jsfitapp_shared_cache', JSON.stringify(cache));
        } catch (error) {
            console.warn('Cache save failed:', error);
        }
    }

    getPlanFromCache(shareId) {
        try {
            const cache = this.getSharedPlansCache();
            return cache[shareId] || null;
        } catch (error) {
            console.warn('Cache read failed:', error);
            return null;
        }
    }

    getSharedPlansCache() {
        try {
            const stored = localStorage.getItem('jsfitapp_shared_cache');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }

    deletePlan(planId) {
        const plan = this.findPlan(planId);
        if (!plan) return;

        const activeWorkouts = Array.from(this.state.activeWorkoutSessions.keys())
            .filter(key => key.startsWith(`${planId}-`));

        let message = `Confirma a exclusão do plano "${plan.nome}"?`;
        if (activeWorkouts.length > 0) {
            message += '\n\n⚠️ Este plano possui treinos em andamento que serão perdidos.';
        }
        message += '\n\nEsta ação não pode ser desfeita.';

        if (!confirm(message)) return;

        // Remove active sessions
        activeWorkouts.forEach(key => this.state.activeWorkoutSessions.delete(key));
        
        // Remove plan
        this.state.workoutPlans = this.state.workoutPlans.filter(p => p.id !== planId);
        
        // Navigation
        if (this.state.currentPlan?.id === planId) {
            this.state.currentPlan = null;
            this.showHome();
        } else {
            this.renderHome();
        }

        this.saveToStorage();
        this.showNotification('Plano excluído!', 'success');
    }

    startPeriodicSync() {
        setInterval(() => {
            if (this.state.isOnline && !document.hidden) {
                this.checkServerConnection();
            }
        }, this.config.syncInterval);
    }

    // =============================================================================
    // UI MANAGEMENT
    // =============================================================================

    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        if (!indicator) return;

        this.state.connectionStatus = status;
        indicator.className = `connection-status ${status}`;
        
        const statusMap = {
            online: 'Conectado ao servidor',
            offline: 'Offline - usando cache local',
            loading: 'Verificando conexão...'
        };
        
        indicator.title = statusMap[status] || 'Status desconhecido';
    }

    showNotification(message, type = 'info', duration = 4000) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // =============================================================================
    // NAVIGATION
    // =============================================================================

    showView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
    }

    showHome() {
        this.state.currentPlan = null;
        this.state.currentWorkout = null;
        this.showView('homeView');
        this.renderHome();
    }

    showPlan(planId) {
        const plan = this.findPlan(planId);
        if (!plan) {
            this.showHome();
            return;
        }
        
        this.state.currentPlan = plan;
        this.state.currentWorkout = null;
        this.showView('planView');
        this.renderPlan();
    }

    showWorkout(workoutId) {
        if (!this.state.currentPlan) {
            this.showHome();
            return;
        }

        const workout = this.state.currentPlan.treinos.find(t => t.id === workoutId);
        if (!workout) {
            this.showPlan(this.state.currentPlan.id);
            return;
        }

        this.state.currentWorkout = workout;
        this.showView('workoutView');
        this.renderWorkout();
    }

    renderCurrentView() {
        if (this.state.currentWorkout) {
            this.renderWorkout();
        } else if (this.state.currentPlan) {
            this.renderPlan();
        } else {
            this.renderHome();
        }
    }

    // =============================================================================
    // RENDERING METHODS
    // =============================================================================

    renderHome() {
        const content = document.getElementById('homeContent');
        if (!content) return;

        let html = this.renderImportCard();
        
        if (this.state.workoutPlans.length === 0) {
            html += this.renderEmptyState();
        } else {
            html += this.state.workoutPlans.map(plan => this.renderPlanCard(plan)).join('');
        }
        
        content.innerHTML = html;
    }

    renderImportCard() {
        const isOnline = this.state.connectionStatus === 'online';
        
        return `
            <div class="card import-by-id-card">
                <div class="card-content">
                    <h3 class="import-title">
                        🔗 Importar Treino
                    </h3>
                    
                    <!-- Import by ID section -->
                    <div class="import-section1">
                        <div class="server-status ${isOnline ? 'online' : 'offline'}">
                            ${isOnline ? 
                                '🟢 Servidor online - Buscará do servidor' : 
                                '🟡 Servidor offline - Usando cache local'
                            }
                        </div>
                            <h4 class="import-method-title">Por ID do Servidor</h4>
                        <div class="import-form">
                            <input type="text" id="importIdInput" class="import-input" 
                                   placeholder="Digite o ID (6 caracteres)" 
                                   maxlength="6" 
                                   autocomplete="off"
                                   oninput="this.value = this.value.toUpperCase()"
                                   onkeypress="if(event.key==='Enter') app.handleImportById()">
                            <button id="importIdButton" class="btn import-btn" onclick="app.handleImportById()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" x2="12" y1="15" y2="3"/>
                                </svg>
                                Importar por ID
                            </button>
                        </div>
                        <div id="importStatus" class="import-status">
                            Peça o ID do seu personal trainer
                        </div>
                    </div>

                    <!-- Import by file section -->
                    <div class="import-section">
                        <div class="import-divider">
                            <span>OU</span>
                        </div>
                        <button class="btn btn-secondary import-file-btn" onclick="app.openFileSelector()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            Importar Arquivo JSON
                        </button>
                        <div class="import-file-hint">
                            Selecione o arquivo JSON fornecido pelo seu personal trainer
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="card">
                <div class="card-content empty-state">
                    <div class="empty-icon">🏋️</div>
                    <h3 class="empty-title">Nenhum plano importado</h3>
                    <p class="empty-description">
                        Use o ID fornecido pelo seu personal trainer para importar seu plano de treino, ou selecione um arquivo JSON
                    </p>
                    <div class="empty-actions">
                        <button onclick="app.loadExampleData()" class="btn btn-secondary">
                            📋 Carregar Exemplo
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPlanCard(plan) {
        const student = plan.aluno || {};
        const age = this.calculateAge(student.dataNascimento) || student.idade;
        const completedWorkouts = plan.treinos.filter(t => t.concluido).length;
        const totalWorkouts = plan.treinos.length;
        const totalExecutions = plan.treinos.reduce((sum, t) => sum + t.execucoes, 0);

        return `
            <div class="card plan-card">
                <div class="card-content">
                    ${student.nome ? this.renderStudentInfo(student, age, plan.perfil) : ''}
                    ${this.renderPlanInfo(plan, completedWorkouts, totalWorkouts, totalExecutions)}
                    ${this.renderWorkoutGrid(plan.treinos)}
                    ${this.renderPlanActions(plan.id)}
                </div>
            </div>
        `;
    }

    renderStudentInfo(student, age, perfil) {
        return `
            <div class="student-info-card">
                <div class="student-info-header">
                    <div class="student-avatar">
                        ${student.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 class="student-name">${student.nome}</h2>
                        ${age ? `<div class="student-age">${age} anos</div>` : ''}
                    </div>
                </div>
                <div class="student-details">
                    ${this.renderDetailItem('Altura', student.altura)}
                    ${this.renderDetailItem('Peso', student.peso)}
                    ${this.renderDetailItem('Objetivo', perfil?.objetivo, 'objective-text')}
                    ${this.renderDetailItem('Nascimento', this.formatDate(student.dataNascimento))}
                </div>
            </div>
        `;
    }

    renderDetailItem(label, value, className = '') {
        if (!value) return '';
        return `
            <div class="detail-item">
                <div class="detail-label">${label}</div>
                <div class="detail-value ${className}">${value}</div>
            </div>
        `;
    }

    renderPlanInfo(plan, completedWorkouts, totalWorkouts, totalExecutions) {
        return `
            <div class="plan-info-card">
                <div class="plan-header">
                    <h3 class="plan-title">${plan.nome}</h3>
                    <div class="plan-period">
                        ${this.formatDate(plan.dataInicio)} - ${this.formatDate(plan.dataFim)}
                    </div>
                    ${plan.originalShareId || plan.importedFrom ? `
                        <div class="plan-badges">
                            ${plan.originalShareId ? `<span class="badge badge-id">ID: ${plan.originalShareId}</span>` : ''}
                            ${plan.importedFrom ? `
                                <span class="badge badge-source">
                                    ${plan.importedFrom === 'server' ? '🌐 Servidor' : 
                                      plan.importedFrom === 'file' ? '📁 Arquivo' : 
                                      plan.importedFrom === 'example' ? '📋 Exemplo' : 
                                      plan.importedFrom === 'legacy' ? '📜 Legado' : '💾 Cache'}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="plan-stats">
                    <div class="stat-card">
                        <div class="stat-number">${plan.execucoesPlanCompleto || 0}</div>
                        <div class="stat-label">Ciclos Completos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${completedWorkouts}/${totalWorkouts}</div>
                        <div class="stat-label">Treinos no Ciclo</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalExecutions}</div>
                        <div class="stat-label">Total de Treinos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${plan.dias || 3}</div>
                        <div class="stat-label">Dias/Semana</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkoutGrid(treinos) {
        return `
            <div class="workout-grid">
                ${treinos.map(treino => this.renderWorkoutItem(treino)).join('')}
            </div>
        `;
    }

    renderWorkoutItem(treino) {
        const progress = treino.exercicios.length > 0 ? 
            (treino.exercicios.filter(ex => ex.concluido).length / treino.exercicios.length) * 100 : 0;
        
        return `
            <div class="workout-item ${treino.concluido ? 'completed' : ''}">
                <div class="workout-name">${treino.nome}</div>
                <div class="workout-details">
                    <span class="execution-count ${treino.concluido ? 'completed' : ''}">${treino.execucoes}x</span>
                    <div class="workout-status ${this.getWorkoutStatusClass(treino.concluido, progress)}">
                        ${this.getWorkoutStatusText(treino.concluido, progress)}
                    </div>
                </div>
                ${progress > 0 && !treino.concluido ? this.renderProgressBar(progress) : ''}
            </div>
        `;
    }

    renderProgressBar(progress) {
        return `
            <div class="workout-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%;"></div>
                </div>
                <span class="progress-text">${Math.round(progress)}%</span>
            </div>
        `;
    }

    renderPlanActions(planId) {
        return `
            <div class="plan-actions">
                <button onclick="app.showPlan(${planId})" class="btn btn-primary">
                    Ver Plano Completo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </button>
                <button onclick="app.deletePlan(${planId})" class="btn btn-danger delete-btn" title="Excluir Plano">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m3 6 18 0"/>
                        <path d="m19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="m8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
    }

    renderPlan() {
        if (!this.state.currentPlan) return;

        const planTitle = document.getElementById('planTitle');
        const planSubtitle = document.getElementById('planSubtitle');
        
        if (planTitle) planTitle.textContent = this.state.currentPlan.nome;
        if (planSubtitle) {
            planSubtitle.textContent = `${this.formatDate(this.state.currentPlan.dataInicio)} - ${this.formatDate(this.state.currentPlan.dataFim)}`;
        }

        const content = document.getElementById('planContent');
        if (!content) return;

        const plan = this.state.currentPlan;
        const completedWorkouts = plan.treinos.filter(t => t.concluido).length;
        const totalWorkouts = plan.treinos.length;
        const cycleProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
        const totalExecutions = plan.treinos.reduce((sum, t) => sum + t.execucoes, 0);

        let html = '';

        // Student info (if available)
        if (plan.aluno?.nome) {
            const age = this.calculateAge(plan.aluno.dataNascimento) || plan.aluno.idade;
            html += this.renderStudentInfo(plan.aluno, age, plan.perfil);
        }

        // Plan cycle information
        html += `
            <div class="plan-cycle-info">
                <div class="cycle-counter">${plan.execucoesPlanCompleto || 0}</div>
                <div class="cycle-label">Ciclos Completos do Plano</div>
                <div class="cycle-progress">
                    <div class="cycle-progress-fill" style="width: ${cycleProgress}%;"></div>
                </div>
                <div class="cycle-status">
                    ${completedWorkouts === totalWorkouts 
                        ? '🎉 Ciclo atual completo! Próximo treino iniciará um novo ciclo.'
                        : `Progresso do ciclo atual: ${completedWorkouts}/${totalWorkouts} treinos (${Math.round(cycleProgress)}%)`
                    }
                </div>
                <div class="total-executions">
                    Total de treinos executados: ${totalExecutions}
                </div>
            </div>
        `;

        // Workout cards
        html += plan.treinos.map(treino => this.renderWorkoutCard(treino, plan.id)).join('');

        // Plan observations
        if (plan.observacoes && Object.keys(plan.observacoes).length > 0) {
            html += this.renderPlanObservations(plan.observacoes);
        }

        content.innerHTML = html;
    }

    renderWorkoutCard(treino, planId) {
        const sessionKey = `${planId}-${treino.id}`;
        const isActive = this.state.activeWorkoutSessions.has(sessionKey);
        const completedExercises = treino.exercicios.filter(ex => ex.concluido).length;
        const totalExercises = treino.exercicios.length;
        const workoutProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
        const isCompleted = treino.concluido;
        
        return `
            <div class="card workout-card ${isCompleted ? 'completed' : ''}">
                <div class="card-content">
                    <div class="workout-header">
                        <div>
                            <div class="workout-title-wrapper">
                                <h3 class="workout-title">${treino.nome}</h3>
                                ${isCompleted ? `
                                    <div class="check-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                    </div>
                                ` : ''}
                            </div>
                            <p class="workout-subtitle">
                                ${treino.foco} • ${totalExercises} exercícios • Executado ${treino.execucoes}x
                            </p>
                            ${isActive ? '<div class="active-workout">Treino em andamento</div>' : ''}
                            
                            ${workoutProgress > 0 && !isCompleted ? this.renderProgressBar(workoutProgress) : ''}
                        </div>
                    </div>
                    
                    <div class="workout-actions">
                        <button onclick="app.showWorkout('${treino.id}')" class="btn btn-secondary">
                            Ver Exercícios
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m9 18 6-6-6-6"/>
                            </svg>
                        </button>
                        ${this.renderWorkoutActionButton(treino, planId, isActive, completedExercises, totalExercises)}
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkoutActionButton(treino, planId, isActive, completedExercises, totalExercises) {
        if (!isActive) {
            return `
                <button onclick="app.startWorkout(${planId}, '${treino.id}')" class="btn ${treino.concluido ? 'btn-warning' : 'btn-success'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="6,3 20,12 6,21"/>
                    </svg>
                    ${treino.concluido ? 'Repetir' : 'Iniciar'}
                </button>
            `;
        } else {
            const allCompleted = completedExercises >= totalExercises;
            return `
                <button onclick="app.completeWorkout(${planId}, '${treino.id}')" 
                        class="${allCompleted ? 'btn btn-warning' : 'btn btn-disabled'}" 
                        ${!allCompleted ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    ${allCompleted ? 'Concluir' : `Faltam ${totalExercises - completedExercises}`}
                </button>
            `;
        }
    }

    renderPlanObservations(observacoes) {
        return `
            <div class="plan-observations">
                <div class="observations-title">
                    📝 Observações do Plano
                </div>
                ${Object.entries(observacoes).map(([key, value]) => {
                    if (!value) return '';
                    const label = this.getObservationLabel(key);
                    return `<div class="observation-item">
                        <span class="observation-label">${label}:</span> ${value}
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    renderWorkout() {
        if (!this.state.currentWorkout || !this.state.currentPlan) return;

        const workoutTitle = document.getElementById('workoutTitle');
        const workoutSubtitle = document.getElementById('workoutSubtitle');
        
        if (workoutTitle) workoutTitle.textContent = this.state.currentWorkout.nome;
        if (workoutSubtitle) {
            workoutSubtitle.textContent = `${this.state.currentWorkout.exercicios.length} exercícios • ${this.state.currentWorkout.foco}`;
        }

        const content = document.getElementById('workoutContent');
        if (!content) return;

        const sessionKey = `${this.state.currentPlan.id}-${this.state.currentWorkout.id}`;
        const isWorkoutActive = this.state.activeWorkoutSessions.has(sessionKey);

        let html = '';

        // Warning if workout is not active
        if (!isWorkoutActive) {
            html += `
                <div class="alert alert-warning">
                    <span class="alert-icon">⚠️</span>
                    Para realizar os exercícios, você precisa iniciar o treino na tela anterior
                </div>
            `;
        }

        // Exercise cards
        html += this.state.currentWorkout.exercicios.map((exercicio, index) => 
            this.renderExerciseCard(exercicio, index, isWorkoutActive)
        ).join('');

        // Completion card if workout is active
        if (isWorkoutActive) {
            html += this.renderWorkoutCompletionCard();
        }

        content.innerHTML = html;
    }

    renderExerciseCard(exercicio, index, isWorkoutActive) {
        const isEditing = this.state.editingWeights.has(exercicio.id);
        const cardClass = isWorkoutActive 
            ? (exercicio.concluido ? 'completed' : 'pending')
            : 'disabled';
        
        // Buscar descrição da técnica se houver
        const tecnicaDescricao = exercicio.tecnica && this.state.currentPlan?.tecnicasAplicadas
            ? this.state.currentPlan.tecnicasAplicadas[exercicio.tecnica]
            : '';
        
        return `
            <div class="card exercise-card ${cardClass}">
                <div class="card-content">
                    <!-- CABEÇALHO DO EXERCÍCIO -->
                    <div class="exercise-header">
                        <div class="exercise-main">
                            <div class="exercise-title-row">
                                <h3 class="exercise-number">${index + 1}. ${exercicio.nome}</h3>
                                ${exercicio.concluido && isWorkoutActive ? `
                                    <div class="check-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- DESCRIÇÃO COMPLETA -->
                            ${exercicio.descricao ? `
                                <div class="exercise-description">
                                    <div class="description-label">📝 Descrição:</div>
                                    <div class="description-text">${exercicio.descricao}</div>
                                </div>
                            ` : ''}
                            
                            <!-- TÉCNICA APLICADA -->
                            ${exercicio.tecnica ? `
                                <div class="exercise-technique">
                                    <div class="technique-header">
                                        <span class="technique-badge" data-technique="${exercicio.tecnica}">
                                            ${this.formatTechniqueName(exercicio.tecnica)}
                                        </span>
                                    </div>
                                    ${tecnicaDescricao ? `
                                        <div class="technique-description">
                                            <strong>Como executar:</strong> ${tecnicaDescricao}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <!-- OBSERVAÇÕES ESPECIAIS -->
                            ${exercicio.observacoesEspeciais ? `
                                <div class="exercise-notes">
                                    <div class="notes-icon">💡</div>
                                    <div class="notes-content">
                                        <div class="notes-label">Observações Especiais:</div>
                                        <div class="notes-text">${exercicio.observacoesEspeciais}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- ESPECIFICAÇÕES DETALHADAS -->
                    <div class="exercise-specs-detailed">
                        <div class="specs-grid">
                            <div class="spec-item">
                                <div class="spec-icon">🔢</div>
                                <div class="spec-content">
                                    <div class="spec-label">Séries</div>
                                    <div class="spec-value">${exercicio.series}</div>
                                </div>
                            </div>
                            
                            <div class="spec-item">
                                <div class="spec-icon">🔄</div>
                                <div class="spec-content">
                                    <div class="spec-label">Repetições</div>
                                    <div class="spec-value">${exercicio.repeticoes}</div>
                                </div>
                            </div>
                            
                            <div class="spec-item">
                                <div class="spec-icon">⚖️</div>
                                <div class="spec-content">
                                    <div class="spec-label">Carga Atual</div>
                                    <div class="spec-value highlight">${exercicio.currentCarga}</div>
                                    ${exercicio.currentCarga !== exercicio.carga ? `
                                        <div class="spec-original">Original: ${exercicio.carga}</div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${exercicio.descanso && exercicio.descanso !== '0' ? `
                            <div class="spec-item">
                                <div class="spec-icon">⏱️</div>
                                <div class="spec-content">
                                    <div class="spec-label">Descanso</div>
                                    <div class="spec-value">${exercicio.descanso}</div>
                                </div>
                            </div>
                            ` : ''}
                            
                         </div>
                    </div>
                    
                    <!-- HISTÓRICO DE CARGA (se disponível) -->
                    ${this.renderWeightHistory(exercicio)}
                    
                    <!-- AÇÕES DO EXERCÍCIO -->
                    ${isEditing ? this.renderWeightEditForm(exercicio) : this.renderExerciseActions(exercicio, isWorkoutActive)}
                </div>
            </div>
        `;
    }
    
    // =============================================================================
    // FUNÇÕES AUXILIARES NOVAS
    // =============================================================================
    
    // Formatar nome da técnica para exibição
    formatTechniqueName(tecnica) {
        const nomes = {
            'tempo-controlado': 'Tempo Controlado',
            'bi-set': 'Bi-Set',
            'pre-exaustao': 'Pré-Exaustão',
            'pos-exaustao': 'Pós-Exaustão',
            'drop-set': 'Drop Set',
            'rest-pause': 'Rest-Pause',
            'superset': 'Superset',
            'cluster': 'Cluster Set'
        };
        return nomes[tecnica] || tecnica.charAt(0).toUpperCase() + tecnica.slice(1);
    }
    
    // Renderizar histórico de mudanças de carga (futuro)
    renderWeightHistory(exercicio) {
        // Se no futuro quiser mostrar histórico de cargas
        if (exercicio.historicoCargas && exercicio.historicoCargas.length > 0) {
            return `
                <div class="weight-history">
                    <div class="history-label">📈 Histórico de Cargas:</div>
                    <div class="history-items">
                        ${exercicio.historicoCargas.slice(-3).map(item => `
                            <span class="history-item">${item.data}: ${item.carga}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        return '';
    }

    renderWeightEditForm(exercicio) {
        return `
            <div class="weight-edit">
                <input type="text" id="weight-input-${exercicio.id}" 
                       class="weight-input" 
                       value="${exercicio.currentCarga}" 
                       placeholder="Digite a nova carga"
                       autocomplete="off">
                <div class="weight-edit-actions">
                    <button onclick="app.handleSaveWeight(${exercicio.id})" class="btn btn-success btn-small">
                        Salvar
                    </button>
                    <button onclick="app.cancelEditingWeight(${exercicio.id})" class="btn btn-secondary btn-small">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
    }

    renderExerciseActions(exercicio, isWorkoutActive) {
        return `
            <div class="exercise-actions">
                                       <!-- NOVO: BOTÃO VER EXERCÍCIO -->
                               <button onclick="app.showExerciseGif('${exercicio.nome.replace(/'/g, "\\'")}')" 
                                        class="btn btn-view-exercise">
                                    <div class="btn-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </div>
                                    <div class="btn-text">
                                        <div class="btn-label">Ver Exercício</div>
                                        <div class="btn-subtitle">Demonstração</div>
                                    </div>
                                </button>

                <button onclick="app.startEditingWeight(${exercicio.id})" class="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar Carga
                </button>
                
                ${isWorkoutActive ? `
                    <button onclick="app.completeExercise(${this.state.currentPlan.id}, '${this.state.currentWorkout.id}', ${exercicio.id})" 
                            ${exercicio.concluido ? 'disabled' : ''} 
                            class="${exercicio.concluido ? 'btn btn-disabled' : 'btn btn-success'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        ${exercicio.concluido ? 'Concluído' : 'Concluir'}
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderWorkoutCompletionCard() {
        const allCompleted = this.state.currentWorkout.exercicios.every(ex => ex.concluido);
        const completedCount = this.state.currentWorkout.exercicios.filter(ex => ex.concluido).length;
        const totalCount = this.state.currentWorkout.exercicios.length;
        
        return `
            <div class="card completion-card">
                <div class="card-content">
                    <h3 class="completion-title">Treino em Andamento</h3>
                    <p class="completion-subtitle">
                        ${completedCount}/${totalCount} exercícios concluídos
                    </p>
                    ${this.renderProgressBar((completedCount / totalCount) * 100)}
                    <button onclick="app.completeWorkout(${this.state.currentPlan.id}, '${this.state.currentWorkout.id}')" 
                            ${!allCompleted ? 'disabled' : ''} 
                            class="${!allCompleted ? 'btn btn-disabled' : 'btn btn-warning'}">
                        ${allCompleted ? 'Finalizar Treino' : `Faltam ${totalCount - completedCount} exercícios`}
                    </button>
                </div>
            </div>
        `;
    }
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    formatDate(dateString) {
        if (!dateString) return 'Não definido';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch (error) {
            return 'Data inválida';
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

    getWorkoutStatusClass(isCompleted, progress) {
        if (isCompleted) return 'completed';
        if (progress > 0) return 'in-progress';
        return 'not-started';
    }

    getWorkoutStatusText(isCompleted, progress) {
        if (isCompleted) return '✅ Concluído';
        if (progress > 0) return `${Math.round(progress)}% completo`;
        return 'Não iniciado';
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =============================================================================
    // EXERCISE GIF MANAGEMENT (NOVO)
    // =============================================================================

    // NOVA FUNÇÃO: Buscar GIF do exercício na base de dados

    findExerciseGif(exerciseName) {
        // Aguardar carregamento da base se necessário
        if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
            console.warn('⚠️ Base de exercícios ainda não carregada');
            return null;
        }

        const normalizedName = exerciseName.trim().toLowerCase();
        
        // Busca exata primeiro
        const exactMatch = this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase() === normalizedName
        );
        
        if (exactMatch) {
            return exactMatch.Column4;
        }
        
        // Busca parcial como fallback
        const partialMatch = this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(exercise.nome.toLowerCase())
        );
        
        if (partialMatch) {
            console.log(`🔍 Busca parcial: "${exerciseName}" → "${partialMatch.nome}"`);
            return partialMatch.Column4;
        }
        
        // Log para debug
        console.warn(`❌ Exercício não encontrado: "${exerciseName}"`);
        return null;
    }


    // NOVA FUNÇÃO: Mostrar modal com GIF do exercício
    showExerciseGif(exerciseName) {
        // Verificar se a base está carregada
        if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
            this.showNotification('⚠️ Base de exercícios ainda não carregada. Aguarde...', 'warning');
            return;
        }

        const gifPath = this.findExerciseGif(exerciseName);
        const exerciseData = this.findExerciseByName(exerciseName);
        
        // Criar modal se não existir
        let modal = document.getElementById('exerciseGifModal');
        if (!modal) {
            modal = this.createExerciseGifModal();
            document.body.appendChild(modal);
        }
        
        // Atualizar conteúdo do modal
        const exerciseNameEl = modal.querySelector('#exerciseGifName');
        const exerciseImageEl = modal.querySelector('#exerciseGifImage');
        const notFoundEl = modal.querySelector('#exerciseNotFound');
        const exerciseInfoEl = modal.querySelector('#exerciseInfo');
        
        exerciseNameEl.textContent = exerciseName;
        
        if (gifPath) {
            exerciseImageEl.src = gifPath;
            exerciseImageEl.style.display = 'block';
            notFoundEl.style.display = 'none';
            
            // Adicionar informações extras se disponível
            if (exerciseData && exerciseInfoEl) {
                exerciseInfoEl.innerHTML = `
                ${exerciseData.grupo ? `<div class="exercise-group">Grupo: ${exerciseData.grupo[0].toUpperCase() + exerciseData.grupo.slice(1).toLowerCase()}</div>` : ''}
                ${exerciseData.Musculos ? `<div class="exercise-muscles">Músculos: ${exerciseData.Musculos[0].toUpperCase() + exerciseData.Musculos.slice(1).toLowerCase()}</div>` : ''}
                ${exerciseData.descricao && exerciseData.descricao.length > 0 ? `<div class="exercise-description-modal">${exerciseData.descricao[0].toUpperCase() + exerciseData.descricao.slice(1).toLowerCase()}</div>` : ''}              `;
                exerciseInfoEl.style.display = 'block';
            }
            
            // Tratamento de erro de carregamento da imagem
            exerciseImageEl.onerror = () => {
                console.error(`❌ Erro ao carregar imagem: ${gifPath}`);
                exerciseImageEl.style.display = 'none';
                notFoundEl.style.display = 'block';
                notFoundEl.querySelector('.not-found-subtitle').textContent = 
                    'Erro ao carregar a demonstração visual deste exercício.';
            };
        } else {
            exerciseImageEl.style.display = 'none';
            notFoundEl.style.display = 'block';
            if (exerciseInfoEl) exerciseInfoEl.style.display = 'none';
        }
        
        // Mostrar modal
        modal.classList.remove('hidden');
    }

        // Buscar exercício completo por nome
        findExerciseByName(exerciseName) {
            if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
                return null;
            }
    
            const normalizedName = exerciseName.trim().toLowerCase();
            
            return this.exerciseDatabase.find(exercise => 
                exercise.nome.toLowerCase() === normalizedName
            );
        }
    
        // Buscar exercícios por grupo
        findExercisesByGroup(groupName) {
            if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
                return [];
            }
    
            const normalizedGroup = groupName.trim().toLowerCase();
            
            return this.exerciseDatabase.filter(exercise => 
                exercise.grupo.toLowerCase() === normalizedGroup
            );
        }
    
        // Buscar exercícios por músculos
        findExercisesByMuscle(muscleName) {
            if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
                return [];
            }
        
            // Normaliza o nome do músculo
            const normalizedMuscle = muscleName[0].toUpperCase() + muscleName.slice(1).toLowerCase().trim();
        
            return this.exerciseDatabase.filter(exercise => 
                exercise.Musculos && exercise.Musculos.toLowerCase().includes(normalizedMuscle.toLowerCase())
            );
        }
        
    
        // Obter todos os grupos disponíveis
        getAllExerciseGroups() {
            if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
                return [];
            }
    
            const groups = new Set();
            this.exerciseDatabase.forEach(exercise => {
                if (exercise.grupo) {
                    groups.add(exercise.grupo);
                }
            });
            
            return Array.from(groups).sort();
        }
    
        // Validar se um exercício existe
        exerciseExists(exerciseName) {
            return this.findExerciseByName(exerciseName) !== null;
        }


    // NOVA FUNÇÃO: Criar modal do GIF

    createExerciseGifModal() {
        const modal = document.createElement('div');
        modal.id = 'exerciseGifModal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="app.hideExerciseGif()"></div>
            <div class="modal-content exercise-gif-modal">
                <div class="modal-header">
                    <h3 id="exerciseGifName" class="modal-title">Nome do Exercício</h3>
                    <button class="modal-close" onclick="app.hideExerciseGif()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m18 6-12 12"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Informações do exercício -->
                    <div id="exerciseInfo" class="exercise-info-modal" style="display: none;"></div>
                    
                    <div class="exercise-gif-container">
                        <img id="exerciseGifImage" 
                             class="exercise-gif" 
                             alt="Demonstração do exercício"
                             style="display: none;">
                        <div id="exerciseNotFound" class="exercise-not-found" style="display: none;">
                            <div class="not-found-icon">🚫</div>
                            <div class="not-found-text">Demonstração não disponível</div>
                            <div class="not-found-subtitle">
                                A demonstração visual deste exercício não está disponível em nossa base de dados.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="app.hideExerciseGif()" class="btn btn-secondary">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        return modal;
    }

    // PASSO 8: MÉTODO DE DEBUG E MANUTENÇÃO
    // =====================================

    // Método para debug - verificar exercícios de um plano
    debugPlanExercises(planId) {
        const plan = this.findPlan(planId);
        if (!plan) {
            console.log('❌ Plano não encontrado');
            return;
        }

        console.log(`🔍 Debug do plano: "${plan.nome}"`);
        
        plan.treinos.forEach((treino, treinoIndex) => {
            console.log(`\n  Treino ${treino.id} - ${treino.nome}:`);
            
            treino.exercicios.forEach((ex, exIndex) => {
                const gifPath = this.findExerciseGif(ex.nome);
                const status = gifPath ? '✅' : '❌';
                
                console.log(`    ${status} ${exIndex + 1}. ${ex.nome}`);
                if (gifPath) {
                    console.log(`         GIF: ${gifPath}`);
                } else {
                    // Sugerir exercícios similares
                    const similar = this.findSimilarExercises(ex.nome);
                    if (similar.length > 0) {
                        console.log(`         Similares: ${similar.slice(0, 3).map(s => s.nome).join(', ')}`);
                    }
                }
            });
        });
    }

    // Buscar exercícios similares
    findSimilarExercises(exerciseName, maxResults = 5) {
        if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
            return [];
        }

        const normalizedName = exerciseName.toLowerCase();
        const words = normalizedName.split(' ').filter(w => w.length > 2);
        
        const matches = this.exerciseDatabase
            .filter(ex => {
                const exName = ex.nome.toLowerCase();
                return words.some(word => exName.includes(word));
            })
            .slice(0, maxResults);
        
        return matches;
    }

    // PASSO 9: VALIDAÇÃO DE INTEGRIDADE
    // ==================================

    validateExerciseDatabase() {
        if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
            console.warn('⚠️ Base de exercícios vazia ou não carregada');
            return false;
        }

        let isValid = true;
        const issues = [];

        this.exerciseDatabase.forEach((ex, index) => {
            // Verificar campos obrigatórios
            if (!ex.nome) {
                issues.push(`Exercício ${index + 1}: Nome ausente`);
                isValid = false;
            }
            
            if (!ex.Column4) {
                issues.push(`Exercício ${index + 1} (${ex.nome}): Column4 (GIF) ausente`);
                isValid = false;
            }
            
            if (!ex.grupo) {
                issues.push(`Exercício ${index + 1} (${ex.nome}): Grupo ausente`);
            }
        });

        if (issues.length > 0) {
            console.warn('⚠️ Problemas na base de exercícios:');
            issues.forEach(issue => console.warn(`   ${issue}`));
        }

        return isValid;
    }


    // NOVA FUNÇÃO: Esconder modal do GIF
    hideExerciseGif() {
        const modal = document.getElementById('exerciseGifModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================

    async handleImportById() {
        const input = document.getElementById('importIdInput');
        const button = document.getElementById('importIdButton');
        const status = document.getElementById('importStatus');
        
        if (!input || !button || !status) return;
        
        const shareId = input.value.trim();
        
        if (!shareId) {
            this.updateImportStatus('Digite um ID válido', 'error');
            return;
        }
        
        if (shareId.length !== 6) {
            this.updateImportStatus('ID deve ter 6 caracteres', 'error');
            return;
        }
        
        // Update UI for loading state
        button.innerHTML = '<span class="loading-spinner"></span> Importando...';
        button.classList.add('btn-loading');
        button.disabled = true;
        this.updateImportStatus('Buscando plano...', 'loading');
        
        try {
            const result = await this.importPlanById(shareId);
            
            this.state.workoutPlans.push(result.plan);
            await this.saveToStorage();
            
            const sourceText = result.source === 'server' ? 'servidor' : 'cache local';
            this.updateImportStatus(`✅ Plano "${result.plan.nome}" importado do ${sourceText}!`, 'success');
            input.value = '';
            
            setTimeout(() => {
                this.renderHome();
                this.updateImportStatus('Peça o ID do seu personal trainer', 'info');
            }, 2000);
            
        } catch (error) {
            console.error('Import error:', error);
            this.updateImportStatus(`❌ ${error.message}`, 'error');
        } finally {
            // Reset button
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                Importar por ID
            `;
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    handleSaveWeight(exerciseId) {
        const input = document.getElementById(`weight-input-${exerciseId}`);
        if (!input) return;

        const newWeight = input.value.trim();
        this.saveWeight(
            this.state.currentPlan.id, 
            this.state.currentWorkout.id, 
            exerciseId, 
            newWeight
        );
    }

    updateImportStatus(message, type) {
        const status = document.getElementById('importStatus');
        if (!status) return;
        
        status.textContent = message;
        status.className = `import-status ${type}`;
    }

    loadExampleData() {
        const examplePlan = {
            id: this.generateId(),
            nome: "Plano Exemplo - Adaptação Iniciante",
            importedAt: new Date().toISOString(),
            importedFrom: 'example',
            aluno: {
                nome: "Usuário Exemplo",
                dataNascimento: "1990-01-01",
                altura: "1,75m",
                peso: "75kg"
            },
            dias: 3,
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            perfil: {
                objetivo: "Condicionamento geral e adaptação"
            },
            treinos: [
                {
                    id: "A",
                    nome: "A - Corpo Inteiro",
                    foco: "Adaptação e condicionamento geral",
                    exercicios: [
                        {
                            id: this.generateId(),
                            nome: "Aquecimento - Esteira",
                            series: 1,
                            repeticoes: "10 min",
                            carga: "Ritmo moderado",
                            descanso: "0",
                            descricao: "Caminhada em ritmo moderado para aquecimento geral",
                            concluido: false,
                            currentCarga: "Ritmo moderado"
                        },
                        {
                            id: this.generateId(),
                            nome: "Agachamento Livre",
                            series: 3,
                            repeticoes: "12-15",
                            carga: "Peso corporal",
                            descanso: "90 segundos",
                            descricao: "Movimento básico fundamental, mantenha as costas retas",
                            concluido: false,
                            currentCarga: "Peso corporal"
                        },
                        {
                            id: this.generateId(),
                            nome: "Flexão de Braços",
                            series: 3,
                            repeticoes: "8-12",
                            carga: "Peso corporal",
                            descanso: "90 segundos",
                            descricao: "Pode ser feito com joelhos apoiados se necessário",
                            concluido: false,
                            currentCarga: "Peso corporal"
                        },
                        {
                            id: this.generateId(),
                            nome: "Prancha",
                            series: 3,
                            repeticoes: "30-60 seg",
                            carga: "Peso corporal",
                            descanso: "60 segundos",
                            descricao: "Mantenha o corpo alinhado, contraindo o abdômen",
                            concluido: false,
                            currentCarga: "Peso corporal"
                        }
                    ],
                    concluido: false,
                    execucoes: 0
                },
                {
                    id: "B",
                    nome: "B - Cardio e Core",
                    foco: "Condicionamento cardiovascular e fortalecimento do core",
                    exercicios: [
                        {
                            id: this.generateId(),
                            nome: "Aquecimento - Bicicleta",
                            series: 1,
                            repeticoes: "8 min",
                            carga: "Resistência leve",
                            descanso: "0",
                            descricao: "Pedalada em ritmo moderado para aquecimento",
                            concluido: false,
                            currentCarga: "Resistência leve"
                        },
                        {
                            id: this.generateId(),
                            nome: "Burpee",
                            series: 3,
                            repeticoes: "5-8",
                            carga: "Peso corporal",
                            descanso: "90 segundos",
                            descricao: "Exercício completo: agachamento, prancha, flexão e salto",
                            concluido: false,
                            currentCarga: "Peso corporal"
                        },
                        {
                            id: this.generateId(),
                            nome: "Mountain Climber",
                            series: 3,
                            repeticoes: "30 seg",
                            carga: "Peso corporal",
                            descanso: "60 segundos",
                            descricao: "Posição de prancha, alternando joelhos ao peito rapidamente",
                            concluido: false,
                            currentCarga: "Peso corporal"
                        }
                    ],
                    concluido: false,
                    execucoes: 0
                }
            ],
            observacoes: {
                frequencia: "3x por semana com 1 dia de descanso entre sessões",
                progressao: "Aumente as repetições gradualmente antes de adicionar peso",
                descanso: "90 segundos entre séries",
                hidratacao: "Beba água antes, durante e após o treino"
            },
            execucoesPlanCompleto: 0
        };

        this.state.workoutPlans.push(examplePlan);
        this.saveToStorage();
        this.renderHome();
        this.showNotification('Plano de exemplo carregado!', 'success');
    }
}

// =============================================================================
// GLOBAL INITIALIZATION AND NAVIGATION FUNCTIONS
// =============================================================================

let app;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new JSFitStudentApp();
});

// Also initialize on window load as fallback
window.addEventListener('load', () => {
    if (!app) {
        app = new JSFitStudentApp();
    }
});

// Global navigation functions for onclick handlers
function showHome() {
    if (app) app.showHome();
}

function showPlan() {
    if (app && app.state.currentPlan) app.showPlan(app.state.currentPlan.id);
}

function hideConfirmation() {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.classList.add('hidden');
}

function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('hidden');
}

function hideErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.classList.add('hidden');
}