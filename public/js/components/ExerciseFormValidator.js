// ========================================
// CLASSE DE VALIDAÇÃO COMPLETA
// ========================================

class ExerciseFormValidator {
    constructor() {
        this.rules = {
            nome: { 
                required: true, 
                minLength: 3, 
                maxLength: 100,
                pattern: /^[a-zA-ZÀ-ÿ0-9\s\-\(\)]+$/
            },
            grupo: { 
                required: true 
            },
            descricao: { 
                required: true, 
                minLength: 10, 
                maxLength: 1000 
            },
            gif: { 
                required: false, 
                pattern: /^(https?:\/\/.+\.(gif|jpg|jpeg|png)(\?.*)?$|\.\/imagens\/.+\.(gif|jpg|jpeg|png)$)/i 
            },
            musculos_secundarios: { 
                required: false, 
                pattern: /^[a-zA-ZÀ-ÿ\s,]+$/ 
            }
        };
        
        console.log('📋 ExerciseFormValidator inicializado');
    }
    
    validate(formData) {
        const errors = {};
        
        // Validar cada campo
        Object.keys(this.rules).forEach(fieldName => {
            const validation = this.validateField(fieldName, formData[fieldName]);
            if (!validation.isValid) {
                errors[fieldName] = validation.error;
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        if (!rule) return { isValid: true };
        
        const trimmedValue = value ? value.toString().trim() : '';
        
        // Campo obrigatório
        if (rule.required && !trimmedValue) {
            return {
                isValid: false,
                error: `${this.getFieldLabel(fieldName)} é obrigatório`
            };
        }
        
        // Se campo não é obrigatório e está vazio, é válido
        if (!rule.required && !trimmedValue) {
            return { isValid: true };
        }
        
        // Comprimento mínimo
        if (rule.minLength && trimmedValue.length < rule.minLength) {
            return {
                isValid: false,
                error: `${this.getFieldLabel(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`
            };
        }
        
        // Comprimento máximo
        if (rule.maxLength && trimmedValue.length > rule.maxLength) {
            return {
                isValid: false,
                error: `${this.getFieldLabel(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`
            };
        }
        
        // Padrão (regex)
        if (rule.pattern && !rule.pattern.test(trimmedValue)) {
            return {
                isValid: false,
                error: this.getPatternError(fieldName)
            };
        }
        
        return { isValid: true };
    }
    
    getFieldLabel(fieldName) {
        const labels = {
            nome: 'Nome do exercício',
            grupo: 'Grupo muscular',
            descricao: 'Descrição',
            gif: 'URL da imagem/GIF',
            musculos_secundarios: 'Músculos secundários'
        };
        
        return labels[fieldName] || fieldName;
    }
    
    getPatternError(fieldName) {
        const errors = {
            nome: 'Nome deve conter apenas letras, números, espaços, hífens e parênteses',
            gif: 'URL deve ser um link válido para uma imagem (gif, jpg, png, webp)',
            musculos_secundarios: 'Use apenas letras e vírgulas para separar os músculos'
        };
        
        return errors[fieldName] || 'Formato inválido';
    }
}

// ========================================
// CLASSE DE RENDERIZAÇÃO COMPLETA
// ========================================


// Disponibilizar globalmente
if (typeof window !== 'undefined') {
//    window.ExerciseManager = ExerciseManager;
    window.ExerciseFormValidator = ExerciseFormValidator;
//    window.ExerciseRenderer = ExerciseRenderer;
}