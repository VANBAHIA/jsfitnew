// shared/jsfitcore.js
class JSFitCore {
    constructor(firebaseConfig) {
        // Usar configurações fornecidas ou as padrão do projeto
        this.firebaseConfig = firebaseConfig || {
            apiKey: "AIzaSyDeQ3Wj9Xs43kiM6vpwfH71p72yn9Qy3wU",
            authDomain: "jsfit-personal-app.firebaseapp.com",
            projectId: "jsfit-personal-app",
            storageBucket: "jsfit-personal-app.firebasestorage.app",
            messagingSenderId: "169908122708",
            appId: "1:169908122708:web:9b11406ede109ccf6ba9c1"
        };
        
        this.firebaseConnected = false;
        this.exerciseDatabase = [];
        this.exerciseDatabaseLoaded = false;
        
        // Base de dados hardcoded como fallback
        this.exerciseDatabaseFallback = {
            peito: {
                iniciante: [
                    { nome: 'Supino com Halteres', series: 3, repeticoes: '10-12', carga: '15kg cada', descricao: 'Exercício básico para peitoral' },
                    { nome: 'Flexão de Braços', series: 3, repeticoes: '8-12', carga: 'Peso corporal', descricao: 'Exercício funcional básico' }
                ]
            },
            costas: {
                iniciante: [
                    { nome: 'Puxada Frontal', series: 3, repeticoes: '10-12', carga: '30kg', descricao: 'Exercício básico para latíssimo' },
                    { nome: 'Remada Baixa', series: 3, repeticoes: '10-12', carga: '25kg', descricao: 'Exercício para desenvolvimento das costas' }
                ]
            },
        };
        
        // Inicializar Firebase automaticamente
        this.initializeFirebase().catch(error => {
            console.error('Falha na inicialização automática do Firebase:', error);
        });
    }

    // ========================================
    // FIREBASE METHODS
    // ========================================
    
    async initializeFirebase() {
        try {
            console.log('🔥 Inicializando Firebase...');
            console.log('📋 Configurações:', {
                projectId: this.firebaseConfig.projectId,
                authDomain: this.firebaseConfig.authDomain,
                hasApiKey: !!this.firebaseConfig.apiKey
            });
            
            // Verificar se já está inicializado
            if (window.firebaseApp && window.db) {
                console.log('✅ Firebase já inicializado');
                this.firebaseConnected = true;
                return;
            }

            // Importar módulos do Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            // Inicializar com as configurações corretas
            console.log('🚀 Inicializando app Firebase...');
            window.firebaseApp = initializeApp(this.firebaseConfig);
            window.db = getFirestore(window.firebaseApp);
            
            console.log('🔍 Testando conexão...');
            await this.testFirebaseConnection();
            
            console.log('✅ Firebase inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error);
            console.error('🔧 Configurações usadas:', this.firebaseConfig);
            this.firebaseConnected = false;
            throw error;
        }
        
    }

    async testFirebaseConnection() {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            // Tentar acessar uma coleção de teste
            const testRef = doc(window.db, '_test_', 'connection');
            await getDoc(testRef);
            
            console.log('✅ Conexão Firebase OK');
            this.firebaseConnected = true;
            
        } catch (error) {
            console.warn('⚠️ Firebase não acessível:', error.message);
            this.firebaseConnected = false;
            
            // Se for erro de permissão, ainda consideramos conectado
            if (error.code === 'permission-denied') {
                console.log('ℹ️ Firebase conectado (sem permissões de teste)');
                this.firebaseConnected = true;
            }
        }
    }

    // ========================================
    // EXERCISE DATABASE METHODS
    // ========================================
    
    async loadExerciseDatabase() {
        try {
            console.log('🏋️ Carregando base de exercícios do Firebase...');

            // Verificar se Firebase está conectado
            if (!this.firebaseConnected) {
                console.warn('⚠️ Firebase não conectado, tentando reconectar...');
                await this.initializeFirebase();
            }
         

            // Tentar carregar do Firebase primeiro
            const firebaseData = await this.loadExercisesFromFirebase();
            
            if (firebaseData && firebaseData.length > 0) {
                this.exerciseDatabase = firebaseData;
                this.exerciseDatabaseLoaded = true;
                console.log(`✅ ${firebaseData.length} exercícios carregados do Firebase`);
                this.logDatabaseStats();
                return true;
            }

            // Fallback: tentar carregar DATABASE.JSON local
            console.log('📄 Firebase vazio, tentando carregar DATABASE.JSON local...');
            const response = await fetch('data/DATABASE.JSON');
            
            if (response.ok) {
                const localData = await response.json();
                
                if (Array.isArray(localData) && localData.length > 0) {
                    this.exerciseDatabase = localData;
                    this.exerciseDatabaseLoaded = true;
                    
                    console.log(`✅ ${localData.length} exercícios carregados do arquivo local`);
                    this.logDatabaseStats();
                    
                    // Migrar para Firebase em background (se conectado)
                    if (this.firebaseConnected) {
                        this.migrateExercisesToFirebase(localData);
                    }
                    
                    return true;
                }
            }

            throw new Error('Nenhuma fonte de dados disponível');

        } catch (error) {
            console.error('❌ Erro ao carregar base de exercícios:', error);

            // Fallback final: usar dados hardcoded
            console.warn('📄 Usando base hardcoded como fallback final');
            this.exerciseDatabase = this.convertHardcodedToArray();
            this.exerciseDatabaseLoaded = false;
            return false;
        }
    }

    async loadExercisesFromFirebase() {
        try {
            if (!this.firebaseConnected || !window.db) {
                console.warn('⚠️ Firebase não disponível para carregar exercícios');
                return null;
            }

            const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const exercisesQuery = query(
                collection(window.db, 'exercises_database'),
                orderBy('nome', 'asc')
            );
            
            const querySnapshot = await getDocs(exercisesQuery);
            const exercises = [];
            
            querySnapshot.forEach((doc) => {
                const exerciseData = doc.data();
                exerciseData.id = doc.id;
                exercises.push(exerciseData);
            });
            
            console.log(`🏋️ ${exercises.length} exercícios carregados do Firebase`);
            return exercises;
            
        } catch (error) {
            console.error('❌ Erro ao carregar exercícios do Firebase:', error);
            return null;
        }
    }

  

   
    convertHardcodedToArray() {
        const exerciseArray = [];
        let id = 1;

        Object.entries(this.exerciseDatabaseFallback).forEach(([grupo, niveis]) => {
            Object.entries(niveis).forEach(([nivel, exercicios]) => {
                exercicios.forEach(ex => {
                    exerciseArray.push({
                        id: id++,
                        nome: ex.nome,
                        Column4: ex.gif || '',
                        grupo: grupo,
                        nivel: nivel,
                        descricao: ex.descricao || '',
                        series: ex.series,
                        repeticoes: ex.repeticoes,
                        carga: ex.carga,
                        codigo: ex.codigo
                    });
                });
            });
        });

        return exerciseArray;
    }

    logDatabaseStats() {
        if (this.exerciseDatabase.length === 0) return;

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

    findExerciseByName(exerciseName) {
        if (!this.exerciseDatabaseLoaded || this.exerciseDatabase.length === 0) {
            return null;
        }

        const normalizedName = exerciseName.trim().toLowerCase();
        
        return this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase() === normalizedName
        );
    }

    getExercisesByGroupAndLevel(grupo, nivel) {
        if (!this.exerciseDatabaseLoaded || this.exerciseDatabase.length === 0) {
            // Fallback para base hardcoded
            return this.exerciseDatabaseFallback[grupo]?.[nivel] || [];
        }

        return this.exerciseDatabase.filter(ex =>
            ex.grupo.toLowerCase() === grupo.toLowerCase() &&
            (ex.nivel?.toLowerCase() === nivel.toLowerCase() || !ex.nivel)
        );
    }

    getAllExerciseGroups() {
        if (!this.exerciseDatabaseLoaded || this.exerciseDatabase.length === 0) {
            return Object.keys(this.exerciseDatabaseFallback);
        }

        const groups = new Set();
        this.exerciseDatabase.forEach(exercise => {
            if (exercise.grupo) {
                groups.add(exercise.grupo);
            }
        });

        return Array.from(groups).sort();
    }

    findExerciseGif(exerciseName) {
        if (!this.exerciseDatabase || this.exerciseDatabase.length === 0) {
            console.warn('⚠️ Base de exercícios ainda não carregada');
            return null;
        }

        const normalizedName = exerciseName.trim().toLowerCase();
        
        const exactMatch = this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase() === normalizedName
        );
        
