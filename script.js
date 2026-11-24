
let ciudad = document.getElementById("ciudad");
let buscar = document.getElementById("buscar");
let actualizar = document.getElementById("actualizar");

let cargando = document.getElementById("cargando");
let error = document.getElementById("error");
let clima = document.getElementById("clima");

let ubicacion = document.getElementById("ubicacion");
let temperatura = document.getElementById("temperatura");
let condicion = document.getElementById("condicion");
let viento = document.getElementById("viento");
let lluvia = document.getElementById("lluvia");

let horasPasadas = document.getElementById("horasPasadas");
let horasFuturas = document.getElementById("horasFuturas");

let ultimaCiudad = "";

// Buscar ciudad
buscar.addEventListener("click", function () {
    let nombre = ciudad.value.trim();

    if (nombre === "") {
        error.textContent = "Escribe una ciudad.";
        return;
    }

    ultimaCiudad = nombre;
    consultarClima(nombre);
});

// Buscar con Enter
ciudad.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        buscar.click();
    }
});

// Actualizar clima
actualizar.addEventListener("click", function () {
    if (ultimaCiudad !== "") {
        consultarClima(ultimaCiudad);
    } else {
        error.textContent = "Primero debes buscar una ciudad.";
    }
});

// Consultar clima
async function consultarClima(nombre) {

    cargando.textContent = "Cargando clima...";
    error.textContent = "";
    clima.style.display = "none";

    try {

        let partes = nombre.split(",");
        let nombreCiudad = partes[0].trim();
        let nombrePais = partes.length > 1 ? partes[1].trim() : "";

        // Buscar ciudad
        let respuestaCiudad = await fetch(
            "https://geocoding-api.open-meteo.com/v1/search?name="
            + encodeURIComponent(nombreCiudad)
            + "&count=10&language=es&format=json"
        );

        let datosCiudad = await respuestaCiudad.json();

        if (!datosCiudad.results) {
            throw new Error("No encontramos esa ciudad.");
        }

        let resultado = datosCiudad.results[0];

        if (nombrePais !== "") {
            let encontrado = datosCiudad.results.find(function (lugar) {
                return lugar.country &&
                    lugar.country.toLowerCase().includes(nombrePais.toLowerCase());
            });

            if (encontrado) {
                resultado = encontrado;
            }
        }

        // Obtener coordenadas
        let latitud = resultado.latitude;
        let longitud = resultado.longitude;

        // Consultar clima
        let respuestaClima = await fetch(
            "https://api.open-meteo.com/v1/forecast"
            + "?latitude=" + latitud
            + "&longitude=" + longitud
            + "&current=temperature_2m,wind_speed_10m,weather_code"
            + "&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code"
            + "&past_hours=24&forecast_hours=25&timezone=auto"
        );

        let datos = await respuestaClima.json();

        // Mostrar datos actuales
        ubicacion.textContent = resultado.name + ", " + resultado.country;

        temperatura.textContent =
            datos.current.temperature_2m + " °C";

        condicion.textContent =
            obtenerCondicion(datos.current.weather_code);

        viento.textContent =
            datos.current.wind_speed_10m + " km/h";

        // Buscar probabilidad de lluvia actual
        let horaActual = datos.current.time;
        let indice = datos.hourly.time.indexOf(horaActual);

        if (indice !== -1) {
            lluvia.textContent =
                datos.hourly.precipitation_probability[indice] + " %";
        } else {
            lluvia.textContent = "No disponible";
        }

        // Mostrar horarios
        mostrarHoras(datos, horaActual);

        clima.style.display = "block";

    } catch (errorConsulta) {

        error.textContent = errorConsulta.message;

    }

    cargando.textContent = "";
}

// Mostrar las horas anteriores y futuras
function mostrarHoras(datos, horaActual) {

    horasPasadas.innerHTML = "";
    horasFuturas.innerHTML = "";

    for (let i = 0; i < datos.hourly.time.length; i++) {

        let tarjeta = document.createElement("div");

        tarjeta.className = "hora";

        let hora = datos.hourly.time[i].split("T")[1];

        tarjeta.innerHTML =
            "<p>" + hora + "</p>" +
            "<h3>" + datos.hourly.temperature_2m[i] + " °C</h3>" +
            "<p>" + obtenerCondicion(datos.hourly.weather_code[i]) + "</p>" +
            "<p>Lluvia: " + datos.hourly.precipitation_probability[i] + " %</p>" +
            "<p>Viento: " + datos.hourly.wind_speed_10m[i] + " km/h</p>";

        if (datos.hourly.time[i] < horaActual) {
            horasPasadas.appendChild(tarjeta);
        }

        if (datos.hourly.time[i] > horaActual) {
            horasFuturas.appendChild(tarjeta);
        }
    }
}

// Traducir el clima
function obtenerCondicion(codigo) {

    if (codigo === 0) {
        return "Despejado";
    } else if (codigo === 1 || codigo === 2) {
        return "Parcialmente nublado";
    } else if (codigo === 3) {
        return "Nublado";
    } else if (codigo === 45 || codigo === 48) {
        return "Niebla";
    } else if (codigo >= 51 && codigo <= 67) {
        return "Llovizna o lluvia";
    } else if (codigo >= 71 && codigo <= 77) {
        return "Nieve";
    } else if (codigo >= 80 && codigo <= 82) {
        return "Lluvia";
    } else if (codigo >= 95) {
        return "Tormenta";
    } else {
        return "Clima variable";
    }
}
