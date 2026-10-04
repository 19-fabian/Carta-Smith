# Carta de Smith — Presentación universitaria interactiva

**Análisis de impedancias, coeficiente de reflexión y adaptación en líneas de transmisión.**

Integrantes: **Sharon Mawenzy Martínez · Brayan Stiven Correa · Fabián Steven Vargas**

Presentación web de 23 diapositivas (20–30 min) con Cartas de Smith calculadas matemáticamente en SVG, simulaciones interactivas y notas para los expositores.

---

## 1. Cómo ejecutarla

**No requiere instalación ni conexión a internet.** No hay dependencias externas: todo (fórmulas, gráficos y fuentes del sistema) es local.

1. Abre la carpeta `presentacion/`.
2. Haz doble clic en **`index.html`** (recomendado: Google Chrome o Microsoft Edge actualizados).
3. Pulsa **F** para pantalla completa.

Opcional, si prefieres servirla por HTTP:

```bash
cd presentacion
python -m http.server 8000
# abrir http://localhost:8000
```

### Parámetros de URL útiles

| URL | Efecto |
|---|---|
| `index.html#11` | Abre directamente la diapositiva 11 |
| `index.html?present` | Arranca en modo exposición (sin interfaz) |
| `index.html?noanim` | Arranca con las animaciones desactivadas |
| `index.html?test` | Prueba automática: recorre todas las diapositivas, pulsa todos los botones y muestra los errores encontrados |

---

## 2. Navegación y controles

| Tecla | Acción |
|---|---|
| `→` `PageDown` `Espacio` | Diapositiva siguiente |
| `←` `PageUp` | Diapositiva anterior |
| `Inicio` / `Fin` | Primera / última diapositiva |
| `F` | Pantalla completa |
| `M` o `?` | Menú de secciones (salto directo a cualquier diapositiva) |
| `N` | Panel de notas del expositor |
| `V` | **Ventana de notas** para un segundo monitor (con cronómetro y botones anterior/siguiente) |
| `P` | Pausar / reanudar las animaciones (los controles siguen funcionando) |
| `A` | Activar / desactivar las animaciones (transiciones instantáneas) |
| `H` | Modo exposición: oculta la barra; reaparece al acercar el ratón al borde inferior |
| `Esc` | Cerrar menú y notas |

La barra inferior tiene los mismos controles. La barra de progreso superior y el contador indican la posición.

**Notas sin que se proyecten:** conecta el proyector como pantalla extendida, pulsa `V`, arrastra la ventana de notas a la pantalla del portátil y deja la presentación en el proyector (pantalla completa). Las dos ventanas se mantienen sincronizadas.

**Campos editables de la portada:** haz clic en *Universidad, Asignatura, Docente y Fecha* para escribirlos. Se guardan en el navegador. En modo exposición, los campos vacíos se ocultan.

---

## 3. Contenido

| # | Diapositiva | Interacción principal |
|---|---|---|
| 1 | Portada | Carta trazada progresivamente, onda con partículas |
| 2 | El problema de las reflexiones | Carga adaptada / desadaptada, propagación de onda incidente y reflejada |
| 3 | ¿Qué es la Carta de Smith? | Construcción progresiva de la carta |
| 4 | ¿Por qué es necesaria? | R<sub>L</sub> y X<sub>L</sub> ajustables: ondas, envolvente, consecuencias |
| 5 | La impedancia | Vector Z en el plano complejo (R, X, ejemplos animados) |
| 6 | Líneas de transmisión | Esquema fuente→línea→carga, campos en microstrip |
| 7 | **Construcción de la carta** | Botón *Construir Carta* y modo paso a paso (8 pasos) |
| 8 | Partes y regiones | 12 etiquetas interactivas (botones y números sobre la carta) |
| 9 | Impedancia normalizada | R, X y Z₀ → z, círculo r y arco x resaltados |
| 10 | Coeficiente de reflexión | Medidor de |Γ|, potencia reflejada, ondas |
| 11 | **Explorador interactivo** | Clic/arrastre/teclado, Z₀ variable, 6 ejemplos, explicación dinámica |
| 12 | Cómo ubicar una impedancia | Procedimiento de 7 pasos animado |
| 13 | VSWR | |Γ| de 0 a 1: ondas estacionarias, círculo de VSWR |
| 14 | Ejemplo resuelto 75 + j25 Ω | 5 pasos con cálculos y gráficos sincronizados |
| 15 | **Desplazamiento sobre la línea** | d/λ de 0 a 0,5; mover/pausar/reiniciar |
| 16 | Adaptación de impedancias | Animación de red L hasta el centro de la carta |
| 17 | Antenas y RF | Barrido de frecuencia de un modelo de antena |
| 18 | Microstrip y Ansys HFSS | W, h, εr, ℓ → Z₀ (Hammerstad) y S11 del modelo ideal |
| 19 | Interpretación de S11 | Cursor de frecuencia sincronizado con la carta, tabla de dB |
| 20 | **Simulador de adaptación** | Reactancia serie con diagnóstico honesto |
| 21 | Ventajas, limitaciones y errores | — |
| 22 | Conclusiones | Punto que viaja hasta la adaptación |
| 23 | ¿Preguntas? | Carta y onda animadas |