        if (exactMatch) {
            return exactMatch.Column4;
        }
        
        const partialMatch = this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(exercise.nome.toLowerCase())
        );
        
        if (partialMatch) {
            console.log(`🔍 Busca parcial: "${exerciseName}" → "${partialMatch.nome}"`);
            return partialMatch.Column4;
        }
        
        console.warn(`❌ Exercício não encontrado: "${exerciseName}"`);
        return null;
    }

    exerciseExists(exerciseName) {
        return this.findExerciseByName(exerciseName) !== null;
    }

    // ========================================
    // PLAN CRUD OPERATIONS
    // ========================================
    
    async savePlanToFirebase(planData) {
        try {
            console.log('💾 Salvando plano no Firebase...');
            
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
            }
            
            const { collection, addDoc, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const planToSave = {
                ...planData,
                created_at: new Date(),
                updated_at: new Date()
            };

            let docRef;
            if (planData.id && typeof planData.id === 'string') {
                // Atualizar plano existente
                docRef = doc(window.db, 'plans', planData.id);
                await setDoc(docRef, planToSave, { merge: true });
                console.log(`✅ Plano atualizado: ${planData.id}`);
                return planData.id;
            } else {
                // Criar novo plano
                docRef = await addDoc(collection(window.db, 'plans'), planToSave);
                console.log(`✅ Novo plano criado: ${docRef.id}`);
                return docRef.id;
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar plano no Firebase:', error);
            throw error;
        }
    }

    async loadPlansFromFirebase() {
        try {
            console.log('🔥 Carregando planos do Firebase...');
            
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
            }
            
            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const plansQuery = query(
                collection(window.db, 'plans'), 
                orderBy('created_at', 'desc')
            );
            
            const querySnapshot = await getDocs(plansQuery);
            const plans = [];
            
            querySnapshot.forEach((doc) => {
                const planData = doc.data();
                planData.id = doc.id;
                plans.push(planData);
            });
            
            console.log(`✅ ${plans.length} planos carregados do Firebase`);
            return plans;
            
        } catch (error) {
            console.error('❌ Erro ao carregar planos do Firebase:', error);
            throw error;
        }
    }

    async deletePlanFromFirebase(planId) {
        try {
            console.log(`🗑️ Deletando plano ${planId} do Firebase...`);
            
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
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

    // ========================================
    // UTILITY METHODS
    // ========================================
    
    generateId() {
        return Date.now() + Math.random();
    }

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

    showNotification(message, type = 'info', duration = 4000) {
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
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
            animation: slideIn 0.3s ease-out;
            background-color: ${colors[type] || colors.info};
        `;
        
        notification.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    capitalizeFirstLetter(string) {
        const exceptions = {
            'biceps': 'Bíceps',
            'triceps': 'Tríceps',
            'quadriceps': 'Quadríceps',
            'panturrilha': 'Panturrilha'
        };

        return exceptions[string.toLowerCase()] ||
            string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    async importPlanFileById(shareId) {
        if (!shareId || shareId.length !== 6) {
            throw new Error('ID deve ter 6 caracteres');
        }
    
        const normalizedId = shareId.toUpperCase();
    
        // Verificar se já foi importado
        const existing = this.state.workoutPlans.find(p => p.originalShareId === normalizedId);
        if (existing) {
            throw new Error('Este plano já foi importado');
        }
    
        try {
            // Buscar do Firebase
            const firebaseData = await this.fetchFromFirebase(normalizedId);
            const processedPlan = this.processPlanData(firebaseData, normalizedId, 'firebase');
            
            return processedPlan;
        } catch (firebaseError) {
            console.warn('Erro no Firebase, tentando cache:', firebaseError);
            
            // Fallback para cache local
            const cacheData = this.getPlanFromCache(normalizedId);
            if (!cacheData) {
                throw new Error('Plano não encontrado nem no Firebase nem no cache');
            }
            
            const processedPlan = this.processPlanData(cacheData, normalizedId, 'cache');
            return processedPlan;
        }
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
                dataNascimento: this.fixTimezoneDate(data.aluno?.dataNascimento || data.student?.birth_date || ''),
                idade: data.aluno?.idade || data.student?.age || null,
                altura: data.aluno?.altura || data.student?.height || '',
                peso: data.aluno?.peso || data.student?.weight || '',
                cpf: data.aluno?.cpf || data.student?.cpf || ''
            },
            
            // Plan metadata com correção de datas
            dias: data.dias || data.frequency_per_week || 3,
            dataInicio: this.fixTimezoneDate(data.dataInicio || data.start_date || new Date().toISOString().split('T')[0]),
            dataFim: this.fixTimezoneDate(data.dataFim || data.end_date || ''),
            
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

 

    fixTimezoneDate(dateInput) {
        if (!dateInput) return '';
        
        // Se já está no formato string correto, mantém
        if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateInput;
        }
        
        try {
            let date;
            
            // Se é string, converte para Date
            if (typeof dateInput === 'string') {
                // Se tem formato ISO completo, trata diferente
                if (dateInput.includes('T')) {
                    date = new Date(dateInput);
                } else {
                    // Para datas simples (YYYY-MM-DD), cria data local
                    const parts = dateInput.split('-');
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                }
            } else {
                date = new Date(dateInput);
            }
            
            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                console.warn('Data inválida:', dateInput);
                return '';
            }
            
            // Retorna no formato YYYY-MM-DD local
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
            
        } catch (error) {
            console.warn('Erro ao processar data:', dateInput, error);
            return '';
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

        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
    }
    
 //IMPORTAÇÃO E COMPARTILHAMENTO ALUNO

 async importSharedPlan(shareId) {
    if (!this.validateShareId(shareId)) {
        throw new Error('ID inválido');
    }
    
    try {
        await this.initializeFirebase();
        
        if (!this.firebaseConnected) {
            throw new Error('Firebase não disponível');
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const shareRef = doc(window.db, 'shared_plans', shareId);
        const shareDoc = await getDoc(shareRef);
        
        if (!shareDoc.exists()) {
            throw new Error('Plano não encontrado');
        }
        
        const shareData = shareDoc.data();
        
        if (!shareData.isActive) {
            throw new Error('Plano foi desativado');
        }
        
        if (shareData.expiresAt && new Date() > shareData.expiresAt.toDate()) {
            throw new Error('Plano expirou');
        }
        
        return {
            plan: shareData.planData,
            shareId: shareId,
            source: 'firebase'
        };
        
    } catch (error) {
        throw new Error(`Erro ao importar: ${error.message}`);
    }
}

validateShareId(shareId) {
    return shareId && typeof shareId === 'string' && /^[A-Z0-9]{6}$/.test(shareId);
}

async migrateExercisesToFirebase(exercises) {
    let loadingElement = null;
    
    try {
        if (!this.firebaseConnected) {
            console.warn('Firebase não conectado, pulando migração');
            return;
        }

        // CRIAR E MOSTRAR LOADING
        loadingElement = this.createMigrationLoading();
        this.showMigrationLoading(loadingElement, 'Iniciando migração de exercícios...');

        console.log('Iniciando migração de exercícios para Firebase...');
        console.log(`Total de exercícios a migrar: ${exercises.length}`);
        
        const { collection, addDoc, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        // 1. VERIFICAR SE JÁ EXISTE MIGRAÇÃO COMPLETA
        this.updateMigrationLoading(loadingElement, 'Verificando exercícios existentes...', 5);
        const existingDocs = await getDocs(collection(window.db, 'exercises_database'));
        
        if (!existingDocs.empty) {
            const existingCount = existingDocs.size;
            console.log(`Encontrados ${existingCount} exercícios no Firebase`);
            
            // Se já tem o número correto ou mais, não migrar
            if (existingCount >= exercises.length) {
                this.updateMigrationLoading(loadingElement, 'Migração já realizada anteriormente', 100);
                setTimeout(() => this.hideMigrationLoading(loadingElement), 2000);
                console.log('Migração já realizada anteriormente, pulando');
                return;
            }
            
            // Se tem menos, limpar duplicatas primeiro
            this.updateMigrationLoading(loadingElement, 'Verificando e removendo duplicatas...', 10);
            await this.cleanupDuplicateExercises();
        }

        // 2. CRIAR MAPA DE EXERCÍCIOS EXISTENTES PARA VERIFICAÇÃO
        this.updateMigrationLoading(loadingElement, 'Preparando lista de exercícios...', 15);
        const existingExercisesMap = new Map();
        const updatedExistingDocs = await getDocs(collection(window.db, 'exercises_database'));
        
        updatedExistingDocs.forEach(doc => {
            const data = doc.data();
            const normalizedName = this.normalizeExerciseName(data.nome);
            existingExercisesMap.set(normalizedName, doc.id);
        });

        console.log(`Exercícios já existentes no Firebase: ${existingExercisesMap.size}`);

        // 3. MIGRAR APENAS EXERCÍCIOS NOVOS
        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const totalToProcess = exercises.length;

        this.updateMigrationLoading(loadingElement, `Migrando 0/${totalToProcess} exercícios...`, 20);

        for (let i = 0; i < exercises.length; i++) {
            const exercise = exercises[i];
            
            try {
                // Verificar se exercício já existe
                const normalizedName = this.normalizeExerciseName(exercise.nome);
                
                if (existingExercisesMap.has(normalizedName)) {
                    skippedCount++;
                    console.log(`Pulando exercício duplicado: ${exercise.nome}`);
                    continue;
                }

                // Validar dados do exercício antes de migrar
                if (!this.validateExerciseData(exercise)) {
                    console.warn(`Exercício inválido pulado: ${exercise.nome || 'Nome indefinido'}`);
                    errorCount++;
                    continue;
                }

                // Preparar dados limpos para migração
                const cleanExercise = this.cleanExerciseDataForMigration(exercise);
                
                // Adicionar ao Firebase
                const docRef = await addDoc(collection(window.db, 'exercises_database'), cleanExercise);
                
                // Adicionar ao mapa para evitar duplicatas no mesmo processo
                existingExercisesMap.set(normalizedName, docRef.id);
                
                migratedCount++;
                
                // Atualizar loading com progresso
                const progressPercent = Math.round(20 + ((i + 1) / totalToProcess) * 70);
                const statusText = `Migrando ${migratedCount}/${totalToProcess} exercícios... (${skippedCount} pulados)`;
                this.updateMigrationLoading(loadingElement, statusText, progressPercent);
                
                // Atualizar estatísticas no loading
                this.updateMigrationStats(loadingElement, migratedCount, skippedCount, errorCount);
                
                // Log progresso a cada 50 exercícios
                if (migratedCount % 50 === 0) {
                    console.log(`Progresso: ${migratedCount} exercícios migrados`);
                }
                
            } catch (error) {
                console.error('Erro ao migrar exercício:', exercise.nome, error);
                errorCount++;
            }
        }

        // 4. VERIFICAÇÃO FINAL
        this.updateMigrationLoading(loadingElement, 'Verificando migração...', 95);
        const finalCount = await getDocs(collection(window.db, 'exercises_database'));
        
        // 5. RELATÓRIO FINAL
        this.updateMigrationLoading(loadingElement, 'Migração concluída!', 100);
        
        console.log('=== RELATÓRIO DE MIGRAÇÃO ===');
        console.log(`Exercícios migrados: ${migratedCount}`);
        console.log(`Exercícios pulados (já existiam): ${skippedCount}`);
        console.log(`Erros: ${errorCount}`);
        console.log(`Total processado: ${exercises.length}`);
        console.log(`Total no Firebase após migração: ${finalCount.size}`);

        // Mostrar resultado no loading por 3 segundos
        const finalMessage = `Concluído! ${migratedCount} novos exercícios migrados. Total: ${finalCount.size}`;
        this.updateMigrationLoading(loadingElement, finalMessage, 100, true);
        
        setTimeout(() => {
            this.hideMigrationLoading(loadingElement);
        }, 3000);
        
        if (migratedCount > 0) {
            console.log('Migração concluída com sucesso!');
        } else {
            console.log('Nenhum exercício novo para migrar');
        }
        
    } catch (error) {
        console.error('Erro na migração:', error);
        
        if (loadingElement) {
            this.updateMigrationLoading(loadingElement, `Erro na migração: ${error.message}`, 0, false, true);
            setTimeout(() => {
                this.hideMigrationLoading(loadingElement);
            }, 5000);
        }
        
        throw error;
    }
}

// MÉTODO AUXILIAR: Normalizar nome do exercício para comparação
normalizeExerciseName(nome) {
    if (!nome || typeof nome !== 'string') {
        return '';
    }
    
    return nome
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')              // Múltiplos espaços -> espaço único
        .replace(/[àáâãä]/g, 'a')          // Normalizar acentos
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s]/g, '');      // Remover caracteres especiais
}

// MÉTODO AUXILIAR: Validar dados do exercício
validateExerciseData(exercise) {
    if (!exercise || typeof exercise !== 'object') {
        return false;
    }
    
    // Nome é obrigatório e deve ser string não vazia
    if (!exercise.nome || typeof exercise.nome !== 'string' || exercise.nome.trim() === '') {
        return false;
    }
    
    // Outros campos opcionais mas se existirem devem ter tipos corretos
    if (exercise.grupo && typeof exercise.grupo !== 'string') {
        return false;
    }
    
    if (exercise.series && isNaN(parseInt(exercise.series))) {
        return false;
    }
    
    return true;
}

// MÉTODO AUXILIAR: Limpar dados do exercício para migração
cleanExerciseDataForMigration(exercise) {
    return {
        nome: exercise.nome.trim(),
        Column4: exercise.Column4 || exercise.gif || '',
        grupo: exercise.grupo || 'geral',
        nivel: exercise.nivel || 'intermediario',
        descricao: exercise.descricao || '',
        series: exercise.series || 3,
        repeticoes: exercise.repeticoes || '10-12',
        carga: exercise.carga || 'A definir',
        codigo: exercise.codigo || '',
        migrated_at: new Date().toISOString(),
        source: 'local_database'
    };
}

// MÉTODO AUXILIAR: Limpar duplicatas existentes
async cleanupDuplicateExercises() {
    try {
        const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const querySnapshot = await getDocs(collection(window.db, 'exercises_database'));
        const exerciseMap = new Map();
        const duplicates = [];
        
        // Identificar duplicatas
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const normalizedName = this.normalizeExerciseName(data.nome);
            
            if (exerciseMap.has(normalizedName)) {
                // É duplicata - marcar para exclusão
                duplicates.push({
                    id: docSnap.id,
                    nome: data.nome,
                    normalizedName
                });
            } else {
                // Primeiro com este nome - manter
                exerciseMap.set(normalizedName, docSnap.id);
            }
        });
        
        // Remover duplicatas
        if (duplicates.length > 0) {
            console.log(`🗑️ Removendo ${duplicates.length} exercícios duplicados`);
            
            for (const duplicate of duplicates) {
                await deleteDoc(doc(window.db, 'exercises_database', duplicate.id));
                console.log(`🗑️ Removido duplicado: ${duplicate.nome}`);
            }
            
            console.log('✅ Limpeza de duplicatas concluída');
        } else {
            console.log('✅ Nenhuma duplicata encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro na limpeza de duplicatas:', error);
        throw error;
    }
}

// MÉTODO DE EMERGÊNCIA: Forçar limpeza completa e nova migração
async forceCleanAndRemigrateExercises() {
    let loadingElement = null;
    
    try {
        console.log('INICIANDO LIMPEZA TOTAL E NOVA MIGRAÇÃO');
        
        if (!this.firebaseConnected) {
            throw new Error('Firebase não conectado');
        }

        // CRIAR E MOSTRAR LOADING
        loadingElement = this.createMigrationLoading();
        this.showMigrationLoading(loadingElement, 'Iniciando limpeza total...');

        const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        // 1. LIMPAR TODOS OS EXERCÍCIOS EXISTENTES
        this.updateMigrationLoading(loadingElement, 'Removendo exercícios existentes do Firebase...', 10);
        const querySnapshot = await getDocs(collection(window.db, 'exercises_database'));
        
        let deletedCount = 0;
        const deletePromises = [];
        
        querySnapshot.forEach(docSnap => {
            deletePromises.push(deleteDoc(doc(window.db, 'exercises_database', docSnap.id)));
        });
        
        await Promise.all(deletePromises);
        deletedCount = querySnapshot.size;
        console.log(`${deletedCount} exercícios removidos`);

        // 2. CARREGAR DATABASE.JSON FRESCO
        this.updateMigrationLoading(loadingElement, 'Carregando DATABASE.JSON...', 30);
        const response = await fetch('data/DATABASE.JSON');
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar DATABASE.JSON: ${response.status}`);
        }
        
        const localData = await response.json();
        console.log(`${localData.length} exercícios encontrados no DATABASE.JSON`);

        // 3. MIGRAR COM MÉTODO CORRIGIDO
        this.updateMigrationLoading(loadingElement, 'Iniciando nova migração...', 40);
        
        // Fechar loading atual e deixar o método de migração criar o seu próprio
        this.hideMigrationLoading(loadingElement);
        loadingElement = null;
        
        await this.migrateExercisesToFirebase(localData);

        // 4. VERIFICAÇÃO FINAL
        const finalCount = await getDocs(collection(window.db, 'exercises_database'));
        console.log(`MIGRAÇÃO FORÇADA CONCLUÍDA: ${finalCount.size} exercícios no Firebase`);
        
        return {
            deleted: deletedCount,
            migrated: finalCount.size,
            success: true
        };
        
    } catch (error) {
        console.error('Erro na migração forçada:', error);
        
        if (loadingElement) {
            this.updateMigrationLoading(loadingElement, `Erro na limpeza: ${error.message}`, 0, false, true);
            setTimeout(() => {
                this.hideMigrationLoading(loadingElement);
            }, 5000);
        }
        
        throw error;
    }
}

