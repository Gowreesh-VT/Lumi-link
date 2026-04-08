"""
GUIDE Mode — Full-screen safety guidance with dynamic routing.
"""

import customtkinter as ctk
import tkinter as tk
from utils.theme import *


class GuideScreen(ctk.CTkFrame):
    TURN_TO_ARROW = {
        "LEFT": "←",
        "RIGHT": "→",
        "FORWARD": "↑",
        "BACK": "↓",
        "U_TURN": "↩",
        "FORWARD_LEFT": "↖",
        "FORWARD_RIGHT": "↗",
    }

    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.guide_sim = app.guide_sim
        self.sensor_sim = app.sensor_sim
        self._build_ui()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color=STATUS_RED_BG, corner_radius=0, height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        back_btn = ctk.CTkButton(header, text="✕", width=40, height=40,
                                 fg_color="transparent", hover_color=BG_CARD,
                                 font=(FONT_FAMILY, 20), text_color=STATUS_RED,
                                 command=self._exit_guide)
        back_btn.pack(side="left", padx=PAD_SM)

        self.header_label = ctk.CTkLabel(header, text="⚡ GUIDE MODE ACTIVE",
                                         font=FONT_HEADING, text_color=STATUS_RED)
        self.header_label.pack(side="left", padx=PAD_SM)

        self.route_status_label = ctk.CTkLabel(header, text="Optimal route active",
                                               font=FONT_SMALL, text_color=STATUS_AMBER)
        self.route_status_label.pack(side="right", padx=PAD_LG)

        # ── Main Content ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Direction Arrow (big, center) ──
        arrow_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS_LG,
                                   border_width=2, border_color=STATUS_RED, height=250)
        arrow_frame.pack(fill="x", pady=(0, PAD_MD))
        arrow_frame.pack_propagate(False)

        ctk.CTkLabel(arrow_frame, text="FOLLOW THIS DIRECTION", font=FONT_SMALL,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, 0))

        self.direction_arrow = ctk.CTkLabel(arrow_frame, text="→", font=FONT_ARROW,
                                            text_color=ACCENT_CYAN)
        self.direction_arrow.pack(expand=True)

        # ── Stats Row ──
        stats_frame = ctk.CTkFrame(body, fg_color="transparent")
        stats_frame.pack(fill="x", pady=(0, PAD_MD))
        stats_frame.columnconfigure((0, 1), weight=1)

        # Distance
        dist_card = ctk.CTkFrame(stats_frame, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        dist_card.grid(row=0, column=0, padx=(0, PAD_SM), sticky="nsew")

        ctk.CTkLabel(dist_card, text="DISTANCE TO EXIT", font=FONT_TINY,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, PAD_XS))
        self.distance_label = ctk.CTkLabel(dist_card, text="127 m", font=FONT_COUNTDOWN,
                                           text_color=ACCENT_CYAN)
        self.distance_label.pack(pady=(0, PAD_MD))

        # Time
        time_card = ctk.CTkFrame(stats_frame, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        time_card.grid(row=0, column=1, padx=(PAD_SM, 0), sticky="nsew")

        ctk.CTkLabel(time_card, text="TIME TO SAFETY", font=FONT_TINY,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, PAD_XS))
        self.time_label = ctk.CTkLabel(time_card, text="1:35", font=FONT_COUNTDOWN,
                                       text_color=STATUS_AMBER)
        self.time_label.pack(pady=(0, PAD_MD))

        # ── Context Card ──
        self.context_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                          border_width=1, border_color=BORDER)
        self.context_frame.pack(fill="x", pady=(0, PAD_MD))

        context_inner = ctk.CTkFrame(self.context_frame, fg_color="transparent")
        context_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        self.hazard_icon = ctk.CTkLabel(context_inner, text="🔥", font=FONT_ICON)
        self.hazard_icon.pack(side="left", padx=(0, PAD_MD))

        context_text = ctk.CTkFrame(context_inner, fg_color="transparent")
        context_text.pack(side="left", fill="both", expand=True)

        self.hazard_title = ctk.CTkLabel(context_text, text="FIRE DETECTED",
                                         font=FONT_SUBHEADING, text_color=FIRE_COLOR, anchor="w")
        self.hazard_title.pack(fill="x")

        self.hazard_instruction = ctk.CTkLabel(context_text,
                                               text="Stay low. Cover mouth. Move to nearest exit.",
                                               font=FONT_BODY, text_color=TEXT_SECONDARY, anchor="w",
                                               wraplength=400)
        self.hazard_instruction.pack(fill="x", pady=(PAD_XS, 0))

        self.hazard_action = ctk.CTkLabel(context_text,
                                          text="▶ Follow illuminated exit path",
                                          font=FONT_BODY_BOLD, text_color=ACCENT_CYAN, anchor="w")
        self.hazard_action.pack(fill="x", pady=(PAD_XS, 0))

        # ── Routing Info ──
        route_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                   border_width=1, border_color=BORDER)
        route_frame.pack(fill="x", pady=(0, PAD_MD))

        route_inner = ctk.CTkFrame(route_frame, fg_color="transparent")
        route_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        ctk.CTkLabel(route_inner, text="DYNAMIC ROUTING", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x")

        self.routing_details = ctk.CTkLabel(
            route_inner,
            text="✓ Avoiding smoke zones\n✓ Avoiding crowd clusters\n✓ Clear path to Exit B",
            font=FONT_BODY, text_color=TEXT_SECONDARY, anchor="w", justify="left")
        self.routing_details.pack(fill="x", pady=(PAD_XS, 0))

        # ── Route Visualizer ──
        map_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        map_frame.pack(fill="x", pady=(0, PAD_MD))

        map_inner = ctk.CTkFrame(map_frame, fg_color="transparent")
        map_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        ctk.CTkLabel(map_inner, text="FLOOR MAP ROUTE (DEMO)", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x")

        self.map_canvas = tk.Canvas(map_inner, width=480, height=190,
                                    bg="#0b1220", highlightthickness=0)
        self.map_canvas.pack(fill="x", pady=(PAD_XS, 0))

        # ── SOS from GUIDE ──
        sos_btn = ctk.CTkButton(body, text="🆘  SEND SOS", height=50,
                                fg_color=STATUS_RED, hover_color=ROLE_NEED_HELP_HOVER,
                                font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                command=lambda: self.app.show_screen("sos"))
        sos_btn.pack(fill="x", pady=(0, PAD_MD))

    def _exit_guide(self):
        self.guide_sim.stop()
        self.app.sensor_sim.reset_to_safe()
        self.app.show_screen("dashboard")

    def on_enter(self):
        """Called when this screen becomes visible."""
        self.guide_sim.start(callback=lambda: None)

    def on_leave(self):
        self.guide_sim.stop()

    def refresh(self):
        if getattr(self.app, "space_hold_active", False):
            self.direction_arrow.configure(text="↑")
            self.route_status_label.configure(text="Data unavailable")
            self.distance_label.configure(text="-- m")
            self.time_label.configure(text="--:--", text_color=STATUS_AMBER)
            self.hazard_title.configure(text="DATA UNAVAILABLE", text_color=STATUS_AMBER)
            self.hazard_instruction.configure(text="Hold steady and point towards the lights.")
            self.hazard_action.configure(text="▶ Move toward illuminated guidance lights")
            self.routing_details.configure(
                text="⚠ Space bar held\n⚠ Live route is temporarily masked\n⚠ Release SPACE to resume"
            )
            self.map_canvas.delete("all")
            self.map_canvas.create_rectangle(2, 2, 478, 188, outline="#2b3446", width=1)
            self.map_canvas.create_text(240, 95, text="Data unavailable - point towards lights",
                                        fill="#f8b84d", font=("Helvetica", 12, "bold"))
            return

        route = self.app.get_live_route_data() if hasattr(self.app, "get_live_route_data") else None
        using_live_route = route and route.get("source") != "simulator"

        # Update direction
        if using_live_route:
            turn = str(route.get("next_turn", "FORWARD")).upper()
            arrow = self.TURN_TO_ARROW.get(turn, "↑")
            self.direction_arrow.configure(text=arrow)
            age = route.get("age_sec")
            source = str(route.get("source", "route")).replace("_", " ").upper()
            if age is not None:
                self.route_status_label.configure(text=f"{source} route: {turn} ({age:.1f}s)")
            else:
                self.route_status_label.configure(text=f"{source} route: {turn}")
        else:
            self.direction_arrow.configure(text="•")
            self.route_status_label.configure(text="No valid route data")

        # Update distance & time
        dist = int(route.get("distance_m", 0)) if using_live_route else 0
        self.distance_label.configure(text=f"{dist} m")

        time_s = int(max(0, dist * 0.75)) if using_live_route else 0
        mins = time_s // 60
        secs = time_s % 60
        self.time_label.configure(text=f"{mins}:{secs:02d}")

        # Color based on urgency
        if time_s < 30:
            self.time_label.configure(text_color=STATUS_RED)
        elif time_s < 60:
            self.time_label.configure(text_color=STATUS_AMBER)
        else:
            self.time_label.configure(text_color=ACCENT_CYAN)

        # Context card from active hazard
        data = self.sensor_sim.get_snapshot()
        hazard_type = (route.get("hazard") if using_live_route else data.get("active_hazard")) or "fire"
        info = HAZARD_INFO.get(hazard_type, HAZARD_INFO["fire"])

        self.hazard_icon.configure(text=info["icon"])
        self.hazard_title.configure(text=info["title"], text_color=info["color"])
        self.hazard_instruction.configure(text=info["instruction"])
        self.hazard_action.configure(text=f"▶ {info['action']}")

        # Blocked zones
        blocked = self.guide_sim.blocked_zones
        if using_live_route:
            target_exit = route.get("target_exit", "Exit A")
            routing_text = (
                "✓ LiFi route lock established\n"
                f"✓ Target exit: {target_exit}\n"
                "✓ Continue following optical guidance"
            )
        else:
            routing_text = "⚠ Route unavailable\n⚠ Check live sensor feed\n⚠ Planner not ready"
        self.routing_details.configure(text=routing_text)

        self._render_route_preview(route)

    def _render_route_preview(self, route):
        self.map_canvas.delete("all")
        self.map_canvas.create_rectangle(2, 2, 478, 188, outline="#2b3446", width=1)

        if not route or route.get("source") != "floor_map" or not hasattr(self.app, "get_planner_visual_data"):
            self.map_canvas.create_text(240, 95, text="No floor-map route to display",
                                        fill="#8a93a6", font=("Helvetica", 12))
            return

        visual = self.app.get_planner_visual_data()
        if not visual:
            self.map_canvas.create_text(240, 95, text="Planner path not ready",
                                        fill="#8a93a6", font=("Helvetica", 12))
            return

        rows = visual["rows"]
        cols = visual["cols"]
        grid = visual.get("grid")
        path = visual["path"]
        step_idx = min(max(0, visual["step_idx"]), max(0, len(path) - 1))

        if len(path) < 2:
            self.map_canvas.create_text(240, 95, text="Path too short",
                                        fill="#8a93a6", font=("Helvetica", 12))
            return

        margin = 12
        width = 480 - (2 * margin)
        height = 190 - (2 * margin)
        cell_w = width / max(1, cols)
        cell_h = height / max(1, rows)

        # Draw floor-map occupancy so the demo matches the actual planner map.
        if grid:
            for r in range(rows):
                row = grid[r]
                for c in range(cols):
                    if row[c] == 1:
                        x1 = margin + c * cell_w
                        y1 = margin + r * cell_h
                        x2 = x1 + cell_w
                        y2 = y1 + cell_h
                        self.map_canvas.create_rectangle(
                            x1, y1, x2, y2,
                            fill="#26334d", outline=""
                        )

        def to_xy(cell):
            r, c = cell
            x = margin + (c / max(1, cols - 1)) * width
            y = margin + (r / max(1, rows - 1)) * height
            return x, y

        points = [to_xy(cell) for cell in path]

        # Full path (dim)
        for i in range(len(points) - 1):
            x1, y1 = points[i]
            x2, y2 = points[i + 1]
            self.map_canvas.create_line(x1, y1, x2, y2, fill="#3a455f", width=2)

        # Remaining path (bright)
        for i in range(step_idx, len(points) - 1):
            x1, y1 = points[i]
            x2, y2 = points[i + 1]
            self.map_canvas.create_line(x1, y1, x2, y2, fill="#3ce6d8", width=4)

        sx, sy = points[step_idx]
        gx, gy = points[-1]

        self.map_canvas.create_oval(sx - 6, sy - 6, sx + 6, sy + 6,
                                    fill="#f59e0b", outline="")
        self.map_canvas.create_text(sx + 14, sy, text="YOU", anchor="w",
                                    fill="#f8b84d", font=("Helvetica", 10, "bold"))

        self.map_canvas.create_oval(gx - 6, gy - 6, gx + 6, gy + 6,
                                    fill="#22c55e", outline="")
        self.map_canvas.create_text(gx + 14, gy, text="EXIT", anchor="w",
                                    fill="#61dd8e", font=("Helvetica", 10, "bold"))
