package proyecto.catalogo_service.service;

import proyecto.catalogo_service.model.Categoria;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.ItemReceta;
import proyecto.catalogo_service.model.Producto;

import java.util.List;

final class Datos {

    static final Categoria TORTAS = new Categoria("tortas", "Tortas", "Tortas caseras", "menu/x");

    private Datos() {
    }

    static Insumo insumo(String id, double stock) {
        return new Insumo(id, id, "g", stock, 0.0);
    }

    static Producto producto(String codigo, int vitrina, List<ItemReceta> receta) {
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setNombre("Producto " + codigo);
        p.setCategoria(TORTAS);
        p.setPrecio(10000);
        p.setStock(vitrina);
        p.setStockCritico(2);
        p.setImagen("menu/x");
        p.setDescripcion("<p>Rica</p>");
        p.cambiarReceta(receta);
        return p;
    }

    static ItemReceta linea(Insumo insumo, double cantidad) {
        return new ItemReceta(insumo, cantidad);
    }
}
