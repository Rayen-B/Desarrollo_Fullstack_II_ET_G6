package proyecto.catalogo_service.service;

import proyecto.catalogo_service.dto.ItemVentaDTO;
import proyecto.catalogo_service.dto.MovimientosDTO;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.ItemReceta;
import proyecto.catalogo_service.model.Producto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class CalculoStock {

    public static final double FACTOR_TROZO = 0.25;

    public record Resultado(String faltante, Map<String, Integer> vitrina, Map<String, Double> insumos, MovimientosDTO movimientos) {
        public boolean ok() {
            return faltante == null;
        }
    }

    private CalculoStock() {
    }

    public static double redondear(double n) {
        return Math.round(n * 1000) / 1000.0;
    }

    public static int preparables(List<ItemReceta> receta, Map<String, Double> stockInsumos, double factor) {
        if (receta == null || receta.isEmpty()) return 0;
        int minimo = Integer.MAX_VALUE;
        for (ItemReceta item : receta) {
            Double stock = stockInsumos.get(item.getInsumo().getId());
            if (stock == null) return 0;
            double porUnidad = item.getCantidad() * factor;
            if (porUnidad <= 0) continue;
            minimo = Math.min(minimo, (int) Math.floor(redondear(stock / porUnidad)));
        }
        return minimo == Integer.MAX_VALUE ? 0 : minimo;
    }

    public static int vitrina(Producto producto) {
        return Math.max(0, producto.getStock() == null ? 0 : producto.getStock());
    }

    public static int disponible(Producto producto, Map<String, Double> stockInsumos) {
        return vitrina(producto) + preparables(producto.getReceta(), stockInsumos, 1);
    }

    public static double factor(ItemVentaDTO item) {
        if (item.getFactor() != null) return item.getFactor();
        return "trozo".equalsIgnoreCase(item.getVariante()) ? FACTOR_TROZO : 1;
    }

    // Las unidades completas salen primero de la vitrina; lo que falta y los trozos se preparan con los insumos
    public static Resultado simular(List<ItemVentaDTO> items, Map<String, Producto> productos, Map<String, Double> stockInsumos) {
        Map<String, Integer> vitrina = new HashMap<>();
        productos.forEach((codigo, p) -> vitrina.put(codigo, vitrina(p)));
        Map<String, Double> insumos = new HashMap<>(stockInsumos);
        MovimientosDTO movimientos = new MovimientosDTO();

        for (ItemVentaDTO item : items) {
            String codigo = item.getCodigo().trim().toUpperCase();
            Producto producto = productos.get(codigo);
            if (producto == null) throw new RecursoNoEncontradoException("El producto " + codigo + " no existe.");
            double factor = factor(item);
            int porPreparar = item.getCantidad();

            if (factor == 1) {
                int desdeVitrina = Math.min(vitrina.get(codigo), porPreparar);
                vitrina.put(codigo, vitrina.get(codigo) - desdeVitrina);
                porPreparar -= desdeVitrina;
                if (desdeVitrina > 0) movimientos.getVitrina().merge(codigo, desdeVitrina, Integer::sum);
            }
            if (porPreparar <= 0) continue;

            if (preparables(producto.getReceta(), insumos, factor) < porPreparar) {
                return new Resultado(producto.getNombre(), vitrina, insumos, movimientos);
            }
            for (ItemReceta ingrediente : producto.getReceta()) {
                String insumoId = ingrediente.getInsumo().getId();
                double stock = insumos.get(insumoId);
                double usado = Math.min(stock, redondear(ingrediente.getCantidad() * factor * porPreparar));
                insumos.put(insumoId, redondear(stock - usado));
                movimientos.getInsumos().merge(insumoId, usado, (a, b) -> redondear(a + b));
            }
        }
        return new Resultado(null, vitrina, insumos, movimientos);
    }
}
