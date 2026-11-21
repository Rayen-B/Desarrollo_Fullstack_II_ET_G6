package proyecto.catalogo_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import proyecto.catalogo_service.dto.ItemVentaDTO;
import proyecto.catalogo_service.dto.MovimientosDTO;
import proyecto.catalogo_service.dto.VentaRequestDTO;
import proyecto.catalogo_service.dto.VerificacionDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.Producto;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ProductoRepository;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StockService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Transactional(readOnly = true)
    public VerificacionDTO verificar(VentaRequestDTO request) {
        CalculoStock.Resultado resultado = simular(request.getItems(), insumoRepository.findAll());
        if (!resultado.ok()) throw new ConflictoException("No hay stock suficiente de " + resultado.faltante() + ".");
        return new VerificacionDTO(true);
    }

    // Siempre se bloquean primero los insumos y después los productos, en el mismo orden, para que dos ventas no se traben
    @Transactional
    public MovimientosDTO descontar(VentaRequestDTO request) {
        List<Insumo> insumos = insumoRepository.findTodosParaActualizar();
        List<String> codigos = request.getItems().stream().map(i -> i.getCodigo().trim().toUpperCase()).distinct().toList();
        Map<String, Producto> productos = productoRepository.findParaActualizar(codigos).stream()
                .collect(Collectors.toMap(Producto::getCodigo, Function.identity()));
        CalculoStock.Resultado resultado = CalculoStock.simular(request.getItems(), productos, stockDe(insumos));
        if (!resultado.ok()) throw new ConflictoException("Ya no hay stock suficiente de " + resultado.faltante() + ".");

        productos.forEach((codigo, producto) -> producto.setStock(resultado.vitrina().get(codigo)));
        insumos.forEach(insumo -> insumo.setStock(resultado.insumos().get(insumo.getId())));
        productoRepository.saveAll(productos.values());
        insumoRepository.saveAll(insumos);
        return resultado.movimientos();
    }

    @Transactional
    public void devolver(MovimientosDTO movimientos) {
        Map<String, Integer> vitrina = movimientos.getVitrina() == null ? Map.of() : movimientos.getVitrina();
        Map<String, Double> usados = movimientos.getInsumos() == null ? Map.of() : movimientos.getInsumos();
        boolean negativo = vitrina.values().stream().anyMatch(n -> n == null || n < 0)
                || usados.values().stream().anyMatch(n -> n == null || n < 0);
        if (negativo) throw new DatoInvalidoException("Las cantidades a devolver no pueden ser negativas");

        List<Insumo> insumos = insumoRepository.findTodosParaActualizar();
        List<String> codigos = vitrina.keySet().stream().map(String::toUpperCase).distinct().toList();
        List<Producto> productos = codigos.isEmpty() ? List.of() : productoRepository.findParaActualizar(codigos);

        productos.forEach(p -> vitrina.forEach((codigo, cantidad) -> {
            if (codigo.equalsIgnoreCase(p.getCodigo())) p.setStock(CalculoStock.vitrina(p) + cantidad);
        }));
        insumos.forEach(i -> {
            Double cantidad = usados.get(i.getId());
            if (cantidad != null) i.setStock(CalculoStock.redondear(i.getStock() + cantidad));
        });
        productoRepository.saveAll(productos);
        insumoRepository.saveAll(insumos);
    }

    private CalculoStock.Resultado simular(List<ItemVentaDTO> items, List<Insumo> insumos) {
        return CalculoStock.simular(items, productosDe(items), stockDe(insumos));
    }

    private Map<String, Producto> productosDe(List<ItemVentaDTO> items) {
        List<String> codigos = items.stream().map(i -> i.getCodigo().trim().toUpperCase()).distinct().toList();
        return productoRepository.findAllById(codigos).stream()
                .collect(Collectors.toMap(Producto::getCodigo, Function.identity()));
    }

    private Map<String, Double> stockDe(List<Insumo> insumos) {
        return insumos.stream().collect(Collectors.toMap(Insumo::getId, Insumo::getStock));
    }
}
