// js/components/ExerciseManager.js - VERSÃO COMPLETA CRUD
class ExerciseManager {
    constructor(personalApp) {
        this.app = personalApp;
        this.core = personalApp.core;
        this.exercises = [];
        this.filteredExercises = [];
        this.currentEditingId = null;
        this.isEditing = false;
        this.renderer = null;
        this.validator = null;
        this.searchMinLength = 2;
        this.debounceTimer = null;
        
        console.log('💪 ExerciseManager inicializado');
    }
    
    async init() {
        try {
            this.validator = new ExerciseFormValidator();
            this.renderer = new ExerciseRenderer(this);
            
            await this.loadExercises();
            this.setupEventListeners();
            window.exerciseManager = this;
            
            console.log('✅ ExerciseManager pronto para CRUD');
            
        } catch (error) {
            console.warn('⚠️ Erro na inicialização do ExerciseManager:', error);
        }
    }
    
    async loadExercises() {
        try {
            if (this.core && this.core.exerciseDatabase) {
                this.exercises = [...this.core.exerciseDatabase];
                console.log(`📊 ${this.exercises.length} exercícios disponíveis`);
            } else {
                console.warn('⚠️ Base de exercícios não disponível');
                this.exercises = [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar exercícios:', error);
            this.exercises = [];
        }
    }
    
    // ========================================
    // MÉTODOS DE INTERFACE E NAVEGAÇÃO
    // ========================================
    
    show() {
        console.log('👁️ Mostrando gerenciador de exercícios');
        this.populateGroupFilterDB();
        this.showSearchPrompt();
        this.updateStats();
    }
    
    updateStats() {
        const statsElement = document.getElementById('exerciseStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span class="stats-label">${this.exercises.length} exercícios disponíveis</span>
            `;
        }
    }
    
    showSearchPrompt() {
        const container = document.getElementById('exerciseList');
        if (!container) return;
        
        const totalExercises = this.exercises.length;
        
        container.innerHTML = `
            <div class="search-prompt">
                <div class="search-icon">🔍</div>
                <h3>Busca de Exercícios</h3>
                <p><strong>${totalExercises}</strong> exercícios disponíveis na base</p>
                <div class="search-instructions">
                    <div class="instruction-item">
                        <span class="instruction-icon">✏️</span>
                        <span>Digite pelo menos <strong>${this.searchMinLength} caracteres</strong> no campo de busca</span>
                    </div>
                    <div class="instruction-item">
                        <span class="instruction-icon">🏷️</span>
                        <span>Ou selecione um <strong>grupo muscular</strong> para filtrar</span>
                    </div>
                    <div class="instruction-item">
                        <span class="instruction-icon">⚡</span>
                        <span>Use <strong>Enter</strong> para buscar rapidamente</span>
                    </div>
                </div>
                <div class="search-examples">
                    <p><strong>Exemplos de busca:</strong></p>
                    <div class="example-tags">
                        <span class="example-tag" onclick="exerciseManager.quickSearch('supino')">supino</span>
                        <span class="example-tag" onclick="exerciseManager.quickSearch('agachamento')">agachamento</span>
                        <span class="example-tag" onclick="exerciseManager.quickSearch('rosca')">rosca</span>
                        <span class="example-tag" onclick="exerciseManager.quickSearch('remada')">remada</span>
                        <span class="example-tag" onclick="exerciseManager.quickSearch('desenvolvimento')">desenvolvimento</span>
                    </div>
                </div>
                <div class="quick-actions">
                    <button class="btn btn-primary" onclick="exerciseManager.showAddForm()">
                        ➕ Adicionar Novo Exercício
                    </button>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // MÉTODOS DE BUSCA E FILTRO
    // ========================================
    setupEventListeners() {
        const groupFilter = document.getElementById('exerciseGroupFilterDB');
        const searchInput = document.getElementById('exerciseSearch'); // NOVO
        
        if (groupFilter) {
            groupFilter.addEventListener('change', (e) => {
                const searchInput = document.getElementById('exerciseSearch');
                this.performSearch(searchInput?.value || '', e.target.value);
            });
        }
        
        // NOVO: Event listeners para busca por nome
        if (searchInput) {
            // Busca ao digitar (com debounce)
            searchInput.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });
            
            // Busca ao pressionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const groupFilter = document.getElementById('exerciseGroupFilterDB');
                    this.performSearch(e.target.value, groupFilter?.value || '');
                }
            });
        }
    }
    
    debounceSearch(searchTerm) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            // CORREÇÃO: Capturar o valor atual do filtro
            const groupFilter = document.getElementById('exerciseGroupFilterDB');
            const groupValue = groupFilter?.value || '';
            console.log('⏰ Debounce executado - Grupo:', groupValue, 'Busca:', searchTerm);
            this.performSearch(searchTerm, groupValue);
        }, 500);
    }
    
    performSearch(searchTerm = '', groupFilter = '') {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        
        console.log(`Buscando: "${trimmedSearch}" | Grupo: "${groupFilter}"`);
        
        this.filteredExercises = this.exercises.filter(exercise => {
            // Busca por texto no NOME do exercício
            const matchesSearch = !trimmedSearch || 
                exercise.nome.toLowerCase().includes(trimmedSearch);
            
            // Filtro por grupo
            const matchesGroup = !groupFilter || 
                groupFilter === 'todos' || 
                exercise.grupo.toLowerCase() === groupFilter.toLowerCase();
            
            return matchesSearch && matchesGroup;
        });
        
        console.log(`${this.filteredExercises.length} exercícios encontrados`);
        this.renderSearchResults();
    }
    
    quickSearch(term) {
        const searchInput = document.getElementById('exerciseSearch');
        if (searchInput) {
            searchInput.value = term;
            searchInput.focus();
            this.performSearch(term);
        }
    }
    
    clearSearch() {
        const searchInput = document.getElementById('exerciseSearch');
        const groupFilter = document.getElementById('exerciseGroupFilterDB');
        
        if (searchInput) searchInput.value = '';
        if (groupFilter) groupFilter.value = '';
        
        this.filteredExercises = [];
        this.showSearchPrompt();
    }
    
    // ========================================
    // CRUD - CREATE (ADICIONAR)
    // ========================================
    
    showAddForm() {
        console.log('➕ Mostrando formulário de novo exercício');
        this.isEditing = false;
        this.currentEditingId = null;
        
        const formContainer = document.getElementById('exerciseForm');
        if (!formContainer) return;
        
        formContainer.innerHTML = this.renderer.renderForm();
        formContainer.style.display = 'block';
        
        // Focar no primeiro campo
        setTimeout(() => {
            const firstInput = formContainer.querySelector('input[name="nome"]');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Scroll para o formulário
        formContainer.scrollIntoView({ behavior: 'smooth' });
        
        this.setupFormListeners();
    }
    
    async addExercise(formData) {
        try {
            console.log('➕ Adicionando novo exercício:', formData.nome);
            
            // Validar dados
            const validation = this.validator.validate(formData);
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            
            // Verificar se exercício já existe
            const existingExercise = this.exercises.find(ex => 
                ex.nome.toLowerCase() === formData.nome.toLowerCase()
            );
            
            if (existingExercise) {
                this.app.showMessage('❌ Já existe um exercício com este nome', 'error');
                return;
            }
            
            this.app.showMessage('💾 Salvando exercício...', 'info');
            
            // Criar novo exercício
            const newExercise = {
                id: this.generateId(),
                codigo: await this.generateNextCode(),
                nome: formData.nome.trim(),
                grupo: formData.grupo,
                descricao: formData.descricao.trim(),
                gif: formData.gif?.trim() || null,
                musculos_secundarios: this.parseMuscleList(formData.musculos_secundarios),
                created_at: new Date().toISOString(),
                created_by: this.app.currentUserId,
                updated_at: new Date().toISOString(),
                ativo: true
            };
            
            // Adicionar à lista local
            this.exercises.push(newExercise);
            
            // Salvar no Firebase e na base do core
            await this.saveToFirebase(newExercise);
            this.updateCoreDatabase();
            
            // Atualizar interface
            this.hideForm();
            this.updateStats();
            
            // Se havia busca ativa, refazer busca para mostrar o novo exercício
            const searchInput = document.getElementById('exerciseSearch');
            const groupFilter = document.getElementById('exerciseGroupFilterDB');
            
            if (searchInput?.value || groupFilter?.value) {
                this.performSearch(searchInput.value, groupFilter.value);
            } else {
                this.showSearchPrompt();
            }
            
            this.app.showMessage('✅ Exercício adicionado com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao adicionar exercício:', error);
            this.app.showMessage('❌ Erro ao adicionar exercício: ' + error.message, 'error');
        }
    }

    
    
    // ========================================
    // CRUD - READ (VISUALIZAR)
    // ========================================
    
    viewExercise(exerciseId) {
        console.log('👁️ Visualizando exercício:', exerciseId);
        
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) {
            this.app.showMessage('❌ Exercício não encontrado', 'error');
            return;
        }
        
        this.showExerciseModal(exercise);
    }
    
    showExerciseModal(exercise) {
        const modalHTML = `
            <div class="modal-overlay" id="exerciseViewModal" onclick="this.remove()">
                <div class="modal-content exercise-view-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>👁️ Visualizar Exercício</h3>
                        <button class="modal-close" onclick="document.getElementById('exerciseViewModal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="exercise-view-grid">
                            <div class="exercise-info">
                                <h4>${exercise.nome}</h4>
                                <div class="exercise-meta-tags">
                                    <span class="meta-tag group-tag">
                                        ${this.getGroupDisplayName(exercise.grupo)}
                                    </span>
                                    ${exercise.codigo ? `<span class="meta-tag code-tag">#${exercise.codigo}</span>` : ''}
                                    <span class="meta-tag date-tag">
                                        Criado: ${this.formatDate(exercise.created_at)}
                                    </span>
                                </div>
                                
                                <div class="exercise-description-full">
                                    <h5>📋 Descrição/Técnica:</h5>
                                    <p>${exercise.descricao || 'Sem descrição disponível'}</p>
                                </div>
                                
                                ${exercise.musculos_secundarios && exercise.musculos_secundarios.length > 0 ? `
                                    <div class="secondary-muscles">
                                        <h5>💪 Músculos Secundários:</h5>
                                        <div class="muscle-tags">
                                            ${exercise.musculos_secundarios.map(muscle => 
                                                `<span class="muscle-tag">${muscle}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${exercise.gif ? `
                                <div class="exercise-media-full">
                                    <h5>🎬 Demonstração:</h5>
                                    <img src="${exercise.gif}" alt="${exercise.nome}" class="exercise-gif-full" 
                                         onerror="this.parentElement.innerHTML='<p>❌ Não foi possível carregar a imagem</p>'">
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="exerciseManager.editExerciseDB('${exercise.id || exercise.codigo}')">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger" onclick="exerciseManager.deleteExercise('${exercise.id || exercise.codigo}')">
                            🗑️ Excluir
                        </button>
                        <button class="btn btn-outline" onclick="document.getElementById('exerciseViewModal').remove()">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // ========================================
    // CRUD - UPDATE (EDITAR)
    // ========================================
    
    editExerciseDB(exerciseId) {
        console.log('✏️ Editando exercício:', exerciseId);
        
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) {
            this.app.showMessage('❌ Exercício não encontrado', 'error');
            return;
        }
        
        // Fechar modal de visualização se estiver aberto
        const viewModal = document.getElementById('exerciseViewModal');
        if (viewModal) viewModal.remove();
        
        this.isEditing = true;
        this.currentEditingId = exerciseId;
        
        const formContainer = document.getElementById('exerciseForm');
        if (!formContainer) return;
        
        formContainer.innerHTML = this.renderer.renderForm(exercise);
        formContainer.style.display = 'block';
        
        // Focar no primeiro campo
        setTimeout(() => {
            const firstInput = formContainer.querySelector('input[name="nome"]');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 100);
        
        // Scroll para o formulário
        formContainer.scrollIntoView({ behavior: 'smooth' });
        
        this.setupFormListeners();
    }
    
    async updateExercise(exerciseId, formData) {
        try {
            console.log('💾 Atualizando exercício:', exerciseId);
            
            // Validar dados
            const validation = this.validator.validate(formData);
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            
            // Encontrar exercício
            const exerciseIndex = this.exercises.findIndex(ex => 
                (ex.id && ex.id === exerciseId) || (ex.codigo && ex.codigo === exerciseId)
            );
            
            if (exerciseIndex === -1) {
                this.app.showMessage('❌ Exercício não encontrado', 'error');
                return;
            }
            
            // Verificar se nome não conflita com outro exercício
            const existingExercise = this.exercises.find(ex => 
                ex.nome.toLowerCase() === formData.nome.toLowerCase() &&
                ex.id !== exerciseId && ex.codigo !== exerciseId
            );
            
            if (existingExercise) {
                this.app.showMessage('❌ Já existe outro exercício com este nome', 'error');
                return;
            }
            
            this.app.showMessage('💾 Salvando alterações...', 'info');
            
            // Atualizar exercício
            const updatedExercise = {
                ...this.exercises[exerciseIndex],
                nome: formData.nome.trim(),
                grupo: formData.grupo,
                descricao: formData.descricao.trim(),
                gif: formData.gif?.trim() || null,
                musculos_secundarios: this.parseMuscleList(formData.musculos_secundarios),
                updated_at: new Date().toISOString(),
                updated_by: this.app.currentUserId
            };
            
            this.exercises[exerciseIndex] = updatedExercise;
            
            // Salvar no Firebase e na base do core
            await this.saveToFirebase(updatedExercise);
            this.updateCoreDatabase();
            
            // Atualizar interface
            this.hideForm();
            this.isEditing = false;
            this.currentEditingId = null;
            
            // Refazer busca se ativa
            const searchInput = document.getElementById('exerciseSearch');
            const groupFilter = document.getElementById('exerciseGroupFilterDB');
            
            if (searchInput?.value || groupFilter?.value) {
                this.performSearch(searchInput.value, groupFilter.value);
            } else {
                this.showSearchPrompt();
            }
            
            this.app.showMessage('✅ Exercício atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar exercício:', error);
            this.app.showMessage('❌ Erro ao atualizar exercício: ' + error.message, 'error');
        }
    }
    
    // ========================================
    // CRUD - DELETE (EXCLUIR)
    // ========================================
    
    deleteExercise(exerciseId) {
        console.log('🗑️ Solicitando exclusão:', exerciseId);
        
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) {
            this.app.showMessage('❌ Exercício não encontrado', 'error');
            return;
        }
        
        this.showDeleteConfirmation(exercise);
    }
    
    showDeleteConfirmation(exercise) {
        const modalHTML = `
            <div class="modal-overlay" id="deleteConfirmModal" onclick="this.remove()">
                <div class="modal-content delete-confirm-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🗑️ Confirmar Exclusão</h3>
                        <button class="modal-close" onclick="document.getElementById('deleteConfirmModal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="delete-warning">
                            <div class="warning-icon">⚠️</div>
                            <p><strong>Tem certeza que deseja excluir este exercício?</strong></p>
                        </div>
                        
                        <div class="exercise-to-delete">
                            <h4>${exercise.nome}</h4>
                            <p><strong>Grupo:</strong> ${this.getGroupDisplayName(exercise.grupo)}</p>
                            ${exercise.codigo ? `<p><strong>Código:</strong> #${exercise.codigo}</p>` : ''}
                        </div>
                        
                        <div class="delete-consequences">
                            <h5>⚠️ Consequências da exclusão:</h5>
                            <ul>
                                <li>O exercício será removido permanentemente da base de dados</li>
                                <li>Planos de treino que usam este exercício podem ser afetados</li>
                                <li>Esta ação não pode ser desfeita</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" onclick="exerciseManager.confirmDelete('${exercise.id || exercise.codigo}')">
                            🗑️ Sim, Excluir
                        </button>
                        <button class="btn btn-outline" onclick="document.getElementById('deleteConfirmModal').remove()">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    async confirmDelete(exerciseId) {
        try {
            console.log('Confirmando exclusão:', exerciseId);
            
            // Fechar modals
            const deleteModal = document.getElementById('deleteConfirmModal');
            if (deleteModal) deleteModal.remove();
            
            const viewModal = document.getElementById('exerciseViewModal');
            if (viewModal) viewModal.remove();
            
            this.app.showMessage('Excluindo exercício...', 'info');
            
            // Encontrar exercício
            const exerciseIndex = this.exercises.findIndex(ex => 
                (ex.id && ex.id === exerciseId) || (ex.codigo && ex.codigo === exerciseId)
            );
            
            if (exerciseIndex === -1) {
                this.app.showMessage('Exercício não encontrado', 'error');
                return;
            }
            
            const exercise = this.exercises[exerciseIndex];
            const exerciseName = exercise.nome;
            
            // Deletar imagem do Firebase se existir
            if (exercise.gif) {
                await this.deleteImageFromFirebase(exercise.gif);
            }
            
            // Remover da lista local
            this.exercises.splice(exerciseIndex, 1);
            
            // Remover do Firebase
            await this.deleteFromFirebase(exerciseId);
            this.updateCoreDatabase();
            
            // Atualizar interface
            this.updateStats();
            
            // Refazer busca se ativa
            const searchInput = document.getElementById('exerciseSearch');
            const groupFilter = document.getElementById('exerciseGroupFilterDB');
            
            if (searchInput?.value || groupFilter?.value) {
                this.performSearch(searchInput.value, groupFilter.value);
            } else {
                this.showSearchPrompt();
            }
            
            this.app.showMessage(`"${exerciseName}" excluído com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao excluir exercício:', error);
            this.app.showMessage('Erro ao excluir exercício: ' + error.message, 'error');
        }
    }
    // ========================================
    // MÉTODOS DE FORMULÁRIO
    // ========================================
    
    setupFormListeners() {
        const form = document.getElementById('exerciseFormData');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });
        
        // Auto-save em campos importantes
        const nameInput = form.querySelector('input[name="nome"]');
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                this.validateFieldInRealTime('nome', nameInput.value);
            });
        }
        
        // Preview de GIF
        const gifInput = form.querySelector('input[name="gif"]');
        if (gifInput) {
            gifInput.addEventListener('blur', () => {
                this.previewGif(gifInput.value);
            });
        }
    }
    
    handleFormSubmit(event) {
        const formData = new FormData(event.target);
        const exerciseData = {
            nome: formData.get('nome'),
            grupo: formData.get('grupo'),
            descricao: formData.get('descricao'),
            gif: formData.get('gif'),
            musculos_secundarios: formData.get('musculos_secundarios')
        };
        
        if (this.isEditing) {
            this.updateExercise(this.currentEditingId, exerciseData);
        } else {
            this.addExercise(exerciseData);
        }
    }
    
    hideForm() {
        const formContainer = document.getElementById('exerciseForm');
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.innerHTML = '';
        }
        
        this.isEditing = false;
        this.currentEditingId = null;
    }
    
    validateFieldInRealTime(fieldName, value) {
        const fieldData = { [fieldName]: value };
        const validation = this.validator.validateField(fieldName, value);
        
        const fieldElement = document.querySelector(`[name="${fieldName}"]`);
        if (!fieldElement) return;
        
        // Remover classes anteriores
        fieldElement.classList.remove('field-valid', 'field-invalid');
        
        // Remover mensagens anteriores
        const existingMessage = fieldElement.parentElement.querySelector('.field-message');
        if (existingMessage) existingMessage.remove();
        
        if (validation.isValid) {
            fieldElement.classList.add('field-valid');
        } else {
            fieldElement.classList.add('field-invalid');
            
            const messageElement = document.createElement('div');
            messageElement.className = 'field-message field-error';
            messageElement.textContent = validation.error;
            fieldElement.parentElement.appendChild(messageElement);
        }
    }
    
    previewGif(gifUrl) {
        if (!gifUrl) return;
        
        const previewContainer = document.getElementById('gifPreview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = `
            <div class="gif-preview-loading">Carregando preview...</div>
        `;
        
        const img = new Image();
        img.onload = () => {
            previewContainer.innerHTML = `
                <img src="${gifUrl}" alt="Preview" class="gif-preview-image">
            `;
        };
        img.onerror = () => {
            previewContainer.innerHTML = `
                <div class="gif-preview-error">❌ Não foi possível carregar a imagem</div>
            `;
        };
        img.src = gifUrl;
    }
    
    showValidationErrors(errors) {
        // Limpar erros anteriores
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.field-invalid').forEach(el => 
            el.classList.remove('field-invalid')
        );
        
        // Mostrar novos erros
        Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            const fieldElement = document.querySelector(`[name="${fieldName}"]`);
            if (fieldElement) {
                fieldElement.classList.add('field-invalid');
                
                const errorElement = document.createElement('div');
                errorElement.className = 'field-message field-error';
                errorElement.textContent = errorMessage;
                fieldElement.parentElement.appendChild(errorElement);
            }
        });
        
        // Focar no primeiro campo com erro
        const firstErrorField = document.querySelector('.field-invalid');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================
    
    findExerciseById(exerciseId) {
        return this.exercises.find(ex => 
            (ex.id && ex.id === exerciseId) || 
            (ex.codigo && ex.codigo === exerciseId)
        );
    }
    
    generateId() {
        return 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async generateNextCode() {
        // Encontrar maior código existente
        const codes = this.exercises
            .map(ex => parseInt(ex.codigo))
            .filter(code => !isNaN(code))
            .sort((a, b) => b - a);
        
        return codes.length > 0 ? codes[0] + 1 : 1;
    }
    
    parseMuscleList(muscleString) {
        if (!muscleString) return [];
        
        return muscleString
            .split(',')
            .map(muscle => muscle.trim())
            .filter(muscle => muscle.length > 0);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch {
            return 'Data inválida';
        }
    }
    
    getGroupDisplayName(groupId) {
        if (!groupId) return 'SEM GRUPO';
        
        const group = this.app.planTypeConfiguration.muscleGroups.find(g => g.id === groupId);
        return group ? `${group.icon} ${group.name}` : groupId.toUpperCase();
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    populateGroupFilterDB() {
        const groupFilter = document.getElementById('exerciseGroupFilterDB');
        if (!groupFilter) return;
        
        groupFilter.innerHTML = '<option value="todos">Todos os grupos</option>';
        
        // Extrair grupos únicos dos exercícios
        const groups = [...new Set(this.exercises.map(ex => ex.grupo))].sort();
        
        groups.forEach(grupo => {
            if (grupo) {
                const option = document.createElement('option');
                option.value = grupo.toLowerCase();
                option.textContent = grupo.toUpperCase();
                groupFilter.appendChild(option);
            }
        });
    }

    async handleImageUpload(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        try {
            // Validações do lado cliente
            if (!file.type.match(/^image\/(gif|jpe?g|png)$/)) {
                this.app.showMessage('Apenas arquivos GIF, JPG ou PNG são aceitos', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB
                this.app.showMessage('Arquivo muito grande. Máximo 5MB', 'error');
                return;
            }
            
            this.app.showMessage('Fazendo upload da imagem...', 'info');
            
            // Gerar nome único baseado no código do exercício
            const exerciseCode = this.isEditing ? 
                this.currentEditingId : 
                await this.generateNextCode();
            
            const extension = file.name.split('.').pop().toLowerCase();
            const fileName = `${exerciseCode}.${extension}`;
            
            // CORREÇÃO: Usar a nova sintaxe modular
            const downloadURL = await this.uploadToFirebaseStorage(file, fileName);
            
            // Atualizar campo URL
            const urlInput = document.querySelector('input[name="gif"]');
            if (urlInput) {
                urlInput.value = downloadURL;
            }
            
            // Mostrar preview
            this.showUploadedImagePreview(downloadURL);
            
            this.app.showMessage('Upload realizado com sucesso!', 'success');
            
            // Limpar input de arquivo
            fileInput.value = '';
            
        } catch (error) {
            console.error('Erro no upload:', error);
            this.app.showMessage('Erro no upload: ' + error.message, 'error');
        }
    }
    
    async uploadToFirebaseStorage(file, fileName) {
        try {
            // CORREÇÃO: Usar imports modulares e window.firebaseStorage
            const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');
            
            if (!window.firebaseStorage) {
                throw new Error('Firebase Storage não inicializado');
            }
            
            // Criar referência para o arquivo
            const storageRef = ref(window.firebaseStorage, `exercise-images/${fileName}`);
            
            // Fazer upload
            const snapshot = await uploadBytes(storageRef, file);
            
            // Obter URL de download
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('Upload concluído:', downloadURL);
            return downloadURL;
            
        } catch (error) {
            console.error('Erro no Firebase Storage:', error);
            throw new Error('Falha no upload da imagem');
        }
    }
    
    showUploadedImagePreview(imageUrl) {
        const previewContainer = document.getElementById('imagePreview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = `
            <div class="image-preview uploaded">
                <img src="${imageUrl}" alt="Preview" 
                     style="max-width: 200px; max-height: 150px; border-radius: 4px;">
                <p class="preview-text">Imagem carregada no Firebase Storage</p>
                <button type="button" class="btn-remove-image" 
                        onclick="exerciseManager.removeUploadedImage()">
                    Remover Imagem
                </button>
            </div>
        `;
    }
    
    removeUploadedImage() {
        const urlInput = document.querySelector('input[name="gif"]');
        const previewContainer = document.getElementById('imagePreview');
        
        if (urlInput) urlInput.value = '';
        if (previewContainer) previewContainer.innerHTML = '';
        
        this.app.showMessage('Imagem removida', 'info');
    }
    
    // Método para deletar imagem do Firebase quando exercício é excluído
    async deleteImageFromFirebase(imageUrl) {
        try {
            if (!imageUrl || !imageUrl.includes('firebase')) return;
            
            const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');

            
            // Extrair o path da URL do Firebase
            const url = new URL(imageUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            if (!pathMatch) return;
            
            const imagePath = decodeURIComponent(pathMatch[1]);
            const imageRef = ref(window.firebaseStorage, imagePath);
            
            await deleteObject(imageRef);
            console.log('Imagem deletada do Firebase:', imagePath);
            
        } catch (error) {
            console.warn('Erro ao deletar imagem do Firebase:', error);
            // Não interromper o processo se não conseguir deletar a imagem
        }
    }
  
    
    renderSearchResults() {
        const container = document.getElementById('exerciseList');
        if (!container) return;
        
        if (this.filteredExercises.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🤷‍♂️</div>
                    <h3>Nenhum exercício encontrado</h3>
                    <p>Tente uma busca diferente ou verifique o filtro de grupo muscular</p>
                    <button class="btn btn-outline" onclick="exerciseManager.clearSearch()">
                        🔄 Limpar Busca
                    </button>
                    <button class="btn btn-primary" onclick="exerciseManager.showAddForm()">
                        ➕ Adicionar Novo Exercício
                    </button>
                </div>
            `;
            return;
        }
        
        const resultsHeader = `
           
                <h4>📋 ${this.filteredExercises.length} exercícios encontrados</h4>
                
        `;
        
        const exerciseCards = this.filteredExercises.map(exercise => `
            <div class="exercise-card" data-id="${exercise.id || exercise.codigo}">
                <div class="exercise-header">
                    <h4>${exercise.nome}</h4>
                    <div class="exercise-meta">
                        <span class="exercise-group">${this.getGroupDisplayName(exercise.grupo)}</span>
                        ${exercise.codigo ? `<span class="exercise-code">#${exercise.codigo}</span>` : ''}
                    </div>
                </div>
                <p class="exercise-description">${this.truncateText(exercise.descricao || 'Sem descrição', 120)}</p>
                ${exercise.gif ? `
                    <div class="exercise-media">
                        <img src="${exercise.gif}" alt="${exercise.nome}" class="exercise-gif" 
                             onerror="this.style.display='none'">
                    </div>
                ` : ''}
                <div class="exercise-actions">
                    <button class="btn btn-sm btn-outline" onclick="exerciseManager.viewExercise('${exercise.id || exercise.codigo}')">
                        👁️ Ver
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="exerciseManager.editExerciseDB('${exercise.id || exercise.codigo}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="exerciseManager.deleteExercise('${exercise.id || exercise.codigo}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = resultsHeader + '<div class="exercise-grid">' + exerciseCards + '</div>';
    }
    
    // ========================================
    // MÉTODOS DE PERSISTÊNCIA (FIREBASE)
    // ========================================
    
    async saveToFirebase(exercise) {
        try {
            if (!this.core || !this.core.firebaseConnected) {
                console.warn('⚠️ Firebase não conectado - salvando apenas localmente');
                return;
            }
            
            // Usar método do core se disponível
            if (typeof this.core.saveExerciseToFirebase === 'function') {
                await this.core.saveExerciseToFirebase(exercise);
            } else {
                console.warn('⚠️ Método saveExerciseToFirebase não disponível no core');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar no Firebase:', error);
            throw error;
        }
    }
    
    async deleteFromFirebase(exerciseId) {
        try {
            if (!this.core || !this.core.firebaseConnected) {
                console.warn('⚠️ Firebase não conectado');
                return;
            }
            
            // Usar método do core se disponível
            if (typeof this.core.deleteExerciseFromFirebase === 'function') {
                await this.core.deleteExerciseFromFirebase(exerciseId);
            } else {
                console.warn('⚠️ Método deleteExerciseFromFirebase não disponível no core');
            }
            
        } catch (error) {
            console.error('❌ Erro ao excluir do Firebase:', error);
            throw error;
        }
    }
    
    updateCoreDatabase() {
        try {
            if (this.core && this.core.exerciseDatabase) {
                this.core.exerciseDatabase = [...this.exercises];
                console.log('✅ Base do core atualizada');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar base do core:', error);
        }
    }

    // Adicionar no método showSearchPrompt() do ExerciseManager
showSearchPrompt() {
    const container = document.getElementById('exerciseList');
    if (!container) return;
    
    const totalExercises = this.exercises.length;
    
    container.innerHTML = `
        <div class="search-prompt">
            <div class="search-icon">🔍</div>
            <h3>Busca de Exercícios</h3>
            <p><strong>${totalExercises}</strong> exercícios disponíveis na base</p>
            
            <!-- RESTO DO CONTEÚDO IGUAL... -->
            
            <div class="quick-actions">
                <button class="btn btn-primary" onclick="exerciseManager.showAddForm()">
                    ➕ Adicionar Novo Exercício
                </button>
                <button class="btn btn-outline" onclick="exerciseManager.showSettings()">
                    ⚙️ Configurações
                </button>
            </div>
        </div>
    `;
}

// Adicionar novo método
showSettings() {
    if (!this.settings) {
        this.settings = new ExerciseSettings(this);
    }
    this.settings.showSettingsModal();
}

// Método para buscar GIF usando a base de dados do Personal.js
findExerciseGifFromDatabase(exerciseName) {
    try {
        // Verificar se temos acesso ao Personal.js
        if (window.app && typeof window.app.getExerciseGif === 'function') {
            const gifPath = window.app.getExerciseGif(exerciseName);
            console.log(`GIF encontrado para ${exerciseName}: ${gifPath}`);
            return gifPath;
        }
        
        // Fallback: usar core diretamente
        if (this.core && typeof this.core.findExerciseGif === 'function') {
            const gifPath = this.core.findExerciseGif(exerciseName);
            console.log(`GIF encontrado via core para ${exerciseName}: ${gifPath}`);
            return gifPath;
        }
        
        console.warn('Métodos de busca de GIF não disponíveis');
        return null;
        
    } catch (error) {
        console.error('Erro ao buscar GIF da base de dados:', error);
        return null;
    }
}

// Método para verificar se exercício existe na base migrada
exerciseExistsInDatabase(exerciseName) {
    try {
        // Verificar via Personal.js
        if (window.app && typeof window.app.exerciseExists === 'function') {
            return window.app.exerciseExists(exerciseName);
        }
        
        // Fallback: verificar via core
        if (this.core && typeof this.core.exerciseExists === 'function') {
            return this.core.exerciseExists(exerciseName);
        }
        
        // Último fallback: buscar na base diretamente
        if (this.core && this.core.exerciseDatabase) {
            return this.core.exerciseDatabase.some(ex => 
                ex.nome && ex.nome.toLowerCase() === exerciseName.toLowerCase()
            );
        }
        
        return false;
        
    } catch (error) {
        console.error('Erro ao verificar exercício na base:', error);
        return false;
    }
}

// Método para exibir GIF no formulário de edição
displayExerciseGifInForm(exerciseName) {
    const gifPreviewGroup = document.getElementById('exerciseGifPreviewGroup');
    const gifPreview = document.getElementById('exerciseGifPreview');
    const gifError = document.getElementById('exerciseGifPreviewError');
    
    if (!gifPreviewGroup || !gifPreview || !gifError) {
        console.warn('Elementos de preview de GIF não encontrados');
        return;
    }
    
    // Verificar se exercício existe na base migrada
    const existsInDatabase = this.exerciseExistsInDatabase(exerciseName);
    
    if (existsInDatabase) {
        console.log(`Exercício ${exerciseName} encontrado na base - buscando GIF`);
        
        // Buscar GIF usando método do Personal.js
        const gifPath = this.findExerciseGifFromDatabase(exerciseName);
        
        if (gifPath && gifPath.trim() !== '') {
            // Mostrar container
            gifPreviewGroup.style.display = 'block';
            gifError.style.display = 'none';
            gifPreview.style.display = 'block';
            
            // Configurar eventos
            gifPreview.onload = () => {
                console.log(`GIF carregado com sucesso: ${exerciseName}`);
            };
            
            gifPreview.onerror = () => {
                console.warn(`Erro ao carregar GIF: ${gifPath}`);
                gifPreview.style.display = 'none';
                gifError.style.display = 'block';
                gifError.textContent = `GIF não pôde ser carregado: ${exerciseName}`;
            };
            
            // Definir source
            gifPreview.src = gifPath;
            gifPreview.alt = `Demonstração: ${exerciseName}`;
            
        } else {
            // Mostrar mensagem de GIF não disponível
            gifPreviewGroup.style.display = 'block';
            gifPreview.style.display = 'none';
            gifError.style.display = 'block';
            gifError.textContent = `GIF não disponível para: ${exerciseName}`;
        }
    } else {
        // Exercício não está na base migrada - ocultar preview
        console.log(`Exercício ${exerciseName} não encontrado na base migrada`);
        gifPreviewGroup.style.display = 'none';
    }
}

// Modificar o método populateInlineEditor existente
populateInlineEditor(exercise, workoutIndex, workout) {
    // ... código existente ...
    
    // NOVA SEÇÃO: Configurar preview de GIF se exercício existe na base
    setTimeout(() => {
        if (exercise.nome && exercise.nome.trim() !== '') {
            this.displayExerciseGifInForm(exercise.nome);
        }
    }, 200);
    
    // ... resto do código existente ...
}


}
// No final do ExerciseManager.js, modificar a seção de disponibilização global:





