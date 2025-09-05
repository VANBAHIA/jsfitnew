// firestore.rules - SUBSTITUIR O ARQUIVO EXISTENTE
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================
    // PLANOS DE TREINO - ISOLADOS POR USUÁRIO
    // ========================================
    match /plans/{planId} {
      // Permitir leitura e escrita APENAS para o dono do plano
      allow read, write: if request.auth != null && 
                        resource.data.userId == request.auth.uid;
      
      // Permitir criação APENAS se o userId corresponder ao usuário autenticado
      allow create: if request.auth != null && 
                    request.auth.uid != null &&
                    isValidPlan() &&
                    request.resource.data.userId == request.auth.uid;
      
      // Permitir atualização APENAS se for o dono
      allow update: if request.auth != null && 
                    resource.data.userId == request.auth.uid &&
                    request.resource.data.userId == request.auth.uid &&
                    isValidPlan();
      
      // Permitir deleção APENAS se for o dono
      allow delete: if request.auth != null && 
                    resource.data.userId == request.auth.uid;
      
      // Função de validação do plano
      function isValidPlan() {
        return request.resource.data.keys().hasAll(['nome', 'dias', 'treinos', 'userId']) &&
               request.resource.data.nome is string &&
               request.resource.data.nome.size() > 0 &&
               request.resource.data.dias is number &&
               request.resource.data.dias >= 1 &&
               request.resource.data.dias <= 6 &&
               request.resource.data.treinos is list &&
               request.resource.data.userId is string &&
               request.resource.data.userId.size() > 0;
      }
    }
    
    // ========================================
    // PLANOS COMPARTILHADOS - LEITURA PÚBLICA, ESCRITA RESTRITA
    // ========================================
    match /shared_plans/{shareId} {
      // Qualquer um pode ler planos compartilhados ativos
      allow read: if resource.data.isActive == true;
      
      // Apenas usuários autenticados podem criar compartilhamentos
      allow create: if request.auth != null && 
                    isValidSharedPlan() &&
                    request.resource.data.createdBy == request.auth.uid;
      
      // Apenas o criador pode atualizar (para desativar, por exemplo)
      allow update: if request.auth != null && 
                    resource.data.createdBy == request.auth.uid;
      
      // Ninguém pode deletar (apenas desativar)
      allow delete: if false;
      
      // Função de validação do plano compartilhado
      function isValidSharedPlan() {
        return request.resource.data.keys().hasAll(['shareId', 'planData', 'createdBy', 'isActive']) &&
               request.resource.data.shareId is string &&
               request.resource.data.shareId.size() == 6 &&
               request.resource.data.planData is map &&
               request.resource.data.createdBy is string &&
               request.resource.data.isActive is bool;
      }
    }
    
    // ========================================
    // BASE DE EXERCÍCIOS - LEITURA PÚBLICA, ESCRITA RESTRITA
    // ========================================
    match /exercises_database/{exerciseId} {
      // Qualquer um pode ler exercícios
      allow read: if true;
      
      // Apenas usuários autenticados podem criar/atualizar exercícios
      allow create, update: if request.auth != null && 
                            isValidExercise();
      
      // Apenas administradores podem deletar (implementar role-based se necessário)
      allow delete: if request.auth != null &&
                    hasAdminRole(); // Implementar função de admin
      
      // Função de validação do exercício
      function isValidExercise() {
        return request.resource.data.keys().hasAll(['nome', 'grupo']) &&
               request.resource.data.nome is string &&
               request.resource.data.nome.size() > 0 &&
               request.resource.data.grupo is string &&
               request.resource.data.grupo.size() > 0;
      }
      
      // Função para verificar role de admin (placeholder)
      function hasAdminRole() {
        // Por enquanto, permitir para qualquer usuário autenticado
        // TODO: Implementar sistema de roles baseado em custom claims
        return request.auth != null;
      }
    }
    
    // ========================================
    // CONFIGURAÇÕES DE PLANO - ISOLADAS POR USUÁRIO
    // ========================================
    match /plan_configurations/{userId} {
      // O userId do documento deve ser igual ao userId do usuário autenticado
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
      
      // Criar configuração apenas para próprio usuário
      allow create: if request.auth != null && 
                    request.auth.uid == userId &&
                    isValidPlanConfiguration();
      
      // Atualizar apenas própria configuração
      allow update: if request.auth != null && 
                    request.auth.uid == userId &&
                    isValidPlanConfiguration();
      
      // Deletar apenas própria configuração
      allow delete: if request.auth != null && 
                    request.auth.uid == userId;
      
      // Função de validação da configuração
      function isValidPlanConfiguration() {
        return request.resource.data.keys().hasAll(['days', 'configuration', 'userId']) &&
               request.resource.data.days is number &&
               request.resource.data.days >= 1 &&
               request.resource.data.days <= 6 &&
               request.resource.data.configuration is map &&
               request.resource.data.userId is string &&
               request.resource.data.userId == request.auth.uid;
      }
    }
    
    // ========================================
    // PERFIS DE USUÁRIO (FUTURO)
    // ========================================
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
      
      allow create: if request.auth != null && 
                    request.auth.uid == userId &&
                    isValidUserProfile();
      
      function isValidUserProfile() {
        return request.resource.data.keys().hasAll(['userId', 'email']) &&
               request.resource.data.userId == request.auth.uid &&
               request.resource.data.email == request.auth.token.email;
      }
    }
    
    // ========================================
    // TESTE DE CONECTIVIDADE - LEITURA PÚBLICA
    // ========================================
    match /_test_/connection {
      allow read: if true;
      allow write: if false; // Ninguém pode escrever no teste
    }
    
    // ========================================
    // LOGS DE AUDITORIA (FUTURO)
    // ========================================
    match /audit_logs/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false; // Logs são imutáveis
    }
    
    // ========================================
    // REGRAS GERAIS DE FALLBACK
    // ========================================
    // Negar acesso a qualquer outro documento não especificado
    match /{document=**} {
      allow read, write: if false;
    }
  }
  
  // ========================================
  // FUNÇÕES AUXILIARES GLOBAIS
  // ========================================
  
  // Verificar se usuário está autenticado e tem UID válido
  function isAuthenticated() {
    return request.auth != null && 
           request.auth.uid != null && 
           request.auth.uid is string && 
           request.auth.uid.size() > 0;
  }
  
  // Verificar se o usuário é dono do recurso
  function isOwner(resourceUserId) {
    return isAuthenticated() && 
           request.auth.uid == resourceUserId;
  }
  
  // Verificar limite de tamanho de string
  function isValidStringSize(str, minSize, maxSize) {
    return str is string && 
           str.size() >= minSize && 
           str.size() <= maxSize;
  }
  
  // Verificar se email é válido (básico)
  function isValidEmail(email) {
    return email is string && 
           email.matches('.*@.*\\..*') &&
           email.size() >= 5 &&
           email.size() <= 254;
  }
}