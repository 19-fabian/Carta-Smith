
import os
import numpy as np
import matplotlib.pyplot as plt
import skrf as rf

from matplotlib.patches import Rectangle
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

# =========================================================
# 1. PARAMETROS DEL PROYECTO
# =========================================================

# PCB
BOARD_X = 100.0       # Ancho (mm)
BOARD_Y = 100.0       # Largo (mm)

# Microstrip
W = 3.0               # Ancho de pista (mm)
L = 100.0             # Longitud de pista (mm)

# Materiales: valores de referencia, no medidos
ER = 4.4              # Permitividad relativa FR4
H = 1.6               # Espesor del dielectrico (mm)
T = 0.035             # Espesor del cobre (mm)
TAND = 0.018          # Tangente de perdidas aproximada
SIGMA_CU = 5.8e7      # Conductividad cobre (S/m)

# RF
ZREF = 50.0           # Impedancia de referencia (ohmios)
F0 = 1.090e9          # Frecuencia central (Hz)
F_LOW = 1.040e9       # Limite inferior (Hz)
F_HIGH = 1.140e9      # Limite superior (Hz)

# Si tienes el archivo exportado desde HFSS,
# escribe su nombre, por ejemplo "microstrip.s2p".
# Si no existe, se usara un modelo teorico ideal.
TOUCHSTONE_FILE = "microstrip.s2p"

# =========================================================
# 2. CALCULO APROXIMADO DE LA MICROSTRIP
# =========================================================

def microstrip_parameters(er, h_mm, w_mm):
    """Aproximacion cuasiestatica de Hammerstad."""

    u = w_mm / h_mm

    eeff = ((er + 1) / 2
            + (er - 1) / 2 / np.sqrt(1 + 12 / u))

    if u < 1:
        eeff += 0.04 * (1 - u)**2

    if u <= 1:
        zc = (60 / np.sqrt(eeff)) * np.log(
            8 / u + 0.25 * u
        )
    else:
        zc = (120 * np.pi / np.sqrt(eeff)) / (
            u + 1.393 + 0.667 * np.log(u + 1.444)
        )

    return eeff, zc


EEFF, ZC = microstrip_parameters(ER, H, W)

C0 = 299792458.0
L_METERS = L / 1000

LAMBDA0 = C0 / F0
LAMBDA_G = LAMBDA0 / np.sqrt(EEFF)
BETA = 2 * np.pi / LAMBDA_G

print("=" * 50)
print("PARAMETROS DE LA MICROSTRIP")
print("=" * 50)
print(f"PCB: {BOARD_X:.1f} x {BOARD_Y:.1f} mm")
print(f"W = {W:.3f} mm")
print(f"L = {L:.3f} mm")
print(f"epsilon efectiva = {EEFF:.4f}")
print(f"Z0 calculada aprox. = {ZC:.2f} ohm")
print(f"Lambda libre = {LAMBDA0*1000:.2f} mm")
print(f"Lambda guiada = {LAMBDA_G*1000:.2f} mm")
print(f"Longitud electrica = {np.degrees(BETA*L_METERS):.2f} grados")

# =========================================================
# 3. OBTENER S11: HFSS O MODELO TEORICO
# =========================================================

if os.path.isfile(TOUCHSTONE_FILE):
    print("\nCargando resultados reales de HFSS...")
    network = rf.Network(TOUCHSTONE_FILE)

    freq = network.f
    s11 = network.s[:, 0, 0]

    source = "HFSS - archivo Touchstone"

else:
    print("\nNo se encontro el archivo Touchstone.")
    print("Se utiliza un modelo teorico ideal sin perdidas.")

    freq = np.linspace(0.1e9, 2.0e9, 1001)
    omega = 2 * np.pi * freq

    beta = omega * np.sqrt(EEFF) / C0

    # Carga ideal de 50 ohmios
    ZL = ZREF

    # Impedancia de entrada de la linea sin perdidas
    tan_bl = np.tan(beta * L_METERS)

    zin = ZC * (
        ZL + 1j * ZC * tan_bl
    ) / (
        ZC + 1j * ZL * tan_bl
    )

    # Coeficiente de reflexion referido a 50 ohmios
    s11 = (zin - ZREF) / (zin + ZREF)

    frequency = rf.Frequency.from_f(
        freq, unit="hz"
    )

    network = rf.Network(
        frequency=frequency,
        s=s11[:, None, None],
        z0=ZREF
    )

    source = "Modelo teorico ideal"

# =========================================================
# 4. MARCADORES DE FRECUENCIA
# =========================================================

marker_freqs = [F_LOW, F0, F_HIGH]
markers = []

