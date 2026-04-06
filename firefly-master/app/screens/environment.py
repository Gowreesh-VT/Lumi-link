"""
Environment Monitor — Air intelligence, thermal, and hazard instructions.
"""

import customtkinter as ctk
from utils.theme import *


class EnvironmentScreen(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.sim = app.sensor_sim
        self._build_ui()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color=BG_SECONDARY, corner_radius=0, height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        back_btn = ctk.CTkButton(header, text="← Back", width=80, height=40,
                                 fg_color="transparent", hover_color=BG_CARD,
                                 font=FONT_BODY, text_color=TEXT_SECONDARY,
                                 command=lambda: self.app.show_screen("dashboard"))
        back_btn.pack(side="left", padx=PAD_SM)

        ctk.CTkLabel(header, text="📊  Environment Monitor", font=FONT_HEADING,
                     text_color=ACCENT_BLUE).pack(side="left", padx=PAD_SM)

        # ── Body ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Air Intelligence ──
        air_label = ctk.CTkLabel(body, text="AIR INTELLIGENCE", font=FONT_SMALL,
                                 text_color=TEXT_MUTED, anchor="w")
        air_label.pack(fill="x", pady=(0, PAD_XS))

        air_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        air_frame.pack(fill="x", pady=(0, PAD_MD))

        air_inner = ctk.CTkFrame(air_frame, fg_color="transparent")
        air_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)
        air_inner.columnconfigure((0, 1, 2), weight=1)

        # AQI
        aqi_frame = ctk.CTkFrame(air_inner, fg_color="transparent")
        aqi_frame.grid(row=0, column=0, sticky="nsew")
        ctk.CTkLabel(aqi_frame, text="AQI", font=FONT_TINY, text_color=TEXT_MUTED).pack()
        self.aqi_value = ctk.CTkLabel(aqi_frame, text="42", font=FONT_TITLE, text_color=STATUS_GREEN)
        self.aqi_value.pack()
        self.aqi_bar = ctk.CTkProgressBar(aqi_frame, width=100, height=6,
                                           progress_color=STATUS_GREEN)
        self.aqi_bar.set(0.084)
        self.aqi_bar.pack(pady=(PAD_XS, 0))

        # Smoke Density
        smoke_frame = ctk.CTkFrame(air_inner, fg_color="transparent")
        smoke_frame.grid(row=0, column=1, sticky="nsew")
        ctk.CTkLabel(smoke_frame, text="SMOKE", font=FONT_TINY, text_color=TEXT_MUTED).pack()
        self.smoke_value = ctk.CTkLabel(smoke_frame, text="0%", font=FONT_TITLE, text_color=STATUS_GREEN)
        self.smoke_value.pack()
        self.smoke_bar = ctk.CTkProgressBar(smoke_frame, width=100, height=6,
                                             progress_color=STATUS_GREEN)
        self.smoke_bar.set(0.0)
        self.smoke_bar.pack(pady=(PAD_XS, 0))

        # Toxic Gas
        gas_frame = ctk.CTkFrame(air_inner, fg_color="transparent")
        gas_frame.grid(row=0, column=2, sticky="nsew")
        ctk.CTkLabel(gas_frame, text="TOXIC GAS", font=FONT_TINY, text_color=TEXT_MUTED).pack()
        self.gas_value = ctk.CTkLabel(gas_frame, text="0%", font=FONT_TITLE, text_color=STATUS_GREEN)
        self.gas_value.pack()
        self.gas_bar = ctk.CTkProgressBar(gas_frame, width=100, height=6,
                                           progress_color=STATUS_GREEN)
        self.gas_bar.set(0.0)
        self.gas_bar.pack(pady=(PAD_XS, 0))

        # ── Thermal Monitor ──
        thermal_label = ctk.CTkLabel(body, text="THERMAL MONITOR", font=FONT_SMALL,
                                     text_color=TEXT_MUTED, anchor="w")
        thermal_label.pack(fill="x", pady=(PAD_SM, PAD_XS))

        thermal_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                     border_width=1, border_color=BORDER)
        thermal_frame.pack(fill="x", pady=(0, PAD_MD))

        thermal_inner = ctk.CTkFrame(thermal_frame, fg_color="transparent")
        thermal_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)
        thermal_inner.columnconfigure((0, 1), weight=1)

        # Temperature
        temp_frame = ctk.CTkFrame(thermal_inner, fg_color="transparent")
        temp_frame.grid(row=0, column=0, sticky="nsew")
        ctk.CTkLabel(temp_frame, text="🌡 TEMPERATURE", font=FONT_TINY, text_color=TEXT_MUTED).pack()
        self.temp_value = ctk.CTkLabel(temp_frame, text="24.0°C", font=FONT_TITLE, text_color=STATUS_GREEN)
        self.temp_value.pack()
        self.temp_bar = ctk.CTkProgressBar(temp_frame, width=120, height=6,
                                            progress_color=STATUS_GREEN)
        self.temp_bar.set(0.34)
        self.temp_bar.pack(pady=(PAD_XS, 0))

        # Flashover Risk
        flash_frame = ctk.CTkFrame(thermal_inner, fg_color="transparent")
        flash_frame.grid(row=0, column=1, sticky="nsew")
        ctk.CTkLabel(flash_frame, text="🔥 FLASHOVER RISK", font=FONT_TINY, text_color=TEXT_MUTED).pack()
        self.flash_value = ctk.CTkLabel(flash_frame, text="LOW", font=FONT_TITLE, text_color=STATUS_GREEN)
        self.flash_value.pack()
        self.flash_bar = ctk.CTkProgressBar(flash_frame, width=120, height=6,
                                             progress_color=STATUS_GREEN)
        self.flash_bar.set(0.1)
        self.flash_bar.pack(pady=(PAD_XS, 0))

        # ── Hazard Instructions ──
        hazard_label = ctk.CTkLabel(body, text="HAZARD RESPONSE PROTOCOLS", font=FONT_SMALL,
                                    text_color=TEXT_MUTED, anchor="w")
        hazard_label.pack(fill="x", pady=(PAD_SM, PAD_XS))

        for key, info in HAZARD_INFO.items():
            card = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                border_width=1, border_color=BORDER)
            card.pack(fill="x", pady=(0, PAD_SM))

            card_inner = ctk.CTkFrame(card, fg_color="transparent")
            card_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

            row_top = ctk.CTkFrame(card_inner, fg_color="transparent")
            row_top.pack(fill="x")

            ctk.CTkLabel(row_top, text=info["icon"], font=(FONT_FAMILY, 24)).pack(side="left", padx=(0, PAD_SM))
            ctk.CTkLabel(row_top, text=info["title"], font=FONT_SUBHEADING,
                         text_color=info["color"], anchor="w").pack(side="left")

            ctk.CTkLabel(card_inner, text=info["instruction"], font=FONT_BODY,
                         text_color=TEXT_SECONDARY, anchor="w", wraplength=500).pack(fill="x", pady=(PAD_XS, 0))
            ctk.CTkLabel(card_inner, text=f"▶ {info['action']}", font=FONT_BODY_BOLD,
                         text_color=ACCENT_CYAN, anchor="w").pack(fill="x", pady=(PAD_XS, 0))

    def _get_color(self, value, low, high):
        if value < low:
            return STATUS_GREEN
        elif value < high:
            return STATUS_AMBER
        return STATUS_RED

    def refresh(self):
        live = self.app.get_live_sensor_data() if hasattr(self.app, "get_live_sensor_data") else self.sim.get_data()

        # Derive UI metrics from LiFi/Arduino values so environment view reflects live hardware.
        smoke_raw = int(live.get("smoke", 0))
        gas_raw = int(live.get("gas", 0))
        temp = float(live.get("temperature", 0.0))

        smoke = max(0, min(100, int(smoke_raw / 10)))
        gas = max(0, min(100, int(gas_raw / 8)))
        aqi = max(0, min(500, int(smoke_raw * 0.45 + gas_raw * 0.55)))

        aqi_color = self._get_color(aqi, 100, 200)
        self.aqi_value.configure(text=str(aqi), text_color=aqi_color)
        self.aqi_bar.configure(progress_color=aqi_color)
        self.aqi_bar.set(min(1, aqi / 500))

        smoke_color = self._get_color(smoke, 30, 60)
        self.smoke_value.configure(text=f"{smoke}%", text_color=smoke_color)
        self.smoke_bar.configure(progress_color=smoke_color)
        self.smoke_bar.set(smoke / 100)

        gas_color = self._get_color(gas, 20, 50)
        self.gas_value.configure(text=f"{gas}%", text_color=gas_color)
        self.gas_bar.configure(progress_color=gas_color)
        self.gas_bar.set(gas / 100)

        temp_color = self._get_color(temp, 35, 45)
        self.temp_value.configure(text=f"{temp}°C", text_color=temp_color)
        self.temp_bar.configure(progress_color=temp_color)
        self.temp_bar.set(min(1, max(0, (temp + 10) / 70)))

        # Flashover
        if temp > 45:
            flash_text, flash_color, flash_val = "HIGH", STATUS_RED, 0.9
        elif temp > 35:
            flash_text, flash_color, flash_val = "MODERATE", STATUS_AMBER, 0.5
        else:
            flash_text, flash_color, flash_val = "LOW", STATUS_GREEN, 0.1
        self.flash_value.configure(text=flash_text, text_color=flash_color)
        self.flash_bar.configure(progress_color=flash_color)
        self.flash_bar.set(flash_val)
