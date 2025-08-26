// sw.js - Service Worker para JS Fit App PWA
// Versão otimizada com cache inteligente e sincronização

const CACHE_NAME = 'js-fit-app-v2.1.0';
const STATIC_CACHE_NAME = 'js-fit-static-v2.1.0';
const DYNAMIC_CACHE_NAME = 'js-fit-dynamic-v2.1.0';

// Arquivos estáticos para cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/aluno.html',
    '/personal.html',
    '/css/style.css',
    '/styles.css',
    '/aluno.js',
    '/script.js',
    '/manifest.json',
    // Fontes do sistema (fallback)
    'https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700;900&display=swap'
];

// URLs da API para cache dinâmico
const API_URLS = [
    'https://jsfitapp.netlify.app/api/health',
    'https://jsfitapp.netlify.app/api/workouts'
];

// =============================================================================
// INSTALAÇÃO DO SERVICE WORKER
// =============================================================================

self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker v2.1.0');
    
    event.waitUntil(
        (async () => {
            try {
                // Cache de arquivos estáticos
                const staticCache = await caches.open(STATIC_CACHE_NAME);
                await staticCache.addAll(STATIC_ASSETS);
                console.log('[SW] Arquivos estáticos cacheados com sucesso');
                
                // Pular a espera e ativar imediatamente
                self.skipWaiting();
            } catch (error) {
                console.error('[SW] Erro ao cachear arquivos estáticos:', error);
            }
        })()
    );
});

// =============================================================================
// ATIVAÇÃO DO SERVICE WORKER
// =============================================================================

self.addEventListener('activate', event => {
    console.log('[SW] Ativando Service Worker v2.1.0');
    
    event.waitUntil(
        (async () => {
            try {
                // Limpar caches antigos
                const cacheNames = await caches.keys();
                const deletionPromises = cacheNames
                    .filter(cacheName => 
                        cacheName !== STATIC_CACHE_NAME && 
                        cacheName !== DYNAMIC_CACHE_NAME &&
                        cacheName.startsWith('js-fit')
                    )
                    .map(cacheName => {
                        console.log('[SW] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    });
                
                await Promise.all(deletionPromises);
                
                // Tomar controle de todas as abas abertas
                await self.clients.claim();
                
                console.log('[SW] Service Worker ativado e em controle');
            } catch (error) {
                console.error('[SW] Erro na ativação:', error);
            }
        })()
    );
});

// =============================================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES
// =============================================================================

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requisições de extensões do navegador
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }
    
    // Estratégia baseada no tipo de recurso
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    } else {
        event.respondWith(handleOtherRequests(request));
    }
});

// =============================================================================
// ESTRATÉGIAS DE CACHE
// =============================================================================

// Cache First - Para arquivos estáticos
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cachear apenas se a resposta for válida
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Erro ao buscar asset estático:', error);
        
        // Retornar resposta em cache se disponível
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback para página offline
        if (request.destination === 'document') {
            return createOfflineResponse();
        }
        
        throw error;
    }
}

// Network First com Cache Fallback - Para API
async function handleAPIRequest(request) {
    try {
        // Tentar buscar da rede primeiro
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
            )
        ]);
        
        // Cachear resposta se for bem-sucedida
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Rede indisponível, tentando cache:', error.message);
        
        // Fallback para cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Adicionar header indicando que veio do cache
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-Cache-Status', 'HIT');
            headers.set('X-Cache-Date', new Date().toISOString());
            
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
            });
        }
        
        // Retornar resposta de erro estruturada
        return new Response(
            JSON.stringify({
                error: 'Sem conexão com a internet',
                cached: false,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cache-Status': 'MISS'
                }
            }
        );
    }
}

// Cache First com Network Fallback - Para navegação
async function handleNavigationRequest(request) {
    try {
        // Verificar cache primeiro
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Tentar atualizar em background
            updateCacheInBackground(request);
            return cachedResponse;
        }
        
        // Buscar da rede
        const networkResponse = await fetch(request);
        
        // Cachear se bem-sucedida
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Erro na navegação:', error);
        
        // Fallback para páginas principais
        const url = new URL(request.url);
        if (url.pathname === '/aluno.html') {
            const cached = await caches.match('/aluno.html');
            return cached || createOfflineResponse();
        } else if (url.pathname === '/personal.html') {
            const cached = await caches.match('/personal.html');
            return cached || createOfflineResponse();
        } else {
            const cached = await caches.match('/index.html');
            return cached || createOfflineResponse();
        }
    }
}

// Stale While Revalidate - Para outros recursos
async function handleOtherRequests(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        // Buscar da rede em background
        const networkPromise = fetch(request).then(response => {
            if (response.ok) {
                const cache = caches.open(DYNAMIC_CACHE_NAME);
                cache.then(c => c.put(request, response.clone()));
            }
            return response;
        }).catch(() => null);
        
        // Retornar cache imediatamente se disponível, senão esperar pela rede
        return cachedResponse || await networkPromise;
    } catch (error) {
        console.error('[SW] Erro em outros requests:', error);
        throw error;
    }
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
           request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'font' ||
           request.destination === 'image';
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.hostname === 'jsfitapp.netlify.app' && url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        console.warn('[SW] Falha na atualização em background:', error);
    }
}

