import { tarjetaVencida } from './pago';

// Validar RUN chileno con Dígito Verificador (Módulo 11)
export function validarRUN(run) {
    if (!run || run.trim() === '') {
        return { valido: false, mensaje: "El RUN es requerido" };
    }
    const runTrim = run.trim();

    if (/[\.\-]/.test(runTrim)) {
        return { valido: false, mensaje: "El RUN debe ingresarse sin puntos ni guión (ej: 19011022K)" };
    }
    const runLimpio = runTrim.toUpperCase();
    if (runLimpio.length < 7 || runLimpio.length > 9) {
        return { valido: false, mensaje: "El RUN debe tener entre 7 y 9 caracteres (sin puntos ni guión)" };
    }
    const cuerpo = runLimpio.slice(0, -1);
    const dv = runLimpio.slice(-1);
    if (!/^\d+$/.test(cuerpo)) {
        return { valido: false, mensaje: "El cuerpo del RUN debe contener solo números" };
    }

    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperadoCalculado = 11 - (suma % 11);
    let dvEsperado = '';
    if (dvEsperadoCalculado === 11) dvEsperado = '0';
    else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
    else dvEsperado = dvEsperadoCalculado.toString();

    if (dv !== dvEsperado) {
        return { valido: false, mensaje: `RUN inválido. El dígito verificador no corresponde (esperado: ${dvEsperado})` };
    }
    return { valido: true, mensaje: "RUN válido" };
}

// Validar Correo Electrónico (formato RFC2822 simplificado, exige dominio con extensión: usuario@dominio.cl)
export function validarEmail(email) {
    if (!email || email.trim() === '') return { valido: false, mensaje: "El correo es requerido" };
    if (email.length > 100) return { valido: false, mensaje: "Máximo 100 caracteres" };

    const regexCorreo = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!regexCorreo.test(email.trim())) {
        return { valido: false, mensaje: "Formato de correo no válido (ej: usuario@correo.com)" };
    }

    return { valido: true, mensaje: "Correo válido" };
}

// Validar Contraseña (4 a 10 caracteres, alfanumérica con caracteres especiales)
export function validarPassword(pass) {
    if (!pass) return { valido: false, mensaje: "La contraseña es requerida" };
    if (pass.length < 4 || pass.length > 10) return { valido: false, mensaje: "Debe tener entre 4 y 10 caracteres" };

    const tieneLetra = /[a-zA-Z]/.test(pass);
    const tieneNumero = /\d/.test(pass);
    const tieneEspecial = /[^a-zA-Z0-9]/.test(pass);

    if (!tieneLetra || !tieneNumero || !tieneEspecial) {
        return { valido: false, mensaje: "Debe ser alfanumérica y contener al menos 1 símbolo (ej: @, $, #, !)" };
    }

    return { valido: true, mensaje: "Contraseña válida" };
}

// Validar Código de Producto
export function validarCodigoProducto(codigo) {
    if (!codigo || codigo.trim() === '') return { valido: false, mensaje: "El código es requerido" };
    if (codigo.trim().length < 3) return { valido: false, mensaje: "Mínimo 3 caracteres" };
    return { valido: true, mensaje: "Código válido" };
}

// Validar Precio
export function validarPrecio(precio) {
    if (precio === '' || precio === null || isNaN(precio)) return { valido: false, mensaje: "El precio es requerido" };
    const num = parseFloat(precio);
    if (num < 0) return { valido: false, mensaje: "El precio no puede ser negativo" };
    return { valido: true, mensaje: num === 0 ? "Producto gratuito" : "Precio válido" };
}

// Validar Stock
export function validarStock(stock) {
    if (stock === '' || stock === null || isNaN(stock)) return { valido: false, mensaje: "El stock es requerido" };
    const num = Number(stock);
    if (!Number.isInteger(num)) return { valido: false, mensaje: "Debe ser un número entero" };
    if (num < 0) return { valido: false, mensaje: "El stock no puede ser negativo" };
    return { valido: true, mensaje: "Stock válido" };
}

// Algoritmo de Luhn para números de tarjeta de crédito
export function validarTarjetaLuhn(numeroTarjeta) {
    const limpio = String(numeroTarjeta).replace(/\D/g, '');
    if (!limpio || limpio.length < 13 || limpio.length > 19) {
        return { valido: false, mensaje: "El número de tarjeta debe tener entre 13 y 19 dígitos" };
    }
    let suma = 0;
    let esSegundo = false;
    for (let i = limpio.length - 1; i >= 0; i--) {
        let d = parseInt(limpio.charAt(i), 10);
        if (esSegundo) {
            d = d * 2;
            if (d > 9) d -= 9;
        }
        suma += d;
        esSegundo = !esSegundo;
    }
    if (suma % 10 !== 0) {
        return { valido: false, mensaje: "Número de tarjeta inválido" };
    }
    return { valido: true, mensaje: "Tarjeta válida" };
}

