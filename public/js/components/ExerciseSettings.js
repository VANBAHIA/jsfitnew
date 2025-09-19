// js/components/ExerciseSettings.js
class ExerciseSettings {
    constructor(exerciseManager) {
        this.manager = exerciseManager;
        this.app = exerciseManager.app;
    }
    
    showSettingsModal() {
        const modalHTML = `
            <div class="modal-overlay" id="exerciseSettingsModal" onclick="this.remove()">
                <div class="modal-content settings-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>⚙️ Configurações de Exercícios</h3>
                        <button class="modal-close" onclick="document.getElementById('exerciseSettingsModal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-grid">
                            
                            <div class="setting-group">
                                <h4>🔄 Sincronização</h4>
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" id="autoSync" checked>
                                        <span>Sincronização automática com Firebase</span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <button class="btn btn-secondary" onclick="exerciseSettings.forceSyncAll()">
                                        🔄 Forçar Sincronização
                                    </button>
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <h4>📊 Base de Dados</h4>
                                <div class="setting-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Exercícios Locais:</span>
                                        <span class="stat-value">${this.manager.exercises.length}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Firebase Status:</span>
                                        <span class="stat-value ${this.app.core?.firebaseConnected ? 'connected' : 'disconnected'}">
                                            ${this.app.core?.firebaseConnected ? '✅ Conectado' : '❌ Desconectado'}
                                        </span>
                                    </div>
                                </div>
                                <div class="setting-actions">
                                    <button class="btn btn-outline" onclick="exerciseSettings.exportDatabase()">
                                        📤 Exportar Base
                                    </button>
                                    <button class="btn btn-outline" onclick="exerciseSettings.importDatabase()">
                                        📥 Importar Base
                                    </button>
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <h4>🧹 Manutenção</h4>
                                <div class="setting-actions">
                                    <button class="btn btn-warning" onclick="exerciseSettings.cleanDuplicates()">
                                        🧹 Limpar Duplicatas
                                    </button>
                                    <button class="btn btn-danger" onclick="exerciseSettings.resetDatabase()">
                                        🗑️ Resetar Base
                                    </button>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="document.getElementById('exerciseSettingsModal').remove()">
                            ✅ Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    async forceSyncAll() {
        try {
            this.app.showMessage('🔄 Sincronizando todos os exercícios...', 'info');
            
            for (const exercise of this.manager.exercises) {
                await this.manager.saveToFirebase(exercise);
            }
            
            this.app.showMessage('✅ Sincronização completa!', 'success');
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.app.showMessage('❌ Erro na sincronização', 'error');
        }
    }
    
    exportDatabase() {
        try {
            const data = {
                exercises: this.manager.exercises,
                exported_at: new Date().toISOString(),
                total_exercises: this.manager.exercises.length,
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `exercises_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.app.showMessage('✅ Base exportada com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.app.showMessage('❌ Erro ao exportar base', 'error');
        }
    }
    
    importDatabase() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.exercises && Array.isArray(data.exercises)) {
                        const importCount = data.exercises.length;
                        
                        if (confirm(`Importar ${importCount} exercícios? Isso substituirá a base atual.`)) {
                            this.manager.exercises = data.exercises;
                            this.manager.updateCoreDatabase();
                            this.app.showMessage(`✅ ${importCount} exercícios importados!`, 'success');
                            
                            // Fechar modal e atualizar interface
                            document.getElementById('exerciseSettingsModal').remove();
                            this.manager.showSearchPrompt();
                            this.manager.updateStats();
                        }
                    } else {
                        this.app.showMessage('❌ Arquivo de backup inválido', 'error');
                    }
                    
                } catch (error) {
                    console.error('Erro ao importar:', error);
                    this.app.showMessage('❌ Erro ao ler arquivo', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    cleanDuplicates() {
        const before = this.manager.exercises.length;
        
        // Remover duplicatas por nome
        const seen = new Set();
        this.manager.exercises = this.manager.exercises.filter(exercise => {
            const key = exercise.nome.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
        
        const after = this.manager.exercises.length;
        const removed = before - after;
        
        if (removed > 0) {
            this.manager.updateCoreDatabase();
            this.app.showMessage(`✅ ${removed} exercícios duplicados removidos`, 'success');
        } else {
            this.app.showMessage('ℹ️ Nenhuma duplicata encontrada', 'info');
        }
    }
    
    resetDatabase() {
        if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os exercícios!\n\nTem certeza absoluta?')) {
            if (confirm('🚨 ÚLTIMA CHANCE!\n\nEsta ação é IRREVERSÍVEL!\n\nConfirma mesmo?')) {
                this.manager.exercises = [];
                this.manager.updateCoreDatabase();
                this.app.showMessage('🗑️ Base de exercícios resetada', 'info');
                
                // Fechar modal e atualizar interface
                document.getElementById('exerciseSettingsModal').remove();
                this.manager.showSearchPrompt();
                this.manager.updateStats();
            }
        }
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.ExerciseSettings = ExerciseSettings;
}