document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.getElementById('video-player');
    const playBtn = document.getElementById('play-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const statusMessage = document.getElementById('status-message');
    
    // URL del stream HLS - Actualiza esta URL si ha cambiado
    const streamUrl = 'https://4d7d-45-189-116-231.ngrok-free.app/hls/test.m3u8';
    
    // Verificar si el navegador soporta HLS.js
    function initPlayer() {
        if (Hls.isSupported()) {
            statusMessage.textContent = 'Inicializando reproductor...';
            statusMessage.className = 'loading';
            
            const hls = new Hls({
                debug: true, // Habilitar debug para ver más información
                manifestLoadingTimeOut: 30000, // Aumentar el tiempo de espera a 30 segundos
                manifestLoadingMaxRetry: 8, // Aumentar el número de reintentos
                manifestLoadingRetryDelay: 2000, // Aumentar el retraso entre reintentos
                xhrSetup: function(xhr, url) {
                    // Configurar CORS para permitir solicitudes desde cualquier origen
                    xhr.withCredentials = false;
                }
            });
            
            hls.loadSource(streamUrl);
            hls.attachMedia(videoPlayer);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                statusMessage.textContent = 'Stream cargado correctamente. Listo para reproducir.';
                statusMessage.className = 'success';
                playBtn.disabled = false;
                
                // Intentar reproducir automáticamente
                videoPlayer.play().catch(error => {
                    console.log('Reproducción automática bloqueada por el navegador:', error);
                });
            });
            
            hls.on(Hls.Events.ERROR, function(event, data) {
                console.error('Error HLS:', event, data); // Mostrar detalles del error en consola
                
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            statusMessage.textContent = 'Error de red al cargar el stream. Intentando reconectar...';
                            statusMessage.className = 'error';
                            console.log('Error de red. Detalles:', data.details);
                            
                            // Pequeña pausa antes de reintentar
                            setTimeout(() => {
                                hls.startLoad();
                            }, 3000);
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            statusMessage.textContent = 'Error de multimedia. Intentando recuperar...';
                            statusMessage.className = 'error';
                            hls.recoverMediaError();
                            break;
                        default:
                            statusMessage.textContent = 'Error fatal. Intentando reiniciar el reproductor...';
                            statusMessage.className = 'error';
                            hls.destroy();
                            setTimeout(initPlayer, 2000); // Reiniciar el reproductor completamente
                            break;
                    }
                } else {
                    statusMessage.textContent = 'Error no fatal detectado. Intentando continuar...';
                    statusMessage.className = 'loading';
                }
            });
            
            videoPlayer.addEventListener('playing', function() {
                statusMessage.textContent = 'Reproduciendo stream en vivo';
                statusMessage.className = 'success';
            });
            
            videoPlayer.addEventListener('waiting', function() {
                statusMessage.textContent = 'Buffering...';
                statusMessage.className = 'loading';
            });
            
            videoPlayer.addEventListener('error', function(e) {
                console.error('Error en el elemento de video:', e);
                statusMessage.textContent = 'Error en el reproductor de video';
                statusMessage.className = 'error';
            });
            
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Para Safari en iOS y macOS que soporta HLS nativamente
            statusMessage.textContent = 'Usando reproductor nativo para HLS';
            videoPlayer.src = streamUrl;
            
            videoPlayer.addEventListener('loadedmetadata', function() {
                statusMessage.textContent = 'Stream cargado correctamente. Listo para reproducir.';
                statusMessage.className = 'success';
                playBtn.disabled = false;
            });
            
            videoPlayer.addEventListener('error', function(e) {
                console.error('Error en el elemento de video nativo:', e);
                statusMessage.textContent = 'Error al cargar el stream en el reproductor nativo';
                statusMessage.className = 'error';
            });
        } else {
            statusMessage.textContent = 'Tu navegador no soporta la reproducción de streams HLS';
            statusMessage.className = 'error';
        }
    }
    
    // Iniciar el reproductor
    initPlayer();
    
    // Botón de reproducir
    playBtn.addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play()
                .then(() => {
                    playBtn.textContent = 'Pausar';
                })
                .catch(error => {
                    statusMessage.textContent = 'No se pudo iniciar la reproducción automáticamente: ' + error.message;
                    statusMessage.className = 'error';
                });
        } else {
            videoPlayer.pause();
            playBtn.textContent = 'Reproducir';
        }
    });
    
    // Botón de recargar
    reloadBtn.addEventListener('click', function() {
        statusMessage.textContent = 'Recargando el stream...';
        statusMessage.className = 'loading';
        videoPlayer.src = '';
        initPlayer();
    });
    
    // Deshabilitar el botón de reproducir inicialmente
    playBtn.disabled = true;
});
