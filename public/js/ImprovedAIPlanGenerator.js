class ImprovedAIPlanGenerator {
    constructor(app) {
        this.app = app;
        this.exerciseDatabase = app.core?.exerciseDatabase || [];
        this.usedExerciseNames = new Set();
        this.groupMuscleRotation = {};
        
        // Configuração de proporcionalidade por objetivo
        this.exerciseProportions = {
            'Hipertrofia e ganho de massa muscular': {
                'perna': { min: 3, max: 4, recommended: 4 },
                'gluteo': { min: 2, max: 3, recommended: 3 },
                'ombro': { min: 2, max: 3, recommended: 3 },
                'costas': { min: 3, max: 4, recommended: 4 },
                'peito': { min: 3, max: 4, recommended: 4 },
                'biceps': { min: 1, max: 2, recommended: 2 },
                'triceps': { min: 2, max: 3, recommended: 3 },
                'antebraco': { min: 1, max: 1, recommended: 1 },
                'abdome': { min: 1, max: 2, recommended: 2 },
                'corpo': { min: 1, max: 1, recommended: 1 }
            },
            'Perda de peso e definição': {
                'perna': { min: 2, max: 3, recommended: 3 },
                'gluteo': { min: 1, max: 2, recommended: 2 },
                'ombro': { min: 1, max: 2, recommended: 2 },
                'costas': { min: 2, max: 3, recommended: 3 },
                'peito': { min: 1, max: 2, recommended: 2 },
                'biceps': { min: 1, max: 1, recommended: 1 },
                'triceps': { min: 1, max: 2, recommended: 2 },
                'antebraco': { min: 1, max: 1, recommended: 1 },
                'abdome': { min: 1, max: 2, recommended: 2 },
                'corpo': { min: 1, max: 1, recommended: 1 }
            },
            'Condicionamento geral': {
                'perna': { min: 2, max: 3, recommended: 2 },
                'gluteo': { min: 1, max: 2, recommended: 1 },
                'ombro': { min: 1, max: 2, recommended: 2 },
                'costas': { min: 2, max: 3, recommended: 2 },
                'peito': { min: 1, max: 2, recommended: 2 },
                'biceps': { min: 1, max: 1, recommended: 1 },
                'triceps': { min: 1, max: 2, recommended: 1 },
                'antebraco': { min: 1, max: 1, recommended: 1 },
                'abdome': { min: 1, max: 2, recommended: 1 },
                'corpo': { min: 1, max: 1, recommended: 1 }
            },
            'Força e potência': {
                'perna': { min: 2, max: 3, recommended: 3 },
                'gluteo': { min: 1, max: 2, recommended: 2 },
                'ombro': { min: 1, max: 2, recommended: 2 },
                'costas': { min: 2, max: 3, recommended: 3 },
                'peito': { min: 1, max: 2, recommended: 2 },
                'biceps': { min: 1, max: 1, recommended: 1 },
                'triceps': { min: 1, max: 2, recommended: 2 },
                'antebraco': { min: 1, max: 1, recommended: 1 },
                'abdome': { min: 1, max: 2, recommended: 1 },
                'corpo': { min: 1, max: 1, recommended: 1 }
            },
            'Resistência muscular': {
                'perna': { min: 3, max: 4, recommended: 3 },
                'gluteo': { min: 2, max: 3, recommended: 2 },
                'ombro': { min: 2, max: 3, recommended: 2 },
                'costas': { min: 3, max: 4, recommended: 3 },
                'peito': { min: 2, max: 3, recommended: 2 },
                'biceps': { min: 1, max: 2, recommended: 1 },
                'triceps': { min: 1, max: 2, recommended: 2 },
                'antebraco': { min: 1, max: 2, recommended: 1 },
                'abdome': { min: 2, max: 3, recommended: 2 },
                'corpo': { min: 1, max: 2, recommended: 1 }
            }
        };
    }

    // Método principal melhorado para gerar plano IA
    async generateAIPlan() {
        try {
            console.log('🤖 Iniciando geração de plano IA com proporcionalidade inteligente...');
            
            // 1. COLETAR DADOS DO FORMULÁRIO
            const aiData = this.collectAIFormData();
            
            // 2. VALIDAÇÕES BÁSICAS
            if (!this.validateAIData(aiData)) {
                return;
            }

            console.log('📊 Dados coletados:', {
                nome: aiData.nome,
                objetivo: aiData.objetivo,
                nivel: aiData.nivel,
                dias: aiData.dias
            });

            // 3. APLICAR CONFIGURAÇÃO AI SE HABILITADA
            this.applyAIConfiguration(aiData);

            // 4. MOSTRAR INDICADOR DE PROGRESSO
            this.app.showGeneratingIndicator();

            // 5. RESETAR CONTROLES DE EXERCÍCIOS
            this.resetExerciseControls();

            // 6. SIMULAR PROCESSAMENTO DA IA COM TIMEOUT
            setTimeout(async () => {
                try {
                    // CRIAR PLANO COM IA MELHORADA E PROPORCIONALIDADE
                    const aiGeneratedPlan = await this.createAIPlanWithIntelligentProportions(aiData);

                    // GARANTIR QUE O PLANO TENHA userId CORRETO
                    aiGeneratedPlan.userId = this.app.currentUserId;
                    aiGeneratedPlan.userEmail = this.app.userEmail;

                    // ADICIONAR À LISTA E SALVAR
                    await this.savePlanToStorage(aiGeneratedPlan);

                    this.app.hideGeneratingIndicator();
                    this.app.showMessage('✅ Plano gerado com proporcionalidade inteligente!', 'success');

                    // Mostrar relatório de proporcionalidade
                    this.showProportionalityReport(aiGeneratedPlan);

                    setTimeout(() => {
                        this.app.showPlanList();
                    }, 2500);

                } catch (error) {
                    console.error('❌ Erro ao gerar plano:', error);
                    this.app.hideGeneratingIndicator();
                    this.app.showMessage('Erro ao gerar plano. Tente novamente.', 'error');
                }
            }, 2000 + Math.random() * 2000);

        } catch (error) {
            console.error('💥 Erro crítico no generateAIPlan:', error);
            this.app.showMessage('Erro crítico ao gerar plano', 'error');
        }
    }

    // =============================================
    // CRIAR PLANO COM PROPORCIONALIDADE INTELIGENTE
    // =============================================

    async createAIPlanWithIntelligentProportions(aiData) {
        console.log('🧠 Criando plano com proporcionalidade inteligente...');
        
        let planId = this.app.core?.generateId() || this.generateLocalId();

        const plan = {
            id: planId,
            nome: this.generatePlanName(aiData),
            aluno: this.buildStudentData(aiData),
            userId: this.app.currentUserId,
            userEmail: this.app.userEmail || 'unknown',
            userDisplayName: this.app.userDisplayName || 'Usuário',
            dias: aiData.dias,
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            perfil: this.buildProfileData(aiData),
            treinos: await this.generateWorkoutsWithProportionality(aiData),
            observacoes: this.generateProportionalityObservations(aiData),
            tecnicas_aplicadas: this.app.getUsedTechniques(aiData.nivel),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_with_ai: true,
            ai_selection_strategy: 'intelligent_proportionality',
            proportionality_applied: this.exerciseProportions[aiData.objetivo]
        };

        console.log(`✅ Plano criado: ${plan.nome} com ${plan.treinos.length} treinos`);
        return plan;
    }

    // =============================================
    // GERAR TREINOS COM PROPORCIONALIDADE
    // =============================================

    async generateWorkoutsWithProportionality(aiData) {
        const workouts = [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const config = this.app.planTypeConfiguration.configuration;
        const proportions = this.exerciseProportions[aiData.objetivo];

        console.log(`🏋️ Gerando ${aiData.dias} treinos com proporcionalidade para: ${aiData.objetivo}`);

        for (let i = 0; i < aiData.dias; i++) {
            const letter = letters[i];
            const workoutConfig = config[letter];

            if (!workoutConfig) {
                console.warn(`⚠️ Configuração não encontrada para treino ${letter}`);
                continue;
            }

            console.log(`📋 Criando treino ${letter}: ${workoutConfig.name}`);

            const exercises = await this.generateProportionalExercisesForWorkout(
                workoutConfig.groups,
                aiData,
                i + 1,
                letter,
                proportions
            );

            workouts.push({
                id: letter,
                nome: workoutConfig.name,
                foco: this.app.generateWorkoutFocusFromGroups(workoutConfig.groups),
                exercicios: exercises,
                gruposMusculares: workoutConfig.groups,
                configuracao_original: workoutConfig,
                proportionalidade_aplicada: this.getWorkoutProportionReport(workoutConfig.groups, proportions),
                concluido: false,
                execucoes: 0,
                selection_strategy: 'proportional_intelligent'
            });
        }

        console.log(`✅ ${workouts.length} treinos gerados com proporcionalidade aplicada`);
        return workouts;
    }

    // =============================================
    // GERAR EXERCÍCIOS PROPORCIONAIS POR TREINO
    // =============================================

    async generateProportionalExercisesForWorkout(muscleGroups, aiData, workoutNumber, workoutLetter, proportions) {
        const exercises = [];
        let exerciseId = workoutNumber * 10;

        console.log(`🎯 Aplicando proporcionalidade para grupos: ${muscleGroups.join(', ')}`);

        // 1. AQUECIMENTO ESPECÍFICO
        exercises.push(this.createWarmupExercise(exerciseId++, muscleGroups, aiData));

        // 2. EXERCÍCIOS PRINCIPAIS COM PROPORCIONALIDADE INTELIGENTE
        for (const grupoId of muscleGroups) {
            const groupProportion = proportions[grupoId];
            
            if (!groupProportion) {
                console.warn(`⚠️ Proporcionalidade não definida para grupo: ${grupoId}`);
                continue;
            }

            // Determinar quantidade de exercícios baseada no objetivo e nível
            const exerciseCount = this.calculateExerciseCountForGroup(
                grupoId, 
                groupProportion, 
                aiData.nivel,
                aiData.tempo,
                muscleGroups.length
            );

            console.log(`📊 Grupo ${grupoId}: ${exerciseCount} exercícios (${groupProportion.recommended} recomendado)`);

            const groupExercises = await this.selectProportionalExercisesForGroup(
                grupoId, 
                exerciseCount,
                aiData, 
                workoutLetter
            );

            groupExercises.forEach(exerciseData => {
                exercises.push({
                    id: exerciseId++,
                    ...exerciseData,
                    concluido: false,
                    grupo_muscular: grupoId,
                    selection_method: 'proportional_intelligent',
                    proportion_applied: groupProportion
                });
            });
        }

        // 3. ALONGAMENTO ESPECÍFICO
        if (exercises.length > 1) {
            exercises.push(this.createCooldownExercise(exerciseId++, muscleGroups));
        }

        console.log(`✅ ${exercises.length} exercícios criados com proporcionalidade aplicada`);
        return exercises;
    }

    // =============================================
    // CALCULAR QUANTIDADE DE EXERCÍCIOS POR GRUPO
    // =============================================

    calculateExerciseCountForGroup(grupoId, proportion, nivel, tempoDisponivel, totalGroups) {
        let baseCount = proportion.recommended;
        
        // Ajustar por nível de experiência
        switch (nivel) {
            case 'iniciante':
                baseCount = Math.max(proportion.min, baseCount - 1);
                break;
            case 'intermediario':
                baseCount = proportion.recommended;
                break;
            case 'avancado':
                baseCount = Math.min(proportion.max, baseCount + 1);
                break;
        }

        // Ajustar por tempo disponível
        if (tempoDisponivel) {
            const timePerGroup = tempoDisponivel / totalGroups;
            
            if (timePerGroup < 15) {
                // Pouco tempo - reduzir exercícios
                baseCount = Math.max(proportion.min, baseCount - 1);
            } else if (timePerGroup > 25) {
                // Muito tempo - pode aumentar
                baseCount = Math.min(proportion.max, baseCount + 1);
            }
        }

        // Ajustes específicos por grupo (grandes músculos precisam de mais exercícios)
        const largeGroups = ['perna', 'costas', 'peito'];
        const smallGroups = ['biceps', 'triceps', 'antebraco'];

        if (largeGroups.includes(grupoId)) {
            baseCount = Math.max(baseCount, 2); // Mínimo 2 para grupos grandes
        } else if (smallGroups.includes(grupoId)) {
            baseCount = Math.min(baseCount, 3); // Máximo 3 para grupos pequenos
        }

        console.log(`📈 ${grupoId}: ${baseCount} exercícios (base: ${proportion.recommended}, nível: ${nivel})`);
        return baseCount;
    }

    // =============================================
    // SELECIONAR EXERCÍCIOS PROPORCIONAIS
    // =============================================

    async selectProportionalExercisesForGroup(grupoId, exerciseCount, aiData, workoutLetter) {
        const mappedGroup = this.app.mapCustomGroupToSystemGroup(grupoId);
        
        console.log(`🔍 Selecionando ${exerciseCount} exercícios para ${grupoId} (${mappedGroup})`);

        // Buscar exercícios disponíveis para o grupo
        const availableExercises = await this.getAvailableExercisesForGroup(mappedGroup);
        
        if (availableExercises.length === 0) {
            console.warn(`❌ Nenhum exercício encontrado para ${grupoId}`);
            return [this.createFallbackExercise(grupoId, aiData)];
        }

        // Aplicar filtros inteligentes
        const filteredExercises = this.applyIntelligentFilters(availableExercises, aiData);
        
        // Estratégia de seleção baseada na quantidade
        let selectedExercises;
        
        if (exerciseCount === 1) {
            selectedExercises = this.selectSingleBestExercise(filteredExercises, grupoId, aiData);
        } else if (exerciseCount === 2) {
            selectedExercises = this.selectComplementaryPair(filteredExercises, grupoId, aiData);
        } else {
            selectedExercises = this.selectDiverseExerciseSet(filteredExercises, grupoId, exerciseCount, aiData);
        }

        // Converter para formato final
        return selectedExercises.map((exercise, index) => 
            this.convertToProportionalExerciseFormat(exercise, aiData, index, grupoId, exerciseCount)
        );
    }

    // =============================================
    // ESTRATÉGIAS DE SELEÇÃO POR QUANTIDADE
    // =============================================

    selectSingleBestExercise(exercises, grupoId, aiData) {
        console.log(`🎯 Selecionando 1 exercício principal para ${grupoId}`);
        
        // Para um único exercício, priorizar compostos ou mais eficientes
        const scored = exercises.map(exercise => ({
            exercise,
            score: this.calculateSingleExerciseScore(exercise, grupoId, aiData.objetivo)
        }));

        scored.sort((a, b) => b.score - a.score);
        
        const selected = scored[0]?.exercise;
        if (selected) {
            this.usedExerciseNames.add(selected.nome);
            console.log(`✅ Selecionado: ${selected.nome} (score: ${scored[0].score})`);
        }
        
        return selected ? [selected] : [];
    }

    selectComplementaryPair(exercises, grupoId, aiData) {
        console.log(`🤝 Selecionando par complementar para ${grupoId}`);
        
        // Para dois exercícios, buscar complementaridade (composto + isolado)
        const compounds = exercises.filter(ex => this.isCompoundExercise(ex.nome.toLowerCase()));
        const isolations = exercises.filter(ex => !this.isCompoundExercise(ex.nome.toLowerCase()));
        
        let selected = [];
        
        // Estratégia: 1 composto + 1 isolado (se disponível)
        if (compounds.length > 0) {
            const bestCompound = this.selectBestFromGroup(compounds, grupoId, 'compound');
            selected.push(bestCompound);
            this.usedExerciseNames.add(bestCompound.nome);
        }
        
        if (isolations.length > 0 && selected.length < 2) {
            const bestIsolation = this.selectBestFromGroup(
                isolations.filter(ex => !this.usedExerciseNames.has(ex.nome)), 
                grupoId, 
                'isolation'
            );
            if (bestIsolation) {
                selected.push(bestIsolation);
                this.usedExerciseNames.add(bestIsolation.nome);
            }
        }
        
        // Se não conseguiu par complementar, selecionar os 2 melhores
        if (selected.length < 2) {
            const remaining = exercises.filter(ex => !this.usedExerciseNames.has(ex.nome));
            const additional = this.selectBestFromGroup(remaining, grupoId, 'best');
            if (additional && selected.length < 2) {
                selected.push(additional);
                this.usedExerciseNames.add(additional.nome);
            }
        }
        
        console.log(`✅ Par selecionado: ${selected.map(ex => ex.nome).join(', ')}`);
        return selected;
    }

    selectDiverseExerciseSet(exercises, grupoId, count, aiData) {
        console.log(`🌈 Selecionando conjunto diverso de ${count} exercícios para ${grupoId}`);
        
        const selected = [];
        const categories = {
            compound: exercises.filter(ex => this.isCompoundExercise(ex.nome.toLowerCase())),
            isolation: exercises.filter(ex => !this.isCompoundExercise(ex.nome.toLowerCase())),
            functional: exercises.filter(ex => this.isFunctionalExercise(ex.nome.toLowerCase()))
        };

        // Estratégia progressiva baseada na quantidade
        const selectionStrategy = this.getSelectionStrategy(count, grupoId);
        
        selectionStrategy.forEach((category, index) => {
            if (selected.length < count) {
                const availableInCategory = categories[category]?.filter(ex => 
                    !this.usedExerciseNames.has(ex.nome)
                ) || [];
                
                if (availableInCategory.length > 0) {
                    const exercise = this.selectBestFromGroup(availableInCategory, grupoId, category);
                    if (exercise) {
                        selected.push(exercise);
                        this.usedExerciseNames.add(exercise.nome);
                        console.log(`✅ ${index + 1}. ${exercise.nome} (${category})`);
                    }
                }
            }
        });

        // Completar com exercícios restantes se necessário
        while (selected.length < count) {
            const remaining = exercises.filter(ex => 
                !this.usedExerciseNames.has(ex.nome) &&
                !selected.some(sel => sel.nome === ex.nome)
            );
            
            if (remaining.length === 0) break;
            
            const additional = this.selectBestFromGroup(remaining, grupoId, 'additional');
            if (additional) {
                selected.push(additional);
                this.usedExerciseNames.add(additional.nome);
                console.log(`✅ ${selected.length}. ${additional.nome} (adicional)`);
            } else {
                break;
            }
        }

        console.log(`✅ Conjunto diverso selecionado: ${selected.map(ex => ex.nome).join(', ')}`);
        return selected;
    }

    // =============================================
    // MÉTODOS AUXILIARES DE SELEÇÃO
    // =============================================

    getSelectionStrategy(count, grupoId) {
        const strategies = {
            3: ['compound', 'isolation', 'functional'],
            4: ['compound', 'compound', 'isolation', 'functional'],
            5: ['compound', 'compound', 'isolation', 'isolation', 'functional']
        };

        // Estratégias específicas por grupo
        const groupStrategies = {
            'perna': {
                3: ['compound', 'compound', 'isolation'],
                4: ['compound', 'compound', 'isolation', 'functional']
            },
            'peito': {
                3: ['compound', 'isolation', 'functional'],
                4: ['compound', 'compound', 'isolation', 'isolation']
            },
            'costas': {
                3: ['compound', 'compound', 'isolation'],
                4: ['compound', 'compound', 'isolation', 'functional']
            }
        };

        return groupStrategies[grupoId]?.[count] || strategies[count] || ['compound', 'isolation'];
    }

    selectBestFromGroup(exercises, grupoId, category) {
        if (!exercises || exercises.length === 0) return null;

        const scored = exercises.map(exercise => ({
            exercise,
            score: this.calculateCategoryScore(exercise, grupoId, category)
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.exercise || null;
    }

    calculateSingleExerciseScore(exercise, grupoId, objetivo) {
        let score = 50; // Score base
        const name = exercise.nome.toLowerCase();

        // Bonus por ser composto (mais eficiente para exercício único)
        if (this.isCompoundExercise(name)) score += 30;

        // Bonus por objetivo específico
        if (objetivo.includes('Hipertrofia') && name.includes('livre')) score += 20;
        if (objetivo.includes('Força') && this.isCompoundExercise(name)) score += 25;
        if (objetivo.includes('Perda de peso') && this.isFunctionalExercise(name)) score += 15;

        return score;
    }

    calculateCategoryScore(exercise, grupoId, category) {
        let score = 50; // Score base
        const name = exercise.nome.toLowerCase();

        // Bonus baseado na categoria
        switch (category) {
            case 'compound':
                if (this.isCompoundExercise(name)) score += 25;
                break;
            case 'isolation':
                if (!this.isCompoundExercise(name) && !this.isFunctionalExercise(name)) score += 25;
                break;
            case 'functional':
                if (this.isFunctionalExercise(name)) score += 25;
                break;
        }

        // Penalizar similaridade
        score -= this.calculateSimilarityPenalty(exercise);

        return score;
    }

    // =============================================
    // CONVERSÃO PARA FORMATO DE EXERCÍCIO
    // =============================================

    convertToProportionalExerciseFormat(exercise, aiData, index, grupoId, totalExercises) {
        const specs = this.getProportionalSpecs(aiData.objetivo, index, totalExercises);
        const tecnicaSelecionada = this.selectProportionalTechnique(aiData.nivel, index, totalExercises);

        return {
            nome: exercise.nome,
            descricao: exercise.descricao || 'Descrição não disponível',
            series: specs.series,
            repeticoes: specs.repeticoes,
            carga: this.app.adjustLoadForLevel(specs.carga, aiData.nivel),
            descanso: specs.descanso,
            observacoesEspeciais: this.getProportionalObservation(tecnicaSelecionada, exercise.nome, index, totalExercises),
            tecnica: tecnicaSelecionada,
            categoria: this.categorizeExerciseByIndex(index, totalExercises),
            musculos_trabalhados: exercise.musculos || [],
            fonte: 'proportional_intelligent_selection',
            exercicio_posicao: index + 1,
            total_exercicios_grupo: totalExercises
        };
    }

    getProportionalSpecs(objetivo, exerciseIndex, totalExercises) {
        const baseSpecs = this.app.getObjectiveSpecs(objetivo);
        
        // Ajustar specs baseado na posição do exercício
        if (exerciseIndex === 0) {
            // Primeiro exercício: mais séries, menos repetições
            return {
                ...baseSpecs,
                series: Math.min(baseSpecs.series + 1, 5),
                repeticoes: this.adjustRepsForPosition('primeiro', baseSpecs.repeticoes)
            };
        } else if (exerciseIndex === totalExercises - 1) {
            // Último exercício: menos séries, mais repetições
            return {
                ...baseSpecs,
                series: Math.max(baseSpecs.series - 1, 2),
                repeticoes: this.adjustRepsForPosition('ultimo', baseSpecs.repeticoes)
            };
        }
        
        return baseSpecs;
    }

    adjustRepsForPosition(position, baseReps) {
        // Lógica para ajustar repetições baseado na posição
        if (position === 'primeiro') {
            // Primeiro exercício: faixa menor de reps (mais peso)
            return baseReps.replace(/(\d+)-(\d+)/, (match, min, max) => {
                const newMin = Math.max(parseInt(min) - 2, 1);
                const newMax = parseInt(max) - 2;
                return `${newMin}-${newMax}`;
            });
        } else if (position === 'ultimo') {
            // Último exercício: faixa maior de reps (menos peso)
            return baseReps.replace(/(\d+)-(\d+)/, (match, min, max) => {
                const newMin = parseInt(min) + 2;
                const newMax = parseInt(max) + 4;
                return `${newMin}-${newMax}`;
            });
        }
        
        return baseReps;
    }

    selectProportionalTechnique(nivel, exerciseIndex, totalExercises) {
        // Aplicar técnicas avançadas baseado na posição e quantidade
        if (totalExercises === 1) {
            return nivel === 'avancado' ? 'drop-set' : '';
        }
        
        if (exerciseIndex === totalExercises - 1 && totalExercises > 2) {
            // Último exercício de sequência: técnicas de finalização
            const finishingTechniques = ['drop-set', 'rest-pause', 'serie-queima'];
            return finishingTechniques[Math.floor(Math.random() * finishingTechniques.length)];
        }
        
        return this.app.getTecnicaForExercise(exerciseIndex, nivel, 'geral');
    }

    categorizeExerciseByIndex(index, total) {
        if (total === 1) return 'principal';
        if (index === 0) return 'principal';
        if (index === total - 1) return 'finalizacao';
        return 'auxiliar';
    }

    getProportionalObservation(tecnica, exerciseName, index, total) {
        let observation = this.app.getObservacaoEspecial(tecnica, exerciseName);
        
        // Adicionar observações específicas por posição
        const positionNotes = {
            0: 'Exercício principal - foque na técnica e progressão de carga',
            [total - 1]: total > 2 ? 'Exercício de finalização - busque o esgotamento controlado' : 'Exercício complementar'
        };
        
        const positionNote = positionNotes[index];
        if (positionNote && observation) {
            return `${observation}. ${positionNote}`;
        } else if (positionNote) {
            return positionNote;
        }
        
        return observation;
    }

    // =============================================
    // RELATÓRIOS E OBSERVAÇÕES DE PROPORCIONALIDADE
    // =============================================

    generateProportionalityObservations(aiData) {
        const baseObservations = this.app.generateAdvancedObservations(aiData);
        const proportionInfo = this.exerciseProportions[aiData.objetivo];
        
        // Adicionar observações específicas sobre proporcionalidade
        const proportionalityNotes = {
            proporcionalidade: this.generateProportionalityExplanation(aiData.objetivo),
            distribuicao_exercicios: this.generateExerciseDistributionNote(proportionInfo),
            ajustes_por_nivel: this.generateLevelAdjustmentNote(aiData.nivel),
            progressao_recomendada: this.generateProgressionNote(aiData.objetivo, aiData.nivel)
        };

        return {
            ...baseObservations,
            ...proportionalityNotes
        };
    }

    generateProportionalityExplanation(objetivo) {
        const explanations = {
            'Hipertrofia e ganho de massa muscular': 
                'Proporcionalidade otimizada para máximo estímulo hipertrófico. Grupos grandes (pernas, costas, peito) recebem 3-4 exercícios para volume adequado, enquanto grupos menores (bíceps, antebraços) têm 1-2 exercícios para evitar overtraining.',
            
            'Perda de peso e definição': 
                'Distribuição focada em exercícios que maximizam gasto calórico. Prioridade para movimentos compostos e funcionais, com volume moderado para preservar massa muscular durante o déficit calórico.',
            
            'Condicionamento geral': 
                'Proporcionalidade equilibrada visando desenvolvimento harmonioso. Quantidade moderada de exercícios por grupo para permitir recuperação adequada e frequência de treino mais alta.',
            
            'Força e potência': 
                'Foco em exercícios principais com menor volume total. Grupos grandes recebem exercícios compostos prioritários, grupos menores trabalham como sinergistas nos movimentos principais.',
            
            'Resistência muscular': 
                'Volume aumentado para desenvolver capacidade de trabalho prolongado. Distribuição permite alto número de repetições sem comprometer a qualidade técnica.'
        };

        return explanations[objetivo] || 'Proporcionalidade padrão aplicada conforme objetivo selecionado.';
    }

    generateExerciseDistributionNote(proportionInfo) {
        const groupCounts = Object.entries(proportionInfo)
            .map(([group, info]) => `${group}: ${info.recommended} exercícios`)
            .join(', ');
        
        return `Distribuição recomendada por grupo muscular: ${groupCounts}. ' +
            'Esta proporção foi cientificamente calculada para otimizar os resultados do seu objetivo específico.`;
    }

    generateLevelAdjustmentNote(nivel) {
        const adjustments = {
            'iniciante': 'Volume reduzido em 1 exercício por grupo para adaptação gradual e foco na aprendizagem técnica.',
            'intermediario': 'Volume padrão conforme recomendações para desenvolvimento consistente.',
            'avancado': 'Volume aumentado em 1 exercício para grupos grandes, permitindo maior especialização e intensidade.'
        };

        return adjustments[nivel] || 'Ajustes padrão aplicados conforme nível de experiência.';
    }

    generateProgressionNote(objetivo, nivel) {
        return `Para ${objetivo.toLowerCase()} no nível ${nivel}, recomenda-se progressão gradual: ` +
               'aumente carga em 2-5% quando conseguir completar todas as séries no limite superior de repetições. ' +
               'Avalie semanalmente e ajuste conforme recuperação e adaptação individual.';
    }

    getWorkoutProportionReport(groups, proportions) {
        return groups.map(groupId => ({
            grupo: groupId,
            exercicios_recomendados: proportions[groupId]?.recommended || 1,
            faixa: `${proportions[groupId]?.min || 1}-${proportions[groupId]?.max || 1}`,
            aplicado: true
        }));
    }

    showProportionalityReport(plan) {
        const totalExercises = plan.treinos.reduce((total, treino) => 
            total + (treino.exercicios?.length || 0), 0
        );

        let reportMessage = `📊 RELATÓRIO DE PROPORCIONALIDADE\n\n`;
        reportMessage += `✅ Plano: ${plan.nome}\n`;
        reportMessage += `🎯 Objetivo: ${plan.perfil.objetivo}\n`;
        reportMessage += `📈 Total de exercícios: ${totalExercises}\n`;
        reportMessage += `🏋️ Treinos gerados: ${plan.treinos.length}\n\n`;

        plan.treinos.forEach(treino => {
            const exercisesByGroup = {};
            treino.exercicios?.forEach(ex => {
                if (ex.grupo_muscular && ex.categoria !== 'aquecimento' && ex.categoria !== 'alongamento') {
                    exercisesByGroup[ex.grupo_muscular] = (exercisesByGroup[ex.grupo_muscular] || 0) + 1;
                }
            });

            reportMessage += `📋 ${treino.nome}:\n`;
            Object.entries(exercisesByGroup).forEach(([grupo, count]) => {
                reportMessage += `   • ${grupo}: ${count} exercícios\n`;
            });
            reportMessage += '\n';
        });

        console.log(reportMessage);
        
        // Mostrar notificação resumida
        const summaryGroups = this.getSummaryByGroup(plan);
        const summaryText = Object.entries(summaryGroups)
            .map(([group, count]) => `${group}: ${count}`)
            .join(', ');
        
        this.app.showMessage(`Proporcionalidade aplicada: ${summaryText}`, 'info', 6000);
    }

    getSummaryByGroup(plan) {
        const summary = {};
        
        plan.treinos.forEach(treino => {
            treino.exercicios?.forEach(ex => {
                if (ex.grupo_muscular && ex.categoria !== 'aquecimento' && ex.categoria !== 'alongamento') {
                    summary[ex.grupo_muscular] = (summary[ex.grupo_muscular] || 0) + 1;
                }
            });
        });
        
        return summary;
    }

    // =============================================
    // MÉTODOS AUXILIARES EXISTENTES (mantidos)
    // =============================================

    collectAIFormData() {
        return {
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
            observacoes: document.getElementById('aiSpecialNotes')?.value,
            idade: null // Será calculado
        };
    }

    validateAIData(aiData) {
        if (!aiData.nome) {
            this.app.showMessage('Por favor, preencha o nome do aluno', 'error');
            return false;
        }

        if (!aiData.dias || aiData.dias < 1 || aiData.dias > 6) {
            this.app.showMessage('Selecione um número válido de dias (1-6)', 'error');
            return false;
        }

        // Calcular idade
        aiData.idade = aiData.dataNascimento ? this.app.calculateAge(aiData.dataNascimento) : 25;
        return true;
    }

    applyAIConfiguration(aiData) {
        if (this.app.aiMuscleConfig.enabled) {
            if (!this.app.validateAICompleteConfig()) {
                return;
            }
            this.app.planTypeConfiguration.days = aiData.dias;
            this.app.planTypeConfiguration.configuration = { ...this.app.aiMuscleConfig.workouts };
        } else {
            const hasCustomConfig = this.app.planTypeConfiguration.days === aiData.dias &&
                Object.keys(this.app.planTypeConfiguration.configuration).length > 0;

            if (!hasCustomConfig) {
                this.app.planTypeConfiguration.days = aiData.dias;
                this.app.planTypeConfiguration.configuration = 
                    this.app.planTypeConfiguration.presetConfigurations[aiData.dias] || {};
            }
        }
        this.app.savePlanTypeConfiguration();
    }

    resetExerciseControls() {
        this.usedExerciseNames.clear();
        this.groupMuscleRotation = {};
    }

    // Buscar exercícios disponíveis para grupo (mantido do código original)
    async getAvailableExercisesForGroup(mappedGroup) {
        if (!this.app.core?.exerciseDatabase) {
            console.warn('Base de exercícios não disponível');
            return [];
        }

        const searchVariations = this.getGroupSearchVariations(mappedGroup);
        
        for (const variation of searchVariations) {
            const found = this.app.core.exerciseDatabase.filter(exercise => {
                const exerciseGroup = (exercise.grupo || '').toLowerCase().trim();
                const targetGroup = variation.toLowerCase().trim();
                
                return exerciseGroup === targetGroup ||
                       exerciseGroup.includes(targetGroup) ||
                       targetGroup.includes(exerciseGroup);
            });

            if (found.length > 0) {
                console.log(`Encontrados ${found.length} exercícios para variação "${variation}"`);
                return found;
            }
        }

        return [];
    }

    // Aplicar filtros inteligentes (mantido)
    applyIntelligentFilters(exercises, aiData) {
        let filtered = [...exercises];

        // 1. Filtro por limitações
        if (aiData.limitacoes) {
            filtered = this.filterByLimitations(filtered, aiData.limitacoes);
        }

        // 2. Filtro por equipamentos
        if (aiData.equipamentos && aiData.equipamentos !== 'completa') {
            filtered = this.filterByEquipment(filtered, aiData.equipamentos);
        }

        // 3. Filtro por nível
        filtered = this.filterByLevel(filtered, aiData.nivel);

        // 4. Remover exercícios já usados
        filtered = filtered.filter(ex => !this.usedExerciseNames.has(ex.nome));

        // 5. Evitar exercícios com nomes similares
        filtered = this.removeSimilarNameExercises(filtered);

        return filtered;
    }

    calculateSimilarityPenalty(exercise) {
        let penalty = 0;
        const name = exercise.nome.toLowerCase();
        
        for (const usedName of this.usedExerciseNames) {
            const usedLower = usedName.toLowerCase();
            const similarity = this.calculateNameSimilarity(name, usedLower);
            
            if (similarity > 0.6) {
                penalty += 20;
            } else if (similarity > 0.4) {
                penalty += 10;
            }
        }
        
        return penalty;
    }

    calculateNameSimilarity(name1, name2) {
        const words1 = name1.split(' ');
        const words2 = name2.split(' ');
        
        let matches = 0;
        words1.forEach(word1 => {
            if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
                matches++;
            }
        });
        
        return matches / Math.max(words1.length, words2.length);
    }

    // Métodos auxiliares de filtros (mantidos)
    filterByLimitations(exercises, limitations) {
        if (!limitations) return exercises;
        
        const limitationsLower = limitations.toLowerCase();
        
        return exercises.filter(exercise => {
            const name = exercise.nome.toLowerCase();
            
            if (limitationsLower.includes('joelho') && 
                (name.includes('agachamento') || name.includes('afundo'))) {
                return false;
            }
            
            if (limitationsLower.includes('ombro') && 
                (name.includes('desenvolvimento') || name.includes('elevação'))) {
                return false;
            }
            
            if (limitationsLower.includes('lombar') && 
                (name.includes('terra') || name.includes('remada curvada'))) {
                return false;
            }
            
            return true;
        });
    }

    filterByEquipment(exercises, equipment) {
        if (equipment === 'basica') {
            return exercises.filter(ex => 
                !ex.nome.toLowerCase().includes('máquina') &&
                !ex.nome.toLowerCase().includes('cabo')
            );
        }
        return exercises;
    }

    filterByLevel(exercises, level) {
        if (level === 'iniciante') {
            return exercises.filter(ex => 
                !ex.nome.toLowerCase().includes('avançado') &&
                !ex.nome.toLowerCase().includes('livre')
            );
        }
        return exercises;
    }

    removeSimilarNameExercises(exercises) {
        const filtered = [];
        const usedPrefixes = new Set();

        exercises.forEach(exercise => {
            const prefix = this.getExercisePrefix(exercise.nome);
            
            if (!usedPrefixes.has(prefix)) {
                filtered.push(exercise);
                usedPrefixes.add(prefix);
            }
        });

        return filtered;
    }

    getExercisePrefix(name) {
        const words = name.toLowerCase().split(' ');
        const significantWords = words.filter(word => 
            !['de', 'da', 'do', 'com', 'em', 'para', 'no', 'na'].includes(word)
        );
        
        return significantWords.slice(0, 2).join(' ');
    }

    // Métodos de verificação de tipos de exercício (mantidos)
    isCompoundExercise(name) {
        const compoundKeywords = [
            'supino', 'agachamento', 'terra', 'remada', 'desenvolvimento',
            'barra fixa', 'paralela', 'clean', 'snatch', 'thruster'
        ];
        
        return compoundKeywords.some(keyword => name.includes(keyword));
    }

    isFunctionalExercise(name) {
        const functionalKeywords = [
            'funcional', 'kettlebell', 'medicine ball', 'burpee',
            'mountain climber', 'bear crawl'
        ];
        
        return functionalKeywords.some(keyword => name.includes(keyword));
    }

    getGroupSearchVariations(grupo) {
        const variations = {
            'perna': ['perna', 'pernas', 'quadriceps', 'coxa', 'leg'],
            'gluteo': ['gluteo', 'gluteos', 'glúteo', 'glúteos', 'posterior'],
            'ombro': ['ombro', 'ombros', 'shoulder', 'deltoide'],
            'corpo': ['corpo', 'funcional', 'full body', 'geral'],
            'costas': ['costas', 'back', 'dorsal', 'latissimo'],
            'peito': ['peito', 'peitoral', 'chest'],
            'biceps': ['biceps', 'bíceps'],
            'triceps': ['triceps', 'tríceps'],
            'antebraco': ['antebraco', 'antebraço', 'forearm'],
            'abdome': ['abdome', 'abdominal', 'abs', 'core']
        };

        return variations[grupo] || [grupo];
    }

    // Métodos de criação de exercícios específicos (mantidos)
    createWarmupExercise(id, muscleGroups, aiData) {
        return {
            id: id,
            nome: this.app.getSmartWarmupForGroups(muscleGroups, aiData.equipamentos),
            descricao: this.app.getWarmupDescriptionForGroups(muscleGroups),
            series: 1,
            repeticoes: "8-10 min",
            carga: this.app.getWarmupIntensity(),
            descanso: '0',
            observacoesEspeciais: 'Aquecimento progressivo e específico',
            tecnica: '',
            categoria: 'aquecimento'
        };
    }

    createCooldownExercise(id, muscleGroups) {
        return {
            id: id,
            nome: this.app.getSmartCooldownForGroups(muscleGroups),
            descricao: "Relaxamento e flexibilidade dos grupos musculares trabalhados",
            series: 1,
            repeticoes: "8-10 min",
            carga: "Peso corporal",
            descanso: '0',
            observacoesEspeciais: 'Foco nos grupos trabalhados no treino',
            tecnica: '',
            categoria: 'alongamento'
        };
    }

    createFallbackExercise(grupoId, aiData) {
        const specs = this.app.getObjectiveSpecs(aiData.objetivo);
        
        return {
            nome: this.app.getFallbackExercise(grupoId),
            descricao: `Exercício básico para ${grupoId}`,
            series: specs.series,
            repeticoes: specs.repeticoes,
            carga: specs.carga,
            descanso: specs.descanso,
            observacoesEspeciais: 'Exercício substituto - ajustar conforme necessário',
            tecnica: '',
            categoria: 'substituto',
            fonte: 'fallback'
        };
    }

    // Métodos de construção de dados (mantidos)
    generatePlanName(aiData) {
        const letters = this.app.getWorkoutLetters(aiData.dias);
        const levelMap = {
            'iniciante': 'Iniciante',
            'intermediario': 'Intermediário', 
            'avancado': 'Avançado'
        };
        
        const objectiveShort = aiData.objetivo.split(' ')[0];
        const level = levelMap[aiData.nivel] || 'Intermediário';
        
        return `${aiData.nome} - Treino ${letters} (${level}) ${objectiveShort}`;
    }

    buildStudentData(aiData) {
        return {
            nome: aiData.nome,
            dataNascimento: aiData.dataNascimento,
            cpf: aiData.cpf || '',
            idade: aiData.idade,
            altura: aiData.altura,
            peso: aiData.peso
        };
    }

    buildProfileData(aiData) {
        return {
            idade: aiData.idade,
            altura: aiData.altura,
            peso: aiData.peso,
            porte: this.app.calculateBodyType(aiData.altura, aiData.peso),
            objetivo: aiData.objetivo
        };
    }

    generateLocalId() {
        return 'local_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Salvamento e finalização (mantido)
    async savePlanToStorage(plan) {
        this.app.savedPlans.push(plan);
        console.log(`Plano adicionado à lista. Total: ${this.app.savedPlans.length}`);

        if (this.app.core && this.app.core.firebaseConnected && 
            typeof this.app.core.savePlanToFirebase === 'function') {
            try {
                const firebaseId = await this.app.core.savePlanToFirebase(plan);
                plan.id = firebaseId;
                plan.saved_in_firebase = true;
                console.log('Plano IA salvo no Firebase:', firebaseId);
            } catch (firebaseError) {
                console.warn('Erro Firebase (não bloqueia):', firebaseError);
                plan.saved_in_localstorage_only = true;
                plan.retry_firebase = true;
            }
        } else {
            console.warn('Firebase indisponível, salvando apenas localmente');
            plan.saved_in_localstorage_only = true;
        }

        await this.app.saveToUserLocalStorage();

        if (this.app.aiMuscleConfig.enabled) {
            this.app.resetAIMuscleConfigAfterGeneration();
        }
    }
}
