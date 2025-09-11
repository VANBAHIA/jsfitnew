// aluno.js - JS Fit Student App - Complete with Direct File Import
// Sistema modernizado compatível com PostgreSQL e Netlify Functions



class JSFitStudentApp {
    constructor() {

        this.core = new JSFitCore(this.firebaseConfig);


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
        this.core.exerciseDatabase = []; // Array simples que será carregado do DATABASE.JSON
        
         // Create hidden file input for direct import
        this.createFileInput();
    }

    // =============================================================================
    // INITIALIZATION & SETUP
    // =============================================================================

    async init() {
        console.log('Inicializando JS Fit Student App com Firebase...');
        
        try {
            // 1. Inicializar Firebase
            await this.core.initializeFirebase();
            
            // 2. Configurações existentes
            this.setupEventListeners();
            this.setupPWAFeatures();
            await this.loadFromStorage();
            
            // 3. Carregar base de exercícios
            await this.core.loadExerciseDatabase();
            this.validateExerciseDatabase();
            
            // 4. Renderizar interface
            this.renderHome();
            
            console.log('App inicializado com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showNotification('Erro ao inicializar aplicativo', 'error');
        }
    }



    setupEventListeners() {
        // Network status para Firebase
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            if (this.firebaseConnected) {
                this.showNotification('Conexão restaurada - Firebase online', 'success');
            }
        });
    
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.showNotification('Modo offline - usando dados locais', 'warning');
        });
    
        // App lifecycle
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveToStorage();
            }
        });
    }

    
    // PASSO 3: MÉTODO PARA MOSTRAR ESTATÍSTICAS
    // ==========================================
    
    logDatabaseStats() {
        if (this.core.exerciseDatabase.length === 0) return;
        
        // Contar exercícios por grupo
        const groupStats = {};
        this.core.exerciseDatabase.forEach(ex => {
            const grupo = ex.grupo || 'Sem grupo';
            groupStats[grupo] = (groupStats[grupo] || 0) + 1;
        });
        
        console.log('📊 Estatísticas da base de exercícios:');
        console.log(`   Total: ${this.core.exerciseDatabase.length} exercícios`);
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
            
            // Student data com correção de data
            aluno: {
                nome: data.aluno?.nome || data.student?.name || '',
                dataNascimento: data.aluno?.dataNascimento ||'',
                idade: data.aluno?.idade || data.student?.age || null,
                altura: data.aluno?.altura || data.student?.height || '',
                peso: data.aluno?.peso || data.student?.weight || '',
                cpf: data.aluno?.cpf || data.student?.cpf || ''
            },
            
            // Plan metadata com correção de datas
            dias: planData.dias || planData.frequency_per_week || 3,
            dataInicio: planData.dataInicio || planData.start_date || new Date().toISOString().split('T')[0],
            dataFim: planData.dataFim || planData.end_date || '',
            
            // Profile and objectives
            perfil: {
                objetivo: data.perfil?.objetivo || data.objective || 'Condicionamento geral',
                altura: data.aluno?.altura || data.student?.height || '',
                peso: data.aluno?.peso || data.student?.weight || '',
                idade: data.aluno?.idade || data.student?.age || null,
                porte: data.perfil?.porte || ''
            },
            
            // Convert workouts
            treinos: this.convertWorkoutsToFrontendFormat(data.treinos || data.workouts || []),
            
            // Observations
            observacoes: data.observacoes || data.observations || {},
            
            // Técnicas aplicadas
            tecnicasAplicadas: data.tecnicas_aplicadas || {}
        };
    
        // Validate processed plan
        if (processedPlan.treinos.length === 0) {
            throw new Error('Nenhum treino válido encontrado no arquivo');
        }
    
        return processedPlan;
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

  
    }

    // =============================================================================
    // SERVER COMMUNICATION
    // =============================================================================


