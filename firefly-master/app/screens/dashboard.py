"""
Threat Dashboard — Home screen for the 'I Need Help' role.
Shows hazard status, live signals, and primary actions.
"""

import customtkinter as ctk
from utils.theme import *
from utils.sensor_reader import ArduinoSensorReader


class DashboardScreen(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.sim = app.sensor_sim
        self.sensor_reader = ArduinoSensorReader(port=None)
        self.sensor_reader.on_fire_alert = lambda: self._trigger_test("fire")
        self.sensor_reader.on_gas_alert = lambda: self._trigger_test("gas")
        self.sensor_reader.on_shock_alert = lambda: self._trigger_test("earthquake")
        self._build_ui()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color=BG_SECONDARY, corner_radius=0, height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        ctk.CTkLabel(header, text="🛡  SAFEZONE", font=FONT_HEADING, text_color=ACCENT_CYAN
                     ).pack(side="left", padx=PAD_LG)

        self.connectivity_label = ctk.CTkLabel(header, text="● Online", font=FONT_SMALL, text_color=STATUS_GREEN)
        self.connectivity_label.pack(side="right", padx=PAD_LG)

        settings_btn = ctk.CTkButton(header, text="⚙", width=35, height=35,
                                     fg_color="transparent", hover_color=BG_CARD,
                                     font=(FONT_FAMILY, 18),
                                     command=lambda: self.app.show_screen("settings"))
        settings_btn.pack(side="right", padx=PAD_SM)

        env_btn = ctk.CTkButton(header, text="📊", width=35, height=35,
                                fg_color="transparent", hover_color=BG_CARD,
                                font=(FONT_FAMILY, 18),
                                command=lambda: self.app.show_screen("environment"))
        env_btn.pack(side="right", padx=PAD_SM)

        # ── Scrollable body ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Hazard Status Banner ──
        self.banner_frame = ctk.CTkFrame(body, corner_radius=CORNER_RADIUS_LG, height=110)
        self.banner_frame.pack(fill="x", pady=(0, PAD_MD))
        self.banner_frame.pack_propagate(False)

        self.banner_icon = ctk.CTkLabel(self.banner_frame, text="✓", font=FONT_TITLE)
        self.banner_icon.pack(side="left", padx=PAD_LG)

        banner_text_frame = ctk.CTkFrame(self.banner_frame, fg_color="transparent")
        banner_text_frame.pack(side="left", fill="both", expand=True, pady=PAD_MD)

        self.banner_title = ctk.CTkLabel(banner_text_frame, text="ALL CLEAR", font=FONT_HEADING, anchor="w")
        self.banner_title.pack(fill="x")
        self.banner_desc = ctk.CTkLabel(banner_text_frame, text="No threats detected. Environment is safe.",
                                        font=FONT_BODY, anchor="w")
        self.banner_desc.pack(fill="x")

        # ── Primary Actions ──
        actions_label = ctk.CTkLabel(body, text="PRIMARY ACTIONS", font=FONT_SMALL,
                                     text_color=TEXT_MUTED, anchor="w")
        actions_label.pack(fill="x", pady=(PAD_SM, PAD_XS))

        actions_frame = ctk.CTkFrame(body, fg_color="transparent")
        actions_frame.pack(fill="x", pady=(0, PAD_MD))
        actions_frame.columnconfigure((0, 1, 2), weight=1)

        # Start Navigation
        nav_btn = ctk.CTkButton(actions_frame, text="🧭\nNavigate", height=90,
                                fg_color=BG_CARD, hover_color=ACCENT_BLUE,
                                font=FONT_SUBHEADING, corner_radius=CORNER_RADIUS,
                                border_width=1, border_color=BORDER,
                                command=lambda: self.app.show_screen("evac"))
        nav_btn.grid(row=0, column=0, padx=(0, PAD_SM), sticky="nsew")

        # SOS
        sos_btn = ctk.CTkButton(actions_frame, text="🆘\nSOS", height=90,
                                fg_color=STATUS_RED_BG, hover_color=STATUS_RED,
                                font=FONT_SUBHEADING, corner_radius=CORNER_RADIUS,
                                border_width=2, border_color=STATUS_RED,
                                text_color=STATUS_RED,
                                command=lambda: self.app.show_screen("sos"))
        sos_btn.grid(row=0, column=1, padx=PAD_SM, sticky="nsew")

        # I'm Safe
        safe_btn = ctk.CTkButton(actions_frame, text="✋\nI'm Safe", height=90,
                                 fg_color=BG_CARD, hover_color=STATUS_GREEN,
                                 font=FONT_SUBHEADING, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER,
                                 command=self._mark_safe)
        safe_btn.grid(row=0, column=2, padx=(PAD_SM, 0), sticky="nsew")

        # ── Live Signals Strip ──
        signals_label = ctk.CTkLabel(body, text="LIVE SIGNALS", font=FONT_SMALL,
                                     text_color=TEXT_MUTED, anchor="w")
        signals_label.pack(fill="x", pady=(PAD_SM, PAD_XS))

        signals_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                     border_width=1, border_color=BORDER)
        signals_frame.pack(fill="x", pady=(0, PAD_MD))
        signals_frame.columnconfigure((0, 1, 2, 3), weight=1)

        self.signal_widgets = {}
        signal_defs = [
            ("temperature", "🌡 Temp", "24°C", 0),
            ("humidity", "💧 Humid", "50%", 1),
            ("smoke", "💨 Smoke", "0 raw", 2),
            ("gas", "☁ Gas", "0 raw", 3),
        ]

        for key, label, default_val, col in signal_defs:
            frame = ctk.CTkFrame(signals_frame, fg_color="transparent")
            frame.grid(row=0, column=col, padx=PAD_MD, pady=PAD_MD, sticky="nsew")

            lbl = ctk.CTkLabel(frame, text=label, font=FONT_TINY, text_color=TEXT_MUTED)
            lbl.pack()
            val = ctk.CTkLabel(frame, text=default_val, font=FONT_SUBHEADING, text_color=TEXT_PRIMARY)
            val.pack(pady=(PAD_XS, 0))
            self.signal_widgets[key] = val

        # ── Simulated Danger Button (for testing) ──
        test_label = ctk.CTkLabel(body, text="SIMULATION CONTROLS", font=FONT_SMALL,
                                  text_color=TEXT_MUTED, anchor="w")
        test_label.pack(fill="x", pady=(PAD_SM, PAD_XS))

        test_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                  border_width=1, border_color=BORDER)
        test_frame.pack(fill="x", pady=(0, PAD_MD))

        test_inner = ctk.CTkFrame(test_frame, fg_color="transparent")
        test_inner.pack(padx=PAD_MD, pady=PAD_MD, fill="x")
        test_inner.columnconfigure((0, 1, 2, 3), weight=1)

        hazards = [("🔥 Fire", "fire"), ("☁ Gas", "gas"), ("🌍 Quake", "earthquake"), ("☣ Chem", "chemical")]
        for i, (label, htype) in enumerate(hazards):
            btn = ctk.CTkButton(test_inner, text=label, height=36,
                                fg_color=BG_INPUT, hover_color=BG_SECONDARY,
                                font=FONT_SMALL, corner_radius=CORNER_RADIUS_SM,
                                command=lambda h=htype: self._trigger_test(h))
            btn.grid(row=0, column=i, padx=PAD_XS, sticky="ew")

        reset_btn = ctk.CTkButton(test_frame, text="Reset to Safe", height=32,
                                  fg_color=STATUS_GREEN_BG, hover_color=STATUS_GREEN,
                                  text_color=STATUS_GREEN, font=FONT_SMALL,
                                  corner_radius=CORNER_RADIUS_SM,
                                  command=self._reset_safe)
        reset_btn.pack(padx=PAD_MD, pady=(0, PAD_MD), fill="x")

        # ── Back to role selection ──
        back_btn = ctk.CTkButton(body, text="← Switch Role", height=36,
                                 fg_color="transparent", hover_color=BG_CARD,
                                 text_color=TEXT_MUTED, font=FONT_SMALL,
                                 command=lambda: self.app.show_screen("role_select"))
        back_btn.pack(pady=(PAD_SM, PAD_LG))

    def _trigger_test(self, hazard_type):
        self.sim.trigger_emergency(hazard_type)

    def _reset_safe(self):
        self.sim.reset_to_safe()

    def _mark_safe(self):
        self.sim.reset_to_safe()

    def refresh(self):
        """Called by the app's update loop to refresh UI."""
        data = self.sim.get_snapshot()

        # Update banner
        status_cfg = STATUS_CONFIG.get(data["hazard_level"], STATUS_CONFIG["green"])
        self.banner_frame.configure(fg_color=status_cfg["bg"], border_width=2, border_color=status_cfg["color"])
        self.banner_icon.configure(text=status_cfg["icon"], text_color=status_cfg["color"])
        self.banner_title.configure(text=status_cfg["label"], text_color=status_cfg["color"])
        self.banner_desc.configure(text=status_cfg["description"], text_color=TEXT_SECONDARY)

        # Update signals with real Arduino Data or mock if unavailable
        ard_data = self.sensor_reader.get_latest_data()
        
        # Temp (Celsius)
        temp = ard_data["temperature"]
        temp_color = STATUS_GREEN if temp < 35 else (STATUS_AMBER if temp < 45 else STATUS_RED)
        self.signal_widgets["temperature"].configure(text=f"{temp:.1f}°C", text_color=temp_color)

        # Humidity
        hum = ard_data["humidity"]
        hum_color = STATUS_GREEN if 30 < hum < 60 else STATUS_AMBER
        self.signal_widgets["humidity"].configure(text=f"{hum:.1f}%", text_color=hum_color)
        
        # Smoke
        smoke_val = ard_data["smoke"]
        smoke_color = STATUS_GREEN if smoke_val < 300 else (STATUS_AMBER if smoke_val < 700 else STATUS_RED)
        self.signal_widgets["smoke"].configure(text=f"{smoke_val}", text_color=smoke_color)
        
        # Gas
        gas_val = ard_data["gas"]
        gas_color = STATUS_GREEN if gas_val < 200 else (STATUS_AMBER if gas_val < 400 else STATUS_RED)
        self.signal_widgets["gas"].configure(text=f"{gas_val}", text_color=gas_color)
        
        # Update connectivity label in header using Arduino connection status
        conn = ard_data["connected"]
        source = (ard_data.get("source") or "serial").upper()
        conn_text = f"● {source} Connected" if conn else "● Sensor Offline"
        conn_lbl_color = STATUS_GREEN if conn else STATUS_RED
        self.connectivity_label.configure(text=conn_text, text_color=conn_lbl_color)

        # Fallback from live stream to simulator values if feed is stale/disconnected.
        if (not conn) or (ard_data.get("age_sec") and ard_data.get("age_sec", 0) > 3):
            sim = self.sim.get_data()
            self.signal_widgets["temperature"].configure(text=f"{sim['temperature']:.1f}°C")
            self.signal_widgets["humidity"].configure(text=f"{sim['humidity']:.1f}%")
            self.signal_widgets["smoke"].configure(text=f"{sim['smoke']}")
            self.signal_widgets["gas"].configure(text=f"{sim['gas']}")

        # Auto-trigger EVAC mode on red
        if data["hazard_level"] == "red" and self.app.current_screen_name == "dashboard":
            self.app.show_screen("evac")

    def on_enter(self):
        if hasattr(self, "sensor_reader") and not self.sensor_reader.is_running:
            self.sensor_reader.start()

    def on_leave(self):
        pass
