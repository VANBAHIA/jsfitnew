// =============================================
// JS FIT APP - PERSONAL TRAINER SYSTEM
// Sistema Completo de Criação de Planos de Treino
// Compatível com formato JSON padronizado
// =============================================

const app = {
    // =============================================
    // CONFIGURAÇÕES E CONSTANTES
    // =============================================
    
    // Configuração da API para compartilhamento
    apiConfig: {
        baseUrl: 'https://jsfitapp.netlify.app/api',
        timeout: 10000,
        retries: 3,
        endpoints: {
            shareWorkout: '/share-workout',
            health: '/health'
        }
    },

    // Estado do compartilhamento
    sharingState: {
        isSharing: false,
        currentShareId: null,
        lastSharedPlan: null
    },

    exerciseDatabase: [], // Array que será carregado do DATABASE.JSON
    exerciseDatabaseLoaded: false, // Flag para controlar se foi carregado
    
    // Manter a base hardcoded como fallback
    exerciseDatabaseFallback: {
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
        // =============================================
// CONFIGURAÇÕES DE TIPOS DE PLANO
// =============================================
planTypeConfiguration: {
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
        { id: 'ombro', name: 'OMBRO', icon: '👐' },
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
},
        ombros: {
            iniciante: [
                { nome: 'Desenvolvimento com Halteres', series: 3, repeticoes: '10-12', carga: '8kg cada', descricao: 'Exercício básico para ombros' },
                { nome: 'Elevação Lateral', series: 3, repeticoes: '12-15', carga: '4kg cada', descricao: 'Isolamento do deltoide medial' }
            ]
        }
    },

    // =============================================
    // BASE DE DADOS DE TÉCNICAS AVANÇADAS
    // =============================================

    tecnicasDatabase: {
        'pre-exaustao': 'Exercício de isolamento antes do composto para pré-fadigar o músculo alvo',
        'pos-exaustao': 'Exercício de isolamento após o composto para finalizar o músculo',
        'bi-set': 'Dois exercícios executados em sequência sem descanso',
        'tri-set': 'Três exercícios executados em sequência sem descanso',
        'drop-set': 'Redução progressiva da carga na mesma série',
        'rest-pause': 'Pause breves durante a série para completar mais repetições',
        'serie-queima': 'Repetições parciais no final da série até a falha',
        'tempo-controlado': 'Execução lenta e controlada (3-4 segundos na fase excêntrica)',
        'pausa-contracao': 'Pausa de 1-2 segundos na contração máxima',
        'unilateral-alternado': 'Execução alternada entre membros',
        'piramide-crescente': 'Aumento progressivo da carga a cada série',
        'piramide-decrescente': 'Diminuição progressiva da carga a cada série',
        'clusters': 'Séries divididas em mini-séries com pausas curtas',
        'negativas': 'Enfase na fase excêntrica do movimento',
        'isometrico': 'Contração muscular sem movimento articular',
        'metodo-21': 'Série de 21 repetições (7 parciais + 7 parciais + 7 completas)',
        'onda': 'Variação de repetições em padrão ondulatório',
        'strip-set': 'Redução de carga sem pausa entre as mudanças'
    },

    // Técnicas por nível de experiência
    tecnicasPorNivel: {
        iniciante: ['tempo-controlado', 'pausa-contracao'],
        intermediario: ['pre-exaustao', 'pos-exaustao', 'drop-set', 'bi-set', 'tempo-controlado', 'pausa-contracao'],
        avancado: ['pre-exaustao', 'pos-exaustao', 'bi-set', 'tri-set', 'drop-set', 'rest-pause', 'serie-queima', 'clusters', 'negativas', 'metodo-21', 'strip-set']
    },

    // =============================================
    // CONFIGURAÇÃO DE GIFS
    // =============================================

    gifConfig: {
        basePath: '/images/',
        dimensions: '300x300',
        format: 'gif',
        
        // Função para obter GIF por código
        getGifByCodigo: function(codigo) {
            return `${this.basePath}${codigo}.${this.format}`;
        },
        
        // Função para exerciseDescriptions por código
        findExerciseByCodigo: function(codigo) {
            for (const muscleGroup in exerciseDatabase) {
                for (const level in exerciseDatabase[muscleGroup]) {
                    const exercise = exerciseDatabase[muscleGroup][level]
                        .find(ex => ex.codigo === codigo);
                    if (exercise) return exercise;
                }
            }
            return null;
        },
        
        // Função para listar todos os códigos
        getAllCodigos: function() {
            const codigos = [];
            for (const muscleGroup in exerciseDatabase) {
                for (const level in exerciseDatabase[muscleGroup]) {
                    exerciseDatabase[muscleGroup][level].forEach(exercise => {
                        codigos.push(exercise.codigo);
                    });
                }
            }
            return codigos.sort();
        }
    },

    // =============================================
    // DESCRIÇÕES DE EXERCÍCIOS (mantidas)
    // =============================================

    exerciseDescriptions: {
        'Supino Reto com Barra': 'Exercício fundamental para desenvolvimento do peitoral. Deitado no banco, segure a barra com pegada média, desça controladamente até o peito e empurre para cima.',
        'Supino Inclinado com Barra': 'Trabalha a parte superior do peitoral. Banco inclinado entre 30-45°, mesma execução do supino reto.',
        'Supino Declinado com Barra': 'Foco no peitoral inferior. Banco declinado, pés presos, execução similar ao supino reto.',
        'Supino com Halteres': 'Maior amplitude de movimento que a barra. Deitado no banco, empurre halteres para cima, controle a descida.',
        'Supino Inclinado com Halteres': 'Versão inclinada com halteres. Permite rotação dos punhos para melhor ativação muscular.',
        'Crucifixo com Halteres': 'Isolamento do peitoral. Movimento de abraço, mantenha cotovelos levemente flexionados.',
        'Crucifixo Inclinado': 'Versão inclinada do crucifixo, trabalha fibras superiores do peitoral.',
        'Crossover': 'Exercício no cabo, movimento cruzado. Excelente para definição e contração muscular.',
        'Flexão de Braços': 'Exercício básico de peso corporal. Mantenha corpo alinhado, desça até quase tocar o peito no solo.',
        'Mergulho em Paralelas': 'Exercício composto. Nas paralelas, desça flexionando os cotovelos, suba controladamente.',
        
        'Puxada Frontal': 'Exercício básico para latíssimo. Puxe a barra até o peito, retraia as escápulas.',
        'Puxada Atrás da Nuca': 'Variação da puxada, cuidado com a amplitude para evitar lesões no ombro.',
        'Barra Fixa': 'Exercício funcional clássico. Pegada pronada, puxe até o queixo passar da barra.',
        'Remada Baixa': 'Exercício sentado no cabo. Puxe até o abdômen, mantenha tronco ereto.',
        'Remada Curvada': 'Tronco inclinado, reme a barra até o abdômen. Mantenha lombar neutra.',
        'Remada com Halter': 'Unilateral, apoie no banco. Reme o halter até o quadril, cotovelo próximo ao corpo.',
        'Remada T-Bar': 'Exercício específico para espessura das costas. Use a máquina ou barra T.',
        'Levantamento Terra': 'Exercício complexo e completo. Técnica perfeita é essencial para evitar lesões.',
        'Pullover': 'Movimento arqueado, trabalha latíssimo e serrátil. Pode ser feito com halter ou barra.',
        
        'Desenvolvimento com Barra': 'Exercício base para ombros. Pode ser feito pela frente ou atrás da nuca.',
        'Desenvolvimento com Halteres': 'Versão com halteres, maior estabilização. Trajetória ligeiramente frontal.',
        'Desenvolvimento Arnold': 'Criado por Arnold Schwarzenegger. Combina rotação com desenvolvimento.',
        'Elevação Lateral': 'Isolamento do deltoide medial. Eleve os halteres até a linha dos ombros.',
        'Elevação Frontal': 'Trabalha deltoide anterior. Eleve à frente até a linha dos ombros.',
        'Elevação Posterior': 'Para deltoide posterior. Pode ser feito inclinado ou na polia.',
        'Encolhimento': 'Para trapézio. "Encolha" os ombros carregando peso.',
        'Face Pull': 'Exercício no cabo, puxe até o rosto. Excelente para postura e ombros posteriores.',
        
        'Rosca Direta': 'Exercício básico para bíceps. Pegada supinada, cotovelos fixos.',
        'Rosca Alternada': 'Versão alternada da rosca. Permite melhor concentração em cada braço.',
        'Rosca Martelo': 'Pegada neutra, trabalha bíceps e braquiorradial.',
        'Rosca Scott': 'No banco Scott, isolamento máximo do bíceps.',
        'Rosca Concentrada': 'Sentado, cotovelo apoiado na coxa. Máxima concentração.',
        'Rosca 21': 'Método especial: 7 parciais inferiores + 7 superiores + 7 completas.',
        'Rosca Spider': 'No banco inclinado invertido, isolamento total.',
        'Rosca no Cabo': 'Versão no cabo, tensão constante durante todo movimento.',
        
        'Tríceps Testa': 'Clássico para tríceps. Flexione apenas antebraços, cotovelos fixos.',
        'Tríceps Francês': 'Com halter atrás da cabeça. Movimento apenas dos antebraços.',
        'Tríceps Pulley': 'No cabo, extensão dos antebraços. Pegada pronada.',
        'Tríceps Corda': 'Com corda, permite abertura na contração final.',
        'Supino Fechado': 'Pegada fechada no supino, trabalha tríceps intensamente.',
        'Mergulho no Banco': 'Mãos no banco, exercício funcional básico.',
        
        'Agachamento Livre': 'Rei dos exercícios. Técnica perfeita é fundamental.',
        'Agachamento Frontal': 'Barra na frente, maior ativação do core e quadríceps.',
        'Leg Press': 'Exercício seguro para iniciantes, permite cargas altas.',
        'Extensão de Pernas': 'Isolamento do quadríceps, evite hiperextensão.',
        'Afundo': 'Exercício unilateral, trabalha equilíbrio e coordenação.',
        'Agachamento Búlgaro': 'Versão avançada do afundo, pé traseiro elevado.',
        'Hack Squat': 'Na máquina específica, movimento guiado e seguro.',
        
        'Stiff': 'Para posterior de coxa. Flexione quadril, joelhos levemente flexionados.',
        'Flexão de Pernas': 'Isolamento dos isquiotibiais. Contração forte no topo.',
        'Mesa Flexora': 'Versão deitada da flexão de pernas.',
        'Good Morning': 'Exercício técnico, flexão apenas do quadril.',
        'Hip Thrust': 'Excelente para glúteos, ombros apoiados no banco.',
        'Elevação Pélvica': 'Versão básica do hip thrust, no solo.',
        
        'Panturrilha em Pé': 'Para gastrocnêmio, pernas estendidas.',
        'Panturrilha Sentado': 'Para sóleo, joelhos flexionados.',
        'Panturrilha no Leg Press': 'Variação no leg press, apenas dedos na plataforma.',
        
        'Esteira': 'Aquecimento cardiovascular básico. 5-10 minutos em ritmo moderado.',
        'Bicicleta': 'Aquecimento para membros inferiores. Baixa intensidade inicial.',
        'Elíptico': 'Exercício completo de baixo impacto. Bom para aquecimento geral.',
        'Aquecimento Articular': 'Movimentos articulares específicos para preparar o corpo.',
        'Alongamento': 'Essencial para flexibilidade e recuperação muscular.'
    },

    // =============================================
    // ESTADO DA APLICAÇÃO
    // =============================================
    
    currentPlan: {
        id: null,
        nome: '',
        aluno: { nome: '', idade: 25, altura: '1,75m', peso: '75kg' },
        dias: 1,
        dataInicio: '',
        dataFim: '',
        perfil: { objetivo: 'Hipertrofia e ganho de massa muscular' },
        observacoes: {},
        treinos: []
    },

    savedPlans: [],
    currentExerciseIndex: null,
    currentWorkoutIndex: null,
    selectedDays: 1,
    isEditing: false,

    // =============================================
    // INICIALIZAÇÃO DA APLICAÇÃO
    // =============================================

    async init() {
        console.log('🚀 Inicializando JS Fit Personal App...');
        
        // Carregar configurações básicas
        this.loadSavedPlans();
        this.setDefaultDates();
        this.setupEventListeners();
        
        // NOVO: Carregar configuração de tipos de plano
        this.loadPlanTypeConfiguration();
        
        // Carregar base de exercícios
        console.log('📄 Iniciando carregamento da base de exercícios...');
        await this.loadExerciseDatabase();
        
        // Popular select inicial
        this.populateExerciseSelect();
        
        // Mostrar interface
        this.showPlanList();
        
        // Verificar API de compartilhamento em background
        this.checkAPIStatus().then(status => {
            console.log('Status da API de compartilhamento:', status ? 'Online' : 'Offline');
        }).catch(() => {
            console.log('API de compartilhamento não disponível');
        });
        
        // Atualizar indicadores visuais de configuração
        setTimeout(() => {
            this.updatePlanConfigIndicators();
        }, 100);
        
        console.log('✅ Aplicação inicializada com sucesso');
    },

    setupEventListeners() {
        // Close modal when clicking outside
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

        // NOVO: Observer para modal de exercício
        const exerciseModal = document.getElementById('exerciseModal');
        if (exerciseModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (exerciseModal.classList.contains('active')) {
                            // Aguardar um pouco para garantir que o modal esteja visível
                            setTimeout(() => {
                                this.populateGroupFilter();      // NOVO
                                this.populateExerciseSelect();
                            }, 100);
                        }
                    }
                });
            });
            observer.observe(exerciseModal, { attributes: true });
        }
    },

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
    },

    // =============================================
