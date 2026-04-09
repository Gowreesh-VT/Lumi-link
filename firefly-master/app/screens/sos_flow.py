"""
SOS Flow — One-tap emergency dispatch with real-time status.
"""

import customtkinter as ctk
from utils.theme import *


class SOSScreen(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.sos_sim = app.sos_sim
        self._build_ui()

    def _build_ui(self):
        # ── Header ──
        header = ctk.CTkFrame(self, fg_color=STATUS_RED_BG, corner_radius=0, height=50)
        header.pack(fill="x")
        header.pack_propagate(False)

        back_btn = ctk.CTkButton(header, text="← Back", width=80, height=40,
                                 fg_color="transparent", hover_color=BG_CARD,
                                 font=FONT_BODY, text_color=TEXT_SECONDARY,
                                 command=self._cancel_and_back)
        back_btn.pack(side="left", padx=PAD_SM)

        ctk.CTkLabel(header, text="🆘  SOS EMERGENCY", font=FONT_HEADING,
                     text_color=STATUS_RED).pack(side="left", padx=PAD_SM)

        # ── Body ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── SOS Trigger Button ──
        trigger_frame = ctk.CTkFrame(body, fg_color="transparent", height=180)
        trigger_frame.pack(fill="x", pady=(PAD_LG, PAD_MD))

        self.sos_button = ctk.CTkButton(
            trigger_frame, text="🆘\n\nTAP TO SEND SOS",
            width=200, height=200,
            fg_color=STATUS_RED, hover_color="#C0392B",
            font=FONT_HEADING, corner_radius=100,
            command=self._trigger_sos)
        self.sos_button.pack()

        self.sos_status_label = ctk.CTkLabel(body, text="Tap the button above to send emergency alert",
                                             font=FONT_BODY, text_color=TEXT_MUTED)
        self.sos_status_label.pack(pady=(0, PAD_LG))

        # ── Data Packet Card ──
        packet_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                    border_width=1, border_color=BORDER)
        packet_frame.pack(fill="x", pady=(0, PAD_MD))

        packet_inner = ctk.CTkFrame(packet_frame, fg_color="transparent")
        packet_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        ctk.CTkLabel(packet_inner, text="DATA PACKET", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x")

        data = self.app.sensor_sim.get_snapshot()
        packet_text = (
            f"📍 Location: 28.6139°N, 77.2090°E\n"
            f"🏢 Indoor: Building A, Floor 2, Sector C\n"
            f"⚠ Hazard: {data.get('active_hazard', 'None') or 'None'}\n"
            f"🌡 Temp: {data.get('temperature', 24)}°C  |  AQI: {data.get('aqi', 42)}\n"
            f"🏥 Medical: No flags set"
        )
        self.packet_label = ctk.CTkLabel(packet_inner, text=packet_text,
                                         font=FONT_MONO, text_color=TEXT_SECONDARY,
                                         anchor="w", justify="left")
        self.packet_label.pack(fill="x", pady=(PAD_SM, 0))

        # ── Cancel SOS ──
        cancel_btn = ctk.CTkButton(body, text="Cancel SOS", height=40,
                                   fg_color="transparent", hover_color=BG_CARD,
                                   border_width=1, border_color=STATUS_RED,
                                   text_color=STATUS_RED, font=FONT_BODY,
                                   corner_radius=CORNER_RADIUS,
                                   command=self._cancel_sos)
        cancel_btn.pack(fill="x", pady=(0, PAD_LG))

    def _send_led_command(self, command):
        dash = self.app.screens.get("dashboard") if hasattr(self.app, "screens") else None
        if not dash or not hasattr(dash, "sensor_reader"):
            return False
        return dash.sensor_reader.send_command(command)

    def trigger_sos_now(self):
        """Public helper so other screens can trigger the same SOS flow."""
        if self.sos_sim.sos_active:
            return
        self._trigger_sos()

    def _trigger_sos(self):
        if hasattr(self.app, "trigger_manual_sos"):
            self.app.trigger_manual_sos()

        self.sos_button.configure(text="✓\n\nSOS SENT", fg_color="#1A5D1A", state="disabled")
        self.sos_status_label.configure(text="Emergency alert dispatched!", text_color=STATUS_GREEN)
        self._send_led_command("SOS_ON")
        self.sos_sim.trigger_sos(callback=None)

    def _cancel_sos(self):
        self.sos_sim.cancel_sos()
        self._send_led_command("SOS_OFF")
        self._reset_ui()

    def _cancel_and_back(self):
        self.sos_sim.cancel_sos()
        self._send_led_command("SOS_OFF")
        self._reset_ui()
        self.app.show_screen("dashboard")

    def _reset_ui(self):
        self.sos_button.configure(text="🆘\n\nTAP TO SEND SOS", fg_color=STATUS_RED, state="normal")
        self.sos_status_label.configure(text="Tap the button above to send emergency alert",
                                        text_color=TEXT_MUTED)

    def refresh(self):
        # Update packet with latest sensor data
        data = self.app.sensor_sim.get_snapshot()
        packet_text = (
            f"📍 Location: 28.6139°N, 77.2090°E\n"
            f"🏢 Indoor: Building A, Floor 2, Sector C\n"
            f"⚠ Hazard: {data.get('active_hazard', 'None') or 'None'}\n"
            f"🌡 Temp: {data['temperature']}°C  |  AQI: {data['aqi']}\n"
            f"🏥 Medical: No flags set"
        )
        self.packet_label.configure(text=packet_text)
