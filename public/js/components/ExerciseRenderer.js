// js/components/ExerciseRenderer.js

class ExerciseRenderer {
    constructor(exerciseManager) {
        this.manager = exerciseManager;
        this.app = exerciseManager.app;
    }
    
    renderForm(exercise = null) {
        const isEditing = !!exercise;
        const muscleGroups = this.getMuscleGroupOptions();
        
        return `
            <div class="exercisedb-form-card">
                <div class="form-header">
                    <h3>${isEditing ? '✏️ Editar' : '➕ Novo'} Exercício</h3>
                    <button onclick="exerciseManager.hideForm()" class="btn-close">✕</button>
                </div>
                
                <form id="exerciseFormData" class="exercisedb-form-grid">
                    <div class="form-group">
                        <label>Nome do Exercício *</label>
                        <input type="text" name="nome" value="${exercise?.nome || ''}" 
                               class="form-input" placeholder="Ex: Supino Reto com Barra">
                    </div>
                    
                    <div class="form-group">
                        <label>Grupo Muscular *</label>
                        <select name="grupo" class="form-select">
                            <option value="">Selecione o grupo</option>
                            ${muscleGroups}
                        </select>
                    </div>
                    
                    <div class="form-group full-width">
                        <label>Descrição/Técnica *</label>
                        <textarea name="descricao" class="form-textarea" 
                                  placeholder="Descreva a execução, posicionamento e técnica...">${exercise?.descricao || ''}</textarea>
                    </div>
                    
<div class="form-group">
    <label>GIF/Imagem</label>
    <div class="image-upload-container">
        <input type="file" id="imageUpload" accept=".gif,.jpg,.jpeg,.png" 
               style="display: none" onchange="exerciseManager.handleImageUpload(this)">
        <input type="url" name="gif" value="${exercise?.gif || ''}" 
        // Em ExerciseRenderer.js, no método renderForm(), adicione após o campo de URL:

<div class="form-group" id="exerciseGifPreviewGroup" style="display: none;">
    <label class="form-label">Demonstração do Exercício</label>
    <div class="exercise-gif-container">
        <img id="exerciseGifPreview" 
             src="" 
             alt="Demonstração do exercício" 
             style="max-width: 300px; max-height: 300px; object-fit: cover; border-radius: 8px;">
        <div id="exerciseGifPreviewError" 
             style="display: none; color: var(--text-secondary); font-size: 12px; margin-top: 5px;">
             GIF não disponível para este exercício
        </div>
    </div>
</div>
               class="form-input" placeholder="URL da imagem ou faça upload">
        <button type="button" class="btn btn-outline" 
                onclick="document.getElementById('imageUpload').click()">
            📁 Upload Imagem
        </button>
    </div>
    <div id="imagePreview"></div>
</div>
                    
                    <div class="form-group">
                        <label>Músculos Secundários</label>
                        <input type="text" name="musculos_secundarios" 
                               value="${exercise?.musculos_secundarios?.join(', ') || ''}"
                               class="form-input" placeholder="deltoide, tríceps, core">
                    </div>
                    
                    <div class="form-actions full-width">
                        <button type="submit" class="btn btn-primary">
                            ${isEditing ? '💾 Salvar' : '➕ Adicionar'}
                        </button>
                        <button type="button" onclick="exerciseManager.hideForm()" 
                                class="btn btn-outline">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    getMuscleGroupOptions() {
        return this.app.planTypeConfiguration.muscleGroups.map(group => 
            `<option value="${group.id}">${group.icon} ${group.name}</option>`
        ).join('');
    }
}