// MÉTODO UTILITÁRIO: Verificar status dos exercícios no Firebase
async checkExerciseStatus() {
    try {
        if (!this.firebaseConnected) {
            console.log('❌ Firebase não conectado');
            return;
        }

        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const querySnapshot = await getDocs(collection(window.db, 'exercises_database'));
        const exerciseMap = new Map();
        const duplicates = [];
        
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const normalizedName = this.normalizeExerciseName(data.nome);
            
            if (exerciseMap.has(normalizedName)) {
                duplicates.push({
                    id: docSnap.id,
                    nome: data.nome,
                    grupo: data.grupo
                });
            } else {
                exerciseMap.set(normalizedName, {
                    id: docSnap.id,
                    nome: data.nome,
                    grupo: data.grupo
                });
            }
        });
        
        console.log('📊 === STATUS DOS EXERCÍCIOS NO FIREBASE ===');
        console.log(`Total de documentos: ${querySnapshot.size}`);
        console.log(`Exercícios únicos: ${exerciseMap.size}`);
        console.log(`Duplicatas encontradas: ${duplicates.length}`);
        
        if (duplicates.length > 0) {
            console.log('🔍 Duplicatas encontradas:');
            duplicates.forEach(dup => {
                console.log(`  - ${dup.nome} (${dup.grupo})`);
            });
        }
        
        // Contar por grupo
        const groupCount = {};
        exerciseMap.forEach(exercise => {
            const grupo = exercise.grupo || 'sem_grupo';
            groupCount[grupo] = (groupCount[grupo] || 0) + 1;
        });
        
        console.log('📋 Exercícios por grupo:');
        Object.entries(groupCount).forEach(([grupo, count]) => {
            console.log(`  ${grupo}: ${count} exercícios`);
        });
        
        return {
            total: querySnapshot.size,
            unique: exerciseMap.size,
            duplicates: duplicates.length,
            byGroup: groupCount
        };
        
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        return null;
    }
}

