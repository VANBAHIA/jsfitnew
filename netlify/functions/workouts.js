// netlify/functions/workouts.js
const { Pool } = require('pg');

// Configuração do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Headers CORS padrão
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Função para gerar ID único de 6 caracteres
function generateWorkoutId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para validar formato do ID
function isValidWorkoutId(id) {
  return typeof id === 'string' && id.length === 6 && /^[A-Z0-9]{6}$/.test(id);
}

// Função para extrair ID da URL
function extractIdFromPath(path) {
  const pathParts = path.split('/');
  return pathParts[pathParts.length - 1];
}

// Resposta de erro padronizada
function errorResponse(statusCode, error, message, details = null) {
  const response = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response)
  };
}

// Resposta de sucesso padronizada
function successResponse(statusCode, message, data = null) {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response)
  };
}

// GET - Buscar treino por ID
async function getWorkout(workoutId) {
  try {
    console.log(`[GetWorkout] Buscando treino: ${workoutId}`);
    
    // Validar ID
    if (!isValidWorkoutId(workoutId)) {
      return errorResponse(400, 'Bad Request', 'ID deve ter exatamente 6 caracteres alfanuméricos');
    }

    const query = 'SELECT * FROM workouts WHERE id = $1';
    const result = await pool.query(query, [workoutId.toUpperCase()]);

    if (result.rows.length === 0) {
      console.log(`[GetWorkout] Treino ${workoutId} não encontrado`);
      return errorResponse(404, 'Not Found', `Treino com ID ${workoutId} não encontrado`);
    }

    const workout = result.rows[0];
    console.log(`[GetWorkout] Treino ${workoutId} encontrado com sucesso`);

    return successResponse(200, 'Treino encontrado', {
      id: workout.id,
      originalId: workout.original_id,
      plan: workout.plan,
      version: workout.version,
      createdAt: workout.created_at,
      updatedAt: workout.updated_at
    });

  } catch (error) {
    console.error('[GetWorkout] Erro ao buscar treino:', error);
    return errorResponse(500, 'Internal Server Error', 'Erro interno do servidor', error.message);
  }
}

// POST - Criar novo treino
async function createWorkout(requestData) {
  try {
    console.log('[CreateWorkout] Criando novo treino');

    // Validar dados obrigatórios
    if (!requestData.plan) {
      return errorResponse(400, 'Bad Request', 'Campo obrigatório: plan');
    }

    // Gerar ID único se não fornecido
    let workoutId = requestData.id;
    if (!workoutId) {
      workoutId = generateWorkoutId();
      
      // Verificar se ID já existe (improvável mas possível)
      let attempts = 0;
      while (attempts < 10) {
        const checkQuery = 'SELECT id FROM workouts WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [workoutId]);
        
        if (checkResult.rows.length === 0) break;
        
        workoutId = generateWorkoutId();
        attempts++;
      }
      
      if (attempts === 10) {
        return errorResponse(500, 'Internal Server Error', 'Não foi possível gerar ID único');
      }
    } else {
      // Validar ID fornecido
      if (!isValidWorkoutId(workoutId)) {
        return errorResponse(400, 'Bad Request', 'ID deve ter exatamente 6 caracteres alfanuméricos');
      }
      
      workoutId = workoutId.toUpperCase();
      
      // Verificar se ID já existe
      const checkQuery = 'SELECT id FROM workouts WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [workoutId]);
      
      if (checkResult.rows.length > 0) {
        return errorResponse(409, 'Conflict', `Treino com ID ${workoutId} já existe`);
      }
    }

    // Inserir treino no banco
    const insertQuery = `
      INSERT INTO workouts (id, original_id, plan, version, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      workoutId,
      requestData.originalId || workoutId,
      JSON.stringify(requestData.plan),
      requestData.version || '1.0'
    ];

    const result = await pool.query(insertQuery, values);
    const workout = result.rows[0];

    console.log(`[CreateWorkout] Treino ${workoutId} criado com sucesso`);

    return successResponse(201, 'Treino criado com sucesso', {
      id: workout.id,
      originalId: workout.original_id,
      version: workout.version,
      createdAt: workout.created_at,
      updatedAt: workout.updated_at
    });

  } catch (error) {
    console.error('[CreateWorkout] Erro ao criar treino:', error);
    return errorResponse(500, 'Internal Server Error', 'Erro interno do servidor', error.message);
  }
}

// PUT - Atualizar treino existente
async function updateWorkout(workoutId, requestData) {
  try {
    console.log(`[UpdateWorkout] Atualizando treino: ${workoutId}`);

    // Validar ID
    if (!isValidWorkoutId(workoutId)) {
      return errorResponse(400, 'Bad Request', 'ID deve ter exatamente 6 caracteres alfanuméricos');
    }

    // Validar dados obrigatórios
    if (!requestData.plan) {
      return errorResponse(400, 'Bad Request', 'Campo obrigatório: plan');
    }

    workoutId = workoutId.toUpperCase();

    // Verificar se treino existe
    const checkQuery = 'SELECT id FROM workouts WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [workoutId]);

    if (checkResult.rows.length === 0) {
      return errorResponse(404, 'Not Found', `Treino com ID ${workoutId} não encontrado`);
    }

    // Atualizar treino
    const updateQuery = `
      UPDATE workouts 
      SET plan = $2, version = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      workoutId,
      JSON.stringify(requestData.plan),
      requestData.version || '1.0'
    ];

    const result = await pool.query(updateQuery, values);
    const workout = result.rows[0];

    console.log(`[UpdateWorkout] Treino ${workoutId} atualizado com sucesso`);

    return successResponse(200, 'Treino atualizado com sucesso', {
      id: workout.id,
      originalId: workout.original_id,
      version: workout.version,
      createdAt: workout.created_at,
      updatedAt: workout.updated_at
    });

  } catch (error) {
    console.error('[UpdateWorkout] Erro ao atualizar treino:', error);
    return errorResponse(500, 'Internal Server Error', 'Erro interno do servidor', error.message);
  }
}