// Validar Teléfono chileno: móvil (9 XXXX XXXX) o fijo (2 XXXX XXXX), con o sin +56
export function validarTelefono(telefono) {
    if (!telefono || telefono.trim() === '') {
        return { valido: false, mensaje: "El número de teléfono es requerido" };
    }
    const limpio = telefono.trim().replace(/[\s-]/g, '');
    if (!/^\+?[0-9]+$/.test(limpio)) {
        return { valido: false, mensaje: "El teléfono solo puede contener números, espacios y el signo +" };
    }
    if (!/^(\+?56)?[2-9]\d{8}$/.test(limpio)) {
        return { valido: false, mensaje: "Ingrese un número válido (ej: +56 9 1234 5678 o 912345678)" };
    }
    return { valido: true, mensaje: "Teléfono válido" };
}

// Validar Texto Requerido
export function validarTexto(valor, nombreCampo = "Este campo", minLen = 2) {
    if (!valor || valor.trim() === '') {
        return { valido: false, mensaje: `${nombreCampo} es requerido` };
    }
    if (valor.trim().length < minLen) {
        return { valido: false, mensaje: `${nombreCampo} debe tener al menos ${minLen} caracteres` };
    }
    return { valido: true, mensaje: "Válido" };
}

// Validar Fecha de Reserva (Igual o posterior a la fecha actual)
export function validarFecha(fechaStr) {
    if (!fechaStr) {
        return { valido: false, mensaje: "La fecha es requerida" };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fechaStr + 'T00:00:00');
    if (isNaN(fechaSeleccionada.getTime())) {
        return { valido: false, mensaje: "Formato de fecha inválido" };
    }
    if (fechaSeleccionada < hoy) {
        return { valido: false, mensaje: "La fecha debe ser igual o posterior a hoy" };
    }
    return { valido: true, mensaje: "Fecha válida" };
}


// Validar nombre de persona: solo letras (con tildes y ñ), espacios, apóstrofe o guion
export function validarNombrePersona(valor, nombreCampo = "El nombre", minLen = 3, maxLen = 60) {
    const texto = (valor || '').trim();
    if (!texto) return { valido: false, mensaje: `${nombreCampo} es requerido` };
    if (texto.length < minLen) return { valido: false, mensaje: `${nombreCampo} debe tener al menos ${minLen} caracteres` };
    if (texto.length > maxLen) return { valido: false, mensaje: `${nombreCampo} no puede superar los ${maxLen} caracteres` };
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(texto)) {
        return { valido: false, mensaje: `${nombreCampo} solo puede contener letras y espacios` };
    }
    return { valido: true, mensaje: "Válido" };
}

// Validar un mensaje libre (largo mínimo y máximo)
export function validarMensaje(valor, minLen = 10, maxLen = 500) {
    const texto = (valor || '').trim();
    if (!texto) return { valido: false, mensaje: "El mensaje es requerido" };
    if (texto.length < minLen) return { valido: false, mensaje: `El mensaje debe tener al menos ${minLen} caracteres` };
    if (texto.length > maxLen) return { valido: false, mensaje: `El mensaje no puede superar los ${maxLen} caracteres` };
    return { valido: true, mensaje: "Mensaje válido" };
}

// Validar que se haya elegido una opción de una lista cerrada (ej. el asunto del contacto)
export function validarOpcion(valor, opciones, nombreCampo = "La opción") {
    if (!valor) return { valido: false, mensaje: `${nombreCampo} es requerida` };
    if (!opciones.includes(valor)) return { valido: false, mensaje: `${nombreCampo} no es válida` };
    return { valido: true, mensaje: "Válido" };
}

// Reglas de la contraseña del registro de clientes
export function evaluarReglasPassword(password = '') {
    return {
        length: password.length >= 8,
        uppercase: /[A-ZÁÉÍÓÚÑ]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(password)
    };
}

