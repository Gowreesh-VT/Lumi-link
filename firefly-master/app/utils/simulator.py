"""
Simulator for mock sensor data, hazard events, SOS flow, and route guidance.
Provides realistic-looking data for the GUI prototype.
"""

import random
import time
import threading


class SensorSimulator:
    """Generates mock sensor readings that update over time."""

    def __init__(self):
        self.aqi = 42
        self.temperature = 24.0
        self.crowd_density = 35
        self.connectivity = 100
        self.smoke_density = 0
        self.toxic_gas = 0
        self.hazard_level = "green"  # green, amber, red
        self.active_hazard = None
        self.is_running = False
        self._callbacks = []
        self._lock = threading.Lock()

    def add_callback(self, callback):
        self._callbacks.append(callback)

    def _notify(self):
        for cb in self._callbacks:
            try:
                cb()
            except Exception:
                pass

    def start(self):
        self.is_running = True
        t = threading.Thread(target=self._run_loop, daemon=True)
        t.start()

    def stop(self):
        self.is_running = False

    def _run_loop(self):
        while self.is_running:
            with self._lock:
                self._update_sensors()
                self._evaluate_hazard()
            self._notify()
            time.sleep(2)

    def _update_sensors(self):
        # Gradual drift with occasional spikes
        self.aqi = max(0, min(500, self.aqi + random.randint(-5, 5)))
        self.temperature = max(-10, min(60, self.temperature + random.uniform(-0.5, 0.5)))
        self.crowd_density = max(0, min(100, self.crowd_density + random.randint(-3, 3)))
        self.connectivity = max(0, min(100, self.connectivity + random.randint(-2, 2)))
        self.smoke_density = max(0, min(100, self.smoke_density + random.randint(-1, 1)))
        self.toxic_gas = max(0, min(100, self.toxic_gas + random.randint(-1, 1)))

    def _evaluate_hazard(self):
        if self.aqi > 200 or self.smoke_density > 60 or self.temperature > 45:
            self.hazard_level = "red"
            if self.smoke_density > 60:
                self.active_hazard = "fire"
            elif self.toxic_gas > 50:
                self.active_hazard = "chemical"
            else:
                self.active_hazard = "fire"
        elif self.aqi > 100 or self.crowd_density > 75 or self.temperature > 35:
            self.hazard_level = "amber"
            self.active_hazard = None
        else:
            self.hazard_level = "green"
            self.active_hazard = None

    def trigger_emergency(self, hazard_type="fire"):
        """Manually trigger an emergency for testing."""
        with self._lock:
            self.active_hazard = hazard_type
            self.hazard_level = "red"
            if hazard_type == "fire":
                self.smoke_density = 80
                self.temperature = 55
                self.aqi = 350
            elif hazard_type == "gas":
                self.toxic_gas = 85
                self.aqi = 280
            elif hazard_type == "earthquake":
                self.aqi = 150
            elif hazard_type == "chemical":
                self.toxic_gas = 90
                self.aqi = 300
        self._notify()

    def reset_to_safe(self):
        """Reset all sensors to safe levels."""
        with self._lock:
            self.aqi = 42
            self.temperature = 24.0
            self.crowd_density = 35
            self.connectivity = 100
            self.smoke_density = 0
            self.toxic_gas = 0
            self.hazard_level = "green"
            self.active_hazard = None
        self._notify()

    def get_snapshot(self):
        with self._lock:
            return {
                "aqi": self.aqi,
                "temperature": round(self.temperature, 1),
                "crowd_density": self.crowd_density,
                "connectivity": self.connectivity,
                "smoke_density": self.smoke_density,
                "toxic_gas": self.toxic_gas,
                "hazard_level": self.hazard_level,
                "active_hazard": self.active_hazard,
            }

    def get_data(self):
        """Compatibility layer for screens/app expecting raw sensor-style fields."""
        snap = self.get_snapshot()
        return {
            "smoke": int(snap["smoke_density"] * 10),
            "gas": int(snap["toxic_gas"] * 8),
            "temperature": float(snap["temperature"]),
            "humidity": 50.0,
            "shock": 1 if snap["active_hazard"] == "earthquake" else 0,
            "motion": 1 if snap["crowd_density"] > 70 else 0,
            "aqi": snap["aqi"],
            "hazard_level": snap["hazard_level"],
        }


class SOSSimulator:
    """Simulates SOS dispatch and responder tracking."""

    def __init__(self):
        self.sos_active = False
        self.dispatch_time = None
        self.responder_distance = None
        self.services_notified = False
        self.contacts_notified = False
        self.building_alerted = False

    def trigger_sos(self, callback=None):
        self.sos_active = True
        self.dispatch_time = time.time()
        self.responder_distance = random.uniform(1.5, 5.0)

        def _simulate_dispatch():
            time.sleep(0.5)
            self.services_notified = True
            if callback:
                callback("services")
            time.sleep(0.3)
            self.contacts_notified = True
            if callback:
                callback("contacts")
            time.sleep(0.2)
            self.building_alerted = True
            if callback:
                callback("building")

            # Simulate responder approaching
            while self.sos_active and self.responder_distance > 0.1:
                self.responder_distance = max(0.1, self.responder_distance - random.uniform(0.1, 0.3))
                if callback:
                    callback("proximity")
                time.sleep(1)

        t = threading.Thread(target=_simulate_dispatch, daemon=True)
        t.start()

    def cancel_sos(self):
        self.sos_active = False
        self.services_notified = False
        self.contacts_notified = False
        self.building_alerted = False
        self.responder_distance = None


class GuideSimulator:
    """Simulates guidance routing data."""

    DIRECTIONS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]

    def __init__(self):
        self.distance_to_exit = 127  # meters
        self.time_to_safety = 95  # seconds
        self.current_direction = "→"
        self.route_status = "Optimal route active"
        self.blocked_zones = []
        self.is_running = False

    def start(self, callback=None):
        self.is_running = True
        self.distance_to_exit = random.randint(80, 200)
        self.time_to_safety = int(self.distance_to_exit * 0.75)

        def _simulate():
            while self.is_running and self.distance_to_exit > 0:
                self.distance_to_exit = max(0, self.distance_to_exit - random.randint(1, 4))
                self.time_to_safety = max(0, int(self.distance_to_exit * 0.75))
                self.current_direction = random.choice(self.DIRECTIONS)

                # Random re-route events
                if random.random() < 0.05:
                    self.route_status = "⚡ Re-routing... blocked path detected"
                    self.blocked_zones.append(f"Zone {random.choice('ABCDEF')}-{random.randint(1,5)}")
                else:
                    self.route_status = "Optimal route active"

                if callback:
                    callback()
                time.sleep(1)

        t = threading.Thread(target=_simulate, daemon=True)
        t.start()

    def stop(self):
        self.is_running = False


