package proyecto.orden_service.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Cancela solas las transferencias que no se pagaron a tiempo y devuelve su stock
@Component
public class VencimientoTransferencias {

    private static final Logger log = LoggerFactory.getLogger(VencimientoTransferencias.class);

    @Autowired
    private OrdenService ordenService;

    @Scheduled(fixedDelayString = "${ordenes.revision-vencidas-ms:300000}", initialDelay = 60000)
    public void revisar() {
        int canceladas = ordenService.cancelarTransferenciasVencidas();
        if (canceladas > 0) log.info("Se cancelaron {} transferencias con el plazo vencido", canceladas);
    }
}