// FUNÇÕES COMPLEMENTARES PARA INTEGRAÇÃO
// Adicione estas funções ao seu app object em personal.js
// =============================================

// Inicialização atualizada (substitua a função init existente)
async init() {
    console.log('🚀 Inicializando JS Fit Personal App...');
    
    // Carregar configurações básicas
    this.loadSavedPlans();
    this.setDefaultDates();
    this.setupEventListeners();
    
    // NOVO: Carregar configuração de tipos de plano
    this.loadPlanTypeConfiguration();
    
    // Carregar base de exercícios
    console.log('📄 Iniciando carregamento da base de exercícios...');
    await this.loadExerciseDatabase();
    
    // Popular select inicial
    this.populateExerciseSelect();
    
    // Mostrar interface
    this.showPlanList();
    
    // Verificar API de compartilhamento em background
    this.checkAPIStatus().then(status => {
        console.log('Status da API de compartilhamento:', status ? 'Online' : 'Offline');
    }).catch(() => {
        console.log('API de compartilhamento não disponível');
    });
    
    // Atualizar indicadores visuais de configuração
    setTimeout(() => {
        this.updatePlanConfigIndicators();
    }, 100);
    
    console.log('✅ Aplicação inicializada com sucesso');
},

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
},

// Modal de configuração rápida (alternativa mais simples)
showQuickPlanConfigModal() {
    const existingModal = document.getElementById('quickPlanConfigModal');
    if (!existingModal) {
        console.error('Modal de configuração rápida não encontrado');
        return;
    }

    const content = document.getElementById('quickConfigContent');
    if (!content) return;

    const days = this.selectedDays || this.planTypeConfiguration.days;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    let html = '<div class="quick-config-grid">';
    
    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter] || { name: `Treino ${letter}`, groups: [] };
        
        html += `
            <div class="quick-config-item">
                <h4>Treino ${letter}</h4>
                <input type="text" 
                       class="form-input" 
                       placeholder="Nome do treino"
                       value="${config.name}"
                       onchange="app.updateQuickConfigName('${letter}', this.value)"
                       style="margin-bottom: 15px;">
                <div class="quick-muscle-groups">
                    ${this.planTypeConfiguration.muscleGroups.map(group => `
                        <label class="quick-muscle-check">
                            <input type="checkbox" 
                                   name="quick-${letter}" 
                                   value="${group.id}"
                                   ${config.groups.includes(group.id) ? 'checked' : ''}
                                   onchange="app.updateQuickConfigGroups()">
                            <span>${group.icon} ${group.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
    existingModal.classList.add('active');
},

// Atualizar nome na configuração rápida
updateQuickConfigName(letter, name) {
    if (!this.planTypeConfiguration.configuration[letter]) {
        this.planTypeConfiguration.configuration[letter] = { name: '', groups: [] };
    }
    this.planTypeConfiguration.configuration[letter].name = name;
},

// Atualizar grupos na configuração rápida
updateQuickConfigGroups() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const days = this.selectedDays || this.planTypeConfiguration.days;
    
    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const checkboxes = document.querySelectorAll(`input[name="quick-${letter}"]:checked`);
        const selectedGroups = Array.from(checkboxes).map(cb => cb.value);
        
        if (!this.planTypeConfiguration.configuration[letter]) {
            this.planTypeConfiguration.configuration[letter] = { name: `Treino ${letter}`, groups: [] };
        }
        this.planTypeConfiguration.configuration[letter].groups = selectedGroups;
    }
},

// Salvar configuração rápida
saveQuickPlanConfig() {
    // Validar se todos os treinos têm pelo menos um grupo
    const letters = Object.keys(this.planTypeConfiguration.configuration);
    let isValid = true;
    let emptyWorkouts = [];

    letters.forEach(letter => {
        const config = this.planTypeConfiguration.configuration[letter];
        if (!config.groups || config.groups.length === 0) {
            isValid = false;
            emptyWorkouts.push(letter);
        }
    });

    if (!isValid) {
        this.showMessage(`⚠️ Os treinos ${emptyWorkouts.join(', ')} não têm grupos musculares selecionados!`, 'warning');
        return;
    }

    // Salvar configuração
    this.savePlanTypeConfiguration();
    
    // Fechar modal
    this.closeQuickPlanConfigModal();
    
    // Gerar treinos baseado na configuração
    this.generateWorkoutEditorWithConfig(this.planTypeConfiguration.days);
    
    // Atualizar indicadores
    this.updatePlanConfigIndicators();
    
    this.showMessage('✅ Configuração aplicada e treinos gerados!', 'success');
},

// Fechar modal de configuração rápida
closeQuickPlanConfigModal() {
    const modal = document.getElementById('quickPlanConfigModal');
    if (modal) {
        modal.classList.remove('active');
    }
},

