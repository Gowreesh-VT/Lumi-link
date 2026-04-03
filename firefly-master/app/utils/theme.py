"""
Theme constants and style helpers for the Emergency Safety App.
Dark theme with status-based color coding.
"""

# ──────────────────────────── Color Palette ────────────────────────────

# Base dark theme
BG_PRIMARY = "#0D1117"
BG_SECONDARY = "#161B22"
BG_CARD = "#1C2333"
BG_INPUT = "#21262D"
BORDER = "#30363D"

# Text
TEXT_PRIMARY = "#F0F6FC"
TEXT_SECONDARY = "#8B949E"
TEXT_MUTED = "#6E7681"

# Accent
ACCENT_BLUE = "#58A6FF"
ACCENT_PURPLE = "#BC8CFF"
ACCENT_CYAN = "#39D2C0"

# Status
STATUS_GREEN = "#2EA043"
STATUS_GREEN_BG = "#0D2818"
STATUS_AMBER = "#D29922"
STATUS_AMBER_BG = "#2D2206"
STATUS_RED = "#F85149"
STATUS_RED_BG = "#3D1114"

# Hazard type colors
FIRE_COLOR = "#FF6B35"
GAS_COLOR = "#9BE564"
EARTHQUAKE_COLOR = "#D4915E"
CHEMICAL_COLOR = "#A855F7"

# Role selection
ROLE_NEED_HELP = "#EF4444"
ROLE_NEED_HELP_HOVER = "#DC2626"
ROLE_HELP_OTHERS = "#22C55E"
ROLE_HELP_OTHERS_HOVER = "#16A34A"

# ──────────────────────────── Fonts ────────────────────────────

FONT_FAMILY = "Segoe UI"

FONT_HERO = (FONT_FAMILY, 36, "bold")
FONT_TITLE = (FONT_FAMILY, 24, "bold")
FONT_HEADING = (FONT_FAMILY, 18, "bold")
FONT_SUBHEADING = (FONT_FAMILY, 14, "bold")
FONT_BODY = (FONT_FAMILY, 13)
FONT_BODY_BOLD = (FONT_FAMILY, 13, "bold")
FONT_SMALL = (FONT_FAMILY, 11)
FONT_TINY = (FONT_FAMILY, 9)
FONT_MONO = ("Consolas", 12)
FONT_ICON = (FONT_FAMILY, 48)
FONT_ARROW = (FONT_FAMILY, 120, "bold")
FONT_COUNTDOWN = ("Consolas", 56, "bold")

# ──────────────────────────── Spacing ────────────────────────────

PAD_XS = 4
PAD_SM = 8
PAD_MD = 16
PAD_LG = 24
PAD_XL = 32

CORNER_RADIUS = 12
CORNER_RADIUS_SM = 8
CORNER_RADIUS_LG = 16

# ──────────────────────────── Status Helpers ────────────────────────────

STATUS_CONFIG = {
    "green": {
        "color": STATUS_GREEN,
        "bg": STATUS_GREEN_BG,
        "label": "ALL CLEAR",
        "icon": "✓",
        "description": "No threats detected. Environment is safe."
    },
    "amber": {
        "color": STATUS_AMBER,
        "bg": STATUS_AMBER_BG,
        "label": "CAUTION",
        "icon": "⚠",
        "description": "Potential hazard detected. Stay alert."
    },
    "red": {
        "color": STATUS_RED,
        "bg": STATUS_RED_BG,
        "label": "DANGER",
        "icon": "✕",
        "description": "Immediate threat! Follow evacuation instructions."
    }
}


HAZARD_INFO = {
    "fire": {
        "color": FIRE_COLOR,
        "icon": "🔥",
        "title": "FIRE DETECTED",
        "instruction": "Stay low. Cover mouth. Move to nearest exit.",
        "action": "Follow illuminated exit path"
    },
    "gas": {
        "color": GAS_COLOR,
        "icon": "☁",
        "title": "GAS LEAK",
        "instruction": "Do NOT use switches. Cover face. Move upwind.",
        "action": "Evacuate to open area immediately"
    },
    "earthquake": {
        "color": EARTHQUAKE_COLOR,
        "icon": "🌍",
        "title": "EARTHQUAKE",
        "instruction": "Drop, Cover, Hold. Stay away from windows.",
        "action": "Wait for shaking to stop, then evacuate"
    },
    "chemical": {
        "color": CHEMICAL_COLOR,
        "icon": "☣",
        "title": "CHEMICAL HAZARD",
        "instruction": "Seal room. Cover skin. Avoid contact.",
        "action": "Wait for hazmat clearance"
    }
}
