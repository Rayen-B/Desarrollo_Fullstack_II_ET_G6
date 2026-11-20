package proyecto.catalogo_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import proyecto.catalogo_service.dto.ItemRecetaDTO;
import proyecto.catalogo_service.dto.ProductoRequestDTO;
import proyecto.catalogo_service.dto.ProductoResponseDTO;
import proyecto.catalogo_service.dto.RecetaDTO;
import proyecto.catalogo_service.exception.ConflictoException;
import proyecto.catalogo_service.exception.DatoInvalidoException;
import proyecto.catalogo_service.exception.RecursoNoEncontradoException;
import proyecto.catalogo_service.model.Categoria;
import proyecto.catalogo_service.model.Insumo;
import proyecto.catalogo_service.model.ItemReceta;
import proyecto.catalogo_service.model.Producto;
import proyecto.catalogo_service.repository.CategoriaRepository;
import proyecto.catalogo_service.repository.InsumoRepository;
import proyecto.catalogo_service.repository.ProductoRepository;
import proyecto.catalogo_service.util.HtmlSeguro;
import proyecto.catalogo_service.util.Textos;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private static final String IMAGEN_POR_DEFECTO = "menu/Torta_Panqueque_Naranja";

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private FotoService fotoService;

    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> listar(String categoria, String texto) {
        Map<String, Double> stock = stockInsumos();
        String categoriaBuscada = Textos.slug(categoria);
        String textoBuscado = Textos.slug(texto);
        return productoRepository.findAll().stream()
                .filter(p -> categoriaBuscada.isEmpty() || p.getCategoria().getId().equals(categoriaBuscada)
                        || Textos.slug(p.getCategoria().getNombre()).equals(categoriaBuscada))
                .filter(p -> textoBuscado.isEmpty() || Textos.slug(p.getNombre() + " " + p.getCodigo() + " " + p.getCategoria().getNombre()).contains(textoBuscado))
                .map(p -> aDto(p, stock))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponseDTO obtener(String codigo) {
        return aDto(buscar(codigo), stockInsumos());
    }

    @Transactional
    public ProductoResponseDTO crear(ProductoRequestDTO request) {
        String codigo = Textos.limpio(request.getCodigo()).toUpperCase();
        if (codigo.isEmpty()) throw new DatoInvalidoException("El código es requerido.");
        if (productoRepository.existsById(codigo)) throw new ConflictoException("Ya existe un producto con el código " + codigo + ".");
        Producto producto = new Producto();
        producto.setCodigo(codigo);
        producto.setImagen(IMAGEN_POR_DEFECTO);
        aplicar(producto, request);
        return aDto(productoRepository.save(producto), stockInsumos());
    }

    @Transactional
    public ProductoResponseDTO actualizar(String codigo, ProductoRequestDTO request) {
        Producto producto = buscar(codigo);
        aplicar(producto, request);
        return aDto(productoRepository.save(producto), stockInsumos());
    }

    @Transactional
    public void eliminar(String codigo) {
        Producto producto = buscar(codigo);
        productoRepository.delete(producto);
        fotoService.borrarSiEsPropia(producto.getImagen());
    }

    @Transactional(readOnly = true)
    public RecetaDTO obtenerReceta(String codigo) {
        return new RecetaDTO(recetaDto(buscar(codigo)));
    }

    @Transactional
    public ProductoResponseDTO actualizarReceta(String codigo, RecetaDTO receta) {
        Producto producto = buscar(codigo);
        producto.cambiarReceta(construirReceta(receta.getItems()));
        return aDto(productoRepository.save(producto), stockInsumos());
    }

    @Transactional
    public ProductoResponseDTO guardarFoto(String codigo, MultipartFile archivo) {
        Producto producto = buscar(codigo);
        String anterior = producto.getImagen();
        producto.setImagen(fotoService.guardar(producto.getCodigo(), archivo));
        Producto guardado = productoRepository.save(producto);
        fotoService.borrarSiEsPropia(anterior);
        return aDto(guardado, stockInsumos());
    }

    private void aplicar(Producto producto, ProductoRequestDTO request) {
        producto.setNombre(Textos.limpio(request.getNombre()));
        producto.setCategoria(categoriaDe(request.getCategoria()));
        producto.setPrecio(request.getPrecio());
        producto.setPrecioAnterior(request.getPrecioAnterior());
        producto.setStock(request.getStock());
        producto.setStockCritico(request.getStockCritico() == null ? 0 : request.getStockCritico());
        if (request.getImagen() != null && !request.getImagen().isBlank()) producto.setImagen(request.getImagen().trim());
        if (request.getDescripcion() != null || producto.getDescripcion() == null) {
            producto.setDescripcion(HtmlSeguro.limpiar(request.getDescripcion()));
        }
        if (request.getReceta() != null) producto.cambiarReceta(construirReceta(request.getReceta()));
    }

    private Categoria categoriaDe(String nombreOId) {
        return categoriaRepository.findById(Textos.slug(nombreOId))
                .orElseThrow(() -> new DatoInvalidoException("La categoría " + Textos.limpio(nombreOId) + " no existe."));
    }

    private List<ItemReceta> construirReceta(List<ItemRecetaDTO> items) {
        Map<String, Insumo> insumos = insumoRepository.findAll().stream()
                .collect(Collectors.toMap(Insumo::getId, Function.identity()));
        Set<String> vistos = new HashSet<>();
        List<ItemReceta> receta = new ArrayList<>();
        for (ItemRecetaDTO item : items) {
            Insumo insumo = insumos.get(item.getInsumoId());
            if (insumo == null) throw new DatoInvalidoException("El insumo " + item.getInsumoId() + " no existe.");
            if (!vistos.add(insumo.getId())) throw new DatoInvalidoException("El insumo " + insumo.getNombre() + " está repetido en la receta.");
            receta.add(new ItemReceta(insumo, CalculoStock.redondear(item.getCantidad())));
        }
        return receta;
    }

    private Producto buscar(String codigo) {
        return productoRepository.findById(Textos.limpio(codigo).toUpperCase())
                .orElseThrow(() -> new RecursoNoEncontradoException("El producto no existe."));
    }

    private Map<String, Double> stockInsumos() {
        return insumoRepository.findAll().stream().collect(Collectors.toMap(Insumo::getId, Insumo::getStock));
    }

    private List<ItemRecetaDTO> recetaDto(Producto producto) {
        return producto.getReceta().stream()
                .map(i -> new ItemRecetaDTO(i.getInsumo().getId(), i.getCantidad()))
                .toList();
    }

    private ProductoResponseDTO aDto(Producto p, Map<String, Double> stockInsumos) {
        int disponible = CalculoStock.disponible(p, stockInsumos);
        return ProductoResponseDTO.builder()
                .id(p.getCodigo())
                .codigo(p.getCodigo())
                .nombre(p.getNombre())
                .categoria(p.getCategoria().getNombre())
                .categoriaId(p.getCategoria().getId())
                .precio(p.getPrecio())
                .precioAnterior(p.getPrecioAnterior())
                .stock(p.getStock())
                .stockCritico(p.getStockCritico())
                .imagen(p.getImagen())
                .descripcion(p.getDescripcion())
                .receta(recetaDto(p))
                .disponible(disponible)
                .critico(disponible <= (p.getStockCritico() == null ? 0 : p.getStockCritico()))
                .build();
    }
}
