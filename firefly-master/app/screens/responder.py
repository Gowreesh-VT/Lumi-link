"""
Responder Dashboard — For users who choose 'I Want to Help Others'.
Shows incoming alerts, nearby people needing help, and navigation to them.
"""

import customtkinter as ctk
import random
import threading
import time
from utils.theme import *


class ResponderScreen(ctk.CTkFrame):
    DIRECTIONS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]

    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.responder_sim = app.responder_sim
        self.resolved_count = 0
        self._nav_active = False
        self._nav_overlay = None
        self._nav_alert = None
        self._nav_distance = 0
        self._build_ui()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color="#0B2E1A", corner_radius=0, height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        ctk.CTkLabel(header, text="🦸  RESPONDER MODE", font=FONT_HEADING,
                     text_color=ROLE_HELP_OTHERS).pack(side="left", padx=PAD_LG)

        self.alert_count_label = ctk.CTkLabel(header, text="3 active alerts",
                                              font=FONT_SMALL, text_color=STATUS_AMBER)
        self.alert_count_label.pack(side="right", padx=PAD_LG)

        settings_btn = ctk.CTkButton(header, text="⚙", width=35, height=35,
                                     fg_color="transparent", hover_color=BG_CARD,
                                     font=(FONT_FAMILY, 18),
                                     command=lambda: self.app.show_screen("settings"))
        settings_btn.pack(side="right", padx=PAD_SM)

        # ── Body ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Status Banner ──
        status_frame = ctk.CTkFrame(body, fg_color="#0B2E1A", corner_radius=CORNER_RADIUS_LG,
                                    border_width=2, border_color=ROLE_HELP_OTHERS, height=80)
        status_frame.pack(fill="x", pady=(0, PAD_MD))
        status_frame.pack_propagate(False)

        status_inner = ctk.CTkFrame(status_frame, fg_color="transparent")
        status_inner.pack(expand=True)

        ctk.CTkLabel(status_inner, text="🟢  You are in Responder Mode",
                     font=FONT_SUBHEADING, text_color=ROLE_HELP_OTHERS).pack()
        ctk.CTkLabel(status_inner, text="Nearby people who need help will appear below",
                     font=FONT_SMALL, text_color=TEXT_MUTED).pack()

        # ── Quick Stats ──
        stats_frame = ctk.CTkFrame(body, fg_color="transparent")
        stats_frame.pack(fill="x", pady=(0, PAD_MD))
        stats_frame.columnconfigure((0, 1, 2), weight=1)

        stat_defs = [
            ("Active Alerts", "3", STATUS_AMBER),
            ("Resolved", "0", STATUS_GREEN),
            ("Nearest", "0.3 km", ACCENT_CYAN),
        ]

        self.stat_widgets = {}
        for i, (label, val, color) in enumerate(stat_defs):
            card = ctk.CTkFrame(stats_frame, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                border_width=1, border_color=BORDER)
            card.grid(row=0, column=i, padx=PAD_XS, sticky="nsew")

            ctk.CTkLabel(card, text=label, font=FONT_TINY, text_color=TEXT_MUTED).pack(pady=(PAD_MD, PAD_XS))
            v_lbl = ctk.CTkLabel(card, text=val, font=FONT_HEADING, text_color=color)
            v_lbl.pack(pady=(0, PAD_MD))
            self.stat_widgets[label] = v_lbl

        # ── Alerts List ──
        ctk.CTkLabel(body, text="INCOMING ALERTS", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(PAD_SM, PAD_XS))

        self.alerts_container = ctk.CTkFrame(body, fg_color="transparent")
        self.alerts_container.pack(fill="x")

        self._render_alerts()

        # ── Back to role selection ──
        back_btn = ctk.CTkButton(body, text="← Switch Role", height=36,
                                 fg_color="transparent", hover_color=BG_CARD,
                                 text_color=TEXT_MUTED, font=FONT_SMALL,
                                 command=self._switch_role)
        back_btn.pack(pady=(PAD_LG, PAD_LG))

    def _switch_role(self):
        self._close_nav()
        self.responder_sim.stop()
        self.app.show_screen("role_select")

    def _render_alerts(self):
        for widget in self.alerts_container.winfo_children():
            widget.destroy()

        if not self.responder_sim.alerts:
            ctk.CTkLabel(self.alerts_container, text="No active alerts nearby",
                         font=FONT_BODY, text_color=TEXT_MUTED).pack(pady=PAD_LG)
            return

        for alert in self.responder_sim.alerts:
            card = ctk.CTkFrame(self.alerts_container, fg_color=BG_CARD,
                                corner_radius=CORNER_RADIUS, border_width=1, border_color=BORDER)
            card.pack(fill="x", pady=(0, PAD_SM))

            card_inner = ctk.CTkFrame(card, fg_color="transparent")
            card_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

            # Top row — name + status badge
            top_row = ctk.CTkFrame(card_inner, fg_color="transparent")
            top_row.pack(fill="x")

            hazard_info = HAZARD_INFO.get(alert["hazard"], HAZARD_INFO["fire"])

            ctk.CTkLabel(top_row, text=f"{hazard_info['icon']}  {alert['name']}",
                         font=FONT_SUBHEADING, text_color=TEXT_PRIMARY, anchor="w").pack(side="left")

            status_color = STATUS_RED if alert["status"] == "critical" else STATUS_AMBER if alert["status"] == "moderate" else STATUS_GREEN
            badge = ctk.CTkLabel(top_row, text=f" {alert['status'].upper()} ",
                                 font=FONT_TINY, text_color=BG_PRIMARY,
                                 fg_color=status_color, corner_radius=4)
            badge.pack(side="right")

            # Details
            details = f"📍 {alert['floor']}  •  📏 {alert['distance']} km  •  🕐 {alert['time_ago']}"
            ctk.CTkLabel(card_inner, text=details, font=FONT_SMALL,
                         text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(PAD_XS, 0))

            if alert["medical_flags"] != "None":
                ctk.CTkLabel(card_inner, text=f"🏥 Medical: {alert['medical_flags']}",
                             font=FONT_SMALL, text_color=STATUS_AMBER, anchor="w"
                             ).pack(fill="x", pady=(PAD_XS, 0))

            # Action buttons
            btn_row = ctk.CTkFrame(card_inner, fg_color="transparent")
            btn_row.pack(fill="x", pady=(PAD_SM, 0))

            navigate_btn = ctk.CTkButton(btn_row, text="🧭 Navigate", height=32,
                                         fg_color=ACCENT_BLUE, hover_color=ACCENT_PURPLE,
                                         font=FONT_SMALL, corner_radius=CORNER_RADIUS_SM,
                                         width=120,
                                         command=lambda a=alert: self._navigate_to(a))
            navigate_btn.pack(side="left", padx=(0, PAD_SM))

            resolve_btn = ctk.CTkButton(btn_row, text="✓ Resolved", height=32,
                                        fg_color=STATUS_GREEN_BG, hover_color=STATUS_GREEN,
                                        text_color=STATUS_GREEN, font=FONT_SMALL,
                                        corner_radius=CORNER_RADIUS_SM, width=100,
                                        command=lambda a_id=alert["id"]: self._resolve(a_id))
            resolve_btn.pack(side="left")

    # ────────────────────────── Navigation Overlay ──────────────────────────

    def _navigate_to(self, alert):
        """Open a full-screen navigation overlay guiding responder to the person."""
        self._close_nav()  # close any existing overlay

        self._nav_active = True
        self._nav_alert = alert
        self._nav_distance = int(alert["distance"] * 1000)  # km → meters

        hazard_info = HAZARD_INFO.get(alert["hazard"], HAZARD_INFO["fire"])

        # ── Build overlay on top of everything ──
        self._nav_overlay = ctk.CTkFrame(self, fg_color=BG_PRIMARY)
        self._nav_overlay.place(relx=0, rely=0, relwidth=1, relheight=1)

        # Header
        nav_header = ctk.CTkFrame(self._nav_overlay, fg_color=ACCENT_BLUE, corner_radius=0, height=50)
        nav_header.pack(fill="x")
        nav_header.pack_propagate(False)

        close_btn = ctk.CTkButton(nav_header, text="✕ Stop", width=80, height=40,
                                  fg_color="transparent", hover_color="#3B82F6",
                                  font=FONT_BODY_BOLD, text_color="#FFFFFF",
                                  command=self._close_nav)
        close_btn.pack(side="left", padx=PAD_SM)

        ctk.CTkLabel(nav_header, text=f"🧭  Navigating to {alert['name']}",
                     font=FONT_HEADING, text_color="#FFFFFF").pack(side="left", padx=PAD_SM)

        # Body
        nav_body = ctk.CTkFrame(self._nav_overlay, fg_color=BG_PRIMARY)
        nav_body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Big Arrow ──
        arrow_frame = ctk.CTkFrame(nav_body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS_LG,
                                   border_width=2, border_color=ACCENT_BLUE, height=220)
        arrow_frame.pack(fill="x", pady=(0, PAD_MD))
        arrow_frame.pack_propagate(False)

        ctk.CTkLabel(arrow_frame, text="FOLLOW THIS DIRECTION", font=FONT_SMALL,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, 0))

        self._nav_arrow_label = ctk.CTkLabel(arrow_frame, text="→",
                                             font=FONT_ARROW, text_color=ACCENT_CYAN)
        self._nav_arrow_label.pack(expand=True)

        # ── Distance + ETA ──
        stats_row = ctk.CTkFrame(nav_body, fg_color="transparent")
        stats_row.pack(fill="x", pady=(0, PAD_MD))
        stats_row.columnconfigure((0, 1), weight=1)

        dist_card = ctk.CTkFrame(stats_row, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        dist_card.grid(row=0, column=0, padx=(0, PAD_SM), sticky="nsew")

        ctk.CTkLabel(dist_card, text="DISTANCE", font=FONT_TINY,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, PAD_XS))
        self._nav_dist_label = ctk.CTkLabel(dist_card, text=f"{self._nav_distance} m",
                                            font=FONT_COUNTDOWN, text_color=ACCENT_CYAN)
        self._nav_dist_label.pack(pady=(0, PAD_MD))

        eta_card = ctk.CTkFrame(stats_row, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                border_width=1, border_color=BORDER)
        eta_card.grid(row=0, column=1, padx=(PAD_SM, 0), sticky="nsew")

        eta_secs = int(self._nav_distance * 0.75)
        mins = eta_secs // 60
        secs = eta_secs % 60
        ctk.CTkLabel(eta_card, text="ETA", font=FONT_TINY,
                     text_color=TEXT_MUTED).pack(pady=(PAD_MD, PAD_XS))
        self._nav_eta_label = ctk.CTkLabel(eta_card, text=f"{mins}:{secs:02d}",
                                           font=FONT_COUNTDOWN, text_color=STATUS_AMBER)
        self._nav_eta_label.pack(pady=(0, PAD_MD))

        # ── Person Info Card ──
        person_card = ctk.CTkFrame(nav_body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                   border_width=1, border_color=BORDER)
        person_card.pack(fill="x", pady=(0, PAD_MD))

        person_inner = ctk.CTkFrame(person_card, fg_color="transparent")
        person_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        ctk.CTkLabel(person_inner, text="PERSON IN NEED", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x")

        info_text = (
            f"👤 {alert['name']}  •  📍 {alert['floor']}\n"
            f"🏥 Medical: {alert['medical_flags']}\n"
            f"{hazard_info['icon']} Hazard: {hazard_info['title']}"
        )
        ctk.CTkLabel(person_inner, text=info_text, font=FONT_BODY,
                     text_color=TEXT_SECONDARY, anchor="w", justify="left").pack(fill="x", pady=(PAD_XS, 0))

        # ── Instruction ──
        instr_card = ctk.CTkFrame(nav_body, fg_color=hazard_info["color"] + "22",
                                  corner_radius=CORNER_RADIUS,
                                  border_width=1, border_color=hazard_info["color"])
        instr_card.pack(fill="x", pady=(0, PAD_MD))

        instr_inner = ctk.CTkFrame(instr_card, fg_color="transparent")
        instr_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        ctk.CTkLabel(instr_inner, text="⚠  RESPONDER INSTRUCTION", font=FONT_SMALL,
                     text_color=hazard_info["color"], anchor="w").pack(fill="x")
        ctk.CTkLabel(instr_inner, text=hazard_info["instruction"], font=FONT_BODY,
                     text_color=TEXT_SECONDARY, anchor="w", wraplength=500).pack(fill="x", pady=(PAD_XS, 0))

        # ── Mark Rescued Button ──
        rescued_btn = ctk.CTkButton(nav_body, text="✓  Person Rescued — Mark Resolved", height=50,
                                    fg_color=STATUS_GREEN, hover_color=ROLE_HELP_OTHERS_HOVER,
                                    font=FONT_HEADING, corner_radius=CORNER_RADIUS,
                                    command=lambda: self._rescue_complete(alert["id"]))
        rescued_btn.pack(fill="x", pady=(0, PAD_MD))

        # Start simulated distance countdown
        self._start_nav_simulation()

    def _start_nav_simulation(self):
        """Simulate approaching the person — distance decreases over time."""
        def _sim():
            while self._nav_active and self._nav_distance > 0:
                self._nav_distance = max(0, self._nav_distance - random.randint(5, 20))
                direction = random.choice(self.DIRECTIONS)
                try:
                    self._nav_arrow_label.configure(text=direction)
                    self._nav_dist_label.configure(text=f"{self._nav_distance} m")

                    eta_secs = int(self._nav_distance * 0.75)
                    mins = eta_secs // 60
                    secs = eta_secs % 60
                    self._nav_eta_label.configure(text=f"{mins}:{secs:02d}")

                    # Color based on distance
                    if self._nav_distance < 50:
                        self._nav_dist_label.configure(text_color=STATUS_GREEN)
                        self._nav_eta_label.configure(text_color=STATUS_GREEN)
                    elif self._nav_distance < 200:
                        self._nav_dist_label.configure(text_color=STATUS_AMBER)
                        self._nav_eta_label.configure(text_color=STATUS_AMBER)
                except Exception:
                    break
                time.sleep(1)

            # Reached the person
            if self._nav_active and self._nav_distance <= 0:
                try:
                    self._nav_arrow_label.configure(text="✓", text_color=STATUS_GREEN)
                    self._nav_dist_label.configure(text="ARRIVED", text_color=STATUS_GREEN)
                    self._nav_eta_label.configure(text="0:00", text_color=STATUS_GREEN)
                except Exception:
                    pass

        threading.Thread(target=_sim, daemon=True).start()

    def _rescue_complete(self, alert_id):
        """Mark person as rescued, close nav, remove alert."""
        self._close_nav()
        self.resolved_count += 1
        self.responder_sim.resolve_alert(alert_id)
        self._render_alerts()

    def _close_nav(self):
        """Close navigation overlay."""
        self._nav_active = False
        self._nav_alert = None
        if self._nav_overlay:
            self._nav_overlay.destroy()
            self._nav_overlay = None

    def _resolve(self, alert_id):
        self.resolved_count += 1
        self.responder_sim.resolve_alert(alert_id)
        self._render_alerts()

    def on_enter(self):
        self.responder_sim.start(callback=lambda: None)

    def on_leave(self):
        self._close_nav()

    def refresh(self):
        # Don't re-render alerts list while navigating
        if self._nav_active:
            return

        count = len(self.responder_sim.alerts)
        self.alert_count_label.configure(text=f"{count} active alert{'s' if count != 1 else ''}")
        self.stat_widgets["Active Alerts"].configure(text=str(count))
        self.stat_widgets["Resolved"].configure(text=str(self.resolved_count))

        if self.responder_sim.alerts:
            nearest = min(a["distance"] for a in self.responder_sim.alerts)
            self.stat_widgets["Nearest"].configure(text=f"{nearest} km")
        else:
            self.stat_widgets["Nearest"].configure(text="—")

        # Re-render alerts periodically
        self._render_alerts()
