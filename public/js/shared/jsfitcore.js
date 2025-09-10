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
        this.currentUser = null;
        
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
            }
        };
    }

    // ========================================
    // MÉTODOS DE AUTENTICAÇÃO SIMPLIFICADOS
    // ========================================
    
    getUserId() {
        // SEMPRE verificar Firebase Auth primeiro (sem cache)
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const currentUserId = window.firebaseAuth.currentUser.uid;
            console.log('🔑 getUserId() Firebase Auth:', currentUserId);
            return currentUserId;
        }
        
        // Verificar AuthManager
        if (window.authManager && window.authManager.getCurrentUser) {
            const user = window.authManager.getCurrentUser();
            if (user && user.uid) {
                console.log('🔑 getUserId() AuthManager:', user.uid);
                return user.uid;
            }
        }
        
        // NUNCA usar localStorage para determinar usuário ativo
        console.warn('❌ getUserId(): Nenhum usuário autenticado encontrado');
        return null;
    }




    // ========================================
    // FIREBASE METHODS - VERSÃO CORRIGIDA
    // ========================================
    
    async initializeFirebase() {
        try {
            console.log('🔥 Inicializando Firebase...');

            if (this.initializationInProgress) {
                console.log('⏸️ Inicialização já em progresso, aguardando...');
                return;
            }
            
            if (window.firebaseApp && window.db) {
                console.log('✅ Firebase já inicializado');
                this.firebaseConnected = true;
                return;
            }
    
            // Importar módulos do Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
            
            // Inicializar Firebase
            console.log('🚀 Inicializando app Firebase...');
            window.firebaseApp = initializeApp(this.firebaseConfig);
            window.db = getFirestore(window.firebaseApp);
            window.firebaseAuth = getAuth(window.firebaseApp);
            
  
            
            console.log('🔍 Testando conexão...');
            await this.testFirebaseConnection();
            
            console.log('✅ Firebase inicializado com sucesso!');
            this.firebaseConnected  =true ;
            
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


    async loadPlanTypeConfiguration() {
        try {
            console.log('⚙️ Carregando configuração de tipos de plano do usuário...');
            
            // Tentar carregar via Firebase primeiro
            if (this.core && this.core.firebaseConnected && this.isUserAuthenticated) {
                try {
                    const firebaseConfig = await this.core.loadPlanConfigFromFirebase();
                    if (firebaseConfig && firebaseConfig.userId === this.currentUserId) {
                        this.planTypeConfiguration.days = firebaseConfig.days || 3;
                        this.planTypeConfiguration.configuration = firebaseConfig.configuration || {};
                        console.log('✅ Configuração carregada do Firebase');
                        return;
                    }
                } catch (firebaseError) {
                    console.warn('⚠️ Erro ao carregar do Firebase, usando backup local:', firebaseError);
                }
            }
    
            // Fallback: tentar localStorage específico do usuário
            if (this.isUserAuthenticated) {
                const configKey = this.getConfigStorageKey();
                const stored = localStorage.getItem(configKey);
                if (stored) {
                    const config = JSON.parse(stored);
                    if (config.userId === this.currentUserId) {
                        this.planTypeConfiguration.days = config.days || 3;
                        this.planTypeConfiguration.configuration = config.configuration || {};
                        console.log('✅ Configuração carregada do localStorage do usuário');
                        return;
                    }
                }
            }
    
            // Usar configuração padrão
            console.log('ℹ️ Usando configuração padrão');
            this.planTypeConfiguration.days = 3;
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3] || {};
            
        } catch (error) {
            console.error('❌ Erro ao carregar configuração de tipos de plano:', error);
            
            // Fallback final: configuração padrão
            this.planTypeConfiguration.days = 3;
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3] || {};
        }
    }

    async migrateExistingPlansToUser() {
        try {
            console.log('🔄 Iniciando migração de planos para usuário atual...');
            
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            if (!this.firebaseConnected) {
                console.warn('Firebase não conectado, não é possível migrar');
                return { migrated: 0, errors: 0 };
            }

            const { collection, getDocs, doc, updateDoc, where, query } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            // Buscar planos sem userId
            const plansWithoutUserQuery = query(
                collection(window.db, 'plans'),
                where('userId', '==', null)
            );
            
            const querySnapshot = await getDocs(plansWithoutUserQuery);
            
            if (querySnapshot.empty) {
                console.log('✅ Nenhum plano encontrado para migração');
                return { migrated: 0, errors: 0 };
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const planDoc of querySnapshot.docs) {
                try {
                    await updateDoc(doc(window.db, 'plans', planDoc.id), {
                        userId: userId,
                        migrated_at: new Date(),
                        migrated_from: 'anonymous'
                    });
                    migratedCount++;
                    console.log(`✅ Plano ${planDoc.id} migrado para usuário ${userId}`);
                } catch (error) {
                    console.error(`❌ Erro ao migrar plano ${planDoc.id}:`, error);
                    errorCount++;
                }
            }

            console.log(`✅ Migração concluída: ${migratedCount} planos migrados, ${errorCount} erros`);
            return { migrated: migratedCount, errors: errorCount };

        } catch (error) {
            console.error('❌ Erro na migração de planos:', error);
            return { migrated: 0, errors: 1 };
        }
    }
    // ========================================
    // EXERCISE DATABASE METHODS
    // ========================================
    