for f in marker_freqs:
    idx = np.argmin(np.abs(freq - f))
    gamma = s11[idx]
    zin_marker = ZREF * (1 + gamma) / (1 - gamma)

    markers.append({
        "freq": freq[idx],
        "gamma": gamma,
        "zin": zin_marker,
        "s11_db": 20 * np.log10(max(abs(gamma), 1e-15))
    })

print("\nRESULTADOS EN FRECUENCIAS DE INTERES")
print("-" * 60)

for m in markers:
    z = m["zin"]
    print(f"\nFrecuencia: {m['freq']/1e6:.3f} MHz")
    print(f"S11: {m['s11_db']:.2f} dB")
    print(f"Fase: {np.angle(m['gamma'], deg=True):.2f} grados")
    print(f"Zin = {z.real:.2f} + j{z.imag:.2f} ohm")

# =========================================================
# 5. FUNCION PARA DIBUJAR UN PRISMA 3D
# =========================================================

def cuboid_faces(x0, x1, y0, y1, z0, z1):
    p = [
        (x0, y0, z0), (x1, y0, z0),
        (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1),
        (x1, y1, z1), (x0, y1, z1)
    ]

    return [
        [p[0], p[1], p[2], p[3]],
        [p[4], p[5], p[6], p[7]],
        [p[0], p[1], p[5], p[4]],
        [p[1], p[2], p[6], p[5]],
        [p[2], p[3], p[7], p[6]],
        [p[3], p[0], p[4], p[7]]
    ]

# =========================================================
# 6. CREAR PANEL DE VISUALIZACION
# =========================================================

fig = plt.figure(figsize=(17, 12))
fig.suptitle(
    "DISEÑO Y ANALISIS DE LINEA MICROSTRIP",
    fontsize=18,
    fontweight="bold"
)

# ---------------------------------------------------------
# PANEL A: VISTA SUPERIOR
# ---------------------------------------------------------

ax1 = fig.add_subplot(2, 2, 1)

# Sustrato
ax1.add_patch(Rectangle(
    (0, 0), BOARD_X, BOARD_Y,
    facecolor="lightgreen",
    edgecolor="black",
    linewidth=2
))

# Linea centrada de borde a borde
y0 = (BOARD_Y - W) / 2
x0 = (BOARD_X - L) / 2

ax1.add_patch(Rectangle(
    (x0, y0), L, W,
    facecolor="gold",
    edgecolor="darkgoldenrod",
    linewidth=1.5
))

# Conectores esquematicos exteriores
connector_length = 7.0
connector_width = 8.0

for x in [x0 - connector_length, x0 + L]:
    ax1.add_patch(Rectangle(
        (x, BOARD_Y/2 - connector_width/2),
        connector_length, connector_width,
        facecolor="silver",
        edgecolor="black",
        linewidth=1.5,
        clip_on=False
    ))

# Cota horizontal
ax1.annotate(
    "", xy=(0, -7), xytext=(BOARD_X, -7),
    arrowprops=dict(arrowstyle="<->", lw=1.4)
)
ax1.text(
    BOARD_X/2, -10,
    f"{BOARD_X:.0f} mm",
    ha="center", va="top"
)

# Cota vertical
ax1.annotate(
    "", xy=(-7, 0), xytext=(-7, BOARD_Y),
    arrowprops=dict(arrowstyle="<->", lw=1.4)
)
ax1.text(
    -10, BOARD_Y/2,
    f"{BOARD_Y:.0f} mm",
    rotation=90, ha="right", va="center"
)

# Ancho de pista
ax1.annotate(
    "", xy=(BOARD_X/2 + 8, y0),
    xytext=(BOARD_X/2 + 8, y0 + W),
    arrowprops=dict(arrowstyle="<->", lw=1.3)
)
ax1.text(
    BOARD_X/2 + 10, BOARD_Y/2,
    f"W = {W} mm",
    va="center", fontsize=9
)

ax1.text(
    BOARD_X/2, BOARD_Y*0.77,
    f"FR4 | er = {ER} | h = {H} mm",
    ha="center", fontsize=11
)

ax1.text(
    BOARD_X/2, BOARD_Y*0.68,
    f"Cobre superior: t = {T} mm",
    ha="center", fontsize=10
)

ax1.text(
    BOARD_X/2, BOARD_Y*0.57,
    f"Microstrip: L = {L} mm",
    ha="center", fontsize=10
)

ax1.set_xlim(-14, BOARD_X + 14)
ax1.set_ylim(-15, BOARD_Y + 5)
ax1.set_aspect("equal")
ax1.set_title("A. PCB - Vista superior")
ax1.set_xlabel("X (mm)")
ax1.set_ylabel("Y (mm)")
ax1.grid(alpha=0.2)