function createOfflineResponse() {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - JS Fit App</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
            }
            .offline-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            .offline-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            .offline-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 16px;
            }
            .offline-message {
                font-size: 16px;
                line-height: 1.6;
                opacity: 0.9;
                margin-bottom: 24px;
            }
            .retry-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">Você está offline</h1>
            <p class="offline-message">
                Não foi possível conectar com a internet. 
                Verifique sua conexão e tente novamente.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
                Tentar Novamente
            </button>
        </div>
    </body>
    </html>
    `;
    
    return new Response(offlineHTML, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Cache-Status': 'OFFLINE'
        }
    });
}

// =============================================================================
// SINCRONIZAÇÃO EM BACKGROUND
// =============================================================================

self.addEventListener('sync', event => {
    console.log('[SW] Evento de sincronização:', event.tag);
    
    if (event.tag === 'sync-workout-data') {
        event.waitUntil(syncWorkoutData());
    } else if (event.tag === 'sync-shared-plans') {
        event.waitUntil(syncSharedPlans());
    }
});

async function syncWorkoutData() {
    try {
        console.log('[SW] Sincronizando dados de treino...');
        
        // Buscar dados locais que precisam ser sincronizados
        const clients = await self.clients.matchAll();
        
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_WORKOUT_DATA',
                status: 'starting'
            });
        });
        
        // Implementar lógica de sincronização aqui
        // Por exemplo, enviar dados offline para o servidor
        
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_WORKOUT_DATA',
                status: 'completed'
            });
        });
        
    } catch (error) {
        console.error('[SW] Erro na sincronização:', error);
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_WORKOUT_DATA',
                status: 'failed',
                error: error.message
            });
        });
    }
}

async function syncSharedPlans() {
    try {
        console.log('[SW] Sincronizando planos compartilhados...');
        
        // Tentar buscar atualizações dos planos compartilhados
        const response = await fetch('https://jsfitapp.netlify.app/api/health');
        
        if (response.ok) {
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_SHARED_PLANS',
                    status: 'server_available'
                });
            });
        }
        
    } catch (error) {
        console.warn('[SW] Servidor indisponível para sincronização');
    }
}

// =============================================================================
// MENSAGENS DO CLIENTE
// =============================================================================

self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLAIM_CLIENTS':
            self.clients.claim();
            break;
            
        case 'CACHE_WORKOUT_DATA':
            handleCacheWorkoutData(payload);
            break;
            
        case 'CLEAR_CACHE':
            handleClearCache(payload);
            break;
            
        case 'GET_CACHE_STATUS':
            handleGetCacheStatus(event);
            break;
            
        default:
            console.warn('[SW] Tipo de mensagem não reconhecido:', type);
    }
});

async function handleCacheWorkoutData(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        
        // Cachear dados de treino para acesso offline
        const response = new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'X-Cache-Date': new Date().toISOString()
            }
        });
        
        await cache.put('/offline-workout-data', response);
        console.log('[SW] Dados de treino cacheados para uso offline');
    } catch (error) {
        console.error('[SW] Erro ao cachear dados de treino:', error);
    }
}

async function handleClearCache(cacheType) {
    try {
        if (cacheType === 'all') {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name.startsWith('js-fit'))
                    .map(name => caches.delete(name))
            );
        } else {
            await caches.delete(cacheType);
        }
        console.log('[SW] Cache limpo:', cacheType);
    } catch (error) {
        console.error('[SW] Erro ao limpar cache:', error);
    }
}

async function handleGetCacheStatus(event) {
    try {
        const cacheNames = await caches.keys();
        const cacheStatus = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheStatus[cacheName] = {
                count: keys.length,
                lastModified: new Date().toISOString()
            };
        }
        
        event.ports[0].postMessage({
            type: 'CACHE_STATUS',
            data: cacheStatus
        });
    } catch (error) {
        console.error('[SW] Erro ao obter status do cache:', error);
        event.ports[0].postMessage({
            type: 'CACHE_STATUS_ERROR',
            error: error.message
        });
    }
}

// =============================================================================
// NOTIFICAÇÕES PUSH
// =============================================================================

self.addEventListener('push', event => {
    console.log('[SW] Notificação push recebida');
    
    const options = {
        body: 'Você tem novos treinos disponíveis!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver Treinos',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('JS Fit App', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('[SW] Clique na notificação:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/aluno.html')
        );
    }
});

// =============================================================================
// LIMPEZA PERIÓDICA DE CACHE
// =============================================================================

// Executar limpeza a cada 24 horas
setInterval(async () => {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const cacheDate = response.headers.get('X-Cache-Date');
                if (cacheDate) {
                    const age = Date.now() - new Date(cacheDate).getTime();
                    // Remover itens com mais de 7 dias
                    if (age > 7 * 24 * 60 * 60 * 1000) {
                        await cache.delete(request);
                        console.log('[SW] Item antigo removido do cache:', request.url);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[SW] Erro na limpeza periódica:', error);
    }
}, 24 * 60 * 60 * 1000); // 24 horas

console.log('[SW] Service Worker JS Fit App v2.1.0 carregado');