// SUBSTITUIR COMPLETAMENTE os métodos relacionados a exercícios no JSFitCore

// ========================================
// MÉTODOS DE EXERCÍCIOS - VERSÃO CORRIGIDA
// ========================================

async loadExerciseDatabase() {
    try {
        console.log('🏋️ Carregando base de exercícios...');

        // PASSO 1: Verificar e tentar conectar Firebase
        if (!this.firebaseConnected) {
            console.warn('⚠️ Firebase não conectado, tentando reconectar...');
            try {
                await this.initializeFirebase();
            } catch (initError) {
                console.warn('⚠️ Falha ao conectar Firebase:', initError.message);
            }
        }

        // PASSO 2: Tentar carregar do Firebase (prioridade)
        if (this.firebaseConnected) {
            const firebaseData = await this.loadFromFirebase();
            
            if (firebaseData && firebaseData.length > 0) {
                this.exerciseDatabase = firebaseData;
                this.exerciseDatabaseLoaded = true;
                console.log(`✅ ${firebaseData.length} exercícios carregados do Firebase`);
                this.logDatabaseStats();
                return true;
            }
            
            console.log('ℹ️ Firebase conectado mas coleção de exercícios vazia');
        }

        // PASSO 3: Fallback para arquivo local (apenas se Firebase falhou)
        console.log('📄 Tentando carregar DATABASE.JSON local...');
        const localData = await this.loadFromLocalFile();
        
        if (localData && localData.length > 0) {
            this.exerciseDatabase = localData;
            this.exerciseDatabaseLoaded = true;
            
            console.log(`✅ ${localData.length} exercícios carregados do arquivo local`);
            this.logDatabaseStats();
            
            // Migrar para Firebase em background (se conectado)
            if (this.firebaseConnected) {
                this.scheduleMigrationToFirebase(localData);
            }
            
            return true;
        }

        // PASSO 4: Fallback final - dados hardcoded
        console.warn('📄 Usando base hardcoded como fallback final');
        this.exerciseDatabase = this.convertHardcodedToArray();
        this.exerciseDatabaseLoaded = false;
        
        console.log(`⚠️ ${this.exerciseDatabase.length} exercícios carregados do fallback`);
        
        // Criar coleção inicial no Firebase se conectado
        if (this.firebaseConnected) {
            this.scheduleInitialFirebaseCollection();
        }
        
        return false;

    } catch (error) {
        console.error('❌ Erro crítico ao carregar base de exercícios:', error);
        return this.handleEmergencyFallback();
    }
}

