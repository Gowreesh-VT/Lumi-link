"""
LumiLink — Emergency Safety & Guidance App
Main application entry point with single-role interface.

Run: python app.py
"""

import customtkinter as ctk
import threading
import time
import os
import importlib.util

# Configure appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("dark-blue")

from utils.theme import *
from utils.simulator import SensorSimulator, SOSSimulator, GuideSimulator
from utils.fire_model import FireDetectionModel


class LumiLinkApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # ── Window Setup ──
        self.title("LumiLink — Emergency Safety System")
        self.geometry("1000x700")
        self.minsize(900, 650)
        self.configure(fg_color=BG_PRIMARY)

        # ── Simulators ──
        self.sensor_sim = SensorSimulator()
        self.sos_sim = SOSSimulator()
        self.guide_sim = GuideSimulator()

        # ── Screen management ──
        self.screens = {}
        self.current_screen_name = None
        self.current_role = None  # "need_help" or "help_others"

        # Container for all screens
        self.container = ctk.CTkFrame(self, fg_color=BG_PRIMARY)
        self.container.pack(fill="both", expand=True)

        # ML model for prediction
        self.fire_model = FireDetectionModel()

        # Runtime state used by screens and auto-guide logic.
        self.current_risk = "CLEAR"
        self.current_hazard_level = "green"
        self.current_hazard_type = "none"
        self.current_sensor_source = "simulator"
        self.manual_sos_mode = os.getenv("FIREFLY_MANUAL_SOS_MODE", "1") == "1"
        self.manual_sos_active = False
        self.auto_guide_enabled = os.getenv("FIREFLY_AUTO_GUIDE", "0") == "1"
        self.auto_guide_cooldown_s = 8.0
        self._last_auto_guide_ts = 0.0
        self._auto_guide_armed = True
        self.space_hold_active = False

        # Floor-map planner state (used as route fallback before simulator).
        self._path_calc = None
        self._planner_grid = None
        self._planner_path = None
        self._planner_step_idx = 0
        self._planner_last_step_ts = 0.0
        self._planner_cell_size_m = float(os.getenv("FIREFLY_CELL_SIZE_M", "1.2"))
        self._planner_start = self._parse_cell_env("FIREFLY_START_CELL", (20, 20))
        self._planner_goal = self._parse_cell_env("FIREFLY_EXIT_CELL", (70, 70))
        self._planner_target_exit = os.getenv("FIREFLY_EXIT_NAME", "Exit A")
        self._planner_enabled = self._init_floor_planner()

        # Hold SPACE to temporarily mask live readings and direction.
        self.bind_all("<KeyPress-space>", self._on_space_press)
        self.bind_all("<KeyRelease-space>", self._on_space_release)

        # Show splash first
        self._show_splash()

    def _on_space_press(self, _event=None):
        self.space_hold_active = True

    def _on_space_release(self, _event=None):
        self.space_hold_active = False

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
        """Return LiFi route direction data when available; fallback to guide simulator."""
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

        # Use floor-map planner route when LiFi route packets are unavailable.
        planned = self.get_planned_route_data()
        if planned is not None:
            return planned

        return {
            "next_turn": "SIM",
            "distance_m": float(self.guide_sim.distance_to_exit),
            "target_exit": "Exit B",
            "hazard": (self.sensor_sim.get_snapshot().get("active_hazard") or "none"),
            "source": "simulator",
            "age_sec": None,
            "ttl_s": None,
        }

    @staticmethod
    def _parse_cell_env(env_key, default):
        raw = os.getenv(env_key)
        if not raw:
            return default
        try:
            x_str, y_str = raw.split(",", 1)
            return int(x_str.strip()), int(y_str.strip())
        except Exception:
            return default

    def _init_floor_planner(self):
        try:
            app_dir = os.path.dirname(os.path.abspath(__file__))
            repo_root = os.path.normpath(os.path.join(app_dir, ".."))
            planner_file = os.path.join(repo_root, "path_algorithm", "path_calculation.py")

            spec = importlib.util.spec_from_file_location("firefly_path_calculation", planner_file)
            if not spec or not spec.loader:
                return False
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self._path_calc = module

            map_path = os.getenv("FIREFLY_FLOOR_MAP")
            if not map_path:
                map_path = os.path.join(repo_root, "path_algorithm", "floor_map_1.png")

            grid = self._path_calc.image_to_grid(map_path)
            self._planner_grid = grid
            rows = len(grid)
            cols = len(grid[0])
            self._planner_start = self._clamp_to_free_cell(self._planner_start, rows, cols)
            self._planner_goal = self._clamp_to_free_cell(self._planner_goal, rows, cols)
            return True
        except Exception as err:
            print(f"[RoutePlanner] Disabled: {err}")
            return False

    def _clamp_to_free_cell(self, cell, rows, cols):
        if self._planner_grid is None:
            return cell

        x = max(0, min(rows - 1, int(cell[0])))
        y = max(0, min(cols - 1, int(cell[1])))
        if self._planner_grid[x][y] == 0:
            return (x, y)

        radius = 1
        while radius < max(rows, cols):
            for dx in range(-radius, radius + 1):
                for dy in range(-radius, radius + 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < rows and 0 <= ny < cols and self._planner_grid[nx][ny] == 0:
                        return (nx, ny)
            radius += 1
        return (x, y)

    def _compute_or_refresh_planner_path(self):
        if not self._planner_enabled or not self._planner_grid or not self._path_calc:
            return False

        start = self._planner_start
        if self._planner_path and self._planner_step_idx < len(self._planner_path):
            start = self._planner_path[self._planner_step_idx]

        start = self._clamp_to_free_cell(start, len(self._planner_grid), len(self._planner_grid[0]))
        goal = self._clamp_to_free_cell(self._planner_goal, len(self._planner_grid), len(self._planner_grid[0]))

        path = self._path_calc.astar(self._planner_grid, start, goal)
        if not path or len(path) < 2:
            return False

        self._planner_path = path
        self._planner_step_idx = 0
        self._planner_last_step_ts = time.time()
        return True

    @staticmethod
    def _delta_to_turn(curr, nxt):
        dx = nxt[0] - curr[0]
        dy = nxt[1] - curr[1]
        if dx == 0 and dy > 0:
            return "RIGHT"
        if dx == 0 and dy < 0:
            return "LEFT"
        if dx < 0 and dy == 0:
            return "FORWARD"
        if dx > 0 and dy == 0:
            return "BACK"
        if dx < 0 and dy > 0:
            return "FORWARD_RIGHT"
        if dx < 0 and dy < 0:
            return "FORWARD_LEFT"
        if dx > 0 and dy > 0:
            return "RIGHT"
        if dx > 0 and dy < 0:
            return "LEFT"
        return "FORWARD"

    def get_planned_route_data(self):
        # Planner route is only relevant in active emergency/guide conditions.
        if self.current_hazard_level != "red":
            return None

        if not self._planner_enabled:
            return None

        if not self._planner_path or self._planner_step_idx >= len(self._planner_path) - 1:
            if not self._compute_or_refresh_planner_path():
                return None

        now = time.time()
        if now - self._planner_last_step_ts >= 1.0 and self._planner_step_idx < len(self._planner_path) - 2:
            self._planner_step_idx += 1
            self._planner_last_step_ts = now

        curr = self._planner_path[self._planner_step_idx]
        nxt = self._planner_path[min(self._planner_step_idx + 1, len(self._planner_path) - 1)]
        remaining_steps = max(0, (len(self._planner_path) - 1) - self._planner_step_idx)
        distance_m = remaining_steps * self._planner_cell_size_m

        return {
            "next_turn": self._delta_to_turn(curr, nxt),
            "distance_m": float(distance_m),
            "target_exit": self._planner_target_exit,
            "hazard": self.current_hazard_type,
            "source": "floor_map",
            "age_sec": 0.0,
            "ttl_s": 1.2,
        }

    def get_planner_visual_data(self):
        if not self._planner_enabled or not self._planner_grid or not self._planner_path:
            return None

        rows = len(self._planner_grid)
        cols = len(self._planner_grid[0]) if rows else 0
        if rows == 0 or cols == 0:
            return None

        return {
            "rows": rows,
            "cols": cols,
            "grid": self._planner_grid,
            "path": list(self._planner_path),
            "step_idx": int(self._planner_step_idx),
            "start": self._planner_start,
            "goal": self._planner_goal,
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

    def _maybe_auto_start_guide(self, risk):
        """Auto-enter guidance mode only when ML reports DANGER."""
        upper_risk = (risk or "").upper()
        if upper_risk == "CLEAR":
            self._auto_guide_armed = True
            return

        if upper_risk != "DANGER":
            return

        if self.current_role != "need_help":
            return

        if self.current_screen_name in {"guide", "sos", "role_select"}:
            return

        now = time.time()
        if (not self._auto_guide_armed) or (now - self._last_auto_guide_ts < self.auto_guide_cooldown_s):
            return

        self._last_auto_guide_ts = now
        self._auto_guide_armed = False
        self.show_screen("guide")

    def trigger_manual_sos(self):
        """Force the app into DANGER state for SOS demo flow."""
        self.manual_sos_active = True
        self.current_risk = "DANGER"
        self.current_hazard_level = "red"
        self.current_hazard_type = "fire"

    # ────────────────────────── Splash Screen ──────────────────────────

    def _show_splash(self):
        self.splash = ctk.CTkFrame(self.container, fg_color=BG_PRIMARY)
        self.splash.place(relx=0, rely=0, relwidth=1, relheight=1)

        center = ctk.CTkFrame(self.splash, fg_color="transparent")
        center.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(center, text="🛡", font=(FONT_FAMILY, 72)).pack()
        ctk.CTkLabel(center, text="LumiLink", font=FONT_HERO,
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
        from screens.evac_mode import GuideScreen
        from screens.sos_flow import SOSScreen
        from screens.environment import EnvironmentScreen
        from screens.settings import SettingsScreen

        # Create all screens
        self.screens["role_select"] = self._create_role_select()
        self.screens["dashboard"] = DashboardScreen(self.container, self)
        self.screens["guide"] = GuideScreen(self.container, self)
        self.screens["sos"] = SOSScreen(self.container, self)
        self.screens["environment"] = EnvironmentScreen(self.container, self)
        self.screens["settings"] = SettingsScreen(self.container, self)

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
        ctk.CTkLabel(center, text="LumiLink", font=FONT_HERO,
                     text_color=ACCENT_CYAN).pack(pady=(PAD_SM, PAD_XS))
        ctk.CTkLabel(center, text="Emergency guidance mode",
                     font=FONT_BODY, text_color=TEXT_MUTED).pack(pady=(0, PAD_XL))

        # Single role card
        cards = ctk.CTkFrame(center, fg_color="transparent")
        cards.pack()
        cards.columnconfigure(0, weight=1)

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
        ctk.CTkLabel(nh_inner, text="Get real-time threat alerts,\nlive route guidance,\nand emergency SOS",
                     font=FONT_BODY, text_color=TEXT_SECONDARY, justify="center").pack(pady=(0, PAD_LG))

        need_btn = ctk.CTkButton(nh_inner, text="Enter →", width=200, height=48,
                                 fg_color=ROLE_NEED_HELP, hover_color=ROLE_NEED_HELP_HOVER,
                                 font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                 command=lambda: self._select_role("need_help"))
        need_btn.pack()

        return frame

    def _select_role(self, role):
        self.current_role = role
        self.show_screen("dashboard")

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
        # During space-hold mode, keep UI responsive but pause model/update progression.
        if self.space_hold_active:
            if self.current_screen_name and self.current_screen_name in self.screens:
                screen = self.screens[self.current_screen_name]
                if hasattr(screen, "refresh"):
                    try:
                        screen.refresh()
                    except Exception:
                        pass
            self.after(1000, self._update_loop)
            return

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

        # Store result globally (manual SOS mode can override startup danger).
        if self.manual_sos_mode:
            if self.manual_sos_active:
                risk = "DANGER"
                hazard_type = "fire"
            else:
                risk = "CLEAR"
                hazard_type = "none"
        else:
            hazard_type = self._infer_hazard_type(smoke, gas, shock)

        self.current_risk = risk
        self.current_hazard_level = self._risk_to_level(risk)
        self.current_hazard_type = hazard_type
        self.current_sensor_source = sensor_data.get("source", "simulator")

        # Keep simulator hazard metadata in sync so existing screens remain coherent.
        self.sensor_sim.hazard_level = self.current_hazard_level
        self.sensor_sim.active_hazard = None if self.current_hazard_level != "red" else self.current_hazard_type

        if self.auto_guide_enabled:
            self._maybe_auto_start_guide(risk)

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
        self.guide_sim.stop()
        
        # Stop Arduino reader if instance exists (usually attached to dashboard)
        if "dashboard" in self.screens:
            dash = self.screens["dashboard"]
            if hasattr(dash, "sensor_reader"):
                dash.sensor_reader.stop()
                
        self.destroy()


if __name__ == "__main__":
    app = LumiLinkApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