// Validar los campos del inicio de sesión.
// "usuario" acepta un correo (con @) o un nombre de usuario simple como "admin".
// Devuelve { campo: mensaje } solo con los campos inválidos.
export function validarLogin({ usuario = '', password = '' }) {
    const errores = {};
    const id = usuario.trim();
    if (!id) {
        errores.usuario = "Ingresa tu correo o nombre de usuario";
    } else if (/\s/.test(id)) {
        errores.usuario = "No puede contener espacios";
    } else if (id.includes('@')) {
        const correo = validarEmail(id);
        if (!correo.valido) errores.usuario = correo.mensaje;
    } else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(id)) {
        errores.usuario = "El usuario debe tener entre 3 y 30 caracteres (letras, números, . _ -)";
    }
    if (!password) errores.password = "Ingresa tu contraseña";
    else if (password.length < 4) errores.password = "La contraseña debe tener al menos 4 caracteres";
    else if (password.length > 50) errores.password = "La contraseña es demasiado larga";
    return errores;
}

// Validar el formulario de registro de clientes. Devuelve { campo: mensaje }
export function validarRegistro(v) {
    const errores = {};
    const nombre = validarNombrePersona(v.nombre, 'El nombre', 3, 60);
    if (!nombre.valido) errores.nombre = nombre.mensaje;
    const correo = validarEmail(v.correo);
    if (!correo.valido) errores.correo = correo.mensaje;
    const reglas = evaluarReglasPassword(v.password);
    if (!v.password) errores.password = "La contraseña es requerida";
    else if (!Object.values(reglas).every(Boolean)) errores.password = "La contraseña no cumple todos los requisitos";
    if (!v.confirmar) errores.confirmar = "Confirma tu contraseña";
    else if (v.confirmar !== v.password) errores.confirmar = "Las contraseñas no coinciden";
    if (!v.region) errores.region = "Selecciona tu región";
    if (!v.comuna) errores.comuna = "Selecciona tu comuna";
    return errores;
}

// Validar el formulario de contacto. Devuelve { campo: mensaje }
export const ASUNTOS_CONTACTO = ['Consulta general', 'Catering & Eventos', 'Comentario', 'Asociación', 'Medios & Prensa'];

export function validarContacto(v) {
    const errores = {};
    const nombre = validarNombrePersona(v.nombre, 'El nombre', 3, 60);
    if (!nombre.valido) errores.nombre = nombre.mensaje;
    const correo = validarEmail(v.correo);
    if (!correo.valido) errores.correo = correo.mensaje;
    // El teléfono es opcional: solo se valida si se escribió algo
    if ((v.telefono || '').trim()) {
        const telefono = validarTelefono(v.telefono);
        if (!telefono.valido) errores.telefono = telefono.mensaje;
    }
    const asunto = validarOpcion(v.asunto, ASUNTOS_CONTACTO, 'El asunto');
    if (!asunto.valido) errores.asunto = asunto.mensaje;
    const mensaje = validarMensaje(v.mensaje, 10, 500);
    if (!mensaje.valido) errores.mensaje = mensaje.mensaje;
    return errores;
}

// Validar el formulario de checkout (datos de contacto, entrega y pago). Devuelve { campo: mensaje }
export function validarCheckout(v) {
    const errores = {};
    const nombre = validarNombrePersona(v.nombre, 'El nombre completo', 3, 80);
    if (!nombre.valido) errores.nombre = nombre.mensaje;
    const run = validarRUN(v.run);
    if (!run.valido) errores.run = run.mensaje;
    const correo = validarEmail(v.correo);
    if (!correo.valido) errores.correo = correo.mensaje;
    const telefono = validarTelefono(v.telefono);
    if (!telefono.valido) errores.telefono = telefono.mensaje;

    if (v.metodoEntrega === 'despacho') {
        const direccion = validarTexto(v.direccion, 'La dirección', 5);
        if (!direccion.valido) errores.direccion = direccion.mensaje;
        if (!v.region) errores.region = 'Selecciona la región';
        if (!v.comuna) errores.comuna = 'Selecciona la comuna';
    }

    if (v.metodoPago === 'tarjeta') {
        const tarjeta = validarTarjetaLuhn(v.numTarjeta);
        if (!tarjeta.valido) errores.numTarjeta = tarjeta.mensaje;
        if (!/^\d{2}\/(?:\d{2}|\d{4})$/.test((v.vencimiento || '').trim())) errores.vencimiento = 'Ingresa la fecha con formato MM/AA o MM/AAAA';
        else if (tarjetaVencida(v.vencimiento.trim())) errores.vencimiento = 'La tarjeta está vencida';
        if (!/^\d{3,4}$/.test((v.cvv || '').trim())) errores.cvv = 'El CVV debe tener 3 o 4 números';
    }
    return errores;
}