async fetchFromFirebase(shareId) {
    try {
        const { doc, getDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const shareRef = doc(window.db, 'shared_plans', shareId);
        const shareDoc = await getDoc(shareRef);
        
        if (!shareDoc.exists()) {
            throw new Error('Plano não encontrado no Firebase');
        }
        
        const shareData = shareDoc.data();
        
        // Verificar se está ativo
        if (!shareData.isActive) {
            throw new Error('Este plano foi desativado');
        }
        
        // Verificar se expirou
        if (shareData.expiresAt && new Date() > shareData.expiresAt.toDate()) {
            throw new Error('Este plano expirou');
        }
        
        // Incrementar contador de acesso
        try {
            await updateDoc(shareRef, {
                accessCount: increment(1),
                lastAccessedAt: new Date()
            });
        } catch (updateError) {
            console.warn('Erro ao atualizar contador:', updateError);
        }
        
        return shareData.plan;
        
    } catch (error) {
        throw new Error(`Erro ao buscar do Firebase: ${error.message}`);
    }
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

    let html = '';
    
    // Renderizar planos primeiro
    if (this.state.workoutPlans.length === 0) {
        html += this.renderEmptyState();
    } else {
        html += this.state.workoutPlans.map(plan => this.renderPlanCard(plan)).join('');
    }
    
    // Adicionar card de importação no final
    html += this.renderImportCard();
    
    content.innerHTML = html;
}

  renderImportCard() {
    const firebaseStatus = this.firebaseConnected ? 'online' : 'offline';
    
    return `
        <div class="card import-by-id-card">
            <div class="card-content">
                <h3 class="import-title">Importar Treino</h3>
                
                <div class="import-section">
                    <div class="server-status ${firebaseStatus}">
                        ${firebaseStatus === 'online' ? 
                            'Firebase online - Buscará do servidor' : 
                            'Firebase offline - Usando cache local'
                        }
                    </div>
                    <h4 class="import-method-title">Por ID do Firebase</h4>
                    <div class="import-form">
                        <input type="text" id="importIdInput" class="import-input" 
                               placeholder="Digite o ID (6 caracteres)" 
                               maxlength="6" 
                               autocomplete="off"
                               oninput="this.value = this.value.toUpperCase()"
                               onkeypress="if(event.key==='Enter') app.handleImportById()">
                        <button id="importIdButton" class="btn import-btn" onclick="app.handleImportById()">
                            Importar por ID
                        </button>
                    </div>
                    <div id="importStatus" class="import-status">
                        Peça o ID do seu personal trainer
                    </div>
                </div>

                <div class="import-section">
                    <div class="import-divider">
                        <span>OU</span>
                    </div>
                    <button class="btn btn-secondary import-file-btn" onclick="app.openFileSelector()">
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
        const age = this.core.calculateAge(student.dataNascimento) || student.idade;
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
                    ${this.renderDetailItem('Nascimento', this.core.formatDate(student.dataNascimento))}
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
                        ${this.core.formatDate(plan.dataInicio)} - ${this.core.formatDate(plan.dataFim)}
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
            planSubtitle.textContent = `${this.core.formatDate(this.state.currentPlan.dataInicio)} - ${this.core.formatDate(this.state.currentPlan.dataFim)}`;
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
            const age = this.core.calculateAge(plan.aluno.dataNascimento) || plan.aluno.idade;
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
                                <h3 class="exercise-number">${index + 1}. ${exercicio.nome.charAt(0).toUpperCase() + exercicio.nome.slice(1).toLowerCase()}</h3>
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
                                    <div class="description-text">
                                        ${this.findExerciseByName(exercicio.nome)?.descricao.charAt(0).toUpperCase() + this.findExerciseByName(exercicio.nome)?.descricao.slice(1).toLowerCase()}
                                    </div>

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
        if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
            console.warn('⚠️ Base de exercícios ainda não carregada');
            return null;
        }

        const normalizedName = exerciseName.trim().toLowerCase();
        
        // Busca exata primeiro
        const exactMatch = this.core.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase() === normalizedName
        );
        
        if (exactMatch) {
            return exactMatch.Column4;
        }
        
        // Busca parcial como fallback
        const partialMatch = this.core.exerciseDatabase.find(exercise => 
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
        if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
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
            if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
                return null;
            }
    
            const normalizedName = exerciseName.trim().toLowerCase();
            
            return this.core.exerciseDatabase.find(exercise => 
                exercise.nome.toLowerCase() === normalizedName
            );
        }
    
        // Buscar exercícios por grupo
        findExercisesByGroup(groupName) {
            if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
                return [];
            }
    
            const normalizedGroup = groupName.trim().toLowerCase();
            
            return this.core.exerciseDatabase.filter(exercise => 
                exercise.grupo.toLowerCase() === normalizedGroup
            );
        }
    
        // Buscar exercícios por músculos
        findExercisesByMuscle(muscleName) {
            if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
                return [];
            }
        
            // Normaliza o nome do músculo
            const normalizedMuscle = muscleName[0].toUpperCase() + muscleName.slice(1).toLowerCase().trim();
        
            return this.core.exerciseDatabase.filter(exercise => 
                exercise.Musculos && exercise.Musculos.toLowerCase().includes(normalizedMuscle.toLowerCase())
            );
        }
        
    
        // Obter todos os grupos disponíveis
        getAllExerciseGroups() {
            if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
                return [];
            }
    
            const groups = new Set();
            this.core.exerciseDatabase.forEach(exercise => {
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
        if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
            return [];
        }

        const normalizedName = exerciseName.toLowerCase();
        const words = normalizedName.split(' ').filter(w => w.length > 2);
        
        const matches = this.core.exerciseDatabase
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
        if (!this.core.exerciseDatabase || this.core.exerciseDatabase.length === 0) {
            console.warn('⚠️ Base de exercícios vazia ou não carregada');
            return false;
        }

        let isValid = true;
        const issues = [];

        this.core.exerciseDatabase.forEach((ex, index) => {
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

// Substituir a função handleImportById() existente no aluno.js

async handleImportById() {
    console.log('🔄 INÍCIO - handleImportById chamado');
    
    // Verificar se já está importando
    if (this.importing) {
        console.log('⚠️ Importação já em andamento');
        this.updateImportStatus('Uma importação já está em andamento', 'warning');
        return;
    }
    
    // Verificar elementos DOM
    const input = document.getElementById('importIdInput');
    const button = document.getElementById('importIdButton');
    const status = document.getElementById('importStatus');
    
    console.log('📋 ELEMENTOS DOM:', { 
        input: !!input, 
        button: !!button, 
        status: !!status 
    });
    
    if (!input || !button || !status) {
        console.error('❌ ERRO CRÍTICO: Elementos da interface não encontrados', {
            input: !!input, button: !!button, status: !!status
        });
        alert('Erro na interface. Recarregue a página.');
        return;
    }
    
    // Verificar se core está inicializado
    if (!this.core) {
        console.error('❌ ERRO: Core não existe');
        this.updateImportStatus('Sistema não inicializado. Recarregue a página.', 'error');
        return;
    }
    
    if (typeof this.core.importSharedPlan !== 'function') {
        console.error('❌ ERRO: Método importSharedPlan não existe');
        this.updateImportStatus('Funcionalidade não disponível. Atualize o app.', 'error');
        return;
    }
    
    // Obter e validar ID
    const shareId = input.value.trim().toUpperCase();
    console.log('🆔 SHARE ID obtido:', shareId);
    
    // Validações básicas
    if (!shareId) {
        console.log('⚠️ VALIDAÇÃO: ID vazio');
        this.updateImportStatus('Digite um ID válido', 'error');
        input.focus();
        return;
    }
    
    if (shareId.length !== 6) {
        console.log('⚠️ VALIDAÇÃO: ID com tamanho incorreto:', shareId.length);
        this.updateImportStatus('ID deve ter exatamente 6 caracteres', 'error');
        input.focus();
        return;
    }
    
    if (!/^[A-Z0-9]{6}$/.test(shareId)) {
        console.log('⚠️ VALIDAÇÃO: ID com caracteres inválidos');
        this.updateImportStatus('ID deve conter apenas letras e números', 'error');
        input.focus();
        return;
    }
    
    console.log('✅ VALIDAÇÃO: ID aprovado');
    
    // Verificar se já foi importado
    console.log('🔍 VERIFICANDO: Planos existentes:', this.state.workoutPlans.length);
    const existingPlan = this.state.workoutPlans.find(p => 
        p.originalShareId === shareId || 
        p.shareId === shareId ||
        p.metadata?.shareId === shareId
    );
    
    if (existingPlan) {
        console.log('⚠️ DUPLICADO: Plano já existe:', existingPlan.nome);
        this.updateImportStatus(`Plano "${existingPlan.nome}" já foi importado`, 'warning');
        input.value = '';
        setTimeout(() => {
            this.renderHome();
        }, 1500);
        return;
    }
    
    console.log('✅ DUPLICAÇÃO: Plano não existe localmente');
    
    // Marcar como importando e configurar UI
    this.importing = true;
    const originalButtonText = button.innerHTML;
    button.innerHTML = '<span class="loading-spinner"></span> Buscando...';
    button.disabled = true;
    input.disabled = true;
    
    this.updateImportStatus('Conectando ao servidor...', 'loading');
    
    try {
        console.log('🔥 FIREBASE: Iniciando busca do plano');
        this.updateImportStatus('Buscando plano no servidor...', 'loading');
        
        // Buscar plano compartilhado
        const sharedPlanResponse = await this.core.importSharedPlan(shareId);
        console.log('✅ BUSCA: Dados obtidos:', {
            hasData: !!sharedPlanResponse,
            source: sharedPlanResponse?.metadata?.source,
            planExists: !!sharedPlanResponse?.plan
        });
        
        if (!sharedPlanResponse || !sharedPlanResponse.plan) {
            throw new Error('Dados do plano não foram encontrados');
        }
        
        // Verificar se processSharedPlanData existe
        if (typeof this.processSharedPlanData !== 'function') {
            console.error('❌ ERRO: Método processSharedPlanData não implementado');
            throw new Error('Funcionalidade de processamento não disponível');
        }
        
        // Processar e validar dados
        console.log('⚙️ PROCESSAMENTO: Iniciando processamento dos dados');
        this.updateImportStatus('Processando dados do plano...', 'loading');
        
        const processedPlan = await this.processSharedPlanData(
            sharedPlanResponse.plan, 
            shareId, 
            sharedPlanResponse.metadata
        );

        
        console.log('✅ PROCESSAMENTO: Plano processado:', {
            nome: processedPlan.nome,
            id: processedPlan.id,
            exerciciosCount: processedPlan.exercicios?.length || 0,
            hasMetadata: !!processedPlan.metadata
        });
        
        if (!processedPlan.nome) {
            throw new Error('Plano processado está incompleto');
        }
        
        // Adicionar à lista local
        console.log('💾 ESTADO: Adicionando plano ao estado local');
        this.state.workoutPlans.push(processedPlan);
        console.log('✅ ESTADO: Total de planos agora:', this.state.workoutPlans.length);
        
        // Salvar localmente
        console.log('💾 STORAGE: Salvando no armazenamento local');
        this.updateImportStatus('Salvando localmente...', 'loading');
        await this.saveToStorage();
        console.log('✅ STORAGE: Dados salvos localmente');
        
        // Salvar no cache para uso offline
        console.log('📦 CACHE: Salvando no cache');
        if (typeof this.savePlanToCache === 'function') {
            this.savePlanToCache(shareId, sharedPlanResponse);
            console.log('✅ CACHE: Plano salvo no cache');
        } else {
            console.warn('⚠️ CACHE: Método savePlanToCache não disponível');
        }
        
        // Feedback de sucesso
        console.log('🎉 SUCESSO: Importação concluída com sucesso');
        this.updateImportStatus(`Plano "${processedPlan.nome}" importado com sucesso!`, 'success');
        input.value = '';
        
        // Atualizar interface após delay
        console.log('🔄 UI: Agendando atualização da interface');
        setTimeout(() => {
            console.log('🏠 UI: Renderizando home e resetando status');
            this.renderHome();
            this.updateImportStatus('Peça o ID do seu personal trainer', 'info');
        }, 2000);
        
    } catch (error) {
        console.error('❌ ERRO PRINCIPAL:', error);
        console.error('❌ DETALHES DO ERRO:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 500),
            shareId: shareId
        });
        
        // Tentar cache local como fallback
        console.log('🔄 FALLBACK: Tentando cache local');
        let fallbackSuccess = false;
        
        try {
            if (typeof this.getPlanFromCache === 'function') {
                const cachedPlan = this.getPlanFromCache(shareId);
                console.log('📦 CACHE: Resultado da busca:', !!cachedPlan);
                
                if (cachedPlan) {
                    console.log('✅ CACHE: Dados encontrados, processando...');
                    this.updateImportStatus('Usando dados salvos...', 'loading');
                    
                    // Extrair dados do cache (pode ter estrutura diferente)
                    const planData = cachedPlan.plan || cachedPlan.planData || cachedPlan;
                    const metadata = cachedPlan.metadata || { source: 'cache', shareId };
                    
                    const processedPlan = await this.processSharedPlanData(planData, shareId, metadata);
                    console.log('✅ CACHE: Plano processado:', processedPlan.nome);
                    // Após a linha: const processedPlan = await this.processSharedPlanData(...)

                    
                    this.state.workoutPlans.push(processedPlan);
                    await this.saveToStorage();
                    console.log('✅ CACHE: Plano salvo do cache');
                    
                    this.updateImportStatus(`Plano "${processedPlan.nome}" importado (modo offline)`, 'success');
                    input.value = '';
                    fallbackSuccess = true;
                    
                    setTimeout(() => {
                        this.renderHome();
                        this.updateImportStatus('Peça o ID do seu personal trainer', 'info');
                    }, 2000);
                } else {
                    console.log('❌ CACHE: Nenhum dado encontrado no cache');
                }
            } else {
                console.warn('⚠️ CACHE: Método getPlanFromCache não disponível');
            }
        } catch (cacheError) {
            console.error('❌ CACHE ERRO:', cacheError);
            console.warn('Cache também falhou:', cacheError.message);
        }
        
        // Se o fallback não funcionou, mostrar erro
        if (!fallbackSuccess) {
            console.log('💬 ERRO FINAL: Exibindo mensagem de erro ao usuário');
            const errorMessage = this.getErrorMessage ? this.getErrorMessage(error) : error.message;
            this.updateImportStatus(errorMessage, 'error');
            
            // Dar foco de volta ao input para nova tentativa
            setTimeout(() => {
                input.focus();
            }, 100);
        }
        
    } finally {
        // Reset estados e UI
        console.log('🔄 CLEANUP: Resetando estado do botão e flags');
        button.innerHTML = originalButtonText;
        button.disabled = false;
        input.disabled = false;
        this.importing = false;
        console.log('✅ FIM - handleImportById concluído');
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

  // Adicionar estas funções à classe JSFitStudentApp no aluno.js

// 1. Buscar plano compartilhado do Firebase
async fetchSharedPlanFromFirebase(shareId) {
    try {
        const { doc, getDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        // Buscar na coleção de planos compartilhados
        const shareRef = doc(window.db, 'shared_plans', shareId);
        const shareDoc = await getDoc(shareRef);
        
        if (!shareDoc.exists()) {
            throw new Error(`Plano com ID ${shareId} não encontrado`);
        }
        
        const shareData = shareDoc.data();
        
        // Verificar se o plano está ativo
        if (!shareData.isActive) {
            throw new Error('Este plano foi desativado pelo personal trainer');
        }
        
        // Verificar se não expirou
        if (shareData.expiresAt && new Date() > shareData.expiresAt.toDate()) {
            throw new Error('Este plano expirou. Solicite um novo ID ao seu personal trainer');
        }
        
        // Incrementar contador de acesso (opcional)
        try {
            await updateDoc(shareRef, {
                accessCount: increment(1),
                lastAccessedAt: new Date()
            });
        } catch (updateError) {
            console.warn('Não foi possível atualizar contador de acesso:', updateError);
        }
        
        return shareData.planData;
        
    } catch (error) {
        if (error.code === 'permission-denied') {
            throw new Error('Sem permissão para acessar este plano');
        } else if (error.code === 'not-found') {
            throw new Error('Plano não encontrado. Verifique o ID');
        }
        throw error;
    }
}

// 2. Processar dados do plano compartilhado
async processSharedPlanData(planData, shareId) {
    if (!planData) {
        throw new Error('Dados do plano inválidos');
    }
    
    // Gerar ID único para o plano importado
    const processedPlan = {
        id: this.core.generateId(),
        originalShareId: shareId,
        nome: planData.nome || 'Plano Importado',
        importedAt: new Date().toISOString(),
        importedFrom: 'firebase',
        execucoesPlanCompleto: 0,
        
        // Dados do aluno
        aluno: {
            nome: planData.aluno?.nome || '',
            dataNascimento: planData.aluno?.dataNascimento || '',
            idade: planData.aluno?.idade || null,
            altura: planData.aluno?.altura || '',
            peso: planData.aluno?.peso || '',
            cpf: planData.aluno?.cpf || ''
        },
        dias: planData.dias || planData.frequency_per_week || 3,
dataInicio: planData.dataInicio || planData.start_date || new Date().toISOString().split('T')[0],
dataFim: planData.dataFim || planData.end_date || '',
        
        // Metadados do plano
    
        
        // Perfil e objetivos
        perfil: {
            objetivo: planData.perfil?.objetivo || 'Condicionamento geral',
            altura: planData.aluno?.altura || planData.perfil?.altura || '',
            peso: planData.aluno?.peso || planData.perfil?.peso || '',
            idade: planData.aluno?.idade || planData.perfil?.idade || null,
            porte: planData.perfil?.porte || this.core.calculateBodyType(
                planData.aluno?.altura || '1,75m',
                planData.aluno?.peso || '75kg'
            )
        },
        
        // Converter treinos
        treinos: this.convertFirebaseWorkoutsToFrontend(planData.treinos || []),
        
        // Observações
        observacoes: planData.observacoes || {},
        
        // Técnicas aplicadas
        tecnicasAplicadas: planData.tecnicas_aplicadas || {}
    };
    
    // Validar dados processados
    this.validateProcessedPlan(processedPlan);
    
    return processedPlan;
}

// 3. Converter treinos do Firebase para formato do frontend
convertFirebaseWorkoutsToFrontend(treinos) {
    return treinos.map((treino, index) => ({
        id: treino.id || String.fromCharCode(65 + index),
        nome: treino.nome || `Treino ${String.fromCharCode(65 + index)}`,
        foco: treino.foco || 'Treino geral',
        concluido: false,
        execucoes: 0,
        exercicios: this.convertFirebaseExercisesToFrontend(treino.exercicios || [])
    }));
}

// 4. Converter exercícios do Firebase
convertFirebaseExercisesToFrontend(exercicios) {
    return exercicios.map((exercicio, index) => ({
        id: exercicio.id || this.core.generateId(),
        nome: exercicio.nome || 'Exercício',
        descricao: exercicio.descricao || '',
        series: exercicio.series || 3,
        repeticoes: exercicio.repeticoes || '10-12',
        carga: exercicio.carga || 'A definir',
        currentCarga: exercicio.currentCarga || exercicio.carga || 'A definir',
        descanso: exercicio.descanso || '90 segundos',
        observacoesEspeciais: exercicio.observacoesEspeciais || '',
        tecnica: exercicio.tecnica || '',
        concluido: false
    }));
}

// 5. Validar plano processado
validateProcessedPlan(plan) {
    const errors = [];
    
    if (!plan.nome || plan.nome.trim() === '') {
        errors.push('Nome do plano é obrigatório');
    }
    
    if (!plan.treinos || !Array.isArray(plan.treinos) || plan.treinos.length === 0) {
        errors.push('Plano deve ter pelo menos um treino');
    }
    
    if (plan.treinos) {
        plan.treinos.forEach((treino, index) => {
            if (!treino.exercicios || !Array.isArray(treino.exercicios)) {
                errors.push(`Treino ${index + 1} não tem exercícios válidos`);
            }
        });
    }
    
    if (errors.length > 0) {
        throw new Error(`Dados do plano inválidos: ${errors.join(', ')}`);
    }
}

// 6. Salvar plano no cache local
savePlanToCache(shareId, planData) {
    try {
        const cache = this.getSharedPlansCache();
        cache[shareId] = {
            data: planData,
            cachedAt: new Date().toISOString(),
            shareId: shareId
        };
        
        localStorage.setItem('jsfitapp_shared_cache', JSON.stringify(cache));
        console.log(`Plano ${shareId} salvo no cache`);
    } catch (error) {
        console.warn('Erro ao salvar no cache:', error);
    }
}

// 7. Obter plano do cache
getPlanFromCache(shareId) {
    try {
        const cache = this.getSharedPlansCache();
        const cachedItem = cache[shareId];
        
        if (!cachedItem) {
            return null;
        }
        
        // Verificar se o cache não está muito antigo (7 dias)
        const cacheAge = Date.now() - new Date(cachedItem.cachedAt).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
        
        if (cacheAge > maxAge) {
            delete cache[shareId];
            localStorage.setItem('jsfitapp_shared_cache', JSON.stringify(cache));
            return null;
        }
        
        return cachedItem.data;
    } catch (error) {
        console.warn('Erro ao ler cache:', error);
        return null;
    }
}

// 8. Obter cache de planos compartilhados
getSharedPlansCache() {
    try {
        const stored = localStorage.getItem('jsfitapp_shared_cache');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        return {};
    }
}

// 9. Obter mensagem de erro amigável
getErrorMessage(error) {
    const errorMessages = {
        'permission-denied': 'Sem permissão para acessar este plano',
        'not-found': 'Plano não encontrado. Verifique o ID',
        'network-error': 'Erro de conexão. Verifique sua internet',
        'expired': 'Este plano expirou',
        'inactive': 'Este plano foi desativado'
    };
    
    if (error.code && errorMessages[error.code]) {
        return errorMessages[error.code];
    }
    
    if (error.message) {
        return error.message;
    }
    
    return 'Erro desconhecido ao importar plano';
}

// 10. Atualizar status da importação
updateImportStatus(message, type) {
    const status = document.getElementById('importStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = `import-status ${type}`;
    
    // Classes CSS correspondentes devem estar definidas
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        loading: '#2196f3',
        info: '#6c757d'
    };
    
    if (colors[type]) {
        status.style.color = colors[type];
    }
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
            "dias": 4,
            "dataInicio": "2025-08-27",
            "dataFim": "2025-10-31",
            "perfil": {
              "idade": 20,
              "altura": "1,73",
              "peso": "57",
              "porte": "médio",
              "objetivo": "Definição muscular"
            },
            "treinos": [
              {
                "id": "A",
                "nome": "Quadríceps e panturrilha",
                "foco": "Foco: PERNA, GLÚTEO",
                "exercicios": [
                  {
                    "id": 1,
                    "nome": "CADEIRA EXTENSORA",
                    "descricao": "",
                    "series": 2,
                    "repeticoes": "20",
                    "carga": "40",
                    "descanso": "60-90",
                    "observacoesEspeciais": "Executar antes do exercício principal para pré-fadigar o músculo",
                    "tecnica": "pre-exaustao",
                    "concluido": false
                  },
                  {
                    "id": 1756262582052,
                    "nome": "AGACHAMENTO EM LIVRE COM BARRA",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos da coxa e glúteos, o agachamento possui diversas variações e uma delas é o agachamento com barra. considerado um dos melhores exercícios para desenvolvimento dos músculos das pernas e da metade infe",
                    "series": 4,
                    "repeticoes": "10-12",
                    "carga": "15-25kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262588989,
                    "nome": "LEVANTAMENTO TERRA",
                    "descricao": "O levantamento terra é ótimo exercício para aumentar força e potência muscular. ele trabalha os principais músculos do corpo: eretor da espinha, glúteos, quadríceps, trapézio, latíssimo do dorso, deltoide posterior, antebraço e até bíceps femoral.  indica",
                    "series": 3,
                    "repeticoes": "10-12",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262592240,
                    "nome": "LEG PRESS INCLINADO",
                    "descricao": "Progressão de Cargas \n",
                    "series": 4,
                    "repeticoes": "12-10-10-8",
                    "carga": "70kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262592806,
                    "nome": "HACK",
                    "descricao": "",
                    "series": 3,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262593239,
                    "nome": "PANTURRILHA SENTADO",
                    "descricao": "Exercício bi-set, + livre. para fortalecimento e hipertrofia dos músculos das panturrilhas. ",
                    "series": 5,
                    "repeticoes": "15",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756262593689,
                    "nome": "CADEIRA ADUTORA",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos da coxa, com enfoque a região interna próximo a virilha. trabalha os músculos adutor largo.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "70kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  }
                ],
                "gruposMusculares": [
                  "perna",
                  "gluteo"
                ],
                "concluido": false,
                "execucoes": 0
              },
              {
                "id": "B",
                "nome": "Costas e Bíceps",
                "foco": "Foco: BÍCEPS, COSTAS",
                "exercicios": [
                  {
                    "id": 11,
                    "nome": "PUXADA ALTA ARTICULADA",
                    "descricao": "O exercício trabalha o fortalecimento e hipertrofia dos músculos das costas, mais especificamente a dorsal e trapézio.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "10",
                    "descanso": "60-90",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756263936166,
                    "nome": "PULLEY FECHADO",
                    "descricao": "Exercício para fortalecimento e hipertrofia da região das dorsais, abrange também, os músculos auxiliares, tais como, trapézio e bíceps braquial. realiza no aparelho. indicado a praticante de musculação nível iniciante ao avançado.",
                    "series": 4,
                    "repeticoes": "10-12",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756264225210,
                    "nome": "REMADA CAVALINHO",
                    "descricao": "É um exercício composto que recruta todos os músculos das costas, principalmente dorsal, trapézio e romboides.",
                    "series": 3,
                    "repeticoes": "12",
                    "carga": "5kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756264226510,
                    "nome": "PULL DOWN COM CORDA",
                    "descricao": "O exercício tem como objetivo trabalhar o fortalecimento e hipertrofia dos músculos das costas com ênfase no latíssimo do dorso, dando aspecto de costas mais largas.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756264231546,
                    "nome": "FACE PULL",
                    "descricao": "É um exercício muito útil para o fortalecimento de músculos da região dorsal e uma boa ferramenta para corrigir problemas posturais causados pelo desequilíbrio entre os músculos do peitoral e das costas.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756264619498,
                    "nome": "ROSCA SCOTT",
                    "descricao": "Um dos exercícios mais clássicos da musculação, consegue recrutar isoladamente as fibras que se propõe. basicamente, por ser um exercício mono articular, a rosca scott imprime maior intensidade nos músculos dos bíceps.",
                    "series": 4,
                    "repeticoes": "12",
                    "carga": "5kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756264623466,
                    "nome": "ROSCA UNILATERAL CROSS OVER",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos bíceps, com enfoque aos músculos bíceps braquiais. realiza em um aparelho de fácil execução. indicado a praticante de musculação nível iniciante e intermediário.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "25kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756264626651,
                    "nome": "ROSCA INVERSA NO CROSS",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos dos antebraços e bíceps.",
                    "series": 3,
                    "repeticoes": "12",
                    "carga": "25kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  }
                ],
                "gruposMusculares": [
                  "biceps",
                  "costas"
                ],
                "concluido": false,
                "execucoes": 0
              },
              {
                "id": "C",
                "nome": "Glúteo e Posterior ",
                "foco": "Foco: PERNA, GLÚTEO",
                "exercicios": [
                  {
                    "id": 21,
                    "nome": "ABDUÇÃO CROSS OVER",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos da coxa e glúteos, com enfoque a região lateral de coxa. trabalha os músculos vasto laterais e glúteos máximos.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "Leve",
                    "descanso": "60-90",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262562261,
                    "nome": "ELEVAÇÃO PÉLVICA NO APARELHO",
                    "descricao": "O exercício trabalha a musculatura do glúteo, fortalece a região da lombar e promove estabilidade na articulação do quadril, além de ser uma excelente aliada no ganho muscular da região dos glúteos.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262563023,
                    "nome": "CADEIRA ABDUTORA",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos da coxa, com enfoque na região interna próximo a virilha. trabalha os músculos adutor largo.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "70kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262563572,
                    "nome": "STIFF",
                    "descricao": "Exercício funcional para fortalecimento e hipertrofia. considerado um exercício chave para ganhar massa muscular. trabalha enorme quantidade grupo musculares, auxilia na postura e desenvolver a força.",
                    "series": 4,
                    "repeticoes": "12",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262564023,
                    "nome": "MESA FLEXORA",
                    "descricao": "Exercício para fortalecimento e hipertrofia da região das coxas, com enfoque nos músculos posteriores de coxa, bíceps femorais. realiza no aparelho com auxílio de roldanas. indicado a praticante que deseja realizar um trabalho muscular isolado dos músculo",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756262564489,
                    "nome": "CADEIRA FLEXORA",
                    "descricao": "Ele se apresenta como um dos exercícios capazes de trabalhar os isquiotibias e promover o aumento de força e hipertrofia nestes.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "40kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  }
                ],
                "gruposMusculares": [
                  "perna",
                  "gluteo"
                ],
                "concluido": false,
                "execucoes": 0
              },
              {
                "id": "D",
                "nome": "Peito, ombro e tríceps",
                "foco": "Foco: TRÍCEPS, PEITO, OMBRO",
                "exercicios": [
                  {
                    "id": 31,
                    "nome": "SUPINO INCLINADO COM HALTERES",
                    "descricao": "Exercício para fortalecimento e hipertrofia da região peitoral, com enfoque nos músculos peitoral maior e menor, músculos auxiliares deltoides anteriores. realiza em um banco inclinado. ajuda a modelar e tonificar a parte superior do corpo, estimula a coo",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "Leve",
                    "descanso": "60-90",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756265614758,
                    "nome": "SUPINO RETO NO APARELHO",
                    "descricao": "Exercício para fortalecimento e hipertrofia da região peitoral, com enfoque aos músculos peitoral maior e menor. realiza no aparelho com o auxílio de roldanas. indicado a praticante de musculação nível iniciante e intermediário.",
                    "series": 3,
                    "repeticoes": "10+10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "Reduzir carga imediatamente após falha e continuar",
                    "tecnica": "drop-set",
                    "concluido": false
                  },
                  {
                    "id": 1756265615425,
                    "nome": "CRUCIFIXO NO VOADOR",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos peitorais, com enfoque aos músculos peitoral maior e menor e músculos auxiliares, tais como: deltoides anteriores.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "10",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756265615941,
                    "nome": "DESENVOLVIMENTO COM HALTERES",
                    "descricao": "",
                    "series": 3,
                    "repeticoes": "10",
                    "carga": "5kg",
                    "descanso": "30 seg",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756265862448,
                    "nome": "ELEVAÇÃO FRONTAL COM HALTERES",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos da região dos ombros, com enfoque nos deltoides e trapézios.",
                    "series": 3,
                    "repeticoes": "10",
                    "carga": "5kg",
                    "descanso": "30",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756265977874,
                    "nome": "TRÍCEPS CROSS OVER",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos tríceps, com enfoque o tríceps braquial.",
                    "series": 4,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "30 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  },
                  {
                    "id": 1756265978925,
                    "nome": "TRÍCEPS TESTA",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos tríceps, com enfoque o tríceps braquial.",
                    "series": 3,
                    "repeticoes": "10",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756265979806,
                    "nome": "TRÍCEPS FRANCÊS",
                    "descricao": "Exercício para fortalecimento e hipertrofia dos músculos tríceps, com enfoque o tríceps braquial.",
                    "series": 3,
                    "repeticoes": "10",
                    "carga": "5kg",
                    "descanso": "30 segundos",
                    "observacoesEspeciais": "Executar em sequência com próximo exercício, sem descanso",
                    "tecnica": "bi-set",
                    "concluido": false
                  },
                  {
                    "id": 1756266101982,
                    "nome": "ABDOMINAL NO APARELHO",
                    "descricao": "Exercício para fortalecimento e hipertrofia da região abdominal, reto abdominal, realizado no aparelho. indicado a praticante de musculação nível intermediário e avançado. fácil execução.",
                    "series": 4,
                    "repeticoes": "5",
                    "carga": "20kg",
                    "descanso": "90 segundos",
                    "observacoesEspeciais": "",
                    "tecnica": "",
                    "concluido": false
                  }
                ],
                "gruposMusculares": [
                  "triceps",
                  "peito",
                  "ombro"
                ],
                "concluido": false,
                "execucoes": 0
              }
            ],
            "observacoes": {
              "geral": "",
              "frequencia": "4x por semana",
              "progressao": "Aumente a carga gradualmente quando conseguir completar todas as repetições",
              "descanso": "60-90 segundos entre séries",
              "hidratacao": "Mantenha-se bem hidratado durante todo o treino",
              "consulta": "Acompanhamento profissional recomendado"
            },
            "tecnicas_aplicadas": {
              "pre-exaustao": "Exercício de isolamento antes do composto para pré-fadigar o músculo alvo",
              "bi-set": "Dois exercícios executados em sequência sem descanso",
              "drop-set": "Redução progressiva da carga na mesma série"
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