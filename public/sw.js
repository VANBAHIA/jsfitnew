// sw.js - Service Worker Simplificado para JS Fit App PWA
// Versão focada apenas no Firebase e funcionalidades essenciais

const CACHE_NAME = 'js-fit-app-v2.1.0';
const STATIC_CACHE_NAME = 'js-fit-static-v2.1.0';

// Arquivos essenciais para cache offline
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/aluno.html',
    '/personal.html',
    '/css/style.css',
    '/css/stylePersonal.css',
    '/js/aluno.js',
    '/js/personal.js',
    '/js/shared/jsfitcore.js',
    '/manifest.json'
];

// =============================================================================
// INSTALAÇÃO DO SERVICE WORKER
// =============================================================================

self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker v2.1.0 (Firebase Only)');
    
    event.waitUntil(
        (async () => {
            try {
                const staticCache = await caches.open(STATIC_CACHE_NAME);
                await staticCache.addAll(STATIC_ASSETS);
                console.log('[SW] Arquivos essenciais cacheados');
                
                // Ativar imediatamente
                self.skipWaiting();
            } catch (error) {
                console.error('[SW] Erro ao cachear arquivos:', error);
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
                        cacheName.startsWith('js-fit')
                    )
                    .map(cacheName => {
                        console.log('[SW] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    });
                
                await Promise.all(deletionPromises);
                
                // Tomar controle de todas as abas
                await self.clients.claim();
                
                console.log('[SW] Service Worker ativado');
            } catch (error) {
                console.error('[SW] Erro na ativação:', error);
            }
        })()
    );
});

// =============================================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES - ESTRATÉGIA SIMPLES
// =============================================================================

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requisições de extensões e Firebase SDK
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'moz-extension:' ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com')) {
        return;
    }
    
    // Cache First para arquivos estáticos, Network First para o resto
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigation(request));
    }
    // Deixar outras requisições (Firebase, API) passarem normalmente
});

// =============================================================================
// ESTRATÉGIAS SIMPLIFICADAS
// =============================================================================

// Cache First para arquivos estáticos
async function handleStaticAsset(request) {
    try {
        // Tentar cache primeiro
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Buscar da rede se não estiver em cache
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Erro ao buscar asset:', error);
        
        // Fallback para cache se rede falhar
        const cachedResponse = await caches.match(request);
        return cachedResponse || createOfflineResponse();
    }
}

// Network First para navegação (permite Firebase funcionar)
async function handleNavigation(request) {
    try {
        // Tentar rede primeiro para permitir atualizações
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Rede indisponível, usando cache:', error);
        
        // Fallback para cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback final baseado na URL
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

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset)) ||
           request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'image' ||
           request.destination === 'font';
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && 
            request.headers.get('accept') && 
            request.headers.get('accept').includes('text/html'));
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 20px;
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
                text-decoration: none;
                display: inline-block;
            }
            .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .app-links {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .app-link {
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .app-link:hover {
                background: rgba(255, 255, 255, 0.25);
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
                🔄 Tentar Novamente
            </button>
            <div class="app-links">
                <a href="/aluno.html" class="app-link">👨‍🎓 Aluno</a>
                <a href="/personal.html" class="app-link">🏋️ Personal</a>
            </div>
        </div>
        
        <script>
            // Tentar reconectar automaticamente a cada 30 segundos
            let reconnectInterval = setInterval(() => {
                if (navigator.onLine) {
                    window.location.reload();
                }
            }, 30000);
            
            // Parar tentativas se usuário interagir
            document.addEventListener('click', () => {
                clearInterval(reconnectInterval);
            });
        </script>
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
// SINCRONIZAÇÃO SIMPLES EM BACKGROUND
// =============================================================================

self.addEventListener('sync', event => {
    console.log('[SW] Evento de sincronização:', event.tag);
    
    if (event.tag === 'firebase-sync') {
        event.waitUntil(notifyFirebaseSync());
    }
});

async function notifyFirebaseSync() {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'FIREBASE_SYNC_AVAILABLE',
                status: 'ready'
            });
        });
    } catch (error) {
        console.error('[SW] Erro na notificação de sincronização:', error);
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
            
        case 'CLEAR_CACHE':
            handleClearCache();
            break;
            
        case 'GET_CACHE_STATUS':
            handleGetCacheStatus(event);
            break;
            
        default:
            console.log('[SW] Mensagem recebida:', type);
    }
});

async function handleClearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter(name => name.startsWith('js-fit'))
                .map(name => caches.delete(name))
        );
        console.log('[SW] Todos os caches limpos');
    } catch (error) {
        console.error('[SW] Erro ao limpar cache:', error);
    }
}

async function handleGetCacheStatus(event) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const keys = await cache.keys();
        
        event.ports[0].postMessage({
            type: 'CACHE_STATUS',
            data: {
                name: STATIC_CACHE_NAME,
                count: keys.length,
                lastModified: new Date().toISOString()
            }
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
// MONITORAMENTO DE CONECTIVIDADE
// =============================================================================

// Notificar quando a conectividade for restaurada
self.addEventListener('online', () => {
    console.log('[SW] Conectividade restaurada');
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'CONNECTIVITY_RESTORED',
                timestamp: new Date().toISOString()
            });
        });
    });
});

console.log('[SW] Service Worker JS Fit App v2.1.0 (Firebase Only) carregado');