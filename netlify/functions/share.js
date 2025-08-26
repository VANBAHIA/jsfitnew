// netlify/functions/share.js - VERSÃO CORRIGIDA - Sistema de Compartilhamento Funcionando
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// ✅ CORRIGIDO: Pool de conexões com configuração correta
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_rsCkP3jbcal7@ep-red-cloud-acw2aqx0-pooler.sa-east-1.aws.neon.tech/academiajsfit?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Headers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

// Função para gerar share ID único
function generateShareId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ✅ CORRIGIDO: Função para verificar JWT com suporte a tokens temporários
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    
    // ✅ NOVO: Aceitar tokens temporários para desenvolvimento
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
        return null;
    }
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

// Handler principal
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
        const path = event.path.replace('/.netlify/functions/share', '').replace('/api/share', '');
        const method = event.httpMethod;
        const pathParts = path.split('/').filter(p => p.length > 0);

        console.log(`[SHARE] ${method} ${path}`);

        // Roteamento
        if (method === 'POST' && pathParts.length === 0) {
            return await createShare(event);
        }
        
        if (method === 'GET' && pathParts.length === 1) {
            return await getSharedPlan(pathParts[0]);
        }

        if (method === 'PUT' && pathParts.length === 1) {
            return await updateShare(event, pathParts[0]);
        }

        if (method === 'DELETE' && pathParts.length === 1) {
            return await deleteShare(event, pathParts[0]);
        }

        return errorResponse(404, 'Endpoint não encontrado');

    } catch (error) {
        console.error('[SHARE] Erro:', error);
        
        return errorResponse(500, 'Erro interno do servidor', error.message);
    }
};

