"""
EVAC Mode — Full-screen evacuation guidance with dynamic routing.
"""

import customtkinter as ctk
from utils.theme import *


class EvacScreen(ctk.CTkFrame):
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
        self.evac_sim = app.evac_sim
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
                                 command=self._exit_evac)
        back_btn.pack(side="left", padx=PAD_SM)

        self.header_label = ctk.CTkLabel(header, text="⚡ EVAC MODE ACTIVE",
                                         font=FONT_HEADING, text_color=STATUS_RED)
        self.header_label.pack(side="left", padx=PAD_SM)

        self.route_status_label = ctk.CTkLabel(header, text="Optimal route active",
                                               font=FONT_SMALL, text_color=STATUS_AMBER)
        self.route_status_label.pack(side="right", padx=PAD_LG)

        # ── Main Content ──
        body = ctk.CTkFrame(self, fg_color=BG_PRIMARY)
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

        # ── SOS from EVAC ──
        sos_btn = ctk.CTkButton(body, text="🆘  SEND SOS", height=50,
                                fg_color=STATUS_RED, hover_color=ROLE_NEED_HELP_HOVER,
                                font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                command=lambda: self.app.show_screen("sos"))
        sos_btn.pack(fill="x", pady=(0, PAD_MD))

    def _exit_evac(self):
        self.evac_sim.stop()
        self.app.sensor_sim.reset_to_safe()
        self.app.show_screen("dashboard")

    def on_enter(self):
        """Called when this screen becomes visible."""
        self.evac_sim.start(callback=lambda: None)

    def on_leave(self):
        self.evac_sim.stop()

    def refresh(self):
        route = self.app.get_live_route_data() if hasattr(self.app, "get_live_route_data") else None
        using_live_route = route and route.get("source") != "simulator"

        # Update direction
        if using_live_route:
            turn = str(route.get("next_turn", "FORWARD")).upper()
            arrow = self.TURN_TO_ARROW.get(turn, "↑")
            self.direction_arrow.configure(text=arrow)
            age = route.get("age_sec")
            if age is not None:
                self.route_status_label.configure(text=f"LiFi route: {turn} ({age:.1f}s)")
            else:
                self.route_status_label.configure(text=f"LiFi route: {turn}")
        else:
            self.direction_arrow.configure(text=self.evac_sim.current_direction)
            self.route_status_label.configure(text="SIM route fallback")

        # Update distance & time
        dist = int(route.get("distance_m", 0)) if using_live_route else self.evac_sim.distance_to_exit
        self.distance_label.configure(text=f"{dist} m")

        time_s = int(max(0, dist * 0.75)) if using_live_route else self.evac_sim.time_to_safety
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
        blocked = self.evac_sim.blocked_zones
        if using_live_route:
            target_exit = route.get("target_exit", "Exit A")
            routing_text = (
                "✓ LiFi route lock established\n"
                f"✓ Target exit: {target_exit}\n"
                "✓ Continue following optical guidance"
            )
        else:
            routing_text = "✓ Avoiding smoke zones\n✓ Avoiding crowd clusters\n✓ Clear path to Exit B"
            if blocked:
                routing_text += "\n⚠ Blocked: " + ", ".join(blocked[-3:])
        self.routing_details.configure(text=routing_text)
