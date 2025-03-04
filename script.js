document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.getElementById('video-player');
    const playBtn = document.getElementById('play-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const statusMessage = document.getElementById('status-message');

    // URL del stream HLS
    const streamUrl = 'https://4d7d-45-189-116-231.ngrok-free.app/hls/test.m3u8';

    // Verificar si el navegador soporta HLS.js
    function initPlayer() {
        if (Hls.isSupported()) {
            statusMessage.textContent = 'Inicializando reproductor...';
            statusMessage.className = 'loading';

            const hls = new Hls({
                debug: false,
                manifestLoadingTimeOut: 20000,
                manifestLoadingMaxRetry: 5,
                manifestLoadingRetryDelay: 1000,
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(videoPlayer);

            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                statusMessage.textContent = 'Stream cargado correctamente. Listo para reproducir.';
                statusMessage.className = 'success';
                playBtn.disabled = false;
            });

            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            statusMessage.textContent = 'Error de red al cargar el stream. Intentando reconectar...';
                            statusMessage.className = 'error';
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            statusMessage.textContent = 'Error de multimedia. Intentando recuperar...';
                            statusMessage.className = 'error';
                            hls.recoverMediaError();
                            break;
                        default:
                            statusMessage.textContent = 'Error fatal. No se puede cargar el stream.';
                            statusMessage.className = 'error';
                            hls.destroy();
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

            videoPlayer.addEventListener('error', function() {
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

            videoPlayer.addEventListener('error', function() {
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