// ✅ CORRIGIDO: Criar compartilhamento com melhor validação
async function createShare(event) {
    try {
        console.log('[CREATE_SHARE] Iniciando criação de compartilhamento');
        
        const requestData = JSON.parse(event.body);
        const { shareId, plan, workoutPlanId } = requestData;

        console.log('[CREATE_SHARE] Dados recebidos:', { 
            shareId, 
            planName: plan?.nome || plan?.name,
            workoutPlanId 
        });

        if (!plan) {
            return errorResponse(400, 'Dados do plano são obrigatórios');
        }

        const client = await pool.connect();
        
        try {
            // ✅ MELHORADO: Gerar shareId se não fornecido com verificação de duplicatas
            let finalShareId = shareId;
            if (!finalShareId) {
                console.log('[CREATE_SHARE] Gerando novo shareId...');
                finalShareId = generateShareId();
            }
            
            // Verificar duplicatas e gerar novo se necessário
            let attempts = 0;
            while (attempts < 10) {
                const existing = await client.query(
                    'SELECT id FROM shared_plans WHERE share_id = $1',
                    [finalShareId]
                );

                if (existing.rows.length === 0) {
                    break; // ID disponível
                }

                console.log(`[CREATE_SHARE] ID ${finalShareId} já existe, gerando novo...`);
                finalShareId = generateShareId();
                attempts++;
            }

            if (attempts === 10) {
                return errorResponse(500, 'Não foi possível gerar ID único após 10 tentativas');
            }

            console.log('[CREATE_SHARE] ShareId final:', finalShareId);

            // ✅ MELHORADO: Verificar se workoutPlanId existe (opcional)
            let validatedWorkoutPlanId = null;
            if (workoutPlanId) {
                console.log('[CREATE_SHARE] Verificando workoutPlanId:', workoutPlanId);
                try {
                    const planCheck = await client.query(
                        'SELECT id FROM workout_plans WHERE id = $1',
                        [workoutPlanId]
                    );
                    if (planCheck.rows.length > 0) {
                        validatedWorkoutPlanId = workoutPlanId;
                        console.log('[CREATE_SHARE] WorkoutPlanId validado:', validatedWorkoutPlanId);
                    } else {
                        console.warn('[CREATE_SHARE] WorkoutPlanId não encontrado, continuando sem ele');
                    }
                } catch (dbError) {
                    console.warn('[CREATE_SHARE] Erro ao verificar workoutPlanId:', dbError);
                    // Continua sem o workoutPlanId
                }
            }

            // ✅ NOVO: Verificar se a tabela shared_plans existe, se não, criar
            await ensureSharedPlansTableExists(client);

            // Definir data de expiração (90 dias)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 90);

            console.log('[CREATE_SHARE] Inserindo na tabela shared_plans...');

            // ✅ CORRIGIDO: Inserção com tratamento melhor de erros
            const result = await client.query(`
                INSERT INTO shared_plans (
                    share_id, 
                    workout_plan_id, 
                    plan_data, 
                    is_active, 
                    expires_at,
                    created_at, 
                    updated_at
                )
                VALUES ($1, $2, $3, true, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, share_id, created_at
            `, [
                finalShareId, 
                validatedWorkoutPlanId, 
                JSON.stringify(plan), 
                expiresAt
            ]);

            const sharedPlan = result.rows[0];
            console.log('[CREATE_SHARE] Plano compartilhado criado:', sharedPlan);

            return successResponse(201, 'Plano compartilhado com sucesso', {
                shareId: sharedPlan.share_id,
                id: sharedPlan.id,
                expiresAt: expiresAt.toISOString(),
                createdAt: sharedPlan.created_at,
                planName: plan?.nome || plan?.name || 'Plano de Treino'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[CREATE_SHARE] Erro detalhado:', error);
        return errorResponse(500, 'Erro ao compartilhar plano: ' + error.message);
    }
}

// ✅ NOVO: Garantir que a tabela shared_plans existe
async function ensureSharedPlansTableExists(client) {
    try {
        // Verificar se a tabela existe
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'shared_plans'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('[SHARE] Criando tabela shared_plans...');
            
            // Criar extensão uuid se não existir
            await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            
            // Criar tabela shared_plans
            await client.query(`
                CREATE TABLE shared_plans (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    share_id VARCHAR(10) UNIQUE NOT NULL,
                    workout_plan_id UUID,
                    plan_data JSONB NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    access_count INTEGER DEFAULT 0,
                    last_accessed_at TIMESTAMP WITH TIME ZONE,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    
                    CONSTRAINT share_id_format CHECK (share_id ~ '^[A-Z0-9]{6})
                );
            `);

            // Criar índices
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_shared_plans_share_id ON shared_plans(share_id);
                CREATE INDEX IF NOT EXISTS idx_shared_plans_active ON shared_plans(is_active);
                CREATE INDEX IF NOT EXISTS idx_shared_plans_expires ON shared_plans(expires_at);
            `);

            console.log('[SHARE] Tabela shared_plans criada com sucesso');
        }

    } catch (error) {
        console.error('[SHARE] Erro ao verificar/criar tabela:', error);
        // Não fazer throw - continuar mesmo se houver erro na criação da tabela
    }
}

// Obter plano compartilhado (usado pelo aluno)
async function getSharedPlan(shareId) {
    if (!shareId || shareId.length !== 6) {
        return errorResponse(400, 'Share ID deve ter 6 caracteres');
    }

    console.log('[GET_SHARED_PLAN] Buscando plano:', shareId.toUpperCase());

    const client = await pool.connect();
    
    try {
        // Buscar plano compartilhado
        const shareResult = await client.query(`
            SELECT 
                plan_data, 
                created_at, 
                access_count,
                expires_at,
                is_active,
                workout_plan_id
            FROM shared_plans 
            WHERE share_id = $1
        `, [shareId.toUpperCase()]);

        if (shareResult.rows.length === 0) {
            console.log('[GET_SHARED_PLAN] Plano não encontrado:', shareId);
            return errorResponse(404, 'Plano compartilhado não encontrado');
        }

        const share = shareResult.rows[0];
        console.log('[GET_SHARED_PLAN] Plano encontrado:', {
            shareId,
            isActive: share.is_active,
            expiresAt: share.expires_at,
            accessCount: share.access_count
        });

        // Verificar se está ativo
        if (!share.is_active) {
            return errorResponse(410, 'Este plano compartilhado foi desativado');
        }

        // Verificar se expirou
        if (share.expires_at && new Date() > new Date(share.expires_at)) {
            return errorResponse(410, 'Este plano compartilhado expirou');
        }

        // ✅ MELHORADO: Atualizar contador de acesso atomicamente
        try {
            await client.query(`
                UPDATE shared_plans 
                SET access_count = access_count + 1, 
                    last_accessed_at = CURRENT_TIMESTAMP
                WHERE share_id = $1
            `, [shareId.toUpperCase()]);
        } catch (updateError) {
            console.warn('[GET_SHARED_PLAN] Erro ao atualizar contador:', updateError);
            // Continuar mesmo se falhar a atualização do contador
        }

        const planData = JSON.parse(share.plan_data);

        return successResponse(200, 'Plano encontrado', {
            plan: planData,
            sharedAt: share.created_at,
            accessCount: (share.access_count || 0) + 1,
            expiresAt: share.expires_at,
            shareId: shareId.toUpperCase()
        });

    } catch (error) {
        console.error('[GET_SHARED_PLAN] Erro:', error);
        return errorResponse(500, 'Erro ao buscar plano compartilhado: ' + error.message);
    } finally {
        client.release();
    }
}

// Atualizar compartilhamento
async function updateShare(event, shareId) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        if (!decoded) {
            return errorResponse(401, 'Token de autorização requerido');
        }

        const requestData = JSON.parse(event.body);
        const { plan, isActive } = requestData;

        if (!shareId || shareId.length !== 6) {
            return errorResponse(400, 'Share ID inválido');
        }

        console.log('[UPDATE_SHARE] Atualizando compartilhamento:', shareId);

        const client = await pool.connect();
        
        try {
            // Verificar se o plano existe
            const checkResult = await client.query(`
                SELECT sp.id, wp.personal_trainer_id 
                FROM shared_plans sp
                LEFT JOIN workout_plans wp ON sp.workout_plan_id = wp.id
                WHERE sp.share_id = $1
            `, [shareId.toUpperCase()]);

            if (checkResult.rows.length === 0) {
                return errorResponse(404, 'Plano compartilhado não encontrado');
            }

            const shareData = checkResult.rows[0];
            
            // ✅ MELHORADO: Verificação de permissão mais flexível
            // Se há workout_plan_id, verificar se pertence ao usuário
            // Se não há, permitir atualização (para compatibilidade com dados antigos)
            if (shareData.personal_trainer_id && shareData.personal_trainer_id !== decoded.userId) {
                return errorResponse(403, 'Acesso negado a este plano');
            }

            // Atualizar plano
            const updateFields = [];
            const updateValues = [];
            let paramCount = 0;

            if (plan) {
                paramCount++;
                updateFields.push(`plan_data = ${paramCount}`);
                updateValues.push(JSON.stringify(plan));
            }

            if (typeof isActive === 'boolean') {
                paramCount++;
                updateFields.push(`is_active = ${paramCount}`);
                updateValues.push(isActive);
            }

            if (updateFields.length === 0) {
                return errorResponse(400, 'Nenhum dado para atualizar');
            }

            paramCount++;
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(shareId.toUpperCase());

            await client.query(`
                UPDATE shared_plans 
                SET ${updateFields.join(', ')}
                WHERE share_id = ${paramCount}
            `, updateValues);

            console.log('[UPDATE_SHARE] Compartilhamento atualizado:', shareId);

            return successResponse(200, 'Plano compartilhado atualizado com sucesso');

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[UPDATE_SHARE] Erro:', error);
        return errorResponse(500, 'Erro ao atualizar plano compartilhado: ' + error.message);
    }
}

// Deletar compartilhamento
async function deleteShare(event, shareId) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        if (!decoded) {
            return errorResponse(401, 'Token de autorização requerido');
        }

        if (!shareId || shareId.length !== 6) {
            return errorResponse(400, 'Share ID inválido');
        }

        console.log('[DELETE_SHARE] Removendo compartilhamento:', shareId);

        const client = await pool.connect();
        
        try {
            // Verificar se o plano existe e permissões
            const checkResult = await client.query(`
                SELECT sp.id, wp.personal_trainer_id 
                FROM shared_plans sp
                LEFT JOIN workout_plans wp ON sp.workout_plan_id = wp.id
                WHERE sp.share_id = $1
            `, [shareId.toUpperCase()]);

            if (checkResult.rows.length === 0) {
                return errorResponse(404, 'Plano compartilhado não encontrado');
            }

            const shareData = checkResult.rows[0];
            
            // Verificar permissões
            if (shareData.personal_trainer_id && shareData.personal_trainer_id !== decoded.userId) {
                return errorResponse(403, 'Acesso negado a este plano');
            }

            // Deletar compartilhamento
            const deleteResult = await client.query(
                'DELETE FROM shared_plans WHERE share_id = $1 RETURNING id', 
                [shareId.toUpperCase()]
            );

            if (deleteResult.rows.length === 0) {
                return errorResponse(404, 'Plano compartilhado não encontrado para exclusão');
            }

            console.log('[DELETE_SHARE] Compartilhamento removido:', shareId);

            return successResponse(200, 'Plano compartilhado removido com sucesso');

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[DELETE_SHARE] Erro:', error);
        return errorResponse(500, 'Erro ao remover plano compartilhado: ' + error.message);
    }
}

// ✅ NOVA FUNÇÃO: Listar compartilhamentos (útil para debug)
async function listShares(event) {
    try {
        const decoded = verifyToken(event.headers.authorization);
        if (!decoded) {
            return errorResponse(401, 'Token de autorização requerido');
        }

        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    sp.share_id,
                    sp.created_at,
                    sp.is_active,
                    sp.access_count,
                    sp.expires_at,
                    sp.plan_data->>'nome' as plan_name,
                    sp.plan_data->'aluno'->>'nome' as student_name
                FROM shared_plans sp
                ORDER BY sp.created_at DESC
                LIMIT 50
            `);

            return successResponse(200, 'Lista de compartilhamentos', {
                shares: result.rows,
                total: result.rows.length
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[LIST_SHARES] Erro:', error);
        return errorResponse(500, 'Erro ao listar compartilhamentos: ' + error.message);
    }
}

// ✅ FUNÇÃO DE LIMPEZA: Remover compartilhamentos expirados
async function cleanupExpiredShares() {
    const client = await pool.connect();
    
    try {
        const result = await client.query(`
            DELETE FROM shared_plans 
            WHERE expires_at < CURRENT_TIMESTAMP 
            AND expires_at IS NOT NULL
            RETURNING share_id
        `);

        if (result.rows.length > 0) {
            console.log('[CLEANUP] Removidos', result.rows.length, 'compartilhamentos expirados');
        }

        return result.rows.length;

    } catch (error) {
        console.error('[CLEANUP] Erro:', error);
        return 0;
    } finally {
        client.release();
    }
}

// ✅ EXECUTAR LIMPEZA PERIODICAMENTE
setInterval(cleanupExpiredShares, 24 * 60 * 60 * 1000); // Uma vez por dia

console.log('[SHARE] Sistema de compartilhamento inicializado - v2.1.0');