"""
Settings / Profile screen — Medical info, contacts, connectivity.
"""

import customtkinter as ctk
from utils.theme import *


class SettingsScreen(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color=BG_PRIMARY)
        self.app = app
        self.contacts = ["Ravi Kumar — +91 98765 43210", "Priya Sharma — +91 87654 32109"]
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

        ctk.CTkLabel(header, text="⚙  Settings & Profile", font=FONT_HEADING,
                     text_color=ACCENT_PURPLE).pack(side="left", padx=PAD_SM)

        # ── Body ──
        body = ctk.CTkScrollableFrame(self, fg_color=BG_PRIMARY)
        body.pack(fill="both", expand=True, padx=PAD_LG, pady=PAD_MD)

        # ── Medical Info ──
        ctk.CTkLabel(body, text="MEDICAL INFORMATION", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(0, PAD_XS))

        med_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        med_frame.pack(fill="x", pady=(0, PAD_MD))

        med_inner = ctk.CTkFrame(med_frame, fg_color="transparent")
        med_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        fields = [("Blood Type", "O+"), ("Allergies", "None"), ("Conditions", "None"),
                  ("Medications", "None")]
        for label, default in fields:
            row = ctk.CTkFrame(med_inner, fg_color="transparent")
            row.pack(fill="x", pady=PAD_XS)
            ctk.CTkLabel(row, text=label, font=FONT_BODY, text_color=TEXT_SECONDARY,
                         width=120, anchor="w").pack(side="left")
            entry = ctk.CTkEntry(row, placeholder_text=default, font=FONT_BODY,
                                 fg_color=BG_INPUT, border_color=BORDER, height=32)
            entry.pack(side="left", fill="x", expand=True)

        # ── Mobility Constraints ──
        ctk.CTkLabel(body, text="MOBILITY", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(PAD_SM, PAD_XS))

        mob_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                 border_width=1, border_color=BORDER)
        mob_frame.pack(fill="x", pady=(0, PAD_MD))

        mob_inner = ctk.CTkFrame(mob_frame, fg_color="transparent")
        mob_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        self.wheelchair = ctk.CTkSwitch(mob_inner, text="Wheelchair user",
                                        font=FONT_BODY, text_color=TEXT_SECONDARY,
                                        progress_color=ACCENT_BLUE)
        self.wheelchair.pack(fill="x", pady=PAD_XS)

        self.visual = ctk.CTkSwitch(mob_inner, text="Visual impairment",
                                    font=FONT_BODY, text_color=TEXT_SECONDARY,
                                    progress_color=ACCENT_BLUE)
        self.visual.pack(fill="x", pady=PAD_XS)

        self.hearing = ctk.CTkSwitch(mob_inner, text="Hearing impairment",
                                     font=FONT_BODY, text_color=TEXT_SECONDARY,
                                     progress_color=ACCENT_BLUE)
        self.hearing.pack(fill="x", pady=PAD_XS)

        # ── Trusted Contacts ──
        ctk.CTkLabel(body, text="TRUSTED CONTACTS", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(PAD_SM, PAD_XS))

        contacts_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                      border_width=1, border_color=BORDER)
        contacts_frame.pack(fill="x", pady=(0, PAD_MD))

        self.contacts_inner = ctk.CTkFrame(contacts_frame, fg_color="transparent")
        self.contacts_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        self._render_contacts()

        # Add contact
        add_row = ctk.CTkFrame(contacts_frame, fg_color="transparent")
        add_row.pack(fill="x", padx=PAD_LG, pady=(0, PAD_MD))

        self.new_contact_entry = ctk.CTkEntry(add_row, placeholder_text="Name — Phone",
                                               font=FONT_BODY, fg_color=BG_INPUT,
                                               border_color=BORDER, height=32)
        self.new_contact_entry.pack(side="left", fill="x", expand=True, padx=(0, PAD_SM))

        add_btn = ctk.CTkButton(add_row, text="+ Add", width=60, height=32,
                                fg_color=ACCENT_BLUE, hover_color=ACCENT_PURPLE,
                                font=FONT_SMALL, corner_radius=CORNER_RADIUS_SM,
                                command=self._add_contact)
        add_btn.pack(side="right")

        # ── Connectivity & Battery ──
        ctk.CTkLabel(body, text="DEVICE STATUS", font=FONT_SMALL,
                     text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=(PAD_SM, PAD_XS))

        device_frame = ctk.CTkFrame(body, fg_color=BG_CARD, corner_radius=CORNER_RADIUS,
                                    border_width=1, border_color=BORDER)
        device_frame.pack(fill="x", pady=(0, PAD_MD))

        device_inner = ctk.CTkFrame(device_frame, fg_color="transparent")
        device_inner.pack(fill="x", padx=PAD_LG, pady=PAD_MD)

        self.conn_status = ctk.CTkLabel(device_inner, text="📶 Connectivity: Online (100%)",
                                        font=FONT_BODY, text_color=STATUS_GREEN, anchor="w")
        self.conn_status.pack(fill="x", pady=PAD_XS)

        self.battery_status = ctk.CTkLabel(device_inner, text="🔋 Battery: 85%",
                                           font=FONT_BODY, text_color=STATUS_GREEN, anchor="w")
        self.battery_status.pack(fill="x", pady=PAD_XS)

        ctk.CTkLabel(device_inner, text="⌚ Wearable: Not paired",
                     font=FONT_BODY, text_color=TEXT_MUTED, anchor="w").pack(fill="x", pady=PAD_XS)

        pair_btn = ctk.CTkButton(device_inner, text="Pair Wearable", height=32,
                                 fg_color=BG_INPUT, hover_color=BG_SECONDARY,
                                 font=FONT_SMALL, corner_radius=CORNER_RADIUS_SM)
        pair_btn.pack(anchor="w", pady=(PAD_SM, 0))

    def _render_contacts(self):
        for widget in self.contacts_inner.winfo_children():
            widget.destroy()

        for i, contact in enumerate(self.contacts):
            row = ctk.CTkFrame(self.contacts_inner, fg_color="transparent")
            row.pack(fill="x", pady=PAD_XS)

            ctk.CTkLabel(row, text=f"👤 {contact}", font=FONT_BODY,
                         text_color=TEXT_SECONDARY, anchor="w").pack(side="left")

            del_btn = ctk.CTkButton(row, text="✕", width=28, height=28,
                                    fg_color="transparent", hover_color=STATUS_RED_BG,
                                    text_color=STATUS_RED, font=FONT_SMALL,
                                    command=lambda idx=i: self._remove_contact(idx))
            del_btn.pack(side="right")

    def _add_contact(self):
        val = self.new_contact_entry.get().strip()
        if val:
            self.contacts.append(val)
            self.new_contact_entry.delete(0, "end")
            self._render_contacts()

    def _remove_contact(self, idx):
        if 0 <= idx < len(self.contacts):
            self.contacts.pop(idx)
            self._render_contacts()

    def refresh(self):
        data = self.app.sensor_sim.get_snapshot()
        conn = data["connectivity"]
        status = "Online" if conn > 50 else "Weak" if conn > 20 else "OFFLINE"
        color = STATUS_GREEN if conn > 50 else STATUS_AMBER if conn > 20 else STATUS_RED
        self.conn_status.configure(text=f"📶 Connectivity: {status} ({conn}%)", text_color=color)