// DELETE - Deletar treino
async function deleteWorkout(workoutId) {
  try {
    console.log(`[DeleteWorkout] Deletando treino: ${workoutId}`);

    // Validar ID
    if (!isValidWorkoutId(workoutId)) {
      return errorResponse(400, 'Bad Request', 'ID deve ter exatamente 6 caracteres alfanuméricos');
    }

    workoutId = workoutId.toUpperCase();

    // Verificar se treino existe e deletar
    const deleteQuery = 'DELETE FROM workouts WHERE id = $1 RETURNING id';
    const result = await pool.query(deleteQuery, [workoutId]);

    if (result.rows.length === 0) {
      return errorResponse(404, 'Not Found', `Treino com ID ${workoutId} não encontrado`);
    }

    console.log(`[DeleteWorkout] Treino ${workoutId} deletado com sucesso`);

    return successResponse(200, 'Treino deletado com sucesso', {
      id: workoutId,
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DeleteWorkout] Erro ao deletar treino:', error);
    return errorResponse(500, 'Internal Server Error', 'Erro interno do servidor', error.message);
  }
}

// Handler principal da função
exports.handler = async (event, context) => {
  // Responder a requisições OPTIONS (preflight CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  const method = event.httpMethod;
  const path = event.path;

  try {
    // Roteamento baseado no método HTTP e path
    switch (method) {
      case 'GET':
        // GET /api/workouts/:id - Buscar treino
        const getWorkoutId = extractIdFromPath(path);
        if (!getWorkoutId || getWorkoutId === 'workouts') {
          return errorResponse(400, 'Bad Request', 'ID do treino é obrigatório na URL');
        }
        return await getWorkout(getWorkoutId);

      case 'POST':
        // POST /api/workouts - Criar treino
        if (!event.body) {
          return errorResponse(400, 'Bad Request', 'Body da requisição é obrigatório');
        }
        
        try {
          const postData = JSON.parse(event.body);
          return await createWorkout(postData);
        } catch (parseError) {
          return errorResponse(400, 'Bad Request', 'JSON inválido no body da requisição');
        }

      case 'PUT':
        // PUT /api/workouts/:id - Atualizar treino
        const putWorkoutId = extractIdFromPath(path);
        if (!putWorkoutId || putWorkoutId === 'workouts') {
          return errorResponse(400, 'Bad Request', 'ID do treino é obrigatório na URL');
        }
        
        if (!event.body) {
          return errorResponse(400, 'Bad Request', 'Body da requisição é obrigatório');
        }
        
        try {
          const putData = JSON.parse(event.body);
          return await updateWorkout(putWorkoutId, putData);
        } catch (parseError) {
          return errorResponse(400, 'Bad Request', 'JSON inválido no body da requisição');
        }

      case 'DELETE':
        // DELETE /api/workouts/:id - Deletar treino
        const deleteWorkoutId = extractIdFromPath(path);
        if (!deleteWorkoutId || deleteWorkoutId === 'workouts') {
          return errorResponse(400, 'Bad Request', 'ID do treino é obrigatório na URL');
        }
        return await deleteWorkout(deleteWorkoutId);

      default:
        return errorResponse(405, 'Method Not Allowed', `Método ${method} não é permitido`);
    }

  } catch (error) {
    console.error('[WorkoutManager] Erro geral:', error);
    return errorResponse(500, 'Internal Server Error', 'Erro interno do servidor', error.message);
  } finally {
    // Não fechar a conexão do pool aqui, deixar o Netlify gerenciar
    // O pool será reutilizado entre invocações da função
  }
};