# ---------------------------------------------------------
# PANEL B: SECCION TRANSVERSAL
# ---------------------------------------------------------

ax2 = fig.add_subplot(2, 2, 2)

# Espesor representado de forma esquematica
# Las dimensiones horizontales y verticales no comparten escala.
ax2.add_patch(Rectangle(
    (0, 0), 100, H,
    facecolor="lightgreen",
    edgecolor="black",
    label="FR4"
))

# Cobre inferior, plano de tierra
ax2.add_patch(Rectangle(
    (0, -T), 100, T,
    facecolor="darkgoldenrod",
    edgecolor="black",
    label="Plano de tierra"
))

# Cobre superior: pista central
ax2.add_patch(Rectangle(
    (48.5, H), W, T,
    facecolor="gold",
    edgecolor="black",
    label="Pista Microstrip"
))

ax2.annotate(
    "", xy=(55, 0), xytext=(55, H),
    arrowprops=dict(arrowstyle="<->", lw=1.5)
)
ax2.text(57, H/2, f"h = {H} mm", va="center")

ax2.text(
    50, H + T + 0.15,
    f"W = {W} mm",
    ha="center"
)

ax2.text(
    5, H/2,
    "DIELECTRICO FR4",
    va="center", fontsize=10
)

ax2.text(
    50, -T - 0.15,
    "Cobre inferior",
    ha="center", va="top", fontsize=9
)

ax2.set_xlim(-5, 105)
ax2.set_ylim(-0.5, H + 0.8)
ax2.set_title("B. Seccion transversal de la Microstrip")
ax2.set_xlabel("Ancho esquematico (mm)")
ax2.set_ylabel("Espesor (mm)")
ax2.grid(alpha=0.2)
ax2.legend(loc="upper right", fontsize=8)

# ---------------------------------------------------------
# PANEL C: MODELO 3D
# ---------------------------------------------------------

ax3 = fig.add_subplot(2, 2, 3, projection="3d")

# Sustrato
faces = cuboid_faces(
    0, BOARD_X, 0, BOARD_Y, 0, H
)
substrate = Poly3DCollection(
    faces, alpha=0.35,
    facecolor="lightgreen",
    edgecolor="gray"
)
ax3.add_collection3d(substrate)

# Plano de tierra inferior
ground = cuboid_faces(
    0, BOARD_X, 0, BOARD_Y, -T, 0
)
ax3.add_collection3d(Poly3DCollection(
    ground, facecolor="saddlebrown",
    edgecolor="none", alpha=0.8
))

# Pista superior
trace = cuboid_faces(
    x0, x0 + L,
    y0, y0 + W,
    H, H + T
)
ax3.add_collection3d(Poly3DCollection(
    trace, facecolor="gold",
    edgecolor="darkgoldenrod", alpha=1
))

ax3.set_xlim(0, BOARD_X)
ax3.set_ylim(0, BOARD_Y)
ax3.set_zlim(-T, H + T + 0.5)
ax3.set_box_aspect((100, 100, 12))
ax3.view_init(elev=28, azim=-55)

ax3.set_title("C. Estructura 3D de la PCB")
ax3.set_xlabel("X (mm)")
ax3.set_ylabel("Y (mm)")
ax3.set_zlabel("Z (mm)")

# ---------------------------------------------------------
# PANEL D: CARTA DE SMITH
# ---------------------------------------------------------

ax4 = fig.add_subplot(2, 2, 4)

network.plot_s_smith(
    m=0, n=0, ax=ax4
)

marker_styles = ["o", "s", "^"]
marker_labels = [
    "Limite inferior",
    "Frecuencia central",
    "Limite superior"
]

for m, style, label in zip(
    markers, marker_styles, marker_labels
):
    gamma = m["gamma"]

    ax4.plot(
        gamma.real, gamma.imag,
        marker=style, markersize=8,
        markeredgecolor="black",
        linestyle="none",
        label=f"{label}: {m['freq']/1e6:.1f} MHz"
    )

ax4.set_title("D. Carta de Smith - S11")
ax4.legend(loc="lower left", fontsize=8)

# =========================================================
# 7. PRESENTACION FINAL
# =========================================================

fig.text(
    0.5, 0.015,
    f"FR4: er={ER} | h={H} mm | Cobre={T} mm | "
    f"W={W} mm | L={L} mm | "
    f"f0={F0/1e6:.0f} MHz | Fuente: {source}",
    ha="center", fontsize=9
)

plt.tight_layout(rect=[0, 0.04, 1, 0.95])
plt.savefig(
    "analisis_microstrip.png",
    dpi=300,
    bbox_inches="tight"
)
plt.show()