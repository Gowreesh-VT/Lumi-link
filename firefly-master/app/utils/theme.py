"""
Theme constants and style helpers for the Emergency Safety App.
Midnight teal theme with amber highlights and status-based color coding.
"""

# ──────────────────────────── Color Palette ────────────────────────────

# Base dark theme (teal slate)
BG_PRIMARY = "#081418"
BG_SECONDARY = "#0F2026"
BG_CARD = "#142A31"
BG_INPUT = "#1A353D"
BORDER = "#2D4D57"

# Text
TEXT_PRIMARY = "#EAF7F8"
TEXT_SECONDARY = "#A7C2C8"
TEXT_MUTED = "#7EA0A8"

# Accent
ACCENT_BLUE = "#4DA3FF"
ACCENT_PURPLE = "#FFB86B"
ACCENT_CYAN = "#2FD4BE"

# Status
STATUS_GREEN = "#3CCF7A"
STATUS_GREEN_BG = "#103423"
STATUS_AMBER = "#FFB347"
STATUS_AMBER_BG = "#3A2A12"
STATUS_RED = "#FF5E5B"
STATUS_RED_BG = "#421A1E"

# Hazard type colors
FIRE_COLOR = "#FF7A45"
GAS_COLOR = "#8BEA8A"
EARTHQUAKE_COLOR = "#D6A26B"
CHEMICAL_COLOR = "#6BA3FF"

# Role selection
ROLE_NEED_HELP = "#FF6A5F"
ROLE_NEED_HELP_HOVER = "#E6554B"

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
        "description": "Immediate threat! Follow safety guidance."
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
        "action": "Move to open area immediately"
    },
    "earthquake": {
        "color": EARTHQUAKE_COLOR,
        "icon": "🌍",
        "title": "EARTHQUAKE",
        "instruction": "Drop, Cover, Hold. Stay away from windows.",
        "action": "Wait for shaking to stop, then move to a safe exit"
    },
    "chemical": {
        "color": CHEMICAL_COLOR,
        "icon": "☣",
        "title": "CHEMICAL HAZARD",
        "instruction": "Seal room. Cover skin. Avoid contact.",
        "action": "Wait for hazmat clearance"
    }
}