async loadFromFirebase() {
    try {
        console.log('📥 Carregando exercícios do Firebase...');
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
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
        
        return exercises;
        
    } catch (error) {
        console.warn('⚠️ Erro ao carregar do Firebase:', error.message);
        
        // Retornar array vazio para coleções não encontradas
        if (error.code === 'not-found' || error.message.includes('not found')) {
            console.log('ℹ️ Coleção de exercícios não encontrada no Firebase');
            return [];
        }
        
        // Para outros erros, retornar null para indicar falha
        return null;
    }
}

async loadFromLocalFile() {
    try {
        const response = await fetch('data/DATABASE.JSON');
        
        if (!response.ok) {
            console.warn(`⚠️ Arquivo DATABASE.JSON não encontrado (HTTP ${response.status})`);
            return null;
        }
        
        const localData = await response.json();
        
        if (!Array.isArray(localData) || localData.length === 0) {
            console.warn('⚠️ Arquivo local existe mas está vazio ou inválido');
            return null;
        }
        
        return localData;
        
    } catch (error) {
        console.warn('⚠️ Erro ao carregar arquivo local:', error.message);
        return null;
    }
}

scheduleMigrationToFirebase(data) {
    // Agendar migração em background para não bloquear a UI
    setTimeout(() => {
        console.log('🔄 Iniciando migração para Firebase...');
        this.migrateExercisesToFirebase(data);
    }, 2000);
}

scheduleInitialFirebaseCollection() {
    // Agendar criação da coleção inicial
    setTimeout(() => {
        console.log('🔧 Criando coleção inicial no Firebase...');
        this.createInitialExerciseCollection();
    }, 3000);
}

handleEmergencyFallback() {
    console.log('🚨 Ativando fallback de emergência...');
    
    this.exerciseDatabase = this.convertHardcodedToArray();
    this.exerciseDatabaseLoaded = false;
    
    console.log(`🚨 ${this.exerciseDatabase.length} exercícios de emergência carregados`);
    return false;
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
                    codigo: ex.codigo || `${grupo.toUpperCase()}${id.toString().padStart(3, '0')}`
                });
            });
        });
    });

    return exerciseArray;
}