Las **cartas interactivas** (diapositiva 11) también funcionan con teclado: haz clic sobre la carta y usa las flechas (`Shift` = paso grande, `Inicio` = centro).

---

## 4. Rigor técnico

Todas las cartas se generan con las ecuaciones, no con imágenes:

- Γ = (z − 1)/(z + 1) y z = (1 + Γ)/(1 − Γ)
- Círculos de r constante: centro (r/(1+r), 0), radio 1/(1+r)
- Arcos de x constante: centro (1, 1/x), radio |1/x| (solo la parte interior a |Γ| = 1)
- Coordenadas SVG: x = 100·Re{Γ}, y = −100·Im{Γ} (se invierte el eje vertical de SVG, de modo que la mitad superior es inductiva)
- VSWR = (1 + |Γ|)/(1 − |Γ|), con ∞ cuando |Γ| = 1 (sin dividir por cero)
- Potencia reflejada = |Γ|² × 100 %; S11(dB) = 20·log₁₀|S11|
- Línea ideal: Γ(d) = Γ<sub>L</sub>·e<sup>−j2βd</sup>
- Casos especiales tratados: z = 1, x = 0, Γ = 0, |Γ| = 1 (abierto/corto) y R < 0 (se advierte que es un caso activo)

Al cargar la página se ejecuta una **autoverificación** (consola del navegador, F12) con 17 pruebas, entre ellas el ejemplo de la exposición:

| Magnitud | Valor calculado |
|---|---|
| z<sub>L</sub> | 1.5 + j0.5 |
| Γ | 0.2308 + j0.1538 |
| \|Γ\| | 0.2774 |
| ∠Γ | 33.69° |
| VSWR | 1.768 |
| Potencia reflejada | 7.69 % |

### Datos teóricos, ilustrativos y simulados

- **Diap. 17 y 19:** datos **ilustrativos** generados por un modelo RLC serie definido en el código (los parámetros se muestran en pantalla). No son mediciones.
- **Diap. 18:** Z₀ y ε<sub>eff</sub> con la aproximación de Hammerstad, y S11 de una **línea ideal sin pérdidas** terminada en 50 Ω. Se usan los mismos parámetros que `CARTA.PY` (FR4, εr = 4,4, h = 1,6 mm, W = 3 mm, ℓ = 100 mm, f₀ = 1,09 GHz → Z₀ ≈ 50,8 Ω). **No es un resultado de Ansys HFSS**, y la diapositiva lo indica.
- No se incluye ninguna medición experimental ni ninguna referencia bibliográfica inventada.

---

## 5. Estructura del proyecto

```
presentacion/
├── index.html          Estructura, barra de herramientas, menú y panel de notas
├── README.md
├── css/
│   └── styles.css      Diseño visual, transiciones y estilos de cada diapositiva
└── js/
    ├── calculations.js Núcleo matemático (complejos, Γ, z, VSWR, línea ideal, red L, microstrip) + autoverificación
    ├── animations.js   Motor de animación (bucle único, pausa, desactivación, tweens)
    ├── smith-chart.js  Clase SmithChart: rejilla, escalas, punto, VSWR, resaltados, trazos, interacción
    ├── slides.js       Utilidades comunes (ecuaciones, campos, diagramas, iconos, gráficas)
    ├── slides-a.js     Diapositivas 1–8
    ├── slides-b.js     Diapositivas 9–16
    ├── slides-c.js     Diapositivas 17–23
    ├── app.js          Navegación, escalado 16:9, menú, notas, ventana del expositor
    └── selftest.js     Prueba automática de la interfaz (solo con ?test)
```

Los cálculos (`calculations.js`) están separados de la interfaz. Para modificar el texto de una diapositiva o sus notas, edita su bloque en `slides-a/b/c.js` (propiedades `html` y `notes`).

---

## 6. Recomendaciones para la exposición

- Prueba la presentación en el equipo y el proyector reales. Está diseñada en 16:9 (1600 × 900) y se escala automáticamente a cualquier resolución.
- Si el equipo es lento o quieres explicar sin movimiento, pulsa **P** (pausa) o **A** (sin animaciones).
- Reparto sugerido (≈ 8–9 min por integrante): diapositivas 1–8 · 9–16 · 17–23.
