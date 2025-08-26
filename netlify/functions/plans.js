// netlify/functions/plans.js - Gerenciamento Completo de Planos de Treino CORRIGIDO
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Configuração do pool de conexões PostgreSQL CORRIGIDA
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_rsCkP3jbcal7@ep-red-cloud-acw2aqx0-pooler.sa-east-1.aws.neon.tech/academiajsfit?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Headers CORS padrão
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

// =============================================================================
// UTILITÁRIOS E MIDDLEWARE
// =============================================================================

// ✅ CORREÇÃO: Middleware para verificar JWT - aceitar tokens temporários
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token de autorização requerido');
    }

    const token = authHeader.substring(7);
    
    // ✅ ADICIONAR: Aceitar tokens temporários para desenvolvimento
    if (token.startsWith('temp_')) {
        return {
            userId: 'temp_user_' + Date.now(),
            email: 'personal@example.com',
            type: 'personal_trainer'
        };
    }
    
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token inválido');
    }
}

// Sanitização de dados
function sanitizeInput(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            sanitized[key] = validator.escape(value.trim());
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? validator.escape(item.trim()) : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Resposta de erro padronizada
function errorResponse(statusCode, message, details = null) {
    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
    
    if (details && process.env.NODE_ENV === 'development') {
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

// Validação de dados do plano
function validatePlanData(data) {
    const errors = [];
    
    if (!data.name || data.name.length < 3 || data.name.length > 255) {
        errors.push('Nome deve ter entre 3 e 255 caracteres');
    }
    
    if (data.frequency_per_week && (data.frequency_per_week < 1 || data.frequency_per_week > 7)) {
        errors.push('Frequência deve ser entre 1 e 7 dias por semana');
    }
    
    if (data.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty_level)) {
        errors.push('Nível de dificuldade inválido');
    }
    
    return errors;
}

// Extrair grupos musculares dos exercícios
function extractMuscleGroups(exerciseName, description = '') {
    const text = `${exerciseName} ${description}`.toLowerCase();
    const groups = [];

    const muscleMap = {
        'peito': ['peito', 'peitoral', 'supino', 'crucifixo'],
        'costas': ['costas', 'dorso', 'puxada', 'remada', 'pullover'],
        'ombros': ['ombro', 'deltoide', 'desenvolvimento', 'elevação'],
        'bíceps': ['bíceps', 'rosca'],
        'tríceps': ['tríceps', 'francês', 'testa', 'pulley'],
        'quadríceps': ['quadríceps', 'agachamento', 'leg press', 'extensão'],
        'posterior': ['posterior', 'flexor', 'stiff', 'mesa flexora'],
        'glúteos': ['glúteo', 'glúteos', 'hip thrust'],
        'panturrilha': ['panturrilha', 'gastrocnêmio'],
        'core': ['abdominal', 'prancha', 'core', 'abdômen']
    };

    for (const [group, keywords] of Object.entries(muscleMap)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            groups.push(group);
        }
    }

    return groups.length > 0 ? groups : ['geral'];
}

// ✅ NOVA FUNÇÃO: Garantir que personal trainer existe
async function ensurePersonalTrainerExists(userId, email) {
    const client = await pool.connect();
    
    try {
        const existingTrainer = await client.query(
            'SELECT id FROM personal_trainers WHERE id = $1',
            [userId]
        );

        if (existingTrainer.rows.length === 0) {
            // Criar personal trainer básico
            await client.query(`
                INSERT INTO personal_trainers (id, name, email, password_hash, is_active)
                VALUES ($1, $2, $3, $4, true)
                ON CONFLICT (email) DO NOTHING
            `, [
                userId,
                'Personal Trainer',
                email,
                'temp_hash' // Será atualizado quando fizer login real
            ]);
        }
    } finally {
        client.release();
    }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        const path = event.path.replace('/.netlify/functions/plans', '').replace('/api/plans', '');
        const method = event.httpMethod;
        const pathParts = path.split('/').filter(p => p.length > 0);

        console.log(`[PLANS] ${method} ${path}`);

        // Roteamento
        if (method === 'GET' && pathParts.length === 0) {
            return await handleGetPlans(event);
        }
        
        if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'share') {
            return await handleSharePlan(event, pathParts[0]);
        }

        return errorResponse(404, 'Endpoint não encontrado');

    } catch (error) {
        console.error('[PLANS] Erro:', error);
        
        return errorResponse(500, 'Erro interno do servidor', error.message);
    }
};

