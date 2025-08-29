// =============================================
// JS FIT APP - PERSONAL TRAINER SYSTEM
// Sistema Completo de Criação de Planos de Treino
// Usando JSFitCore compartilhado
// =============================================

class PersonalApp {
    constructor() {



// Inicializar core compartilhado com as configurações corretas
        this.core = new JSFitCore(this.firebaseConfig);

        
        // Estados específicos do personal
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
        this.pendingDeletions = [];
        this.autoSyncInterval = null;
        this.cleanupInterval = null;
        this.debugUpdateInterval = null;

        this.savedPlans = [];
        this.currentExerciseIndex = null;
        this.currentWorkoutIndex = null;
        this.selectedDays = 1;
        this.isEditing = false;
        this.currentScrollPosition = 0;
            // Sincronização Firebase prioritária
    this.pendingDeletions = [];
    this.autoSyncInterval = null;
    this.cleanupInterval = null;
    this.debugUpdateInterval = null;
    this.localAutoSaveInterval = null;
    
    // Controle de progresso
    this.progressInterval = null;
    
    // Base de exercícios de fallback
    this.fallbackExercises = [];
    
    console.log('Constructor atualizado com suporte Firebase prioritário');
        
        // Estado do compartilhamento
        this.sharingState = {
            isSharing: false,
            currentShareId: null,
            lastSharedPlan: null
        };

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

        this.tecnicasPorNivel = {
            iniciante: ['tempo-controlado', 'pausa-contracao'],
            intermediario: ['pre-exaustao', 'pos-exaustao', 'bi-set', 'drop-set', 'rest-pause', 'serie-queima'],
            avancado: ['pre-exaustao', 'pos-exaustao', 'bi-set', 'tri-set', 'drop-set', 'rest-pause', 'serie-queima']
        };

        
    }

