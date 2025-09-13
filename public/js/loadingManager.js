class LoadingManager {
    constructor() {
        this.isActive = false;
        this.currentOperation = null;
        this.progress = 0;
        this.overlay = null;
        this.elements = {};
        
        this.initializeElements();
          // Adicionar esta configuração:
 

        
    }
    
    initializeElements() {
        this.overlay = document.getElementById('globalLoadingOverlay');
        this.elements = {
            title: document.getElementById('loadingTitle'),
            message: document.getElementById('loadingMessage'),
            progress: document.getElementById('loadingProgress'),
            percentage: document.getElementById('loadingPercentage')
        };
    }
    
    show(title = 'Carregando...', message = 'Processando...') {
        if (!this.overlay) {
            console.warn('Loading overlay não encontrado');
            return;
        }
        
        this.isActive = true;
        this.progress = 0;
        
        this.updateContent(title, message);
        this.updateProgress(0);
        this.overlay.classList.add('active');
        
        console.log(`🔄 Loading iniciado: ${title}`);
    }
    
    hide() {
        if (!this.overlay) return;
        
        this.isActive = false;
        this.currentOperation = null;
        this.overlay.classList.remove('active');
        
        console.log('✅ Loading finalizado');
    }
    
    updateContent(title, message) {
        if (this.elements.title) {
            this.elements.title.textContent = title;
        }
        if (this.elements.message) {
            this.elements.message.textContent = message;
        }
    }
    
    updateProgress(percentage, message) {
        this.progress = Math.min(100, Math.max(0, percentage));
        
        if (this.elements.progress) {
            this.elements.progress.style.width = this.progress + '%';
        }
        if (this.elements.percentage) {
            this.elements.percentage.textContent = Math.round(this.progress) + '%';
        }
        if (message && this.elements.message) {
            this.elements.message.textContent = message;
        }
    }
    
    setOperation(operation, steps) {
        this.currentOperation = {
            name: operation,
            steps: steps,
            currentStep: 0,
            stepProgress: 0
        };
    }

    
    
    nextStep(stepName) {
        if (!this.currentOperation) return;
        
        this.currentOperation.currentStep++;
        this.currentOperation.stepProgress = 0;
        
        const totalSteps = this.currentOperation.steps.length;
        const stepProgress = (this.currentOperation.currentStep / totalSteps) * 100;
        
        this.updateProgress(stepProgress, stepName);
    }
    
    // Método para operações com promise
    async withLoading(title, message, operation) {
        try {
            this.show(title, message);
            const result = await operation();
            return result;
        } finally {
            this.hide();
        }
    }
}
