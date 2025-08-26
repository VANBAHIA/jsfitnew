// netlify/functions/health.js - Health Check Corrigido
const { Pool } = require('pg');

// Pool de conexões com o banco correto
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_rsCkP3jbcal7@ep-red-cloud-acw2aqx0-pooler.sa-east-1.aws.neon.tech/academiajsfit?sslmode=require&channel_binding=require',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Headers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
};

// Cache para evitar múltiplas consultas simultâneas
let lastHealthCheck = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

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

    // Apenas aceitar GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        const now = Date.now();
        
        // Usar cache se disponível e não expirado
        if (lastHealthCheck && (now - lastCheckTime) < CACHE_DURATION) {
            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Cache-Control': 'public, max-age=30',
                    'X-Cache': 'HIT'
                },
                body: JSON.stringify({
                    ...lastHealthCheck,
                    cached: true,
                    cacheAge: Math.floor((now - lastCheckTime) / 1000)
                })
            };
        }

        console.log('[HEALTH] Executando health check...');

        // Testar conexão com banco de dados
        const dbHealth = await checkDatabase();
        
        // Obter estatísticas do sistema
        const stats = await getSystemStats();

        // Construir resposta
        const healthData = {
            status: 'online',
            timestamp: new Date().toISOString(),
            version: '2.1.0',
            environment: process.env.NODE_ENV || 'production',
            uptime: process.uptime(),
            database: dbHealth,
            statistics: stats,
            server: {
                memory: process.memoryUsage(),
                platform: process.platform,
                nodeVersion: process.version
            }
        };

        // Determinar status geral
        const overallStatus = dbHealth.status === 'healthy' ? 'online' : 'degraded';
        healthData.status = overallStatus;

        // Atualizar cache
        lastHealthCheck = healthData;
        lastCheckTime = now;

        return {
            statusCode: overallStatus === 'online' ? 200 : 503,
            headers: {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=30',
                'X-Cache': 'MISS'
            },
            body: JSON.stringify(healthData)
        };

    } catch (error) {
        console.error('[HEALTH] Erro no health check:', error);

        return {
            statusCode: 503,
            headers: corsHeaders,
            body: JSON.stringify({
                status: 'error',
                timestamp: new Date().toISOString(),
                version: '2.1.0',
                error: error.message,
                uptime: process.uptime()
            })
        };
    }
};

// Verificar saúde do banco de dados
async function checkDatabase() {
    const startTime = Date.now();
    
    try {
        const client = await pool.connect();
        
        try {
            // Teste básico de conectividade
            const result = await client.query('SELECT NOW() as current_time, version() as version');
            const responseTime = Date.now() - startTime;

            // Teste de transação
            await client.query('BEGIN');
            await client.query('SELECT 1');
            await client.query('ROLLBACK');

            // Verificar se as extensões estão instaladas
            const extensionsResult = await client.query(`
                SELECT extname FROM pg_extension 
                WHERE extname IN ('uuid-ossp')
            `);

            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                timestamp: result.rows[0].current_time,
                version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
                connection: 'active',
                extensions: extensionsResult.rows.map(row => row.extname),
                pool: {
                    total: pool.totalCount,
                    idle: pool.idleCount,
                    waiting: pool.waitingCount
                }
            };

        } finally {
            client.release();
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'unhealthy',
            responseTime: `${responseTime}ms`,
            error: error.message,
            connection: 'failed'
        };
    }
}

// Obter estatísticas do sistema
async function getSystemStats() {
    try {
        const client = await pool.connect();
        
        try {
            // Primeiro verificar se as tabelas existem
            const tablesExist = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('workout_plans', 'workouts', 'exercises', 'shared_plans', 'personal_trainers', 'students')
            `);

            const existingTables = tablesExist.rows.map(row => row.table_name);

            if (existingTables.length === 0) {
                return {
                    tablesStatus: 'not_created',
                    message: 'Database tables not yet created',
                    availableTables: existingTables
                };
            }

            // Se as tabelas existem, obter estatísticas
            const stats = {};

            // Estatísticas básicas
            if (existingTables.includes('personal_trainers')) {
                const trainersResult = await client.query('SELECT COUNT(*) as count FROM personal_trainers WHERE is_active = true');
                stats.activePersonalTrainers = parseInt(trainersResult.rows[0].count);
            }

            if (existingTables.includes('students')) {
                const studentsResult = await client.query('SELECT COUNT(*) as count FROM students');
                stats.totalStudents = parseInt(studentsResult.rows[0].count);
            }

            if (existingTables.includes('workout_plans')) {
                const plansResult = await client.query(`
                    SELECT 
                        COUNT(*) as total_plans,
                        COUNT(*) FILTER (WHERE status = 'active') as active_plans,
                        COUNT(*) FILTER (WHERE ai_generated = true) as ai_generated_plans
                    FROM workout_plans
                `);
                const planStats = plansResult.rows[0];
                stats.workoutPlans = {
                    total: parseInt(planStats.total_plans),
                    active: parseInt(planStats.active_plans),
                    aiGenerated: parseInt(planStats.ai_generated_plans)
                };
            }

            if (existingTables.includes('workouts')) {
                const workoutsResult = await client.query(`
                    SELECT 
                        COUNT(*) as total_workouts,
                        COUNT(*) FILTER (WHERE is_completed = true) as completed_workouts,
                        COALESCE(SUM(execution_count), 0) as total_executions
                    FROM workouts
                `);
                const workoutStats = workoutsResult.rows[0];
                stats.workouts = {
                    total: parseInt(workoutStats.total_workouts),
                    completed: parseInt(workoutStats.completed_workouts),
                    totalExecutions: parseInt(workoutStats.total_executions)
                };
            }

            if (existingTables.includes('exercises')) {
                const exercisesResult = await client.query(`
                    SELECT 
                        COUNT(*) as total_exercises,
                        COUNT(*) FILTER (WHERE is_completed = true) as completed_exercises
                    FROM exercises
                `);
                const exerciseStats = exercisesResult.rows[0];
                stats.exercises = {
                    total: parseInt(exerciseStats.total_exercises),
                    completed: parseInt(exerciseStats.completed_exercises)
                };
            }

            if (existingTables.includes('shared_plans')) {
                const sharedResult = await client.query(`
                    SELECT 
                        COUNT(*) as total_shared,
                        COUNT(*) FILTER (WHERE is_active = true) as active_shares,
                        COALESCE(SUM(access_count), 0) as total_accesses
                    FROM shared_plans
                `);
                const shareStats = sharedResult.rows[0];
                stats.sharedPlans = {
                    total: parseInt(shareStats.total_shared),
                    active: parseInt(shareStats.active_shares),
                    totalAccesses: parseInt(shareStats.total_accesses)
                };
            }

            // Informações sobre o banco
            const dbSizeResult = await client.query(`
                SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
            `);
            stats.database = {
                size: dbSizeResult.rows[0].database_size,
                availableTables: existingTables
            };

            return stats;

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[HEALTH] Erro ao obter estatísticas:', error);
        return {
            error: 'Could not fetch statistics',
            message: error.message,
            tablesStatus: 'error'
        };
    }
}

// Função para limpar cache quando necessário
function clearCache() {
    lastHealthCheck = null;
    lastCheckTime = 0;
}

// Exportar função para limpeza de cache se necessário
module.exports.clearCache = clearCache;