// MÉTODOS DE LOADING PARA MIGRAÇÃO
createMigrationLoading() {
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'migrationLoadingModal';
    loadingContainer.className = 'migration-loading-modal';
    
    loadingContainer.innerHTML = `
        <div class="migration-loading-overlay">
            <div class="migration-loading-content">
                <div class="migration-loading-header">
                    <h3>Migrando Exercícios para Firebase</h3>
                    <div class="migration-loading-icon">
                        <div class="spinner"></div>
                    </div>
                </div>
                
                <div class="migration-progress-container">
                    <div class="migration-progress-bar">
                        <div class="migration-progress-fill" id="migrationProgressFill"></div>
                    </div>
                    <div class="migration-progress-text" id="migrationProgressPercent">0%</div>
                </div>
                
                <div class="migration-status-text" id="migrationStatusText">
                    Preparando migração...
                </div>
                
                <div class="migration-stats" id="migrationStats" style="display: none;">
                    <div class="stat-item">
                        <span class="stat-label">Migrados:</span>
                        <span class="stat-value" id="migratedCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pulados:</span>
                        <span class="stat-value" id="skippedCount">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Erros:</span>
                        <span class="stat-value" id="errorCount">0</span>
                    </div>
                </div>
                
                <div class="migration-warning" style="display: none;" id="migrationWarning">
                    Não feche esta janela durante a migração
                </div>
            </div>
        </div>
    `;
    
    // Adicionar estilos CSS
    const styles = document.createElement('style');
    styles.textContent = `
        .migration-loading-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .migration-loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .migration-loading-content {
            background: white;
            border-radius: 12px;
            padding: 30px;
            min-width: 400px;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        
        .migration-loading-header {
            margin-bottom: 25px;
        }
        
        .migration-loading-header h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 20px;
            font-weight: 600;
        }
        
        .migration-loading-icon {
            display: flex;
            justify-content: center;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .migration-progress-container {
            margin: 25px 0;
            position: relative;
        }
        
        .migration-progress-bar {
            width: 100%;
            height: 12px;
            background: #f0f0f0;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .migration-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 6px;
        }
        
        .migration-progress-text {
            position: absolute;
            top: 50%;
            right: -50px;
            transform: translateY(-50%);
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        
        .migration-status-text {
            color: #666;
            font-size: 14px;
            margin: 15px 0;
            min-height: 20px;
        }
        
        .migration-stats {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-value {
            display: block;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .migration-warning {
            background: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            margin-top: 15px;
        }
        
        .migration-success {
            color: #2ecc71;
        }
        
        .migration-error {
            color: #e74c3c;
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(loadingContainer);
    
    return loadingContainer;
}

showMigrationLoading(loadingElement, message) {
    const statusText = loadingElement.querySelector('#migrationStatusText');
    const warning = loadingElement.querySelector('#migrationWarning');
    
    if (statusText) statusText.textContent = message;
    if (warning) warning.style.display = 'block';
    
    // Fade in animation
    loadingElement.style.opacity = '0';
    loadingElement.style.display = 'block';
    
    setTimeout(() => {
        loadingElement.style.transition = 'opacity 0.3s ease';
        loadingElement.style.opacity = '1';
    }, 10);
}

updateMigrationLoading(loadingElement, message, percent, isComplete = false, isError = false) {
    const statusText = loadingElement.querySelector('#migrationStatusText');
    const progressFill = loadingElement.querySelector('#migrationProgressFill');
    const progressText = loadingElement.querySelector('#migrationProgressPercent');
    const spinner = loadingElement.querySelector('.spinner');
    const stats = loadingElement.querySelector('#migrationStats');
    
    if (statusText) {
        statusText.textContent = message;
        
        if (isComplete && !isError) {
            statusText.className = 'migration-status-text migration-success';
        } else if (isError) {
            statusText.className = 'migration-status-text migration-error';
        }
    }
    
    if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(percent)}%`;
    }
    
    // Mostrar/ocultar spinner
    if (spinner) {
        if (isComplete || isError) {
            spinner.style.display = 'none';
        } else {
            spinner.style.display = 'block';
        }
    }
    
    // Mostrar stats quando começar migração
    if (percent > 15 && stats) {
        stats.style.display = 'flex';
    }
}

hideMigrationLoading(loadingElement) {
    if (!loadingElement) return;
    
    loadingElement.style.transition = 'opacity 0.3s ease';
    loadingElement.style.opacity = '0';
    
    setTimeout(() => {
        if (loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
        
        // Remover estilos também
        const styles = document.head.querySelector('style');
        if (styles && styles.textContent.includes('.migration-loading-modal')) {
            styles.remove();
        }
    }, 300);
}

// MÉTODO AUXILIAR: Atualizar estatísticas no loading
updateMigrationStats(loadingElement, migrated, skipped, errors) {
    const migratedCount = loadingElement.querySelector('#migratedCount');
    const skippedCount = loadingElement.querySelector('#skippedCount');
    const errorCount = loadingElement.querySelector('#errorCount');
    
    if (migratedCount) migratedCount.textContent = migrated;
    if (skippedCount) skippedCount.textContent = skipped;
    if (errorCount) errorCount.textContent = errors;
}

}

// Exportar para uso global
window.JSFitCore = JSFitCore;