 // 3. MÉTODO DE IMPORT MODIFICADO PARA PRIORIZAR FIREBASE
async importPlan(event) {
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
            
            for (const planData of plansToImport) {
                try {
                    // Preparar dados
                    planData.id = null; // Forçar novo ID
                    planData.nome = planData.nome + ' (Importado)';
                    planData.imported_at = new Date().toISOString();
                    
                    // Normalizar estrutura
                    this.normalizePlanStructure(planData);
                    
                    // PRIORIDADE 1: TENTAR FIREBASE
                    let savedToFirebase = false;
                    
                    if (this.core && this.core.firebaseConnected) {
                        try {
                            const firebaseId = await this.core.savePlanToFirebase(planData);
                            planData.id = firebaseId;
                            planData.saved_in_firebase = true;
                            savedToFirebase = true;
                            results.firebase_success++;
                            
                            console.log(`Plano ${planData.nome} salvo no Firebase: ${firebaseId}`);
                            
                        } catch (firebaseError) {
                            console.error(`Erro Firebase para ${planData.nome}:`, firebaseError);
                            savedToFirebase = false;
                        }
                    }
                    
                    // PRIORIDADE 2: BACKUP LOCAL
                    if (!savedToFirebase) {
                        planData.id = this.core.generateId();
                        planData.saved_in_localstorage_only = true;
                        planData.retry_firebase = true;
                        results.localStorage_only++;
                        
                        console.log(`Plano ${planData.nome} salvo apenas localmente`);
                    } else {
                        planData.backup_in_localstorage = true;
                    }
                    
                    // Adicionar à lista local (sempre)
                    this.savedPlans.push(planData);
                    
                } catch (planError) {
                    console.error('Erro ao processar plano individual:', planError);
                    results.errors++;
                }
            }
            
            // Salvar backup local
            this.saveToLocalStorageAsBackup();
            
            // Atualizar interface
            this.renderPlanList();
            
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
            
            // Agendar retry para planos que falharam no Firebase
            this.scheduleFailedPlansRetry();
            
        } catch (error) {
            console.error('Erro ao importar:', error);
            this.showMessage('Erro ao importar arquivo. Verifique o formato.', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

    loadSavedPlans() {
        try {
            const stored = localStorage.getItem('jsfitapp_plans');
            if (stored) {
                this.savedPlans = JSON.parse(stored);
                
                // Migrate old plans to new structure
                this.savedPlans.forEach(plan => {
                    if (!plan.aluno && plan.perfil) {
                        plan.aluno = {
                            nome: '',
                            dataNascimento: '',
                            cpf: '',
                            idade: plan.perfil.idade || 25,
                            altura: plan.perfil.altura || '1,75m',
                            peso: plan.perfil.peso || '75kg'
                        };
                    }
                    
                    // Ensure exercises have all required fields
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
                    
                    // Add tecnicas_aplicadas if not present
                    if (!plan.tecnicas_aplicadas) {
                        plan.tecnicas_aplicadas = {};
                    }
                    
                    // Ensure perfil has porte field
                    if (plan.perfil && !plan.perfil.porte) {
                        plan.perfil.porte = this.core.calculateBodyType(
                            plan.perfil.altura || '1,75m',
                            plan.perfil.peso || '75kg'
                        );
                    }
                });
                
                this.savePlansToStorage(); // Save migrated data
            }
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
            this.savedPlans = [];
        }
    }

    savePlansToStorage() {
        try {
            localStorage.setItem('jsfitapp_plans', JSON.stringify(this.savedPlans));
        } catch (error) {
            console.error('Erro ao salvar planos:', error);
        }
    }


    // =============================================
    // INICIALIZAÇÃO DA APLICAÇÃO
    // =============================================

// MÉTODO init() COMPLETO COM TODAS AS CORREÇÕES PARA PERSISTÊNCIA

async init() {
    console.log('Inicializando JS Fit Personal App...');

    try {
        // 1. Inicializar Firebase via core
        console.log('Inicializando Firebase...');
        await this.core.initializeFirebase();

        // 2. Configurações básicas
        console.log('Definindo configurações básicas...');
        this.setDefaultDates();
        this.setupEventListeners();
        
        // 3. Configurar handlers de persistência
        this.setupBeforeUnloadHandler();
        this.setupVisibilityChangeHandler();

        // 4. Carregar configuração de tipos de plano
        console.log('Carregando configuração de tipos de plano...');
        await this.loadPlanTypeConfiguration();

        // 5. CARREGAR PLANOS COM VERIFICAÇÃO ROBUSTA
        console.log('Carregando planos salvos...');
        await this.loadSavedPlansWithVerification();

        // 6. Carregar base de exercícios via core
        console.log('Carregando base de exercícios...');
        await this.core.loadExerciseDatabase();

        // 7. Popular interface
        console.log('Populando interface...');
        this.populateGroupFilter();
        this.populateExerciseSelect();

        // 8. Mostrar interface principal
        console.log('Mostrando interface principal...');
        this.showPlanList();

        // 9. Verificar e restaurar planos perdidos
        console.log('Verificando planos perdidos...');
        await this.verifyAndRestorePlans();
        
        // 10. Iniciar auto-save
        console.log('Iniciando auto-save...');
       // this.startAutoSave();
        
        // 11. Sincronizar dados importados
        console.log('Sincronizando dados importados...');
        await this.syncAfterImport();

        // 12. Verificar integridade dos dados
        this.verifyDataIntegrity();

        console.log('Aplicação inicializada com sucesso');
        this.showMessage('Aplicação carregada com sucesso!', 'success', 2000);

        // Debug opcional
        if (console.debug) {
            this.debugDataState();
        }

    } catch (error) {
        console.error('Erro na inicialização:', error);
        
        // Fallback: inicialização offline robusta
        console.log('Iniciando modo de fallback...');
        await this.initializeFallbackMode();
        
        this.showMessage('Iniciado em modo offline. Algumas funcionalidades podem estar limitadas.', 'warning');
    }
}

// FINALIZAÇÃO DO SISTEMA FIREBASE PRIORITÁRIO

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

// 6. ATUALIZAR O MÉTODO init() PARA INCLUIR AUTO-SYNC
// Adicione estas linhas no final do método init() existente:

/*
        // 13. Iniciar auto-sync (Firebase prioritário)
        console.log('Iniciando auto-sync...');
        this.startAutoSync();
        
        // 14. Setup handler de reconexão Firebase
        if (this.core) {
            this.core.onFirebaseReconnect = () => this.handleFirebaseReconnection();
        }
*/

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

// MÉTODO PARA VALIDAR CONSISTÊNCIA ENTRE MEMÓRIA E LOCALSTORAGE
validateDataConsistency() {
    try {
        const memoryCount = this.savedPlans ? this.savedPlans.length : 0;
        const localData = localStorage.getItem('jsfitapp_plans');
        const localCount = localData ? JSON.parse(localData).length : 0;
        
        const isConsistent = memoryCount === localCount;
        
        console.log(`Consistência de dados: ${isConsistent ? 'OK' : 'PROBLEMA'}`);
        console.log(`Memória: ${memoryCount}, localStorage: ${localCount}`);
        
        if (!isConsistent) {
            this.showMessage(
                `Inconsistência detectada: ${memoryCount} em memória vs ${localCount} localmente`, 
                'warning'
            );
            
            // Oferecer correção automática
            if (confirm('Deseja corrigir a inconsistência sincronizando os dados?')) {
                if (memoryCount > localCount) {
                    // Memória tem mais dados, salvar no localStorage
                    this.savePlansToStorage();
                    this.showMessage('Dados da memória salvos no localStorage', 'success');
                } else if (localCount > memoryCount) {
                    // localStorage tem mais dados, carregar na memória
                    this.loadFromLocalStorageOnly();
                    this.renderPlanList();
                    this.showMessage('Dados do localStorage carregados na memória', 'success');
                }
            }
        }
        
        return isConsistent;
        
    } catch (error) {
        console.error('Erro ao validar consistência:', error);
        return false;
    }
}

// MÉTODO PARA LIMPEZA COMPLETA DOS DADOS (USAR COM CUIDADO)
clearAllData() {
    if (confirm('ATENÇÃO: Isso irá apagar TODOS os planos salvos. Tem certeza?')) {
        if (confirm('Última chance! Todos os dados serão perdidos permanentemente!')) {
            // Limpar memória
            this.savedPlans = [];
            
            // Limpar localStorage
            localStorage.removeItem('jsfitapp_plans');
            
            // Limpar backups
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('jsfitapp_backup_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Atualizar interface
            this.renderPlanList();
            
            this.showMessage('Todos os dados foram apagados', 'info');
            console.log('Limpeza completa de dados executada');
        }
    }
}

// MÉTODO PARA EXPORTAR DADOS PARA DEBUG
exportDebugData() {
    try {
        const debugData = {
            timestamp: new Date().toISOString(),
            memoryPlans: this.savedPlans || [],
            localStoragePlans: this.getLocalStoragePlans(),
            configuration: this.planTypeConfiguration,
            firebaseConnected: this.core?.firebaseConnected || false,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const dataStr = JSON.stringify(debugData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `jsfitapp_debug_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showMessage('Dados de debug exportados', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar dados de debug:', error);
        this.showMessage('Erro ao exportar dados de debug', 'error');
    }
}

    // =============================================
    // MÉTODOS QUE USAM O CORE
    // =============================================

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

    // Usar métodos do core para utilitários
    showMessage(message, type, duration) {
        return this.core.showNotification(message, type, duration);
    }



    // =============================================
    // MÉTODOS ESPECÍFICOS DO PERSONAL
    // =============================================

    

    async loadSavedPlans() {
        try {
            // Tentar carregar via core
            const firebasePlans = await this.core.loadPlansFromFirebase();
            this.savedPlans = firebasePlans || [];
            
        } catch (error) {
            console.error('Erro ao carregar planos do Firebase:', error);
            
            // Fallback para localStorage
            try {
                const stored = localStorage.getItem('jsfitapp_plans');
                if (stored) {
                    this.savedPlans = JSON.parse(stored);
                    this.showMessage('Dados carregados localmente.', 'warning');
                }
            } catch (localError) {
                console.error('Erro no fallback localStorage:', localError);
                this.savedPlans = [];
            }
        }
    }

 // SISTEMA DE DELEÇÃO COM FIREBASE PRIORITÁRIO

async deletePlan(planId) {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
        this.showMessage('Excluindo plano...', 'info');

        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) {
            this.showMessage('Plano não encontrado', 'error');
            return;
        }

        let firebaseDeleted = false;
        let localDeleted = false;

        // PRIORIDADE 1: DELETAR DO FIREBASE PRIMEIRO
        if (this.core && this.core.firebaseConnected) {
            try {
                console.log(`Deletando do Firebase: ${plan.nome} (ID: ${planId})`);
                await this.core.deletePlanFromFirebase(planId);
                firebaseDeleted = true;
                console.log('Deletado do Firebase com sucesso');
                
            } catch (firebaseError) {
                console.error('Erro ao deletar do Firebase:', firebaseError);
                
                // Se o erro for 404 (não encontrado), considerar como sucesso
                if (firebaseError.code === 'not-found' || firebaseError.message.includes('not found')) {
                    console.log('Plano não existia no Firebase (considerado sucesso)');
                    firebaseDeleted = true;
                } else {
                    firebaseDeleted = false;
                    
                    // Marcar para deleção posterior
                    plan.pending_firebase_deletion = true;
                    plan.deletion_error = firebaseError.message;
                    
                    console.warn('Falha na deleção Firebase, marcado para retry');
                }
            }
        } else {
            console.warn('Firebase não conectado - deletando apenas localmente');
            plan.pending_firebase_deletion = true;
        }

        // PRIORIDADE 2: DELETAR DO LOCALSTORAGE (SEMPRE EXECUTAR)
        try {
            // Remover da lista local
            const initialLength = this.savedPlans.length;
            this.savedPlans = this.savedPlans.filter(p => p.id !== planId);
            localDeleted = this.savedPlans.length < initialLength;
            
            if (localDeleted) {
                // Atualizar backup local
                this.saveToLocalStorageAsBackup();
                console.log('Removido da lista local e backup atualizado');
            }
            
        } catch (localError) {
            console.error('Erro ao deletar localmente:', localError);
            localDeleted = false;
        }

        // ATUALIZAR INTERFACE
        this.renderPlanList();

        // MENSAGENS DE RESULTADO
        if (firebaseDeleted && localDeleted) {
            this.showMessage('Plano excluído com sucesso!', 'success');
        } else if (localDeleted && !firebaseDeleted) {
            this.showMessage('Plano excluído localmente (Firebase indisponível)', 'warning');
            // Agendar retry da deleção no Firebase
            this.scheduleFirebaseDeletionRetry(planId, plan.nome);
        } else if (!localDeleted) {
            this.showMessage('Erro ao excluir plano', 'error');
            // Reverter se possível
            if (firebaseDeleted) {
                console.error('INCONSISTÊNCIA: Deletado do Firebase mas não localmente');
            }
        }
        
    } catch (error) {
        console.error('Erro geral ao deletar plano:', error);
        this.showMessage('Erro ao excluir plano. Tente novamente.', 'error');
    }
}

// 2. MÉTODO PARA BACKUP SECUNDÁRIO NO LOCALSTORAGE
saveToLocalStorageAsBackup() {
    try {
        const backupData = {
            plans: this.savedPlans,
            last_backup: new Date().toISOString(),
            backup_type: 'secondary',
            firebase_primary: true
        };
        
        localStorage.setItem('jsfitapp_plans', JSON.stringify(this.savedPlans));
        localStorage.setItem('jsfitapp_backup_meta', JSON.stringify(backupData));
        
        console.log('Backup secundário no localStorage criado');
        return true;
        
    } catch (error) {
        console.error('Erro ao criar backup localStorage:', error);
        return false;
    }
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
        planData.perfil.porte = this.core.calculateBodyType(
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

async loadFromLocalStorageAsBackup() {
   
    try {
        const stored = localStorage.getItem('jsfitapp_plans');
        if (stored) {
            const parsedPlans = JSON.parse(stored);
            if (Array.isArray(parsedPlans)) {
                this.savedPlans = parsedPlans.map(plan => {
                    // Marcar que foi carregado do backup
                    plan.loaded_from_backup = true;
                    return this.migratePlanStructure(plan);
                });
                console.log(`${this.savedPlans.length} planos carregados do backup localStorage`);
                
                // Agendar sincronização com Firebase quando possível
                this.scheduleFailedPlansRetry();
            } else {
                this.savedPlans = [];
            }
        } else {
            this.savedPlans = [];
        }
    } catch (error) {
        console.error('Erro ao carregar backup localStorage:', error);
        this.savedPlans = [];
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

// MÉTODOS AUSENTES - ADICIONAR À CLASSE PersonalApp

// 1. MÉTODO MELHORADO PARA CARREGAR PLANOS COM VERIFICAÇÃO
async loadSavedPlansWithVerification() {
    try {
        console.log('Carregando planos com verificação...');
        
        // Carregar planos usando método melhorado
        await this.loadSavedPlans();
        
        // Verificar se os planos foram carregados corretamente
        if (!Array.isArray(this.savedPlans)) {
            console.warn('savedPlans não é um array, inicializando como array vazio');
            this.savedPlans = [];
        }
        
        console.log(`${this.savedPlans.length} planos carregados na memória`);
        
        // Verificar integridade de cada plano
        let plansRemoved = 0;
        this.savedPlans = this.savedPlans.filter(plan => {
            if (!plan || !plan.id) {
                plansRemoved++;
                console.warn('Plano inválido removido:', plan);
                return false;
            }
            return true;
        });
        
        if (plansRemoved > 0) {
            console.log(`${plansRemoved} plano(s) inválido(s) removido(s)`);
            // Salvar lista limpa
            this.saveToLocalStorageAsBackup();
        }
        
        // Log detalhado dos planos carregados
        this.savedPlans.forEach((plan, index) => {
            console.log(`  ${index + 1}. ${plan.nome} (ID: ${plan.id})`);
        });
        
    } catch (error) {
        console.error('Erro ao carregar planos com verificação:', error);
        this.savedPlans = [];
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

// 7. MODO DE FALLBACK ROBUSTO PARA QUANDO FIREBASE FALHA
async initializeFallbackMode() {
    try {
        console.log('Iniciando modo offline...');
        
        // Configurações básicas (já feitas, mas garantir)
        this.setDefaultDates();
        this.setupEventListeners();
        
        // Carregar apenas do localStorage
        await this.loadFromLocalStorageAsBackup();
        
        // Usar base de exercícios embutida se core falhar
        if (!this.core.exerciseDatabaseLoaded) {
            console.log('Usando base de exercícios de fallback...');
            this.initializeFallbackExerciseDatabase();
        }
        
        // Popular interface
        this.populateGroupFilter();
        this.populateExerciseSelect();
        this.showPlanList();
        
        // Configurar auto-save local apenas
        this.startLocalOnlyAutoSave();
        
        console.log('Modo offline inicializado');
        
    } catch (fallbackError) {
        console.error('Erro crítico no modo fallback:', fallbackError);
        
        // Último recurso: interface mínima
        this.savedPlans = [];
        this.showPlanList();
        this.showMessage('Aplicação iniciada em modo mínimo. Algumas funcionalidades não estarão disponíveis.', 'warning');
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


    savePlansToStorage() {
        try {
            localStorage.setItem('jsfitapp_plans', JSON.stringify(this.savedPlans));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
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


    populateGroupFilter() {
        const groupFilter = document.getElementById('exerciseGroupFilter');
        if (!groupFilter) return;

        // Salvar valor atual
        const currentValue = groupFilter.value;

        // Limpar opções (exceto "todos")
        groupFilter.innerHTML = '<option value="todos">📋 Todos os Grupos</option>';

        // Usar core para obter grupos
        const groups = this.core.getAllExerciseGroups();
        
        groups.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.toLowerCase();
            option.textContent = `💪 ${this.core.capitalizeFirstLetter(grupo)}`;
            groupFilter.appendChild(option);
        });

        // Restaurar valor se ainda existe
        if (currentValue && currentValue !== '') {
            const optionExists = Array.from(groupFilter.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                groupFilter.value = currentValue;
            }
        }
    }

    populateExerciseSelect(filterGroup = 'todos') {
        const exerciseSelect = document.getElementById('exerciseName');
        if (!exerciseSelect) return;

        // Salvar opção custom e valor atual
        const currentValue = exerciseSelect.value;

        // Limpar todas as opções
        exerciseSelect.innerHTML = '';

        // Recriar opção custom
        const newCustomOption = document.createElement('option');
        newCustomOption.value = 'custom';
        newCustomOption.textContent = '✏️ Exercício Personalizado';
        exerciseSelect.appendChild(newCustomOption);

        // Usar core para obter exercícios
        if (this.core.exerciseDatabaseLoaded && this.core.exerciseDatabase.length > 0) {
            let exercisesToShow = this.core.exerciseDatabase;

            if (filterGroup && filterGroup !== 'todos') {
                exercisesToShow = this.core.exerciseDatabase.filter(ex =>
                    ex.grupo && ex.grupo.toLowerCase() === filterGroup.toLowerCase()
                );
            }

            if (filterGroup === 'todos') {
                // Mostrar agrupado
                const groupedExercises = {};
                exercisesToShow.forEach(ex => {
                    const grupo = ex.grupo || 'Outros';
                    if (!groupedExercises[grupo]) {
                        groupedExercises[grupo] = [];
                    }
                    groupedExercises[grupo].push(ex);
                });

                const sortedGroups = Object.keys(groupedExercises).sort();

                sortedGroups.forEach(grupo => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = this.core.capitalizeFirstLetter(grupo);

                    const exercicios = groupedExercises[grupo].sort((a, b) =>
                        a.nome.localeCompare(b.nome, 'pt-BR')
                    );

                    exercicios.forEach(ex => {
                        const option = document.createElement('option');
                        option.value = ex.nome;
                        option.textContent = ex.nome;

                        if (ex.nivel) {
                            option.textContent += ` (${ex.nivel})`;
                        }

                        optgroup.appendChild(option);
                    });

                    exerciseSelect.appendChild(optgroup);
                });
            } else {
                // Mostrar apenas exercícios do grupo selecionado
                const sortedExercises = exercisesToShow.sort((a, b) =>
                    a.nome.localeCompare(b.nome, 'pt-BR')
                );

                sortedExercises.forEach(ex => {
                    const option = document.createElement('option');
                    option.value = ex.nome;
                    option.textContent = ex.nome;

                    if (ex.nivel) {
                        option.textContent += ` (${ex.nivel})`;
                    }

                    exerciseSelect.appendChild(option);
                });
            }
        }

        // Restaurar valor anterior se ainda existe
        if (currentValue && currentValue !== '') {
            const optionExists = Array.from(exerciseSelect.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                exerciseSelect.value = currentValue;
            }
        }
    }

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

    // =============================================
    // MÉTODOS DE NAVEGAÇÃO
    // =============================================

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
    }

    showAIPlanCreator() {
        document.getElementById('aiPlanCreator').style.display = 'block';
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
        document.getElementById('planDetails').style.display = 'none';
    }

    showPlanList() {
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('aiPlanCreator').style.display = 'none';
        document.getElementById('planDetails').style.display = 'none';
        document.getElementById('planList').style.display = 'block';
        this.renderPlanList();
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


// Adicionar estas funções ao personal.js

// 1. Modificar o método renderPlanList para incluir botão de compartilhar
renderPlanList() {
    const container = document.getElementById('planListContent');
    if (!container) return;

    if (this.savedPlans.length === 0) {
        container.innerHTML = `
            <div class="plan-card">
                <h3>Nenhum plano encontrado</h3>
                <p>Crie seu primeiro plano de treino!</p>
                <div class="plan-card-actions">
                    <button class="btn btn-primary btn-small" onclick="app.showAIPlanCreator()">
                        🤖 Criar com IA
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="app.showPlanCreator()">
                        ➕ Criar Manualmente
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = this.savedPlans.map(plan => `
        <div class="plan-card">
            <h3>${plan.nome}</h3>
            <p><strong>Aluno:</strong> ${plan.aluno?.nome || 'Não informado'}</p>
            <p><strong>Período:</strong> ${this.core.formatDate(plan.dataInicio)} até ${this.core.formatDate(plan.dataFim)}</p>
            <p><strong>Frequência:</strong> ${plan.dias} dias por semana</p>
            <p><strong>Objetivo:</strong> ${plan.perfil?.objetivo || 'Não especificado'}</p>
            
            ${plan.shareId ? `
                <div class="share-status">
                    <span class="share-badge">🔗 ID: ${plan.shareId}</span>
                    <small>Compartilhado e disponível para importação</small>
                </div>
            ` : ''}
            
            <div class="plan-card-actions">
                <button class="btn btn-primary btn-small" onclick="app.viewPlan('${plan.id}')">
                    👁️ Visualizar
                </button>
                <button class="btn btn-secondary btn-small" onclick="app.editPlan('${plan.id}')">
                    ✏️ Editar
                </button>
                ${plan.shareId ? `
                    <button class="btn btn-success btn-small" onclick="app.copyShareId('${plan.shareId}')">
                        📋 Copiar ID
                    </button>
                    <button class="btn btn-warning btn-small" onclick="app.stopSharing('${plan.id}')">
                        🔒 Parar Compartilhar
                    </button>
                ` : `
                    <button class="btn btn-success btn-small" onclick="app.sharePlan('${plan.id}')">
                        🔗 Compartilhar
                    </button>
                `}
                <button class="btn btn-danger btn-small" onclick="app.deletePlan('${plan.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// 2. Função principal de compartilhamento
async sharePlan(planId) {
    try {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) {
            this.showMessage('Plano não encontrado', 'error');
            return;
        }

        // Verificar se já está compartilhado
        if (plan.shareId) {
            this.showMessage('Este plano já está compartilhado', 'info');
            this.showQuickShareInfo(plan.shareId, plan.nome);
            return;
        }

        this.showMessage('Preparando plano para compartilhamento...', 'info');

        // Validação básica
        if (!plan.nome || !plan.aluno?.nome) {
            this.showMessage('Plano deve ter nome e nome do aluno para ser compartilhado', 'warning');
            return;
        }

        if (!plan.treinos || plan.treinos.length === 0) {
            this.showMessage('Plano deve ter pelo menos um treino para ser compartilhado', 'warning');
            return;
        }

        // Preparar dados para compartilhamento (sanitizar)
        const sharedPlan = this.preparePlanForSharing(plan);

        // Gerar ID de compartilhamento
        const shareId = this.generateShareId();

        // Salvar no Firebase
        await this.saveSharedPlanToFirebase(shareId, sharedPlan);

        // Atualizar plano local com ID de compartilhamento
        plan.shareId = shareId;
        plan.sharedAt = new Date().toISOString();

        // Salvar localmente
        await this.savePlansToStorage();

        // Mostrar resultado
        this.showQuickShareInfo(shareId, plan.nome);
        this.renderPlanList(); // Recarregar lista para mostrar novo status

    } catch (error) {
        console.error('Erro ao compartilhar plano:', error);
        this.showMessage(`Erro ao compartilhar: ${error.message}`, 'error');
    }
}

// 3. Preparar plano para compartilhamento (remover dados sensíveis)
preparePlanForSharing(plan) {
    const sharedPlan = {
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
        tecnicas_aplicadas: plan.tecnicas_aplicadas || {}
    };

    return sharedPlan;
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

// 5. Salvar plano compartilhado no Firebase
async saveSharedPlanToFirebase(shareId, planData) {
    try {
        await this.core.initializeFirebase();

        if (!this.core.firebaseConnected) {
            throw new Error('Firebase não está conectado');
        }

        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        const shareData = {
            shareId: shareId,
            planData: planData,
            createdAt: new Date(),
            isActive: true,
            expiresAt: this.getDefaultExpirationDate(),
            accessCount: 0,
            lastAccessedAt: null
        };

        const shareRef = doc(window.db, 'shared_plans', shareId);
        await setDoc(shareRef, shareData);

        console.log(`Plano compartilhado salvo no Firebase: ${shareId}`);

    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        throw new Error('Não foi possível salvar no Firebase. Verifique sua conexão.');
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

// 7. Copiar ID de compartilhamento
async copyShareId(shareId) {
    try {
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
                this.showMessage(`Copie manualmente: ${shareId}`, 'info');
            }
            
            document.body.removeChild(tempInput);
        }
    } catch (error) {
        this.showMessage(`Erro ao copiar. ID: ${shareId}`, 'warning');
    }
}

// 8. Parar compartilhamento
async stopSharing(planId) {
    if (!confirm('Deseja parar de compartilhar este plano?\nO aluno não conseguirá mais importá-lo.')) {
        return;
    }

    try {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan || !plan.shareId) {
            this.showMessage('Plano não está compartilhado', 'info');
            return;
        }

        this.showMessage('Removendo compartilhamento...', 'info');

        // Desativar no Firebase
        await this.deactivateSharedPlan(plan.shareId);

        // Remover ID local
        delete plan.shareId;
        delete plan.sharedAt;

        // Salvar alterações
        await this.savePlansToStorage();

        // Atualizar interface
        this.renderPlanList();
        this.showMessage('Compartilhamento removido', 'success');

    } catch (error) {
        console.error('Erro ao parar compartilhamento:', error);
        this.showMessage('Erro ao remover compartilhamento', 'error');
    }
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

    // =============================================
    // MÉTODOS STUBS (A IMPLEMENTAR)
    // =============================================


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
        
        // Definir índices atuais
        this.currentWorkoutIndex = workoutIndex;  // Esta linha deve existir
        this.currentExerciseIndex = exerciseIndex;
    
        // Verificar se exercício existe
        if (!this.currentPlan.treinos[workoutIndex] || 
            !this.currentPlan.treinos[workoutIndex].exercicios[exerciseIndex]) {
            this.showMessage('Exercício não encontrado', 'error');
            return;
        }
    
        const exercise = this.currentPlan.treinos[workoutIndex].exercicios[exerciseIndex];
        const workout = this.currentPlan.treinos[workoutIndex];
    
        // Criar e mostrar editor fullscreen
        this.createFullscreenEditor(exercise, workoutIndex, workout);
        
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
                                style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid var(--border-color);">
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
                this.populateExerciseSelect('contextual');
    
                if (currentExercise) {
                    this.setDefaultValues(currentExercise, configuredGroups);
                }
            }, 100);
        } else {
            setTimeout(() => {
                this.populateGroupFilter();
                this.populateExerciseSelect('todos');
    
                if (currentExercise) {
                    this.setDefaultExerciseName(currentExercise);
                }
            }, 100);
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


// =============================================
// CORREÇÃO ESPECÍFICA DO BUG saveInlineExercise()
// =============================================

// MÉTODO saveInlineExercise() ATUAL POR ESTA VERSÃO CORRIGIDA:



// MÉTODO ADICIONAL PARA DEBUG - Adicione este método também:
debugCurrentExercise() {
    if (this.currentWorkoutIndex !== null && this.currentExerciseIndex !== null) {
        const exercise = this.currentPlan.treinos[this.currentWorkoutIndex].exercicios[this.currentExerciseIndex];
        console.log('DEBUG: Estado atual do exercício:', JSON.parse(JSON.stringify(exercise)));
        console.log('DEBUG: Estrutura completa do treino:', JSON.parse(JSON.stringify(this.currentPlan.treinos[this.currentWorkoutIndex])));
    } else {
        console.log('DEBUG: Nenhum exercício selecionado para debug');
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

// FUNÇÃO AUXILIAR PARA DEBUG
debugWorkoutState() {
    console.log('🔍 DEBUG: Estado atual do sistema');
    console.log('currentWorkoutIndex:', this.currentWorkoutIndex);
    console.log('currentExerciseIndex:', this.currentExerciseIndex);
    console.log('currentPlan exists:', !!this.currentPlan);
    console.log('treinos exists:', !!(this.currentPlan && this.currentPlan.treinos));
    console.log('treinos length:', this.currentPlan?.treinos?.length || 0);
    
    if (this.currentWorkoutIndex !== null && this.currentPlan?.treinos) {
        console.log(`workout[${this.currentWorkoutIndex}] exists:`, !!this.currentPlan.treinos[this.currentWorkoutIndex]);
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

// FUNÇÃO AUXILIAR PARA SANITIZAÇÃO DE TEXTO
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

// FUNÇÃO AUXILIAR PARA DEBUG DE EXERCÍCIOS
debugExerciseData(exercicios, workoutIndex) {
    console.log(`🔍 DEBUG: Analisando dados dos exercícios`);
    console.log(`Workout Index: ${workoutIndex}`);
    console.log(`Exercícios recebidos:`, exercicios);
    
    if (!exercicios) {
        console.log(`❌ Exercícios é null/undefined`);
        return;
    }
    
    if (!Array.isArray(exercicios)) {
        console.log(`❌ Exercícios não é um array:`, typeof exercicios);
        return;
    }
    
    console.log(`📊 Total de exercícios: ${exercicios.length}`);
    
    exercicios.forEach((ex, index) => {
        console.log(`📋 Exercício ${index}:`, {
            nome: ex?.nome || 'INDEFINIDO',
            series: ex?.series || 'INDEFINIDO',
            repeticoes: ex?.repeticoes || 'INDEFINIDO',
            carga: ex?.carga || 'INDEFINIDO',
            valido: !!(ex && ex.nome)
        });
    });
}

// 5. MÉTODO DE DEBUG PARA VERIFICAR DADOS
debugExerciseData(workoutIndex, exerciseIndex) {
    console.log('🔍 DEBUG - Estado atual dos dados:');
    console.log('  currentPlan.treinos:', this.currentPlan.treinos.length);
    
    if (this.currentPlan.treinos[workoutIndex]) {
        const workout = this.currentPlan.treinos[workoutIndex];
        console.log(`  Treino ${workoutIndex}:`, {
            nome: workout.nome,
            exercicios: workout.exercicios.length
        });
        
        if (workout.exercicios[exerciseIndex]) {
            const exercise = workout.exercicios[exerciseIndex];
            console.log(`  Exercício ${exerciseIndex}:`, {
                nome: exercise.nome,
                series: exercise.series,
                repeticoes: exercise.repeticoes,
                carga: exercise.carga,
                descricao: exercise.descricao,
                tecnica: exercise.tecnica
            });
        } else {
            console.error(`  ❌ Exercício ${exerciseIndex} não encontrado`);
        }
    } else {
        console.error(`  ❌ Treino ${workoutIndex} não encontrado`);
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



    viewPlan(planId) {
        const plan = this.savedPlans.find(p => p.id == planId);
        if (!plan) {
            this.showMessage('Plano não encontrado', 'error');
            return;
        }
    
        console.log(`Visualizando plano: ${plan.nome} (ID: ${planId})`);
    
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


    editPlan(planId) {
        this.showPlanCreator(planId);
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
                porte: this.core.calculateBodyType(aiData.altura, aiData.peso),
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

// 3. ATUALIZAR generateWorkoutEditor PARA SUPORTAR MAIS DIAS
generateWorkoutEditor(days) {
    const editor = document.getElementById('workoutEditor');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Nomes de treinos expandidos para todos os dias
    const workoutNames = {
        1: ['A - Corpo Inteiro'],
        2: ['A - Membros Superiores', 'B - Membros Inferiores'],
        3: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Pernas e Ombros'],
        4: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Ombros', 'D - Pernas'],
        5: ['A - Peito e Tríceps', 'B - Costas e Bíceps', 'C - Ombros e Trapézio', 'D - Pernas (Quadríceps)', 'E - Posterior e Core'],
        6: ['A - Peito', 'B - Costas', 'C - Ombros', 'D - Braços', 'E - Pernas (Quadríceps)', 'F - Posterior e Core']
    };

    // Validar se temos nomes para todos os dias
    if (!workoutNames[days]) {
        console.error(`Configuração de nomes não encontrada para ${days} dias`);
        return;
    }

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

    // Função para importar configuração de tipos de plano
    importPlanTypeConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);

                // Validar estrutura
                if (!importedConfig.days || !importedConfig.configuration) {
                    throw new Error('Arquivo de configuração inválido');
                }

                // Aplicar configuração importada
                this.planTypeConfiguration.days = importedConfig.days;
                this.planTypeConfiguration.configuration = importedConfig.configuration;

                // Salvar
                this.savePlanTypeConfiguration();

                // Atualizar interface
                this.updatePlanConfigIndicators();

                // Selecionar o tipo de plano correto
                const planTypeBtn = document.querySelector(`.plan-type-btn:nth-child(${importedConfig.days})`);
                if (planTypeBtn) {
                    document.querySelectorAll('.plan-type-btn').forEach(btn => btn.classList.remove('active'));
                    planTypeBtn.classList.add('active');
                    this.selectedDays = importedConfig.days;
                }

                this.showMessage('📥 Configuração importada com sucesso!', 'success');

            } catch (error) {
                console.error('Erro ao importar configuração:', error);
                this.showMessage('❌ Erro ao importar configuração. Verifique o arquivo.', 'error');
            }
        };
        reader.readAsText(file);

        // Limpar input
        event.target.value = '';
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
debugPlanConfiguration() {
    console.log('=== DEBUG: Configuração de Planos ===');
    console.log('Dias selecionados:', this.selectedDays);
    console.log('Dias na configuração:', this.planTypeConfiguration.days);
    console.log('Configuração atual:', JSON.stringify(this.planTypeConfiguration.configuration, null, 2));
    
    // Verificar estado dos elementos HTML
    const configSection = document.getElementById('inlineQuickConfig');
    console.log('Seção inline visível:', configSection?.style.display !== 'none');
    
    // Verificar checkboxes
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="inline-"]');
    console.log(`Total de checkboxes encontrados: ${allCheckboxes.length}`);
    
    allCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            console.log(`Checkbox selecionado: ${checkbox.name} = ${checkbox.value}`);
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

// 1. LOADPLANTYPECONFIGURATION - Carrega configuração de tipos de plano
async loadPlanTypeConfiguration() {
    try {
        console.log('Carregando configuração de tipos de plano...');
        
        // Tentar carregar via Firebase se disponível
        if (this.core && this.core.firebaseConnected) {
            try {
                const firebaseConfig = await this.loadPlanConfigFromFirebase();
                if (firebaseConfig) {
                    this.planTypeConfiguration.days = firebaseConfig.days || 3;
                    this.planTypeConfiguration.configuration = firebaseConfig.configuration || {};
                    console.log('Configuração carregada do Firebase');
                    return;
                }
            } catch (firebaseError) {
                console.warn('Erro ao carregar do Firebase:', firebaseError);
            }
        }

        // Fallback: tentar localStorage
        const stored = localStorage.getItem('jsfitapp_plan_configuration');
        if (stored) {
            const config = JSON.parse(stored);
            this.planTypeConfiguration.days = config.days || 3;
            this.planTypeConfiguration.configuration = config.configuration || {};
            console.log('Configuração carregada do localStorage');
            
            // Migrar para Firebase em background se disponível
            if (this.core && this.core.firebaseConnected) {
                this.migratePlanConfigToFirebase(config);
            }
        } else {
            // Usar configuração padrão
            console.log('Usando configuração padrão');
            this.planTypeConfiguration.days = 3;
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3] || {};
        }
        
    } catch (error) {
        console.error('Erro ao carregar configuração de tipos de plano:', error);
        
        // Fallback final: configuração padrão
        this.planTypeConfiguration.days = 3;
        this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3] || {};
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

 // SUBSTITUA O MÉTODO savePlan() EXISTENTE POR ESTA VERSÃO

async savePlan() {
    try {
        const currentPlanId = document.getElementById('currentPlanId').value;
        const isEditingPlan = this.isEditing && currentPlanId;

        const birthDate = document.getElementById('studentBirthDate')?.value;
        const calculatedAge = birthDate ? this.core.calculateAge(birthDate) : 25;

        const planData = {
            id: isEditingPlan ? currentPlanId : null,
            nome: document.getElementById('planName')?.value || 'Plano sem nome',
            aluno: {
                nome: document.getElementById('studentName')?.value || '',
                dataNascimento: birthDate || '',
                cpf: document.getElementById('studentCpf')?.value || '',
                idade: calculatedAge,
                altura: document.getElementById('studentHeight')?.value || '1,75m',
                peso: document.getElementById('studentWeight')?.value || '75kg'
            },
            dias: this.selectedDays,
            dataInicio: document.getElementById('planStartDate')?.value || new Date().toISOString().split('T')[0],
            dataFim: document.getElementById('planEndDate')?.value || '',
            perfil: {
                idade: calculatedAge,
                altura: document.getElementById('studentHeight')?.value || '1,75m',
                peso: document.getElementById('studentWeight')?.value || '75kg',
                porte: this.core.calculateBodyType(
                    document.getElementById('studentHeight')?.value || '1,75m',
                    document.getElementById('studentWeight')?.value || '75kg'
                ),
                objetivo: document.getElementById('planObjective')?.value || 'Condicionamento geral'
            },
            treinos: [...this.currentPlan.treinos],
            observacoes: {
                geral: document.getElementById('planObservations')?.value || ''
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Validação
        if (!planData.nome || planData.nome === 'Plano sem nome') {
            this.showMessage('Por favor, preencha o nome do plano', 'error');
            return;
        }

        this.showMessage('Salvando plano...', 'info');

        // PRIORIDADE 1: TENTAR SALVAR NO FIREBASE PRIMEIRO
        let firebaseSuccess = false;
        let firebaseId = null;
        
        if (this.core && this.core.firebaseConnected) {
            try {
                console.log('Salvando no Firebase (prioridade 1)...');
                firebaseId = await this.core.savePlanToFirebase(planData);
                planData.id = firebaseId;
                planData.saved_in_firebase = true;
                firebaseSuccess = true;
                console.log('Salvo no Firebase com sucesso:', firebaseId);
                
            } catch (firebaseError) {
                console.error('ERRO Firebase (continuando com localStorage):', firebaseError);
                firebaseSuccess = false;
                
                // Marcar que houve falha no Firebase para retry posterior
                planData.firebase_save_failed = true;
                planData.firebase_error = firebaseError.message;
                planData.retry_firebase = true;
            }
        } else {
            console.warn('Firebase não conectado, usando localStorage apenas');
            planData.firebase_save_failed = true;
            planData.retry_firebase = true;
        }

        // PRIORIDADE 2: BACKUP NO LOCALSTORAGE (SEMPRE EXECUTAR)
        try {
            // Se Firebase falhou, gerar ID local
            if (!firebaseSuccess) {
                if (!planData.id) {
                    planData.id = this.core.generateId();
                }
                planData.saved_in_localstorage_only = true;
            } else {
                planData.saved_in_firebase = true;
                planData.backup_in_localstorage = true;
            }

            // Atualizar lista local
            if (isEditingPlan) {
                const existingIndex = this.savedPlans.findIndex(p => 
                    p.id === planData.id || (currentPlanId && p.id === currentPlanId)
                );
                if (existingIndex >= 0) {
                    this.savedPlans[existingIndex] = planData;
                } else {
                    this.savedPlans.push(planData);
                }
            } else {
                this.savedPlans.push(planData);
            }

            // Salvar backup local
            this.saveToLocalStorageAsBackup();
            
            console.log('Backup local criado');

        } catch (localStorageError) {
            console.error('ERRO CRÍTICO: Falha no backup localStorage:', localStorageError);
            
            if (!firebaseSuccess) {
                // Se ambos falharam, é um erro crítico
                this.showMessage('ERRO CRÍTICO: Não foi possível salvar em nenhum local!', 'error');
                return;
            }
        }

        // SUCESSO: Informar resultado
        this.isEditing = false;
        
        if (firebaseSuccess) {
            this.showMessage('Plano salvo no Firebase com sucesso!', 'success');
        } else {
            this.showMessage('Plano salvo localmente (Firebase indisponível)', 'warning');
            // Agendar retry do Firebase
            this.scheduleFirebaseRetry(planData.id);
        }

        setTimeout(() => {
            this.showPlanList();
        }, 1500);

    } catch (error) {
        console.error('Erro geral ao salvar plano:', error);
        this.showMessage('Erro ao salvar plano. Tente novamente.', 'error');
    }
}


// 2. SAVEPLANTYPECONFIGURATION - Salva configuração de tipos de plano
async savePlanTypeConfiguration() {
    try {
        console.log('Salvando configuração de tipos de plano...');
        
        const configToSave = {
            days: this.planTypeConfiguration.days,
            configuration: this.planTypeConfiguration.configuration,
            savedAt: new Date(),
            version: '1.0'
        };

        // Tentar salvar no Firebase primeiro
        if (this.core && this.core.firebaseConnected) {
            try {
                await this.savePlanConfigToFirebase(configToSave);
                console.log('Configuração salva no Firebase');
            } catch (firebaseError) {
                console.warn('Erro ao salvar no Firebase:', firebaseError);
            }
        }

        // Backup local sempre
        try {
            localStorage.setItem('jsfitapp_plan_configuration', JSON.stringify({
                days: configToSave.days,
                configuration: configToSave.configuration,
                savedAt: configToSave.savedAt.toISOString()
            }));
            console.log('Configuração salva localmente');
        } catch (localError) {
            console.error('Erro ao salvar localmente:', localError);
        }
        
    } catch (error) {
        console.error('Erro geral ao salvar configuração:', error);
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

// 3. POPULATECONTEXTUALGROUPFILTER - Popular filtro contextual de grupos
populateContextualGroupFilter(configuredGroups, workout) {
    const groupFilter = document.getElementById('exerciseGroupFilter');
    if (!groupFilter) {
        console.warn('Elemento exerciseGroupFilter não encontrado');
        return;
    }

    console.log(`Populando filtro contextual com ${configuredGroups.length} grupos para treino ${workout.id}`);

    // Limpar opções existentes
    groupFilter.innerHTML = '';

    // Opção para todos os grupos do treino atual
    const allWorkoutGroupsOption = document.createElement('option');
    allWorkoutGroupsOption.value = 'contextual';
    allWorkoutGroupsOption.textContent = `Todos os grupos do treino ${workout.id}`;
    groupFilter.appendChild(allWorkoutGroupsOption);

    // Adicionar grupos configurados individualmente
    configuredGroups.forEach(groupId => {
        const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
        if (group) {
            const option = document.createElement('option');
            option.value = group.id.toLowerCase();
            option.textContent = `${group.icon} ${group.name}`;
            groupFilter.appendChild(option);
        }
    });

    // Separador visual
    if (configuredGroups.length > 0) {
        const separatorOption = document.createElement('option');
        separatorOption.disabled = true;
        separatorOption.textContent = '─────────────────';
        groupFilter.appendChild(separatorOption);
    }

    // Opção para ver todos os grupos disponíveis
    const allGroupsOption = document.createElement('option');
    allGroupsOption.value = 'todos';
    allGroupsOption.textContent = 'Ver todos os grupos disponíveis';
    groupFilter.appendChild(allGroupsOption);

    // Selecionar contextual por padrão
    groupFilter.value = 'contextual';
    
    // Mostrar informação contextual
    this.showContextualFilterInfo(workout, configuredGroups);
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

// =============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================

// Criar instância global
const app = new PersonalApp();

// Initialize app when page loads

document.addEventListener('DOMContentLoaded', async function () {
    await app.init();
});


// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init.bind(app));
} else {
    app.init();
}