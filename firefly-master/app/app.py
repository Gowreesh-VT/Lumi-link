"""
Firefly — Emergency Safety & Evacuation App
Main application entry point with dual-role interface.

Run: python app.py
"""

import customtkinter as ctk
import threading
import time

# Configure appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

from utils.theme import *
from utils.simulator import SensorSimulator, SOSSimulator, EvacSimulator, ResponderSimulator
from utils.fire_model import FireDetectionModel


class FireflyApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # ── Window Setup ──
        self.title("Firefly — Emergency Safety System")
        self.geometry("1000x700")
        self.minsize(900, 650)
        self.configure(fg_color=BG_PRIMARY)

        # ── Simulators ──
        self.sensor_sim = SensorSimulator()
        self.sos_sim = SOSSimulator()
        self.evac_sim = EvacSimulator()
        self.responder_sim = ResponderSimulator()

        # ── Screen management ──
        self.screens = {}
        self.current_screen_name = None
        self.current_role = None  # "need_help" or "help_others"

        # Container for all screens
        self.container = ctk.CTkFrame(self, fg_color=BG_PRIMARY)
        self.container.pack(fill="both", expand=True)

        # ML model for prediction
        self.fire_model = FireDetectionModel()

        # Runtime state used by screens and auto-evac logic.
        self.current_risk = "CLEAR"
        self.current_hazard_level = "green"
        self.current_hazard_type = "none"
        self.current_sensor_source = "simulator"
        self.auto_evac_cooldown_s = 8.0
        self._last_auto_evac_ts = 0.0
        self._auto_evac_armed = True

        # Show splash first
        self._show_splash()

    def get_live_sensor_data(self):
        """Return LiFi/Arduino data when fresh; otherwise fallback to simulator."""
        # If dashboard/sensor reader exists and has fresh data, use it.
        dash = self.screens.get("dashboard") if hasattr(self, "screens") else None
        if dash and hasattr(dash, "sensor_reader"):
            live = dash.sensor_reader.get_latest_data()
            if live.get("connected") and (live.get("age_sec") is None or live.get("age_sec", 999) <= 3):
                return {
                    "smoke": live.get("smoke", 0),
                    "gas": live.get("gas", 0),
                    "temperature": live.get("temperature", 0.0),
                    "humidity": live.get("humidity", 0.0),
                    "shock": live.get("shock", 0),
                    "motion": live.get("motion", 0),
                    "source": live.get("source", "serial"),
                    "age_sec": live.get("age_sec"),
                    "connected": True,
                }

        # Fallback to simulator stream.
        sim = self.sensor_sim.get_data()
        return {
            "smoke": sim.get("smoke", 0),
            "gas": sim.get("gas", 0),
            "temperature": sim.get("temperature", 0.0),
            "humidity": sim.get("humidity", 0.0),
            "shock": sim.get("shock", 0),
            "motion": sim.get("motion", 0),
            "source": "simulator",
            "age_sec": None,
            "connected": False,
        }

    def get_live_route_data(self):
        """Return LiFi route direction data when available; fallback to evac simulator."""
        dash = self.screens.get("dashboard") if hasattr(self, "screens") else None
        if dash and hasattr(dash, "sensor_reader"):
            route = dash.sensor_reader.get_latest_route()
            ttl_s = max(1.0, float(route.get("ttl_ms", 2500)) / 1000.0)
            age = route.get("age_sec")
            if route.get("connected") and age is not None and age <= ttl_s:
                return {
                    "next_turn": route.get("next_turn", "FORWARD"),
                    "distance_m": float(route.get("distance_m", 0.0)),
                    "target_exit": route.get("target_exit", "Exit A"),
                    "hazard": route.get("hazard", "none"),
                    "source": route.get("source", "lifi"),
                    "age_sec": age,
                    "ttl_s": ttl_s,
                }

        return {
            "next_turn": "SIM",
            "distance_m": float(self.evac_sim.distance_to_exit),
            "target_exit": "Exit B",
            "hazard": (self.sensor_sim.get_snapshot().get("active_hazard") or "none"),
            "source": "simulator",
            "age_sec": None,
            "ttl_s": None,
        }

    def _risk_to_level(self, risk):
        return {
            "CLEAR": "green",
            "WARNING": "amber",
            "DANGER": "red",
        }.get((risk or "").upper(), "green")

    def _infer_hazard_type(self, smoke, gas, shock):
        if shock == 1:
            return "earthquake"
        if gas > smoke:
            return "gas"
        if smoke > 0 or gas > 0:
            return "fire"
        return "none"

    def _maybe_auto_start_evac(self, risk):
        """Auto-enter evacuation mode only when ML reports DANGER."""
        upper_risk = (risk or "").upper()
        if upper_risk == "CLEAR":
            self._auto_evac_armed = True
            return

        if upper_risk != "DANGER":
            return

        if self.current_role != "need_help":
            return

        if self.current_screen_name in {"evac", "sos", "role_select"}:
            return

        now = time.time()
        if (not self._auto_evac_armed) or (now - self._last_auto_evac_ts < self.auto_evac_cooldown_s):
            return

        self._last_auto_evac_ts = now
        self._auto_evac_armed = False
        self.show_screen("evac")

    # ────────────────────────── Splash Screen ──────────────────────────

    def _show_splash(self):
        self.splash = ctk.CTkFrame(self.container, fg_color=BG_PRIMARY)
        self.splash.place(relx=0, rely=0, relwidth=1, relheight=1)

        center = ctk.CTkFrame(self.splash, fg_color="transparent")
        center.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(center, text="🛡", font=(FONT_FAMILY, 72)).pack()
        ctk.CTkLabel(center, text="Firefly", font=FONT_HERO,
                     text_color=ACCENT_CYAN).pack(pady=(PAD_MD, PAD_XS))
        ctk.CTkLabel(center, text="Emergency Safety System",
                     font=FONT_BODY, text_color=TEXT_MUTED).pack()

        # Sensor check animation
        self.check_label = ctk.CTkLabel(center, text="",
                                        font=FONT_SMALL, text_color=TEXT_MUTED)
        self.check_label.pack(pady=(PAD_LG, 0))

        self.progress = ctk.CTkProgressBar(center, width=250, height=4,
                                            progress_color=ACCENT_CYAN)
        self.progress.set(0)
        self.progress.pack(pady=(PAD_SM, 0))

        # Run checks then transition
        threading.Thread(target=self._run_splash_checks, daemon=True).start()

    def _run_splash_checks(self):
        checks = [
            ("Checking sensors...", 0.25),
            ("Verifying connectivity...", 0.50),
            ("Loading maps...", 0.75),
            ("System ready ✓", 1.0),
        ]

        for msg, progress in checks:
            try:
                self.check_label.configure(text=msg)
                self.progress.set(progress)
            except Exception:
                pass
            time.sleep(0.12)

        # Transition to role selection
        try:
            self.after(100, self._init_screens)
        except Exception:
            pass

    # ────────────────────────── Screen Initialization ──────────────────────────

    def _init_screens(self):
        # Destroy splash
        self.splash.destroy()

        # Import screens
        from screens.dashboard import DashboardScreen
        from screens.evac_mode import EvacScreen
        from screens.sos_flow import SOSScreen
        from screens.environment import EnvironmentScreen
        from screens.settings import SettingsScreen
        from screens.responder import ResponderScreen

        # Create all screens
        self.screens["role_select"] = self._create_role_select()
        self.screens["dashboard"] = DashboardScreen(self.container, self)
        self.screens["evac"] = EvacScreen(self.container, self)
        self.screens["sos"] = SOSScreen(self.container, self)
        self.screens["environment"] = EnvironmentScreen(self.container, self)
        self.screens["settings"] = SettingsScreen(self.container, self)
        self.screens["responder"] = ResponderScreen(self.container, self)

        # Place all (hidden)
        for screen in self.screens.values():
            screen.place(relx=0, rely=0, relwidth=1, relheight=1)
            screen.lower()

        # Start with role selection
        self.show_screen("role_select")

        # Start sensor simulator
        self.sensor_sim.start()

        # Start update loop
        self._update_loop()

    # ────────────────────────── Role Selection ──────────────────────────

    def _create_role_select(self):
        frame = ctk.CTkFrame(self.container, fg_color=BG_PRIMARY)

        # Center content
        center = ctk.CTkFrame(frame, fg_color="transparent")
        center.place(relx=0.5, rely=0.5, anchor="center")

        # Logo
        ctk.CTkLabel(center, text="🛡", font=(FONT_FAMILY, 56)).pack()
        ctk.CTkLabel(center, text="Firefly", font=FONT_HERO,
                     text_color=ACCENT_CYAN).pack(pady=(PAD_SM, PAD_XS))
        ctk.CTkLabel(center, text="Choose how you want to use Firefly",
                     font=FONT_BODY, text_color=TEXT_MUTED).pack(pady=(0, PAD_XL))

        # Two role cards side by side
        cards = ctk.CTkFrame(center, fg_color="transparent")
        cards.pack()
        cards.columnconfigure((0, 1), weight=1)

        # ── I NEED HELP ──
        need_help_card = ctk.CTkFrame(cards, fg_color=BG_CARD, corner_radius=CORNER_RADIUS_LG,
                                      border_width=2, border_color=ROLE_NEED_HELP, width=320, height=350)
        need_help_card.grid(row=0, column=0, padx=PAD_LG, sticky="nsew")
        need_help_card.grid_propagate(False)

        nh_inner = ctk.CTkFrame(need_help_card, fg_color="transparent")
        nh_inner.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(nh_inner, text="🆘", font=(FONT_FAMILY, 64)).pack()
        ctk.CTkLabel(nh_inner, text="I NEED HELP", font=FONT_TITLE,
                     text_color=ROLE_NEED_HELP).pack(pady=(PAD_MD, PAD_SM))
        ctk.CTkLabel(nh_inner, text="Get real-time threat alerts,\nevacuation guidance,\nand emergency SOS",
                     font=FONT_BODY, text_color=TEXT_SECONDARY, justify="center").pack(pady=(0, PAD_LG))

        need_btn = ctk.CTkButton(nh_inner, text="Enter →", width=200, height=48,
                                 fg_color=ROLE_NEED_HELP, hover_color=ROLE_NEED_HELP_HOVER,
                                 font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                 command=lambda: self._select_role("need_help"))
        need_btn.pack()

        # ── I WANT TO HELP ──
        help_card = ctk.CTkFrame(cards, fg_color=BG_CARD, corner_radius=CORNER_RADIUS_LG,
                                 border_width=2, border_color=ROLE_HELP_OTHERS, width=320, height=350)
        help_card.grid(row=0, column=1, padx=PAD_LG, sticky="nsew")
        help_card.grid_propagate(False)

        ho_inner = ctk.CTkFrame(help_card, fg_color="transparent")
        ho_inner.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(ho_inner, text="🦸", font=(FONT_FAMILY, 64)).pack()
        ctk.CTkLabel(ho_inner, text="I WANT TO HELP", font=FONT_TITLE,
                     text_color=ROLE_HELP_OTHERS).pack(pady=(PAD_MD, PAD_SM))
        ctk.CTkLabel(ho_inner, text="See people nearby who\nneed assistance and\nguide them to safety",
                     font=FONT_BODY, text_color=TEXT_SECONDARY, justify="center").pack(pady=(0, PAD_LG))

        help_btn = ctk.CTkButton(ho_inner, text="Enter →", width=200, height=48,
                                 fg_color=ROLE_HELP_OTHERS, hover_color=ROLE_HELP_OTHERS_HOVER,
                                 font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                 command=lambda: self._select_role("help_others"))
        help_btn.pack()

        # Version text at bottom
        ctk.CTkLabel(center, text="Firefly v1.0 — Prototype", font=FONT_TINY,
                     text_color=TEXT_MUTED).pack(pady=(PAD_XL, 0))

        return frame

    def _select_role(self, role):
        self.current_role = role
        if role == "need_help":
            self.show_screen("dashboard")
        else:
            self.show_screen("responder")

    # ────────────────────────── Navigation ──────────────────────────

    def show_screen(self, name):
        # Lifecycle: leave current
        if self.current_screen_name and self.current_screen_name in self.screens:
            current = self.screens[self.current_screen_name]
            if hasattr(current, "on_leave"):
                current.on_leave()

        # Show new
        if name in self.screens:
            self.screens[name].lift()
            self.current_screen_name = name

            # Lifecycle: enter new
            if hasattr(self.screens[name], "on_enter"):
                self.screens[name].on_enter()

    # ────────────────────────── Update Loop ──────────────────────────

    def _update_loop(self):
        # Get latest sensor values (LiFi/Arduino preferred, simulator fallback).
        sensor_data = self.get_live_sensor_data()

        smoke = sensor_data["smoke"]
        gas = sensor_data["gas"]
        temp = sensor_data["temperature"]
        humidity = sensor_data["humidity"]
        shock = sensor_data["shock"]
        motion = sensor_data["motion"]

        # Run ML prediction
        risk = self.fire_model.predict(
            smoke,
            gas,
            temp,
            humidity,
            shock,
            motion
        )

        # Store result globally
        self.current_risk = risk
        self.current_hazard_level = self._risk_to_level(risk)
        self.current_hazard_type = self._infer_hazard_type(smoke, gas, shock)
        self.current_sensor_source = sensor_data.get("source", "simulator")

        # Keep simulator hazard metadata in sync so existing screens remain coherent.
        self.sensor_sim.hazard_level = self.current_hazard_level
        self.sensor_sim.active_hazard = None if self.current_hazard_level != "red" else self.current_hazard_type

        self._maybe_auto_start_evac(risk)

        # Refresh screen
        if self.current_screen_name and self.current_screen_name in self.screens:
            screen = self.screens[self.current_screen_name]

            if hasattr(screen, "refresh"):
                try:
                    screen.refresh()
                except Exception:
                    pass

        self.after(1000, self._update_loop)

    # ────────────────────────── Cleanup ──────────────────────────

    def on_closing(self):
        self.sensor_sim.stop()
        self.evac_sim.stop()
        self.responder_sim.stop()
        
        # Stop Arduino reader if instance exists (usually attached to dashboard)
        if "dashboard" in self.screens:
            dash = self.screens["dashboard"]
            if hasattr(dash, "sensor_reader"):
                dash.sensor_reader.stop()
                
        self.destroy()


if __name__ == "__main__":
    app = FireflyApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
