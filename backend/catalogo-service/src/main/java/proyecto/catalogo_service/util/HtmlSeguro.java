package proyecto.catalogo_service.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

public final class HtmlSeguro {

    private static final Safelist PERMITIDO = Safelist.basic()
            .addTags("h1", "h2", "h3", "s", "hr")
            .addProtocols("a", "href", "http", "https", "mailto");

    private static final Document.OutputSettings SALIDA = new Document.OutputSettings().prettyPrint(false);

    private HtmlSeguro() {
    }

    public static String limpiar(String html) {
        if (html == null || html.isBlank()) return "";
        return Jsoup.clean(html, "", PERMITIDO, SALIDA);
    }
}
