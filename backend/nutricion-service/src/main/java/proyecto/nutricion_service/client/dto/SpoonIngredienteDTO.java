package proyecto.nutricion_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SpoonIngredienteDTO {
    private String original;
    private String name;
    private Double amount;
    private String unit;
    private Nutricion nutrition;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Nutricion {
        private List<Nutriente> nutrients;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Nutriente {
        private String name;
        private Double amount;
        private String unit;
    }
}