async createInitialExerciseCollection() {
    try {
        console.log('🔨 Verificando se precisa criar coleção inicial...');
        
        if (!this.firebaseConnected) {
            console.log('⚠️ Firebase não conectado, pulando criação inicial');
            return;
        }

        // Verificar se já existem exercícios
        const existingExercises = await this.loadExercisesFromFirebase();
        if (existingExercises.length > 0) {
            console.log('ℹ️ Coleção já possui exercícios, pulando criação inicial');
            return;
        }
        
        console.log('🔨 Criando coleção inicial de exercícios...');
        
        const { collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        // Usar os dados do fallback como base inicial
        const initialExercises = this.convertHardcodedToArray();
        let createdCount = 0;
        
        for (const exercise of initialExercises.slice(0, 10)) { // Limitar para não sobrecarregar
            try {
                const docRef = doc(collection(window.db, 'exercises_database'));
                
                await setDoc(docRef, {
                    ...exercise,
                    created_at: new Date(),
                    source: 'initial_setup',
                    migrated_at: new Date().toISOString()
                });
                
                createdCount++;
                
                // Pequena pausa para não sobrecarregar
                if (createdCount % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (docError) {
                console.warn('⚠️ Erro ao criar exercício:', exercise.nome, docError);
            }
        }
        
        console.log(`✅ Coleção inicial criada com ${createdCount} exercícios`);
        
    } catch (error) {
        console.error('❌ Erro ao criar coleção inicial:', error);
    }
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

    

  
    async savePlanToFirebase(planData) {
        try {
            console.log('💾 Salvando plano no Firebase com autenticação...');
            
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
            }
    
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }
            
            const { collection, addDoc, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const planToSave = {
                ...planData,
                userId: userId, // CAMPO OBRIGATÓRIO
                created_at: planData.created_at || new Date(),
                updated_at: new Date()
            };
    
            // Validar dados essenciais antes de salvar
            if (!planToSave.nome || !planToSave.treinos) {
                throw new Error('Dados do plano incompletos');
            }
    
            console.log('💾 Salvando com userId:', userId, 'Plano:', planToSave.nome);
    
            let docRef;
            let returnId;
            
            if (planData.id && typeof planData.id === 'string') {
                // Atualizar plano existente
                docRef = doc(window.db, 'plans', planData.id);
                await setDoc(docRef, planToSave, { merge: true });
                returnId = planData.id;
                console.log(`✅ Plano atualizado: ${planData.id} (Usuário: ${userId})`);
            } else {
                // Criar novo plano
                docRef = await addDoc(collection(window.db, 'plans'), planToSave);
                returnId = docRef.id;
                console.log(`✅ Novo plano criado: ${docRef.id} (Usuário: ${userId})`);
            }
            
            return returnId; // ⚠️ CORREÇÃO CRÍTICA: RETORNAR O ID
            
        } catch (error) {
            console.error('❌ Erro ao salvar plano no Firebase:', error);
            throw error;
        }
    }


    async migrateOrphanPlans() {
        const userId = this.getUserId();
        if (!userId) return;
    
        try {
            const { collection, getDocs, doc, updateDoc, where, query } = 
                await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const orphanQuery = query(
                collection(window.db, 'plans'),
                where('userId', '==', null)
            );
            
            const orphanSnapshot = await getDocs(orphanQuery);
            
            for (const planDoc of orphanSnapshot.docs) {
                await updateDoc(doc(window.db, 'plans', planDoc.id), {
                    userId: userId,
                    migrated_at: new Date()
                });
            }
            
            console.log(`✅ ${orphanSnapshot.size} planos órfãos migrados`);
        } catch (error) {
            console.error('Erro na migração:', error);
        }
    }

    async debugFirebaseData() {
        const userId = this.getUserId();
        console.log('🔍 UserID atual:', userId);
        
        const { collection, getDocs } = 
            await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        const allPlans = await getDocs(collection(window.db, 'plans'));
        
        console.log('📊 Todos os planos no Firebase:');
        allPlans.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.nome} | UserID: ${data.userId} | Email: ${data.userEmail}`);
        });
    }



    async loadPlansFromFirebase() {
        try {
            console.log('🔥 Carregando planos do Firebase...');
            
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
            }
            
            // VALIDAÇÃO CRÍTICA: SEMPRE obter userId atual
            const userId = this.getUserId();
            if (!userId) {
                console.error('❌ ERRO CRÍTICO: Usuário não autenticado para carregar planos');
                throw new Error('Usuário não autenticado');
            }
            
            console.log(`👤 QUERY FIREBASE para usuário: ${userId}`);
            
            const { collection, getDocs, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            // Query com filtro rigoroso
            const plansQuery = query(
                collection(window.db, 'plans'),
                where('userId', '==', userId),
                orderBy('created_at', 'desc')
            );
            
            const querySnapshot = await getDocs(plansQuery);
            const plans = [];
            
            querySnapshot.forEach((doc) => {
                const planData = doc.data();
                planData.id = doc.id;
                
                // VALIDAÇÃO DUPLA: só incluir se userId bate
                if (planData.userId === userId) {
                    plans.push(planData);
                    console.log(`✅ Plano incluído: ${planData.nome} (ID: ${doc.id}, User: ${planData.userId})`);
                } else {
                    console.warn(`⚠️ Plano REJEITADO: ${planData.nome} - UserID ${planData.userId} ≠ ${userId}`);
                }
            });
            
            console.log(`✅ RESULTADO FINAL: ${plans.length} planos carregados para ${userId}`);
            return plans;
            
        } catch (error) {
            console.error('❌ Erro ao carregar planos do Firebase:', error);
            throw error;
        }
    }
    

    async deletePlanFromFirebase(planId) {
        try {
            if (!this.firebaseConnected) {
                throw new Error('Firebase não conectado');
            }
            
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const planRef = doc(window.db, 'plans', planId);
            await deleteDoc(planRef);
            
            console.log(`Plano ${planId} deletado do Firebase`);
            
        } catch (error) {
            console.error('Erro ao deletar do Firebase:', error);
            throw error;
        }
    }


    // ========================================
    // COMPARTILHAMENTO SIMPLIFICADO
    // ========================================

    async importSharedPlan(shareId) {

        
            console.log('🔥 Inicializando Firebase...');
            
            // Verificar se já foi inicializado
            if (window.firebaseApp && window.db && this.firebaseConnected) {
                console.log('✅ Firebase já inicializado, pulando...');
                return;
            }
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

    // ========================================
    // UTILITY METHODS
    // ========================================
    
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        if (!dateString) return 'Não definido';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch (error) {
            return 'Data inválida';
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

    // ========================================
    // MIGRAÇÃO DE EXERCÍCIOS SIMPLIFICADA
    // ========================================
    
    async migrateExercisesToFirebase(exercises) {
   /*     if (!this.firebaseConnected) {
            console.warn('Firebase não conectado, pulando migração');
            return;
        }

        try {
            console.log('Iniciando migração de exercícios para Firebase...');
            
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            let migratedCount = 0;
            
            for (const exercise of exercises) {
                try {
                    if (!exercise.nome || typeof exercise.nome !== 'string') {
                        continue;
                    }

                    const cleanExercise = {
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
                    
                    await addDoc(collection(window.db, 'exercises_database'), cleanExercise);
                    migratedCount++;
                    
                    if (migratedCount % 50 === 0) {
                        console.log(`Progresso: ${migratedCount} exercícios migrados`);
                    }
                    
                } catch (error) {
                    console.error('Erro ao migrar exercício:', exercise.nome, error);
                }
            }

            console.log(`Migração concluída: ${migratedCount} exercícios migrados`);
            
        } catch (error) {
            console.error('Erro na migração:', error);
        }
            */
    }


    // Adicionar este método à classe JSFitCore
async initializeUserData() {
    try {
        console.log('🔄 Inicializando dados do usuário após autenticação...');
        
        const userId = this.getUserId();
        if (!userId) {
            console.warn('⚠️ Usuário não autenticado - abortando inicialização');
            return false;
        }
        
        console.log(`👤 Inicializando dados para usuário: ${userId}`);
        
        // 1. Carregar base de exercícios
       // await this.ensureExerciseDatabaseLoaded();
        
        // 2. Carregar planos do usuário
       // await this.loadUserPlans();
        
        // 3. Migrar planos existentes se necessário
       // await this.migrateExistingPlansToUser();
        
        // 4. Carregar configurações do usuário
     //   await this.loadUserConfiguration();
        
        console.log('✅ Dados do usuário inicializados com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar dados do usuário:', error);
        this.showNotification('Erro ao carregar dados do usuário', 'error');
        return false;
    }
}




// Carregar planos do localStorage como fallback
loadPlansFromLocalStorage() {
    try {
        const userId = this.getUserId();
        if (!userId) return [];
        
        const storageKey = `jsfitapp_plans_${userId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            const plans = JSON.parse(stored);
            console.log(`✅ ${plans.length} planos carregados do localStorage`);
            
            if (window.app) {
                window.app.savedPlans = plans;
                if (window.app.updatePlansList) {
                    window.app.updatePlansList();
                }
            }
            
            return plans;
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ Erro ao carregar do localStorage:', error);
        return [];
    }
}

// Carregar configurações do usuário
async loadUserConfiguration() {
    try {
        console.log('⚙️ Carregando configurações do usuário...');
        
        // Se houver método de configuração na aplicação principal
        if (window.app && window.app.loadUserConfiguration) {
            await window.app.loadUserConfiguration();
        }
        
        // Carregar configurações específicas do core se necessário
        // await this.loadPlanTypeConfiguration();
        
        console.log('✅ Configurações do usuário carregadas');
        
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
    }
}
}



// Exportar para uso global
window.JSFitCore = JSFitCore;