// =============================================================================
// HANDLERS DOS ENDPOINTS
// =============================================================================

// Listar planos do personal trainer
async function handleGetPlans(event) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        const queryParams = event.queryStringParameters || {};
        
        const page = parseInt(queryParams.page) || 1;
        const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
        const status = queryParams.status;
        const search = queryParams.search;
        const offset = (page - 1) * limit;

        const client = await pool.connect();
        
        try {
            let whereClause = 'WHERE wp.personal_trainer_id = $1';
            let params = [decoded.userId];
            let paramCount = 1;

            // Filtros adicionais
            if (status) {
                paramCount++;
                whereClause += ` AND wp.status = ${paramCount}`;
                params.push(status);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (wp.name ILIKE ${paramCount} OR s.name ILIKE ${paramCount})`;
                params.push(`%${search}%`);
            }

            // Query principal
            const query = `
                SELECT 
                    wp.id, wp.name, wp.description, wp.objective, wp.frequency_per_week,
                    wp.start_date, wp.end_date, wp.status, wp.difficulty_level,
                    wp.equipment_type, wp.estimated_duration_minutes, wp.ai_generated,
                    wp.completed_cycles, wp.created_at, wp.updated_at,
                    s.id as student_id, s.name as student_name, s.email as student_email,
                    COUNT(w.id) as total_workouts,
                    COUNT(w.id) FILTER (WHERE w.is_completed = true) as completed_workouts,
                    COALESCE(SUM(w.execution_count), 0) as total_executions,
                    (SELECT COUNT(*) FROM shared_plans sp WHERE sp.workout_plan_id = wp.id AND sp.is_active = true) as active_shares
                FROM workout_plans wp
                LEFT JOIN students s ON wp.student_id = s.id
                LEFT JOIN workouts w ON wp.id = w.workout_plan_id
                ${whereClause}
                GROUP BY wp.id, s.id
                ORDER BY wp.updated_at DESC
                LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}
            `;

            params.push(limit, offset);

            const result = await client.query(query, params);

            // Contar total para paginação
            const countQuery = `
                SELECT COUNT(DISTINCT wp.id) as total
                FROM workout_plans wp
                LEFT JOIN students s ON wp.student_id = s.id
                ${whereClause}
            `;

            const countResult = await client.query(countQuery, params.slice(0, -2));
            const total = parseInt(countResult.rows[0].total);

            return successResponse(200, 'Planos obtidos com sucesso', {
                plans: result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    objective: row.objective,
                    frequencyPerWeek: row.frequency_per_week,
                    startDate: row.start_date,
                    endDate: row.end_date,
                    status: row.status,
                    difficultyLevel: row.difficulty_level,
                    equipmentType: row.equipment_type,
                    estimatedDuration: row.estimated_duration_minutes,
                    aiGenerated: row.ai_generated,
                    completedCycles: row.completed_cycles,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    student: row.student_id ? {
                        id: row.student_id,
                        name: row.student_name,
                        email: row.student_email
                    } : null,
                    stats: {
                        totalWorkouts: parseInt(row.total_workouts) || 0,
                        completedWorkouts: parseInt(row.completed_workouts) || 0,
                        totalExecutions: parseInt(row.total_executions) || 0,
                        activeShares: parseInt(row.active_shares) || 0
                    }
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao obter estatísticas:', error);
        return errorResponse(401, error.message);
    }
}release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao listar planos:', error);
        return errorResponse(401, error.message);
    }
}

// ✅ CORREÇÃO: Criar novo plano - adicionar verificação de personal trainer
async function handleCreatePlan(event) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        const data = JSON.parse(event.body);

        const sanitizedData = sanitizeInput(data);
        
        // ✅ ADICIONAR: Verificar se personal trainer existe, senão criar
        await ensurePersonalTrainerExists(decoded.userId, decoded.email);
        
        const validationErrors = validatePlanData(sanitizedData);
        
        if (validationErrors.length > 0) {
            return errorResponse(400, 'Dados inválidos', validationErrors);
        }

        const {
            name, description, objective, frequencyPerWeek, startDate, endDate,
            difficultyLevel, equipmentType, estimatedDuration, observations,
            aiGenerated, student, workouts
        } = sanitizedData;

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            let studentId = null;

            // Criar ou buscar aluno se fornecido
            if (student && student.name) {
                const studentResult = await client.query(`
                    INSERT INTO students (name, email, birth_date, age, height, weight, cpf)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (cpf) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        birth_date = EXCLUDED.birth_date,
                        age = EXCLUDED.age,
                        height = EXCLUDED.height,
                        weight = EXCLUDED.weight,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                `, [
                    student.name,
                    student.email || null,
                    student.birthDate || null,
                    student.age || null,
                    student.height || null,
                    student.weight || null,
                    student.cpf || null
                ]);

                studentId = studentResult.rows[0].id;
            }

            // Criar plano
            const planResult = await client.query(`
                INSERT INTO workout_plans (
                    personal_trainer_id, student_id, name, description, objective,
                    frequency_per_week, start_date, end_date, difficulty_level,
                    equipment_type, estimated_duration_minutes, observations, ai_generated
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
            `, [
                decoded.userId, studentId, name, description, objective,
                frequencyPerWeek || 3, startDate, endDate, difficultyLevel || 'intermediate',
                equipmentType || 'gym', estimatedDuration || 60,
                observations ? JSON.stringify(observations) : null, aiGenerated || false
            ]);

            const planId = planResult.rows[0].id;

            // Criar treinos se fornecidos
            if (workouts && Array.isArray(workouts)) {
                for (let i = 0; i < workouts.length; i++) {
                    const workout = workouts[i];
                    
                    const workoutResult = await client.query(`
                        INSERT INTO workouts (
                            workout_plan_id, name, workout_letter, focus_area,
                            description, estimated_duration_minutes, difficulty_level, order_index
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING id
                    `, [
                        planId, workout.name, workout.workoutLetter || String.fromCharCode(65 + i),
                        workout.focusArea, workout.description, workout.estimatedDuration || 60,
                        workout.difficultyLevel || 'intermediate', i
                    ]);

                    const workoutId = workoutResult.rows[0].id;

                    // Criar exercícios se fornecidos
                    if (workout.exercises && Array.isArray(workout.exercises)) {
                        for (let j = 0; j < workout.exercises.length; j++) {
                            const exercise = workout.exercises[j];
                            const muscleGroups = extractMuscleGroups(exercise.name, exercise.description);
                            
                            await client.query(`
                                INSERT INTO exercises (
                                    workout_id, name, description, muscle_groups, equipment,
                                    sets, reps, weight, rest_time, order_index, special_instructions
                                )
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            `, [
                                workoutId, exercise.name, exercise.description,
                                muscleGroups, exercise.equipment,
                                exercise.sets || 3, exercise.reps || '10-12',
                                exercise.weight || 'A definir', exercise.restTime || '90 segundos',
                                j, exercise.specialInstructions
                            ]);
                        }
                    }
                }
            }

            await client.query('COMMIT');

            return successResponse(201, 'Plano criado com sucesso', {
                planId
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao criar plano:', error);
        return errorResponse(error.message.includes('Token') ? 401 : 400, 'Erro ao criar plano');
    }
}

// Compartilhar plano
async function handleSharePlan(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const client = await pool.connect();
        
        try {
            // Verificar se o plano pertence ao personal trainer
            const planCheck = await client.query(
                'SELECT id, name FROM workout_plans WHERE id = $1 AND personal_trainer_id = $2',
                [planId, decoded.userId]
            );

            if (planCheck.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            const plan = planCheck.rows[0];

            // Gerar ID único para compartilhamento
            let shareId;
            let attempts = 0;
            
            do {
                shareId = generateShareId();
                const existing = await client.query(
                    'SELECT id FROM shared_plans WHERE share_id = $1',
                    [shareId]
                );
                attempts++;
            } while (existing.rows.length > 0 && attempts < 10);

            if (attempts === 10) {
                return errorResponse(500, 'Não foi possível gerar ID único');
            }

            // Buscar dados completos do plano
            const fullPlan = await getFullPlanData(client, planId);

            // Criar compartilhamento
            const shareResult = await client.query(`
                INSERT INTO shared_plans (
                    share_id, workout_plan_id, plan_data, expires_at
                )
                VALUES ($1, $2, $3, $4)
                RETURNING id, share_id, created_at
            `, [
                shareId,
                planId,
                JSON.stringify(fullPlan),
                new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 dias
            ]);

            const sharedPlan = shareResult.rows[0];

            return successResponse(201, 'Plano compartilhado com sucesso', {
                shareId: sharedPlan.share_id,
                planName: plan.name,
                expiresAt: sharedPlan.expires_at,
                createdAt: sharedPlan.created_at
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao compartilhar plano:', error);
        return errorResponse(401, error.message);
    }
}

// Função auxiliar para gerar Share ID
function generateShareId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Função auxiliar para obter dados completos do plano
async function getFullPlanData(client, planId) {
    // Buscar plano básico
    const planResult = await client.query(`
        SELECT 
            wp.*, s.name as student_name, s.email as student_email,
            s.birth_date, s.age, s.height, s.weight, s.cpf
        FROM workout_plans wp
        LEFT JOIN students s ON wp.student_id = s.id
        WHERE wp.id = $1
    `, [planId]);

    if (planResult.rows.length === 0) {
        throw new Error('Plano não encontrado');
    }

    const plan = planResult.rows[0];

    // Buscar treinos
    const workoutsResult = await client.query(`
        SELECT * FROM workouts 
        WHERE workout_plan_id = $1 
        ORDER BY order_index
    `, [planId]);

    // Buscar exercícios para cada treino
    const workouts = [];
    for (const workout of workoutsResult.rows) {
        const exercisesResult = await client.query(`
            SELECT * FROM exercises 
            WHERE workout_id = $1 
            ORDER BY order_index
        `, [workout.id]);

        workouts.push({
            id: workout.workout_letter,
            nome: workout.name,
            foco: workout.focus_area,
            descricao: workout.description,
            exercicios: exercisesResult.rows.map(ex => ({
                id: ex.id,
                nome: ex.name,
                descricao: ex.description,
                series: ex.sets,
                repeticoes: ex.reps,
                carga: ex.weight,
                descanso: ex.rest_time,
                observacoesEspeciais: ex.special_instructions,
                concluido: false
            })),
            concluido: false,
            execucoes: workout.execution_count || 0
        });
    }

    // Montar estrutura final do plano
    return {
        id: plan.id,
        nome: plan.name,
        descricao: plan.description,
        objetivo: plan.objective,
        dias: plan.frequency_per_week,
        dataInicio: plan.start_date,
        dataFim: plan.end_date,
        aluno: plan.student_name ? {
            nome: plan.student_name,
            email: plan.student_email,
            dataNascimento: plan.birth_date,
            idade: plan.age,
            altura: plan.height,
            peso: plan.weight,
            cpf: plan.cpf
        } : null,
        perfil: {
            objetivo: plan.objective,
            idade: plan.age,
            altura: plan.height,
            peso: plan.weight
        },
        treinos: workouts,
        observacoes: plan.observations ? JSON.parse(plan.observations) : {},
        execucoesPlanCompleto: plan.completed_cycles || 0
    };
}

// Obter plano específico com todos os detalhes
async function handleGetPlan(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const client = await pool.connect();
        
        try {
            // Buscar plano
            const planResult = await client.query(`
                SELECT 
                    wp.*, s.name as student_name, s.email as student_email,
                    s.birth_date, s.age, s.height, s.weight, s.cpf
                FROM workout_plans wp
                LEFT JOIN students s ON wp.student_id = s.id
                WHERE wp.id = $1 AND wp.personal_trainer_id = $2
            `, [planId, decoded.userId]);

            if (planResult.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            const plan = planResult.rows[0];

            // Buscar treinos
            const workoutsResult = await client.query(`
                SELECT * FROM workouts 
                WHERE workout_plan_id = $1 
                ORDER BY order_index
            `, [planId]);

            // Buscar exercícios para cada treino
            const workouts = [];
            for (const workout of workoutsResult.rows) {
                const exercisesResult = await client.query(`
                    SELECT * FROM exercises 
                    WHERE workout_id = $1 
                    ORDER BY order_index
                `, [workout.id]);

                workouts.push({
                    id: workout.id,
                    name: workout.name,
                    workoutLetter: workout.workout_letter,
                    focusArea: workout.focus_area,
                    description: workout.description,
                    estimatedDuration: workout.estimated_duration_minutes,
                    difficultyLevel: workout.difficulty_level,
                    orderIndex: workout.order_index,
                    isCompleted: workout.is_completed,
                    executionCount: workout.execution_count,
                    notes: workout.notes,
                    exercises: exercisesResult.rows.map(ex => ({
                        id: ex.id,
                        name: ex.name,
                        description: ex.description,
                        muscleGroups: ex.muscle_groups,
                        equipment: ex.equipment,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight,
                        restTime: ex.rest_time,
                        orderIndex: ex.order_index,
                        specialInstructions: ex.special_instructions,
                        videoUrl: ex.video_url,
                        imageUrl: ex.image_url,
                        isCompleted: ex.is_completed,
                        currentWeight: ex.current_weight,
                        rpeScale: ex.rpe_scale
                    }))
                });
            }

            return successResponse(200, 'Plano obtido com sucesso', {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                objective: plan.objective,
                frequencyPerWeek: plan.frequency_per_week,
                startDate: plan.start_date,
                endDate: plan.end_date,
                status: plan.status,
                difficultyLevel: plan.difficulty_level,
                equipmentType: plan.equipment_type,
                estimatedDuration: plan.estimated_duration_minutes,
                observations: plan.observations,
                aiGenerated: plan.ai_generated,
                completedCycles: plan.completed_cycles,
                createdAt: plan.created_at,
                updatedAt: plan.updated_at,
                student: plan.student_name ? {
                    name: plan.student_name,
                    email: plan.student_email,
                    birthDate: plan.birth_date,
                    age: plan.age,
                    height: plan.height,
                    weight: plan.weight,
                    cpf: plan.cpf
                } : null,
                workouts
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao obter plano:', error);
        return errorResponse(401, error.message);
    }
}

// Atualizar plano
async function handleUpdatePlan(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        const data = JSON.parse(event.body);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const sanitizedData = sanitizeInput(data);

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verificar se o plano pertence ao personal trainer
            const planCheck = await client.query(
                'SELECT id FROM workout_plans WHERE id = $1 AND personal_trainer_id = $2',
                [planId, decoded.userId]
            );

            if (planCheck.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            // Atualizar plano
            const updateFields = [];
            const updateValues = [];
            let paramCount = 0;

            const allowedFields = [
                'name', 'description', 'objective', 'frequency_per_week',
                'start_date', 'end_date', 'status', 'difficulty_level',
                'equipment_type', 'estimated_duration_minutes', 'observations'
            ];

            for (const [key, value] of Object.entries(sanitizedData)) {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                if (allowedFields.includes(snakeKey) && value !== undefined) {
                    paramCount++;
                    updateFields.push(`${snakeKey} = ${paramCount}`);
                    updateValues.push(key === 'observations' ? JSON.stringify(value) : value);
                }
            }

            if (updateFields.length > 0) {
                updateValues.push(planId);
                await client.query(`
                    UPDATE workout_plans 
                    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${paramCount + 1}
                `, updateValues);
            }

            await client.query('COMMIT');

            return successResponse(200, 'Plano atualizado com sucesso');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao atualizar plano:', error);
        return errorResponse(error.message.includes('Token') ? 401 : 400, 'Erro ao atualizar plano');
    }
}

// Excluir plano
async function handleDeletePlan(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const client = await pool.connect();
        
        try {
            const result = await client.query(
                'DELETE FROM workout_plans WHERE id = $1 AND personal_trainer_id = $2 RETURNING id',
                [planId, decoded.userId]
            );

            if (result.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            return successResponse(200, 'Plano excluído com sucesso');

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao excluir plano:', error);
        return errorResponse(401, error.message);
    }
}

// Duplicar plano
async function handleDuplicatePlan(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Buscar plano original
            const originalPlan = await client.query(
                'SELECT * FROM workout_plans WHERE id = $1 AND personal_trainer_id = $2',
                [planId, decoded.userId]
            );

            if (originalPlan.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            const plan = originalPlan.rows[0];

            // Criar cópia do plano
            const newPlanResult = await client.query(`
                INSERT INTO workout_plans (
                    personal_trainer_id, name, description, objective, frequency_per_week,
                    start_date, end_date, difficulty_level, equipment_type,
                    estimated_duration_minutes, observations
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `, [
                decoded.userId,
                plan.name + ' (Cópia)',
                plan.description,
                plan.objective,
                plan.frequency_per_week,
                null, // Limpar datas
                null,
                plan.difficulty_level,
                plan.equipment_type,
                plan.estimated_duration_minutes,
                plan.observations
            ]);

            const newPlanId = newPlanResult.rows[0].id;

            // Duplicar treinos e exercícios
            const workouts = await client.query(
                'SELECT * FROM workouts WHERE workout_plan_id = $1 ORDER BY order_index',
                [planId]
            );

            for (const workout of workouts.rows) {
                const newWorkoutResult = await client.query(`
                    INSERT INTO workouts (
                        workout_plan_id, name, workout_letter, focus_area, description,
                        estimated_duration_minutes, difficulty_level, order_index
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `, [
                    newPlanId, workout.name, workout.workout_letter, workout.focus_area,
                    workout.description, workout.estimated_duration_minutes,
                    workout.difficulty_level, workout.order_index
                ]);

                const newWorkoutId = newWorkoutResult.rows[0].id;

                // Duplicar exercícios
                const exercises = await client.query(
                    'SELECT * FROM exercises WHERE workout_id = $1 ORDER BY order_index',
                    [workout.id]
                );

                for (const exercise of exercises.rows) {
                    await client.query(`
                        INSERT INTO exercises (
                            workout_id, name, description, muscle_groups, equipment,
                            sets, reps, weight, rest_time, order_index, special_instructions
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [
                        newWorkoutId, exercise.name, exercise.description,
                        exercise.muscle_groups, exercise.equipment, exercise.sets,
                        exercise.reps, exercise.weight, exercise.rest_time,
                        exercise.order_index, exercise.special_instructions
                    ]);
                }
            }

            await client.query('COMMIT');

            return successResponse(201, 'Plano duplicado com sucesso', {
                planId: newPlanId
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[PLANS] Erro ao duplicar plano:', error);
        return errorResponse(401, error.message);
    }
}

// Obter estatísticas do plano
async function handleGetPlanStats(event, planId) {
    try {
        const decoded = verifyToken(event.headers.authorization);

        if (!validator.isUUID(planId)) {
            return errorResponse(400, 'ID do plano inválido');
        }

        const client = await pool.connect();
        
        try {
            // Verificar se o plano pertence ao usuário
            const planCheck = await client.query(
                'SELECT id FROM workout_plans WHERE id = $1 AND personal_trainer_id = $2',
                [planId, decoded.userId]
            );

            if (planCheck.rows.length === 0) {
                return errorResponse(404, 'Plano não encontrado');
            }

            // Obter estatísticas
            const statsResult = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM workouts WHERE workout_plan_id = $1) as total_workouts,
                    (SELECT COUNT(*) FROM workouts WHERE workout_plan_id = $1 AND is_completed = true) as completed_workouts,
                    (SELECT COUNT(*) FROM exercises e JOIN workouts w ON e.workout_id = w.id WHERE w.workout_plan_id = $1) as total_exercises,
                    (SELECT COUNT(*) FROM exercises e JOIN workouts w ON e.workout_id = w.id WHERE w.workout_plan_id = $1 AND e.is_completed = true) as completed_exercises,
                    (SELECT COALESCE(SUM(execution_count), 0) FROM workouts WHERE workout_plan_id = $1) as total_executions,
                    (SELECT completed_cycles FROM workout_plans WHERE id = $1) as completed_cycles
            `, [planId]);

            const stats = statsResult.rows[0];

            return successResponse(200, 'Estatísticas obtidas com sucesso', {
                totalWorkouts: parseInt(stats.total_workouts) || 0,
                completedWorkouts: parseInt(stats.completed_workouts) || 0,
                totalExercises: parseInt(stats.total_exercises) || 0,
                completedExercises: parseInt(stats.completed_exercises) || 0,
                totalExecutions: parseInt(stats.total_executions) || 0,
                completedCycles: parseInt(stats.completed_cycles) || 0,
                completionPercentage: stats.total_exercises > 0 ? 
                    Math.round((stats.completed_exercises / stats.total_exercises) * 100) : 0
            });

        } finally {
            client.length === 0) {
            return await handleCreatePlan(event);
        }
        
        if (method === 'GET' && pathParts.length === 1) {
            return await handleGetPlan(event, pathParts[0]);
        }
        
        if (method === 'PUT' && pathParts.length === 1) {
            return await handleUpdatePlan(event, pathParts[0]);
        }
        
        if (method === 'DELETE' && pathParts.length === 1) {
            return await handleDeletePlan(event, pathParts[0]);
        }
        
        if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'duplicate') {
            return await handleDuplicatePlan(event, pathParts[0]);
        }

        if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'stats') {
            return await handleGetPlanStats(event, pathParts[0]);
        }

        if (method === 'POST' && pathParts.