// Função selectPlanType atualizada (substitua a existente)
selectPlanType(days, letters, element) {
    // Remove active de todos os botões
    document.querySelectorAll('.plan-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adiciona active ao botão clicado
    element.classList.add('active');
    
    this.selectedDays = days;
    this.planTypeConfiguration.days = days;
    
    // Se não há configuração para este número de dias, usar padrão
    const currentConfig = Object.keys(this.planTypeConfiguration.configuration).length;
    if (currentConfig === 0 || this.planTypeConfiguration.days !== days) {
        this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[days] || {};
        this.planTypeConfiguration.days = days;
    }
    
    // Mostrar modal de configuração
    this.showPlanTypeConfigModal();
},

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
},

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
},

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
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `plan_configuration_${config.days}dias.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showMessage('📤 Configuração exportada com sucesso!', 'success');
},

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
},

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
},

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
},

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
},

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
},

// Função para aplicar sugestão de configuração
applySuggestedConfiguration(suggestion) {
    if (!suggestion || !suggestion.config) return;
    
    this.planTypeConfiguration.configuration = { ...suggestion.config };
    this.savePlanTypeConfiguration();
    this.updatePlanConfigIndicators();
    
    this.showMessage(`✅ Configuração "${suggestion.name}" aplicada!`, 'success');
},


    setDefaultDates() {
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6);
        
        const startInput = document.getElementById('planStartDate');
        const endInput = document.getElementById('planEndDate');
        
        if (startInput) startInput.value = today.toISOString().split('T')[0];
        if (endInput) endInput.value = endDate.toISOString().split('T')[0];
    },

    // =============================================
    // CARREGAMENTO DA BASE DE EXERCÍCIOS
    // =============================================

    async loadExerciseDatabase() {
        try {
            console.log('📄 Carregando base de dados de exercícios...');
            
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
            this.exerciseDatabaseLoaded = true;
            console.log(`✅ ${data.length} exercícios carregados com sucesso`);
            
            // Mostrar estatísticas
            this.logDatabaseStats();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao carregar DATABASE.JSON:', error);
            
            // Fallback: usar base hardcoded
            console.warn('🔄 Usando base de exercícios hardcoded como fallback');
            this.exerciseDatabase = this.convertHardcodedToArray();
            this.exerciseDatabaseLoaded = false;
            
            // Mostrar notificação para o usuário
            this.showMessage(
                '⚠️ Erro ao carregar base de exercícios atualizada. Usando dados locais.',
                'warning'
            );
            
            return false;
        }
    },

    // Converter base hardcoded para formato array
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
    },

    // Mostrar estatísticas da base
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
    },

    // =============================================
    // MÉTODOS DE BUSCA NA BASE DINÂMICA
    // =============================================

    // Buscar exercícios por grupo e nível
    getExercisesByGroupAndLevel(grupo, nivel) {
        if (!this.exerciseDatabaseLoaded || this.exerciseDatabase.length === 0) {
            // Fallback para base hardcoded
            return this.exerciseDatabaseFallback[grupo]?.[nivel] || [];
        }
        
        return this.exerciseDatabase.filter(ex => 
            ex.grupo.toLowerCase() === grupo.toLowerCase() &&
            (ex.nivel?.toLowerCase() === nivel.toLowerCase() || !ex.nivel)
        );
    },

    // Buscar exercício por nome
    findExerciseByName(exerciseName) {
        if (!this.exerciseDatabaseLoaded || this.exerciseDatabase.length === 0) {
            return null;
        }

        const normalizedName = exerciseName.trim().toLowerCase();
        
        return this.exerciseDatabase.find(exercise => 
            exercise.nome.toLowerCase() === normalizedName
        );
    },

    // Buscar todos os grupos disponíveis
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
    },

    // Obter GIF do exercício
    getExerciseGif(exerciseName) {
        const exercise = this.findExerciseByName(exerciseName);
        return exercise ? exercise.Column4 : null;
    },

    // Verificar se exercício existe
    exerciseExists(exerciseName) {
        return this.findExerciseByName(exerciseName) !== null;
    },

    // =============================================
    // SISTEMA DE FILTRO POR GRUPO MUSCULAR
    // =============================================

    // Popular filtro de grupos musculares
    populateGroupFilter() {
        const groupFilter = document.getElementById('exerciseGroupFilter');
        if (!groupFilter) return;
        
        console.log('🎯 Populando filtro de grupos...');
        
        // Salvar valor atual
        const currentValue = groupFilter.value;
        
        // Limpar opções (exceto "todos")
        groupFilter.innerHTML = '<option value="todos">📋 Todos os Grupos</option>';
        
        if (this.exerciseDatabaseLoaded && this.exerciseDatabase.length > 0) {
            // Obter grupos únicos da base dinâmica
            const groups = [...new Set(this.exerciseDatabase.map(ex => ex.grupo))].filter(Boolean).sort();
            
            groups.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.toLowerCase();
                option.textContent = `💪 ${this.capitalizeFirstLetter(grupo)}`;
                groupFilter.appendChild(option);
            });
            
            console.log(`✅ ${groups.length} grupos carregados no filtro`);
        } else {
            // Fallback para base hardcoded
            const groups = Object.keys(this.exerciseDatabaseFallback || {});
            groups.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.toLowerCase();
                option.textContent = `💪 ${this.capitalizeFirstLetter(grupo)}`;
                groupFilter.appendChild(option);
            });
        }
        
        // Adicionar opção de carregamento se necessário
        if (!this.exerciseDatabaseLoaded) {
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.disabled = true;
            loadingOption.textContent = '⏳ Carregando grupos...';
            groupFilter.appendChild(loadingOption);
        }
        
        // Restaurar valor se ainda existe
        if (currentValue && currentValue !== '') {
            const optionExists = Array.from(groupFilter.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                groupFilter.value = currentValue;
            }
        }
    },

    // Filtrar exercícios por grupo selecionado
    filterExercisesByGroup() {
        const groupFilter = document.getElementById('exerciseGroupFilter');
        const selectedGroup = groupFilter ? groupFilter.value : 'todos';
        
        console.log(`🔍 Filtrando exercícios por grupo: ${selectedGroup}`);
        
        // Atualizar select de exercícios baseado no filtro
        this.populateExerciseSelect(selectedGroup);
    },

    // Popular select de exercícios com filtro opcional
    populateExerciseSelect(filterGroup = 'todos') {
        const exerciseSelect = document.getElementById('exerciseName');
        if (!exerciseSelect) return;
        
        console.log(`🔄 Populando select de exercícios (filtro: ${filterGroup})...`);
        
        // Salvar opção custom e valor atual
        const currentValue = exerciseSelect.value;
        
        // Limpar todas as opções
        exerciseSelect.innerHTML = '';
        
        // Recriar opção custom
        const newCustomOption = document.createElement('option');
        newCustomOption.value = 'custom';
        newCustomOption.textContent = '✏️ Exercício Personalizado';
        exerciseSelect.appendChild(newCustomOption);
        
        if (this.exerciseDatabaseLoaded && this.exerciseDatabase.length > 0) {
            // Filtrar exercícios baseado no grupo selecionado
            let exercisesToShow = this.exerciseDatabase;
            
            if (filterGroup && filterGroup !== 'todos') {
                exercisesToShow = this.exerciseDatabase.filter(ex => 
                    ex.grupo && ex.grupo.toLowerCase() === filterGroup.toLowerCase()
                );
            }
            
            if (filterGroup === 'todos') {
                // Mostrar agrupado quando "todos" estiver selecionado
                const groupedExercises = {};
                exercisesToShow.forEach(ex => {
                    const grupo = ex.grupo || 'Outros';
                    if (!groupedExercises[grupo]) {
                        groupedExercises[grupo] = [];
                    }
                    groupedExercises[grupo].push(ex);
                });
                
                // Ordenar grupos
                const sortedGroups = Object.keys(groupedExercises).sort();
                
                sortedGroups.forEach(grupo => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = this.capitalizeFirstLetter(grupo);
                    
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
                // Mostrar apenas exercícios do grupo selecionado (sem agrupamento)
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
            
            console.log(`✅ ${exercisesToShow.length} exercícios carregados (filtro: ${filterGroup})`);
            
        } else {
            console.warn('⚠️ Base dinâmica não disponível, usando fallback hardcoded');
            
            // Fallback para base hardcoded com filtro
            if (filterGroup === 'todos') {
                // Mostrar todos os grupos
                Object.entries(this.exerciseDatabaseFallback || {}).forEach(([grupo, niveis]) => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = this.capitalizeFirstLetter(grupo);
                    
                    const allExercises = [];
                    Object.values(niveis).forEach(exercicios => {
                        allExercises.push(...exercicios);
                    });
                    
                    const uniqueExercises = allExercises.filter((ex, index, arr) => 
                        arr.findIndex(item => item.nome === ex.nome) === index
                    );
                    
                    uniqueExercises.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                    
                    uniqueExercises.forEach(ex => {
                        const option = document.createElement('option');
                        option.value = ex.nome;
                        option.textContent = ex.nome;
                        optgroup.appendChild(option);
                    });
                    
                    exerciseSelect.appendChild(optgroup);
                });
            } else {
                // Mostrar apenas grupo específico
                const groupData = this.exerciseDatabaseFallback[filterGroup];
                if (groupData) {
                    const allExercises = [];
                    Object.values(groupData).forEach(exercicios => {
                        allExercises.push(...exercicios);
                    });
                    
                    const uniqueExercises = allExercises.filter((ex, index, arr) => 
                        arr.findIndex(item => item.nome === ex.nome) === index
                    );
                    
                    uniqueExercises.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                    
                    uniqueExercises.forEach(ex => {
                        const option = document.createElement('option');
                        option.value = ex.nome;
                        option.textContent = ex.nome;
                        exerciseSelect.appendChild(option);
                    });
                }
            }
        }
        
        // Adicionar opção de carregamento se necessário
        if (!this.exerciseDatabaseLoaded) {
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.disabled = true;
            loadingOption.textContent = '⏳ Aguardando carregamento da base...';
            exerciseSelect.appendChild(loadingOption);
        }
        
        // Restaurar valor anterior se ainda existe
        if (currentValue && currentValue !== '') {
            const optionExists = Array.from(exerciseSelect.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                exerciseSelect.value = currentValue;
            }
        }
        
        // Atualizar indicador de status
        this.updateExerciseSelectStatus(filterGroup);
    },

    // Atualizar status com informação do filtro
    updateExerciseSelectStatus(filterGroup = 'todos') {
        const statusElement = document.getElementById('exerciseSelectStatus');
        const countElement = document.getElementById('exerciseCount');
        
        if (!statusElement || !countElement) return;
        
        if (this.exerciseDatabaseLoaded && this.exerciseDatabase.length > 0) {
            let exerciseCount = this.exerciseDatabase.length;
            let groupCount = this.getAllExerciseGroups().length;
            
            // Calcular contagem filtrada
            if (filterGroup && filterGroup !== 'todos') {
                const filteredExercises = this.exerciseDatabase.filter(ex => 
                    ex.grupo && ex.grupo.toLowerCase() === filterGroup.toLowerCase()
                );
                exerciseCount = filteredExercises.length;
                groupCount = 1;
            }
            
            statusElement.className = 'form-hint success';
            if (filterGroup === 'todos') {
                countElement.textContent = `✅ ${exerciseCount} exercícios em ${groupCount} grupos`;
            } else {
                const groupName = this.capitalizeFirstLetter(filterGroup);
                countElement.textContent = `🎯 ${exerciseCount} exercícios de ${groupName}`;
            }
        } else if (this.exerciseDatabase.length > 0) {
            statusElement.className = 'form-hint';
            countElement.textContent = `📚 ${this.exerciseDatabase.length} exercícios (fallback)`;
        } else {
            statusElement.className = 'form-hint loading';
            countElement.textContent = '⏳ Carregando exercícios...';
        }
    },

    // Função auxiliar para capitalizar primeira letra
    capitalizeFirstLetter(string) {
        const exceptions = {
            'biceps': 'Bíceps',
            'triceps': 'Tríceps',
            'quadriceps': 'Quadríceps',
            'panturrilha': 'Panturrilha'
        };
        
        return exceptions[string.toLowerCase()] || 
               string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    },

    // =============================================
    // FUNÇÕES DE API E COMPARTILHAMENTO
    // =============================================

    // Verificar status da API
    async checkAPIStatus() {
        try {
            const response = await this.makeAPIRequest(`${this.apiConfig.baseUrl}${this.apiConfig.endpoints.health}`);
            return response.ok;
        } catch (error) {
            console.error('Erro ao verificar API:', error);
            return false;
        }
    },

    // Fazer requisições para API
    async makeAPIRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout na conexão com servidor');
            }
            throw error;
        }
    },

    // Gerar ID único de 6 caracteres
    generateShareId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Compartilhar plano
    async sharePlan(planId) {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) {
            this.showMessage('Plano não encontrado', 'error');
            return;
        }

        // Verificar se API está disponível
        const apiAvailable = await this.checkAPIStatus();
        
        this.sharingState.isSharing = true;
        this.showMessage('Preparando plano para compartilhamento...', 'info');

        try {
            // Gerar ID único
            const shareId = this.generateShareId();
            
            // Preparar dados para compartilhamento
            const shareData = {
                shareId: shareId,
                plan: {
                    ...plan,
                    sharedAt: new Date().toISOString(),
                    sharedBy: 'personal_trainer'
                }
            };

            if (apiAvailable) {
                try {
                    const response = await this.makeAPIRequest(
                        `${this.apiConfig.baseUrl}${this.apiConfig.endpoints.shareWorkout}`,
                        {
                            method: 'POST',
                            body: JSON.stringify(shareData)
                        }
                    );

                    if (response.ok) {
                        this.saveSharedPlanLocally(shareId, shareData.plan);
                        this.sharingState.currentShareId = shareId;
                        this.sharingState.lastSharedPlan = plan;
                        this.showShareSuccessModal(shareId, 'server');
                        this.showMessage('✅ Plano compartilhado com sucesso no servidor!', 'success');
                        return;
                    } else {
                        throw new Error(`Erro do servidor: ${response.status}`);
                    }
                } catch (serverError) {
                    console.warn('Falha no servidor, usando armazenamento local:', serverError);
                    this.saveSharedPlanLocally(shareId, shareData.plan);
                    this.sharingState.currentShareId = shareId;
                    this.sharingState.lastSharedPlan = plan;
                    this.showShareSuccessModal(shareId, 'local');
                    this.showMessage('⚠️ Plano compartilhado localmente (servidor indisponível)', 'warning');
                }
            } else {
                this.saveSharedPlanLocally(shareId, shareData.plan);
                this.sharingState.currentShareId = shareId;
                this.sharingState.lastSharedPlan = plan;
                this.showShareSuccessModal(shareId, 'local');
                this.showMessage('⚠️ Plano compartilhado localmente (servidor offline)', 'warning');
            }

        } catch (error) {
            console.error('Erro ao compartilhar plano:', error);
            this.showMessage('❌ Erro ao compartilhar plano: ' + error.message, 'error');
        } finally {
            this.sharingState.isSharing = false;
        }
    },

    // Salvar plano compartilhado localmente
    saveSharedPlanLocally(shareId, planData) {
        try {
            const sharedPlans = this.getSharedPlansFromStorage();
            sharedPlans[shareId] = planData;
            localStorage.setItem('jsfitapp_shared_plans', JSON.stringify(sharedPlans));
            console.log(`Plano ${shareId} salvo localmente`);
        } catch (error) {
            console.error('Erro ao salvar plano localmente:', error);
            throw new Error('Falha ao salvar plano localmente');
        }
    },

    // Obter planos compartilhados do localStorage
    getSharedPlansFromStorage() {
        try {
            const stored = localStorage.getItem('jsfitapp_shared_plans');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Erro ao carregar planos compartilhados:', error);
            return {};
        }
    },

    // Mostrar modal de sucesso do compartilhamento
    showShareSuccessModal(shareId, source) {
        const existingModal = document.getElementById('shareSuccessModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'shareSuccessModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content share-success-modal">
                <div class="modal-header">
                    <h2>🎉 Plano Compartilhado com Sucesso!</h2>
                    <button class="close-btn" onclick="app.closeShareModal()">&times;</button>
                </div>
                <div class="share-success-content">
                    <div class="share-id-display">
                        <h3>ID do Plano:</h3>
                        <div class="share-id-code">${shareId}</div>
                        <p class="share-id-subtitle">
                            ${source === 'server' ? 
                                '🌐 Armazenado no servidor' : 
                                '💾 Armazenado localmente'
                            }
                        </p>
                    </div>
                    
                    <div class="share-instructions">
                        <h4>📋 Como usar:</h4>
                        <ol>
                            <li>Compartilhe este ID com seu aluno</li>
                            <li>O aluno deve abrir o app do aluno</li>
                            <li>Clicar em "Importar por ID"</li>
                            <li>Digitar o código: <strong>${shareId}</strong></li>
                        </ol>
                    </div>

                    <div class="share-actions">
                        <button class="btn btn-primary" onclick="app.copyShareId('${shareId}')">
                            📋 Copiar ID
                        </button>
                        <button class="btn btn-secondary" onclick="app.shareViaWhatsApp('${shareId}')">
                            📱 Compartilhar no WhatsApp
                        </button>
                        <button class="btn btn-outline" onclick="app.closeShareModal()">
                            ✅ Fechar
                        </button>
                    </div>

                    <div class="share-qr-section">
                        <p><small>💡 Dica: O aluno pode usar este ID a qualquer momento para importar o plano</small></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            const shareCodeElement = modal.querySelector('.share-id-code');
            if (shareCodeElement && window.getSelection) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(shareCodeElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, 100);
    },

    // Fechar modal de compartilhamento
    closeShareModal() {
        const modal = document.getElementById('shareSuccessModal');
        if (modal) {
            modal.remove();
        }
    },

    // Copiar ID para clipboard
    async copyShareId(shareId) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareId);
                this.showMessage('📋 ID copiado para a área de transferência!', 'success');
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = shareId;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showMessage('📋 ID copiado!', 'success');
            }
        } catch (error) {
            console.error('Erro ao copiar:', error);
            this.showMessage('Erro ao copiar ID. Copie manualmente: ' + shareId, 'error');
        }
    },

    // Compartilhar via WhatsApp
    shareViaWhatsApp(shareId) {
        const planName = this.sharingState.lastSharedPlan?.nome || 'Plano de Treino';
        const studentName = this.sharingState.lastSharedPlan?.aluno?.nome || 'Aluno';
        
        const message = `🏋️ *${planName}*\n\n` +
                       `Olá ${studentName}! Seu plano de treino está pronto!\n\n` +
                       `📱 Para importar:\n` +
                       `1. Abra o JS Fit App (Aluno)\n` +
                       `2. Clique em "Importar por ID"\n` +
                       `3. Digite o código: *${shareId}*\n\n` +
                       `💪 Bons treinos!`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    },

    // Listar planos compartilhados
    getSharedPlansList() {
        const sharedPlans = this.getSharedPlansFromStorage();
        return Object.entries(sharedPlans).map(([shareId, planData]) => ({
            shareId,
            planName: planData.nome,
            studentName: planData.aluno?.nome || 'Não informado',
            sharedAt: planData.sharedAt || 'Data não disponível'
        }));
    },

    // Renovar compartilhamento (gerar novo ID)
    async renewShareId(oldShareId) {
        const sharedPlans = this.getSharedPlansFromStorage();
        const planData = sharedPlans[oldShareId];
        
        if (!planData) {
            this.showMessage('Plano compartilhado não encontrado', 'error');
            return;
        }

        const newShareId = this.generateShareId();
        
        try {
            const apiAvailable = await this.checkAPIStatus();
            
            if (apiAvailable) {
                const response = await this.makeAPIRequest(
                    `${this.apiConfig.baseUrl}${this.apiConfig.endpoints.shareWorkout}`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            shareId: newShareId,
                            plan: planData
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error('Erro no servidor');
                }
            }

            sharedPlans[newShareId] = {
                ...planData,
                sharedAt: new Date().toISOString()
            };
            
            delete sharedPlans[oldShareId];
            
            localStorage.setItem('jsfitapp_shared_plans', JSON.stringify(sharedPlans));
            
            this.showMessage(`✅ Novo ID gerado: ${newShareId}`, 'success');
            this.showShareSuccessModal(newShareId, apiAvailable ? 'server' : 'local');
            
        } catch (error) {
            console.error('Erro ao renovar compartilhamento:', error);
            this.showMessage('Erro ao renovar compartilhamento', 'error');
        }
    },

    // =============================================
    // FUNÇÕES DE TÉCNICAS AVANÇADAS
    // =============================================

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
    },

    getObservacaoEspecial(tecnica, nomeExercicio) {
        if (!tecnica) return '';
        
        const observacoes = {
            'pre-exaustao': `Executar antes do exercício principal para pré-fadigar o músculo`,
            'pos-exaustao': `Exercício final para esgotamento completo do músculo`,
            'bi-set': `Executar em sequência com próximo exercício, sem descanso`,
            'tri-set': `Executar em sequência com próximos 2 exercícios, sem descanso`,
            'drop-set': `Reduzir carga imediatamente após falha e continuar`,
            'rest-pause': `Pausar 10-15s após falha e continuar até nova falha`,
            'serie-queima': `Após falha, fazer repetições parciais até esgotamento`,
            'tempo-controlado': `3-4 segundos na descida, 1-2 segundos na subida`,
            'pausa-contracao': `Pausar 2 segundos na contração máxima`,
            'unilateral-alternado': `Alternar membros a cada repetição`,
            'metodo-21': `7 reps na metade inferior + 7 superior + 7 completas`,
            'negativas': `Enfatizar fase excêntrica com 4-6 segundos`,
            'clusters': `Dividir série em mini-séries de 3-4 reps com 15s pausa`
        };
        
        return observacoes[tecnica] || '';
    },

    getTecnicasAplicadasFromPlan(treinos) {
        const tecnicasUsadas = new Set();
        
        treinos.forEach(treino => {
            if (treino.exercicios) {
                treino.exercicios.forEach(ex => {
                    if (ex.tecnica && this.tecnicasDatabase[ex.tecnica]) {
                        tecnicasUsadas.add(ex.tecnica);
                    }
                });
            }
        });
        
        const tecnicasAplicadas = {};
        tecnicasUsadas.forEach(tecnica => {
            tecnicasAplicadas[tecnica] = this.tecnicasDatabase[tecnica];
        });
        
        return tecnicasAplicadas;
    },

    getUsedTechniques(nivel) {
        const tecnicasUsadas = {};
        const tecnicasDisponiveis = this.tecnicasPorNivel[nivel] || this.tecnicasPorNivel.intermediario;
        
        tecnicasDisponiveis.forEach(tecnica => {
            if (this.tecnicasDatabase[tecnica]) {
                tecnicasUsadas[tecnica] = this.tecnicasDatabase[tecnica];
            }
        });
        
        return tecnicasUsadas;
    },

    // =============================================
    // FUNÇÕES DE INTERFACE - IA
    // =============================================

    showAIPlanCreator() {
        document.getElementById('aiPlanCreator').style.display = 'block';
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
        
        const form = document.getElementById('aiPlanCreator');
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type !== 'number') {
                input.value = '';
            }
        });
        
        document.getElementById('aiAvailableDays').value = '3';
        document.getElementById('aiSessionTime').value = '60';
    },

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    generateAIPlan() {
        const aiData = {
            nome: document.getElementById('aiStudentName').value,
            dataNascimento: document.getElementById('aiStudentBirthDate').value,
            cpf: document.getElementById('aiStudentCpf').value,
            altura: document.getElementById('aiStudentHeight').value || '1,75m',
            peso: document.getElementById('aiStudentWeight').value || '75kg',
            objetivo: document.getElementById('aiPlanObjective').value,
            nivel: document.getElementById('aiExperienceLevel').value,
            dias: parseInt(document.getElementById('aiAvailableDays').value),
            tempo: parseInt(document.getElementById('aiSessionTime').value),
            equipamentos: document.getElementById('aiEquipment').value,
            foco: document.getElementById('aiMusclePreference').value,
            limitacoes: document.getElementById('aiLimitations').value,
            observacoes: document.getElementById('aiSpecialNotes').value
        };

        aiData.idade = aiData.dataNascimento ? this.calculateAge(aiData.dataNascimento) : 25;

        if (!aiData.nome) {
            this.showMessage('Por favor, preencha o nome do aluno', 'error');
            return;
        }

        const indicator = document.getElementById('generatingIndicator');
        const progressFill = document.getElementById('progressFill');
        indicator.classList.add('active');

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 200);

        setTimeout(() => {
            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            try {
                const aiGeneratedPlan = this.createAIPlan(aiData);
                
                const existingIndex = this.savedPlans.findIndex(p => p.id === aiGeneratedPlan.id);
                if (existingIndex >= 0) {
                    this.savedPlans[existingIndex] = { ...aiGeneratedPlan };
                } else {
                    this.savedPlans.push({ ...aiGeneratedPlan });
                }

                this.savePlansToStorage();
                
                indicator.classList.remove('active');
                
                this.showMessage('Plano gerado com sucesso pela IA! ✨', 'success');
                
                setTimeout(() => {
                    this.showPlanList();
                }, 1500);

            } catch (error) {
                console.error('Erro ao gerar plano:', error);
                indicator.classList.remove('active');
                this.showMessage('Erro ao gerar plano. Tente novamente.', 'error');
            }

        }, 2000 + Math.random() * 2000);
    },

    createAIPlan(aiData) {
        const plan = {
            id: Date.now(),
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
            dataFim: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            perfil: {
                idade: aiData.idade,
                altura: aiData.altura,
                peso: aiData.peso,
                porte: this.calculateBodyType(aiData.altura, aiData.peso),
                objetivo: aiData.objetivo
            },
            treinos: this.generateAIWorkouts(aiData),
            observacoes: this.generateObservations(aiData),
            tecnicas_aplicadas: this.getUsedTechniques(aiData.nivel)
        };

        return plan;
    },

    getWorkoutLetters(days) {
        const letters = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE', 'ABCDEF'];
        return letters[days - 1] || 'A';
    },

    calculateBodyType(altura, peso) {
        const height = parseFloat(altura.replace('m', '').replace(',', '.'));
        const weight = parseFloat(peso.replace('kg', ''));
        const imc = weight / (height * height);
        
        if (imc < 18.5) return 'pequeno';
        if (imc < 25) return 'médio';
        return 'grande';
    },

    generateAIWorkouts(aiData) {
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
    },

    generateExercisesForMuscleGroups(grupos, nivel, objetivo, equipamentos, workoutNumber) {
        const exercises = [];
        let exerciseId = workoutNumber * 10;

        // Aquecimento
        exercises.push({
            id: exerciseId++,
            nome: this.getWarmupExercise(grupos),
            descricao: this.getWarmupDescription(grupos),
            series: 1,
            repeticoes: "8-10 min",
            carga: this.getWarmupIntensity(),
            descanso: '0',
            observacoesEspeciais: '',
            tecnica: '',
            concluido: false
        });

        // Exercícios por grupo muscular
        grupos.forEach(grupo => {
            // NOVA IMPLEMENTAÇÃO: Usar base dinâmica
            const groupExercises = this.getExercisesByGroupAndLevel(grupo, nivel);
            
            if (groupExercises.length > 0) {
                const numExercises = grupos.length <= 2 ? 4 : (grupos.length <= 3 ? 3 : 2);
                
                for (let i = 0; i < Math.min(numExercises, groupExercises.length); i++) {
                    const baseExercise = groupExercises[i];
                    const tecnicaSelecionada = this.getTecnicaForExercise(i, nivel, grupo);
                    
                    exercises.push({
                        id: exerciseId++,
                        nome: baseExercise.nome,
                        descricao: findExerciseByName(baseExercise.nome),
                        series: baseExercise.series || 3,
                        repeticoes: baseExercise.repeticoes || '10-12',
                        carga: this.adjustLoadForLevel(baseExercise.carga || 'A definir', nivel),
                        descanso: this.getRestByObjective(objetivo),
                        observacoesEspeciais: this.getObservacaoEspecial(tecnicaSelecionada, baseExercise.nome),
                        tecnica: tecnicaSelecionada,
                        concluido: false
                    });
                }
            }
        });

        // Alongamento
        if (exercises.length > 1) {
            exercises.push({
                id: exerciseId++,
                nome: "Alongamento",
                descricao: "Relaxamento e flexibilidade dos grupos musculares trabalhados",
                series: 1,
                repeticoes: "8-10 min",
                carga: "Peso corporal",
                descanso: '0',
                observacoesEspeciais: '',
                tecnica: '',
                concluido: false
            });
        }

        return exercises;
    },

    getWarmupExercise(grupos) {
        if (grupos.includes('quadriceps') || grupos.includes('posterior')) {
            return "Bicicleta";
        } else if (grupos.includes('costas')) {
            return "Remo Ergômetro";
        } else if (grupos.includes('ombros')) {
            return "Elíptico";
        } else {
            return "Esteira";
        }
    },

    getWarmupDescription(grupos) {
        if (grupos.includes('quadriceps') || grupos.includes('posterior')) {
            return "Aquecimento específico para membros inferiores em ritmo moderado";
        } else if (grupos.includes('costas')) {
            return "Aquecimento específico para movimentos de puxar";
        } else if (grupos.includes('ombros')) {
            return "Aquecimento com mobilização de braços";
        } else {
            return "Caminhada moderada para aquecimento geral";
        }
    },

    getWarmupIntensity() {
        return "Intensidade moderada";
    },

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
    },

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
    },

    getProgressionByLevel(nivel) {
        const progressions = {
            iniciante: "Aumente a carga em 2,5kg quando conseguir executar todas as séries no limite superior de repetições",
            intermediario: "Aumente a carga em 2,5-5kg quando conseguir executar todas as séries no limite superior de repetições",
            avancado: "Aumente a carga em 2,5-5kg ou use técnicas avançadas quando conseguir executar todas as séries facilmente"
        };
        return progressions[nivel] || progressions.intermediario;
    },

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
    },

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
    },

    // =============================================
    // FUNÇÕES DE INTERFACE - CRIAÇÃO MANUAL
    // =============================================

    showPlanCreator(planId = null) {
        document.getElementById('planCreator').style.display = 'block';
        document.getElementById('aiPlanCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'none';
        
        if (planId) {
            this.loadPlanForEditing(planId);
        } else {
            this.resetPlanForm();
            this.selectPlanType(1, 'A', document.querySelector('.plan-type-btn'));
        }
    },

    loadPlanForEditing(planId) {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) return;

        this.isEditing = true;
        this.currentPlan = { ...plan };
        
        document.getElementById('currentPlanId').value = planId;
        document.getElementById('studentName').value = plan.aluno?.nome || '';
        document.getElementById('studentBirthDate').value = plan.aluno?.dataNascimento || '';
        document.getElementById('studentCpf').value = plan.aluno?.cpf || '';
        document.getElementById('studentHeight').value = plan.aluno?.altura || plan.perfil?.altura || '';
        document.getElementById('studentWeight').value = plan.aluno?.peso || plan.perfil?.peso || '';
        document.getElementById('planName').value = plan.nome || '';
        document.getElementById('planObjective').value = plan.perfil?.objetivo || '';
        document.getElementById('planStartDate').value = plan.dataInicio || '';
        document.getElementById('planEndDate').value = plan.dataFim || '';
        document.getElementById('planObservations').value = plan.observacoes?.geral || '';
        
        this.selectedDays = plan.dias;
        this.selectPlanTypeForEdit(plan.dias);
        
        document.getElementById('cancelEditBtn').style.display = 'inline-flex';
        
        this.showMessage('Modo de edição ativado 📝', 'success');
    },

    selectPlanTypeForEdit(days) {
        document.querySelectorAll('.plan-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.plan-type-btn')[days - 1]?.classList.add('active');
        
        this.selectedDays = days;
        this.generateWorkoutEditorForEdit(days);
    },

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
    },

    cancelEdit() {
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
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('currentPlanId').value = '';
        this.showPlanList();
    },

    showPlanList() {
        document.getElementById('planCreator').style.display = 'none';
        document.getElementById('aiPlanCreator').style.display = 'none';
        document.getElementById('planList').style.display = 'block';
        this.renderPlanList();
    },

    resetPlanForm() {
        const inputs = document.querySelectorAll('#planCreator input, #planCreator textarea, #planCreator select');
        inputs.forEach(input => {
            if (input.type === 'number') {
                input.value = input.placeholder || '';
            } else {
                input.value = '';
            }
        });
        
        this.setDefaultDates();
        this.currentPlan.treinos = [];
        this.selectedDays = 1;
        this.isEditing = false;
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('currentPlanId').value = '';
    },

    selectPlanType(days, letters, element) {
        // Remove active de todos os botões
        document.querySelectorAll('.plan-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adiciona active ao botão clicado
        element.classList.add('active');
        
        this.selectedDays = days;
        this.planTypeConfiguration.days = days;
        
        // Se não há configuração para este número de dias, usar padrão
        const currentConfig = Object.keys(this.planTypeConfiguration.configuration).length;
        if (currentConfig === 0 || this.planTypeConfiguration.days !== days) {
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[days] || {};
            this.planTypeConfiguration.days = days;
        }
        
        // Mostrar modal de configuração
        this.showPlanTypeConfigModal();
    },


    // =============================================
// EXTENSÕES PARA TIPOS DE PLANO CONFIGURÁVEIS
// Adicione estas funções ao seu app object em personal.js
// =============================================

// Configurações de tipos de plano
planTypeConfiguration: {
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
        { id: 'ombro', name: 'OMBRO', icon: '👐' },
        { id: 'corpo', name: 'CORPO TODO', icon: '🏋️' }
    ],
    
        // Modelos pré-definidos
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
},

// Carregar configuração de tipos de plano
loadPlanTypeConfiguration() {
    try {
        const saved = localStorage.getItem('jsfitapp_plan_configuration');
        if (saved) {
            const config = JSON.parse(saved);
            this.planTypeConfiguration.days = config.days;
            this.planTypeConfiguration.configuration = config.configuration;
            console.log('✅ Configuração de tipos de plano carregada');
        } else {
            // Usar configuração padrão
            this.planTypeConfiguration.days = 3;
            this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3];
            console.log('📋 Usando configuração padrão para tipos de plano');
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de tipos de plano:', error);
        this.planTypeConfiguration.days = 3;
        this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[3];
    }
},

// Salvar configuração de tipos de plano
savePlanTypeConfiguration() {
    try {
        const configToSave = {
            days: this.planTypeConfiguration.days,
            configuration: this.planTypeConfiguration.configuration,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('jsfitapp_plan_configuration', JSON.stringify(configToSave));
        console.log('💾 Configuração de tipos de plano salva');
    } catch (error) {
        console.error('Erro ao salvar configuração de tipos de plano:', error);
    }
},

// Abrir modal de configuração de tipos de plano
showPlanTypeConfiguration() {
    this.showPlanTypeConfigModal();
},

// Mostrar modal de configuração (substitui o selectPlanType original)
selectPlanType(days, letters, element) {
    // Se não há configuração personalizada, usar padrão
    if (!this.planTypeConfiguration.configuration[Object.keys(this.planTypeConfiguration.presetConfigurations[days])[0]]) {
        this.planTypeConfiguration.configuration = this.planTypeConfiguration.presetConfigurations[days];
        this.planTypeConfiguration.days = days;
    }

    document.querySelectorAll('.plan-type-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    
    this.selectedDays = days;
    this.planTypeConfiguration.days = days;
    
    // Mostrar modal de configuração
    this.showPlanTypeConfigModal();
},

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

                <div class="plan-config-preview">
                    <h3>👁️ Preview da Configuração</h3>
                    <div id="planConfigPreview" class="plan-config-preview-grid">
                        ${this.generatePlanConfigPreview()}
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
},

// Gerar HTML para configuração de planos
generatePlanConfigHTML() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const days = this.planTypeConfiguration.days;
    let html = '';

    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter] || { name: `Treino ${letter}`, groups: [] };
        
        html += `
            <div class="workout-config-item">
                <div class="workout-config-header">
                    <div class="workout-letter">${letter}</div>
                    <input type="text" 
                           id="workout-name-${letter}" 
                           class="form-input"
                           placeholder="Nome do Treino ${letter}"
                           value="${config.name}"
                           onchange="app.updateWorkoutConfigName('${letter}')">
                </div>
                
                <div class="muscle-groups-grid">
                    ${this.planTypeConfiguration.muscleGroups.map(group => `
                        <label class="muscle-group-checkbox">
                            <input type="checkbox" 
                                   id="group-${letter}-${group.id}" 
                                   ${config.groups.includes(group.id) ? 'checked' : ''}
                                   onchange="app.updateWorkoutConfigGroups('${letter}')">
                            <span class="checkbox-custom"></span>
                            <span class="muscle-group-label">${group.icon} ${group.name}</span>
                        </label>
                    `).join('')}
                </div>
                
                <div class="selected-groups-display" id="selected-display-${letter}">
                    ${this.generateSelectedGroupsDisplay(letter, config.groups)}
                </div>
            </div>
        `;
    }

    return html;
},

// Gerar display dos grupos selecionados
generateSelectedGroupsDisplay(letter, selectedGroups) {
    if (selectedGroups.length === 0) {
        return '<span class="no-groups-selected">⚠️ Nenhum grupo selecionado</span>';
    }

    return `
        <div class="selected-groups-title">Grupos selecionados:</div>
        <div class="selected-groups-tags">
            ${selectedGroups.map(groupId => {
                const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
                return `<span class="selected-group-tag">${group.icon} ${group.name}</span>`;
            }).join('')}
        </div>
    `;
},

// Gerar preview da configuração
generatePlanConfigPreview() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const days = this.planTypeConfiguration.days;
    let html = '';

    for (let i = 0; i < days; i++) {
        const letter = letters[i];
        const config = this.planTypeConfiguration.configuration[letter] || { name: `Treino ${letter}`, groups: [] };
        
        const groupsText = config.groups.length > 0 
            ? config.groups.map(groupId => {
                const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
                return `${group.icon} ${group.name}`;
            }).join(', ')
            : '⚠️ Nenhum grupo selecionado';

        html += `
            <div class="preview-card ${config.groups.length === 0 ? 'preview-card-warning' : ''}">
                <h4>Treino ${letter}</h4>
                <div class="preview-name">${config.name}</div>
                <div class="preview-groups">${groupsText}</div>
            </div>
        `;
    }

    return html;
},

// Atualizar nome do treino na configuração
updateWorkoutConfigName(letter) {
    const input = document.getElementById(`workout-name-${letter}`);
    if (!this.planTypeConfiguration.configuration[letter]) {
        this.planTypeConfiguration.configuration[letter] = { name: '', groups: [] };
    }
    this.planTypeConfiguration.configuration[letter].name = input.value;
    this.updatePlanConfigPreview();
},

// Atualizar grupos do treino na configuração
updateWorkoutConfigGroups(letter) {
    const selectedGroups = [];
    this.planTypeConfiguration.muscleGroups.forEach(group => {
        const checkbox = document.getElementById(`group-${letter}-${group.id}`);
        if (checkbox && checkbox.checked) {
            selectedGroups.push(group.id);
        }
    });

    if (!this.planTypeConfiguration.configuration[letter]) {
        this.planTypeConfiguration.configuration[letter] = { name: `Treino ${letter}`, groups: [] };
    }
    this.planTypeConfiguration.configuration[letter].groups = selectedGroups;

    // Atualizar display dos grupos selecionados
    const displayElement = document.getElementById(`selected-display-${letter}`);
    if (displayElement) {
        displayElement.innerHTML = this.generateSelectedGroupsDisplay(letter, selectedGroups);
    }

    this.updatePlanConfigPreview();
},

// Atualizar preview da configuração
updatePlanConfigPreview() {
    const previewElement = document.getElementById('planConfigPreview');
    if (previewElement) {
        previewElement.innerHTML = this.generatePlanConfigPreview();
    }
},

// Carregar modelo padrão
loadPresetPlanConfig() {
    const days = this.planTypeConfiguration.days;
    const preset = this.planTypeConfiguration.presetConfigurations[days];
    
    if (preset) {
        this.planTypeConfiguration.configuration = JSON.parse(JSON.stringify(preset));
        
        // Atualizar interface
        Object.entries(preset).forEach(([letter, config]) => {
            // Atualizar nome
            const nameInput = document.getElementById(`workout-name-${letter}`);
            if (nameInput) {
                nameInput.value = config.name;
            }

            // Atualizar checkboxes
            this.planTypeConfiguration.muscleGroups.forEach(group => {
                const checkbox = document.getElementById(`group-${letter}-${group.id}`);
                if (checkbox) {
                    checkbox.checked = config.groups.includes(group.id);
                }
            });

            // Atualizar display
            const displayElement = document.getElementById(`selected-display-${letter}`);
            if (displayElement) {
                displayElement.innerHTML = this.generateSelectedGroupsDisplay(letter, config.groups);
            }
        });

        this.updatePlanConfigPreview();
        this.showMessage('📋 Modelo padrão aplicado!', 'success');
    }
},

// Salvar configuração e gerar treinos
savePlanTypeConfigAndGenerate() {
    // Validar se todos os treinos têm pelo menos um grupo
    const letters = Object.keys(this.planTypeConfiguration.configuration);
    let isValid = true;
    let emptyWorkouts = [];

    letters.forEach(letter => {
        const config = this.planTypeConfiguration.configuration[letter];
        if (!config.groups || config.groups.length === 0) {
            isValid = false;
            emptyWorkouts.push(letter);
        }
    });

    if (!isValid) {
        this.showMessage(`⚠️ Os treinos ${emptyWorkouts.join(', ')} não têm grupos musculares selecionados!`, 'warning');
        return;
    }

    // Salvar configuração
    this.savePlanTypeConfiguration();
    
    // Fechar modal
    this.closePlanTypeConfigModal();
    
    // Gerar treinos baseado na configuração
    this.generateWorkoutEditorWithConfig(this.planTypeConfiguration.days);
    
    this.showMessage('✅ Configuração aplicada e treinos gerados!', 'success');
},

// Fechar modal de configuração
closePlanTypeConfigModal() {
    const modal = document.getElementById('planTypeConfigModal');
    if (modal) {
        modal.remove();
    }
},

// Gerar editor de treinos com configuração personalizada
generateWorkoutEditorWithConfig(days) {
    const editor = document.getElementById('workoutEditor');
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
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
},

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
},

// Sobrescrever função de geração de treinos da IA para usar configuração
generateAIWorkouts(aiData) {
    const workouts = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Usar configuração personalizada se disponível
    const useCustomConfig = this.planTypeConfiguration.days === aiData.dias && 
                           Object.keys(this.planTypeConfiguration.configuration).length > 0;
    
    if (useCustomConfig) {
        console.log('🎯 Usando configuração personalizada para IA');
        
        for (let i = 0; i < aiData.dias; i++) {
            const letter = letters[i];
            const config = this.planTypeConfiguration.configuration[letter];
            
            if (!config) continue;
            
            const exercises = this.generateExercisesForCustomGroups(
                config.groups,
                aiData.nivel,
                aiData.objetivo,
                aiData.equipamentos,
                i + 1
            );

            workouts.push({
                id: letter,
                nome: config.name,
                foco: this.generateWorkoutFocusFromGroups(config.groups),
                exercicios: exercises,
                gruposMusculares: config.groups,
                concluido: false,
                execucoes: 0
            });
        }
    } else {
        // Usar método padrão original
        console.log('📋 Usando configuração padrão para IA');
        return this.generateAIWorkoutsOriginal(aiData);
    }
    
    return workouts;
},

// Gerar exercícios para grupos personalizados
generateExercisesForCustomGroups(customGroups, nivel, objetivo, equipamentos, workoutNumber) {
    const exercises = [];
    let exerciseId = workoutNumber * 10;

    // Aquecimento específico
    exercises.push({
        id: exerciseId++,
        nome: this.getWarmupForGroups(customGroups),
        descricao: this.getWarmupDescriptionForGroups(customGroups),
        series: 1,
        repeticoes: "8-10 min",
        carga: this.getWarmupIntensity(),
        descanso: '0',
        observacoesEspeciais: '',
        tecnica: '',
        concluido: false
    });

    // Exercícios por grupo muscular personalizado
    customGroups.forEach(grupoId => {
        // Mapear IDs personalizados para grupos do sistema
        const mappedGroup = this.mapCustomGroupToSystemGroup(grupoId);
        
        if (mappedGroup) {
            const groupExercises = this.getExercisesByGroupAndLevel(mappedGroup, nivel);
            
            if (groupExercises.length > 0) {
                const numExercises = customGroups.length <= 2 ? 4 : (customGroups.length <= 3 ? 3 : 2);
                
                for (let i = 0; i < Math.min(numExercises, groupExercises.length); i++) {
                    const baseExercise = groupExercises[i];
                    const tecnicaSelecionada = this.getTecnicaForExercise(i, nivel, mappedGroup);
                    
                    exercises.push({
                        id: exerciseId++,
                        nome: baseExercise.nome,
                        descricao: this.findExerciseByName(baseExercise.nome) || 'Descrição não disponível',
                        series: baseExercise.series || 3,
                        repeticoes: baseExercise.repeticoes || '10-12',
                        carga: this.adjustLoadForLevel(baseExercise.carga || 'A definir', nivel),
                        descanso: this.getRestByObjective(objetivo),
                        observacoesEspeciais: this.getObservacaoEspecial(tecnicaSelecionada, baseExercise.nome),
                        tecnica: tecnicaSelecionada,
                        concluido: false
                    });
                }
            }
        }
    });

    // Alongamento
    if (exercises.length > 1) {
        exercises.push({
            id: exerciseId++,
            nome: "Alongamento",
            descricao: "Relaxamento e flexibilidade dos grupos musculares trabalhados",
            series: 1,
            repeticoes: "8-10 min",
            carga: "Peso corporal",
            descanso: '0',
            observacoesEspeciais: '',
            tecnica: '',
            concluido: false
        });
    }

    return exercises;
},

// Mapear grupos personalizados para grupos do sistema
mapCustomGroupToSystemGroup(customGroupId) {
    const mapping = {
        'antebraco': 'antebraco',
        'abdome': 'abdome', 
        'biceps': 'biceps',
        'triceps': 'triceps',
        'peito': 'peito',
        'perna': 'quadriceps', // Perna mapeia para quadríceps
        'gluteo': 'gluteos',
        'costas': 'costas',
        'ombro': 'ombros',
        'corpo': 'corpo_inteiro'
    };
    
    return mapping[customGroupId] || customGroupId;
},

// Aquecimento específico para grupos
getWarmupForGroups(groups) {
    if (groups.includes('perna') || groups.includes('gluteo')) {
        return "Bicicleta Ergométrica";
    } else if (groups.includes('costas')) {
        return "Remo Ergômetro";
    } else if (groups.includes('ombro')) {
        return "Elíptico";
    } else if (groups.includes('corpo')) {
        return "Aquecimento Geral";
    } else {
        return "Esteira";
    }
},

// Descrição do aquecimento para grupos
getWarmupDescriptionForGroups(groups) {
    const groupNames = groups.map(groupId => {
        const group = this.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
        return group ? group.name.toLowerCase() : groupId;
    }).join(', ');
    
    return `Aquecimento específico para ${groupNames} em ritmo moderado`;
},


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
    },

    renderExercises(exercicios, workoutIndex) {
        if (!exercicios || exercicios.length === 0) {
            return '<p>Nenhum exercício adicionado</p>';
        }

        return exercicios.map((ex, exIndex) => `
            <div class="exercise-item">
                <div class="exercise-info">
                    <div>
                        <div class="exercise-name">${ex.nome}</div>
                        <div class="exercise-description">${ex.descricao}</div>
                        ${ex.tecnica ? `<div class="exercise-special-notes">🎯 ${ex.tecnica.replace('-', ' ').toUpperCase()}</div>` : ''}
                        ${ex.observacoesEspeciais ? `<div class="exercise-special-notes">💡 ${ex.observacoesEspeciais}</div>` : ''}
                    </div>
                    <div><strong>Séries:</strong> ${ex.series}</div>
                    <div><strong>Reps:</strong> ${ex.repeticoes}</div>
                    <div><strong>Carga:</strong> ${ex.carga}</div>
                    <div><strong>Descanso:</strong> ${ex.descanso || '60s'}</div>
                </div>
                <div class="exercise-actions">
                    <button class="btn btn-outline btn-small" onclick="app.editExercise(${workoutIndex}, ${exIndex})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="app.removeExercise(${workoutIndex}, ${exIndex})">
                        🗑️ Remover
                    </button>
                </div>
            </div>
        `).join('');
    },

    addExercise(workoutIndex) {
        const newExercise = {
            id: Date.now(),
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
        
        this.currentPlan.treinos[workoutIndex].exercicios.push(newExercise);
        this.updateExerciseList(workoutIndex);
    },

    editExercise(workoutIndex, exerciseIndex) {
        this.currentWorkoutIndex = workoutIndex;
        this.currentExerciseIndex = exerciseIndex;
        
        const exercise = this.currentPlan.treinos[workoutIndex].exercicios[exerciseIndex];
        
        // Configurar nome do exercício
        const exerciseSelect = document.getElementById('exerciseName');
        const customGroup = document.getElementById('customExerciseGroup');
        const customInput = document.getElementById('customExerciseName');
        
        const option = Array.from(exerciseSelect.options).find(opt => opt.value === exercise.nome);
        if (option) {
            exerciseSelect.value = exercise.nome;
            customGroup.style.display = 'none';
        } else {
            exerciseSelect.value = 'custom';
            customGroup.style.display = 'block';
            customInput.value = exercise.nome;
        }
        
        // Configurar dados básicos
        document.getElementById('exerciseSets').value = exercise.series;
        document.getElementById('exerciseReps').value = exercise.repeticoes;
        document.getElementById('exerciseWeight').value = exercise.carga;
        document.getElementById('exerciseRest').value = exercise.descanso || '90 segundos';
        document.getElementById('exerciseDescription').value = exercise.descricao;
        
        // Configurar técnica selecionada
        const techniqueSelect = document.getElementById('exerciseTechnique');
        if (exercise.tecnica && this.tecnicasDatabase[exercise.tecnica]) {
            techniqueSelect.value = exercise.tecnica;
            this.updateTechniqueDescription();
        } else {
            techniqueSelect.value = '';
            this.updateTechniqueDescription();
        }
        
        // Abrir modal
        document.getElementById('exerciseModal').classList.add('active');
    },

    updateTechniqueDescription() {
        const techniqueSelect = document.getElementById('exerciseTechnique');
        const descriptionGroup = document.getElementById('techniqueDescriptionGroup');
        const descriptionTextarea = document.getElementById('techniqueDescription');
        
        if (techniqueSelect.value && this.tecnicasDatabase[techniqueSelect.value]) {
            descriptionGroup.style.display = 'block';
            descriptionTextarea.value = this.tecnicasDatabase[techniqueSelect.value];
        } else {
            descriptionGroup.style.display = 'none';
            descriptionTextarea.value = '';
        }
    },

    updateExerciseDescription() {
        const exerciseSelect = document.getElementById('exerciseName');
        const customGroup = document.getElementById('customExerciseGroup');
        const descriptionTextarea = document.getElementById('exerciseDescription');
        
        if (exerciseSelect.value === 'custom') {
            customGroup.style.display = 'block';
            descriptionTextarea.value = '';
        } else {
            customGroup.style.display = 'none';
            const description =  this.findExerciseByName(exerciseSelect.value) || 'Descrição não disponível';
            descriptionTextarea.value = description;
        }
    },

    saveExercise() {
        if (this.currentWorkoutIndex === null || this.currentExerciseIndex === null) return;
        
        const exercise = this.currentPlan.treinos[this.currentWorkoutIndex].exercicios[this.currentExerciseIndex];
        
        const exerciseSelect = document.getElementById('exerciseName');
        const customName = document.getElementById('customExerciseName');
        const techniqueSelect = document.getElementById('exerciseTechnique');
        
        // Atualizar dados básicos do exercício
        exercise.nome = exerciseSelect.value === 'custom' ? customName.value : exerciseSelect.value;
        exercise.series = parseInt(document.getElementById('exerciseSets').value) || 3;
        exercise.repeticoes = document.getElementById('exerciseReps').value;
        exercise.carga = document.getElementById('exerciseWeight').value;
        exercise.descanso = document.getElementById('exerciseRest').value;
        exercise.descricao = document.getElementById('exerciseDescription').value;
        
        // Configurar técnica selecionada
        exercise.tecnica = techniqueSelect.value;
        
        // Gerar observações especiais automaticamente baseadas na técnica
        if (exercise.tecnica && this.tecnicasDatabase[exercise.tecnica]) {
            exercise.observacoesEspeciais = this.getObservacaoEspecial(exercise.tecnica, exercise.nome);
        } else {
            exercise.observacoesEspeciais = '';
        }
        
        // Atualizar a lista de exercícios e fechar modal
        this.updateExerciseList(this.currentWorkoutIndex);
        this.closeExerciseModal();
    },

    removeExercise(workoutIndex, exerciseIndex) {
        if (confirm('Tem certeza que deseja remover este exercício?')) {
            this.currentPlan.treinos[workoutIndex].exercicios.splice(exerciseIndex, 1);
            this.updateExerciseList(workoutIndex);
        }
    },

    updateExerciseList(workoutIndex) {
        const container = document.getElementById(`exerciseList${workoutIndex}`);
        if (container) {
            container.innerHTML = this.renderExercises(
                this.currentPlan.treinos[workoutIndex].exercicios, 
                workoutIndex
            );
        }
    },

    closeExerciseModal() {
        document.getElementById('exerciseModal').classList.remove('active');
        this.currentWorkoutIndex = null;
        this.currentExerciseIndex = null;
    },

    // =============================================
    // FUNÇÕES DE PERSISTÊNCIA
    // =============================================

    savePlan() {
        try {
            const currentPlanId = document.getElementById('currentPlanId').value;
            const isEditingPlan = this.isEditing && currentPlanId;
            
            const birthDate = document.getElementById('studentBirthDate')?.value;
            const calculatedAge = birthDate ? this.calculateAge(birthDate) : 25;
            
            const planData = {
                id: isEditingPlan ? parseInt(currentPlanId) : Date.now(),
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
                    porte: this.calculateBodyType(
                        document.getElementById('studentHeight')?.value || '1,75m',
                        document.getElementById('studentWeight')?.value || '75kg'
                    ),
                    objetivo: document.getElementById('planObjective')?.value || 'Condicionamento geral'
                },
                treinos: [...this.currentPlan.treinos],
                observacoes: {
                    geral: document.getElementById('planObservations')?.value || '',
                    frequencia: `${this.selectedDays}x por semana`,
                    progressao: 'Aumente a carga gradualmente quando conseguir completar todas as repetições',
                    descanso: '60-90 segundos entre séries',
                    hidratacao: 'Mantenha-se bem hidratado durante todo o treino',
                    consulta: 'Acompanhamento profissional recomendado'
                },
                tecnicas_aplicadas: this.getTecnicasAplicadasFromPlan([...this.currentPlan.treinos])
            };

            if (!planData.nome || planData.nome === 'Plano sem nome') {
                this.showMessage('Por favor, preencha o nome do plano', 'error');
                return;
            }

            if (isEditingPlan) {
                const existingIndex = this.savedPlans.findIndex(p => p.id == currentPlanId);
                if (existingIndex >= 0) {
                    this.savedPlans[existingIndex] = planData;
                    this.showMessage('Plano atualizado com sucesso! 📝', 'success');
                } else {
                    this.savedPlans.push(planData);
                    this.showMessage('Plano salvo com sucesso! 💾', 'success');
                }
            } else {
                this.savedPlans.push(planData);
                this.showMessage('Plano salvo com sucesso! 💾', 'success');
            }
            
            this.savePlansToStorage();
            
            this.isEditing = false;
            document.getElementById('cancelEditBtn').style.display = 'none';
            
            setTimeout(() => {
                this.showPlanList();
            }, 1500);

        } catch (error) {
            console.error('Erro ao salvar plano:', error);
            this.showMessage('Erro ao salvar plano. Tente novamente.', 'error');
        }
    },

    editPlan(planId) {
        this.showPlanCreator(planId);
    },

    deletePlan(planId) {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            this.savedPlans = this.savedPlans.filter(plan => plan.id !== planId);
            this.savePlansToStorage();
            this.showMessage('Plano excluído com sucesso', 'success');
            this.renderPlanList();
        }
    },

    exportPlan(planId) {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) return;

        const exportData = {
            planos: [plan]
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `plano_${plan.nome.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showMessage('Plano exportado com sucesso! 📤', 'success');
    },

    importPlan(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                let plansToImport = [];
                
                if (importedData.planos) {
                    plansToImport = importedData.planos;
                } else if (Array.isArray(importedData)) {
                    plansToImport = importedData;
                } else {
                    plansToImport = [importedData];
                }
                
                plansToImport.forEach(planData => {
                    planData.id = Date.now() + Math.random();
                    planData.nome = planData.nome + ' (Importado)';
                    
                    if (!planData.aluno) {
                        planData.aluno = {
                            nome: '',
                            dataNascimento: '',
                            cpf: '',
                            idade: planData.perfil?.idade || 25,
                            altura: planData.perfil?.altura || '1,75m',
                            peso: planData.perfil?.peso || '75kg'
                        };
                    }
                    
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
                    
                    if (!planData.tecnicas_aplicadas) {
                        planData.tecnicas_aplicadas = {};
                    }
                    
                    if (planData.perfil && !planData.perfil.porte) {
                        planData.perfil.porte = this.calculateBodyType(
                            planData.perfil.altura || '1,75m',
                            planData.perfil.peso || '75kg'
                        );
                    }
                    
                    this.savedPlans.push(planData);
                });
                
                this.savePlansToStorage();
                
                this.showMessage(`${plansToImport.length} plano(s) importado(s) com sucesso! 📥`, 'success');
                this.renderPlanList();
                
            } catch (error) {
                console.error('Erro ao importar plano:', error);
                this.showMessage('Erro ao importar plano. Verifique o arquivo.', 'error');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    },

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
                        plan.perfil.porte = this.calculateBodyType(
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
    },

    savePlansToStorage() {
        try {
            localStorage.setItem('jsfitapp_plans', JSON.stringify(this.savedPlans));
        } catch (error) {
            console.error('Erro ao salvar planos:', error);
        }
    },

    // =============================================
    // FUNÇÕES DE VISUALIZAÇÃO
    // =============================================

    renderPlanList() {
        const container = document.getElementById('planListContent');
        if (!container) return;

        if (this.savedPlans.length === 0) {
            container.innerHTML = `
                <div class="plan-card">
                    <h3>Nenhum plano encontrado</h3>
                    <p>Crie seu primeiro plano de treino clicando em "Novo Plano" ou "Criar com IA"!</p>
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

        // Obter lista de planos compartilhados
        const sharedPlans = this.getSharedPlansFromStorage();

        container.innerHTML = this.savedPlans.map(plan => {
            // Verificar se este plano já foi compartilhado
            const isShared = Object.values(sharedPlans).some(shared => shared.id === plan.id);
            const shareInfo = isShared ? 
                Object.entries(sharedPlans).find(([, shared]) => shared.id === plan.id) : 
                null;

            return `
                <div class="plan-card ${isShared ? 'plan-shared' : ''}">
                    <h3>${plan.nome}</h3>
                    <p><strong>Aluno:</strong> ${plan.aluno?.nome || 'Não informado'}</p>
                    <p><strong>Período:</strong> ${this.formatDate(plan.dataInicio)} até ${this.formatDate(plan.dataFim)}</p>
                    <p><strong>Frequência:</strong> ${plan.dias} dias por semana</p>
                    <p><strong>Objetivo:</strong> ${plan.perfil?.objetivo || 'Não especificado'}</p>
                    <p><strong>Treinos:</strong> ${plan.treinos?.length || 0} dias configurados</p>
                    
                    ${isShared ? `
                        <div class="share-info">
                            <span class="share-badge">✅ Compartilhado</span>
                            <span class="share-id">ID: ${shareInfo[0]}</span>
                        </div>
                    ` : ''}
                    
                    <div class="plan-card-actions">
                        <button class="btn btn-primary btn-small" onclick="app.viewPlan(${plan.id})">
                            👁️ Visualizar
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="app.editPlan(${plan.id})">
                            ✏️ Editar
                        </button>
                        ${isShared ? `
                            <button class="btn btn-success btn-small" onclick="app.showShareSuccessModal('${shareInfo[0]}', 'local')">
                                🔗 Ver ID
                            </button>
                            <button class="btn btn-outline btn-small" onclick="app.renewShareId('${shareInfo[0]}')">
                                🔄 Novo ID
                            </button>
                        ` : `
                            <button class="btn btn-success btn-small" onclick="app.sharePlan(${plan.id})">
                                🔗 Compartilhar
                            </button>
                        `}
                        <button class="btn btn-outline btn-small" onclick="app.exportPlan(${plan.id})">
                            📤 Exportar
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deletePlan(${plan.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Adicionar seção de planos compartilhados se houver
        const sharedPlansList = this.getSharedPlansList();
        if (sharedPlansList.length > 0) {
            container.innerHTML += `
                <div class="shared-plans-section">
                    <h3>📤 Planos Compartilhados Recentemente</h3>
                    ${sharedPlansList.map(shared => `
                        <div class="shared-plan-item">
                            <div class="shared-plan-info">
                                <strong>${shared.planName}</strong>
                                <span>ID: ${shared.shareId}</span>
                                <small>Aluno: ${shared.studentName}</small>
                            </div>
                            <div class="shared-plan-actions">
                                <button class="btn btn-outline btn-small" onclick="app.copyShareId('${shared.shareId}')">
                                    📋 Copiar
                                </button>
                                <button class="btn btn-secondary btn-small" onclick="app.shareViaWhatsApp('${shared.shareId}')">
                                    📱 WhatsApp
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },

    viewPlan(planId) {
        const plan = this.savedPlans.find(p => p.id === planId);
        if (!plan) return;

        // Fill modal with plan details
        document.getElementById('planModalTitle').textContent = plan.nome;
        
        let content = `
            <div class="plan-details">
                <h3>📊 Informações Gerais</h3>
                <p><strong>Aluno:</strong> ${plan.aluno?.nome || 'Não informado'}</p>
                <p><strong>Frequência:</strong> ${plan.dias} dias por semana</p>
                <p><strong>Período:</strong> ${this.formatDate(plan.dataInicio)} até ${this.formatDate(plan.dataFim)}</p>
                <p><strong>Objetivo:</strong> ${plan.perfil?.objetivo || 'Não especificado'}</p>
                ${plan.aluno?.idade ? `<p><strong>Idade:</strong> ${plan.aluno.idade} anos</p>` : ''}
                ${plan.aluno?.altura ? `<p><strong>Altura:</strong> ${plan.aluno.altura}</p>` : ''}
                ${plan.aluno?.peso ? `<p><strong>Peso:</strong> ${plan.aluno.peso}</p>` : ''}
            </div>
        `;

        if (plan.treinos && plan.treinos.length > 0) {
            content += `
                <div class="workout-tabs">
                    ${plan.treinos.map((treino, index) => `
                        <div class="workout-tab ${index === 0 ? 'active' : ''}" onclick="app.switchWorkoutTab(${index})">
                            ${treino.id || treino.nome}
                        </div>
                    `).join('')}
                </div>
            `;

            plan.treinos.forEach((treino, index) => {
                content += `
                    <div class="workout-content ${index === 0 ? 'active' : ''}" id="workoutContent${index}">
                        <h3>${treino.nome}</h3>
                        <p><strong>Foco:</strong> ${treino.foco}</p>
                        
                        ${treino.exercicios ? treino.exercicios.map(ex => `
                            <div class="exercise-card">
                                <div class="exercise-header">
                                    <strong>${ex.nome}</strong>
                                    ${ex.tecnica ? `<div class="exercise-special-display">🎯 Técnica: ${ex.tecnica.replace('-', ' ').toUpperCase()}</div>` : ''}
                                    ${ex.observacoesEspeciais ? `<div class="exercise-special-display">💡 ${ex.observacoesEspeciais}</div>` : ''}
                                </div>
                                <p>${ex.descricao}</p>
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
                        `).join('') : '<p>Nenhum exercício configurado</p>'}
                    </div>
                `;
            });
        }

        // Add techniques section if available
        if (plan.tecnicas_aplicadas && Object.keys(plan.tecnicas_aplicadas).length > 0) {
            content += `
                <div class="techniques-section">
                    <h3>🎯 Técnicas Aplicadas no Plano</h3>
                    ${Object.entries(plan.tecnicas_aplicadas).map(([tecnica, descricao]) => `
                        <div class="technique-item">
                            <div class="technique-name">${tecnica.replace('-', ' ')}</div>
                            <div class="technique-description">${descricao}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (plan.observacoes) {
            content += `
                <div class="plan-details">
                    <h3>📝 Observações</h3>
                    ${Object.entries(plan.observacoes).map(([key, value]) => 
                        value ? `<p><strong>${this.getObservationLabel(key)}:</strong> ${value}</p>` : ''
                    ).join('')}
                </div>
            `;
        }

        document.getElementById('planModalContent').innerHTML = content;
        document.getElementById('planModal').classList.add('active');
    },

    switchWorkoutTab(index) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.workout-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.workout-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelectorAll('.workout-tab')[index].classList.add('active');
        document.getElementById(`workoutContent${index}`).classList.add('active');
    },

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
    },

    closePlanModal() {
        document.getElementById('planModal').classList.remove('active');
    },

    formatDate(dateString) {
        if (!dateString) return 'Não definido';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    // =============================================
    // FUNÇÕES DE MENSAGENS
    // =============================================

    showMessage(message, type = 'success') {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message-success, .message-error, .message-warning, .message-info');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-${type}`;
        messageDiv.style.cssText = `
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
        `;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        messageDiv.style.backgroundColor = colors[type] || colors.info;
        
        messageDiv.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 5000);
    }
};

// =============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init.bind(app));
} else {
    app.init();
}

// CSS para animações das mensagens
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(messageStyles);
