import threading
import json
import time
import os

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    serial = None
    list_ports = None


class ArduinoSensorReader:
    """Reads JSON data from an Arduino over Serial in a background thread."""

    def __init__(self, port=None, baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.is_running = False
        self.serial_conn = None
        self.is_connected = False

        # Data we care about
        self.smoke_value = 0
        self.gas_value = 0
        self.temperature = 0.0
        self.humidity = 0.0
        self.shock_state = 0
        self.motion_state = 0
        self.last_update_ts = 0.0
        self.last_source = "none"
        self.last_error = ""
        self.bad_crc_count = 0

        # Route-direction payload (LiFi guidance channel)
        self.route_next_turn = "→"
        self.route_distance_m = 0.0
        self.route_target_exit = "Exit A"
        self.route_hazard = "none"
        self.route_seq = 0
        self.route_ttl_ms = 2500
        self.route_last_update_ts = 0.0
        
        # Threat thresholds
        self.smoke_threshold = 700
        self.gas_threshold = 400

        # Callbacks if a threat is detected
        self.on_fire_alert = None
        self.on_gas_alert = None
        self.on_shock_alert = None
        
        self._lock = threading.Lock()

    def _pick_serial_port(self):
        # Explicit override is best for reliability.
        if self.port:
            return self.port

        env_port = os.getenv("FIREFLY_SENSOR_PORT")
        if env_port:
            return env_port

        if list_ports is None:
            return None

        ports = list(list_ports.comports())
        if not ports:
            return None

        preferred = [
            "usb",
            "uart",
            "cp210",
            "ch340",
            "wchusbserial",
            "tty.usb",
            "ttyacm",
            "ttyusb",
            "com",
        ]
        for p in ports:
            hay = f"{p.device} {p.description} {p.hwid}".lower()
            if any(k in hay for k in preferred):
                return p.device

        return ports[0].device

    def start(self):
        self.is_running = True
        t = threading.Thread(target=self._run_loop, daemon=True)
        t.start()

    def stop(self):
        self.is_running = False
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()

    def _run_loop(self):
        if serial is None:
            print("[Arduino] pyserial is not installed. Run: pip install pyserial")
            self.is_connected = False
            return

        while self.is_running:
            if self.serial_conn is None or not self.serial_conn.is_open:
                port = self._pick_serial_port()
                if not port:
                    self.is_connected = False
                    self.last_error = "No serial ports found"
                    time.sleep(1.5)
                    continue

                try:
                    self.serial_conn = serial.Serial(port, self.baudrate, timeout=1)
                    self.port = port
                    print(f"[Arduino] Connected to {port} at {self.baudrate} baud")
                    self.is_connected = True
                    self.last_error = ""
                except Exception as e:
                    self.is_connected = False
                    self.last_error = str(e)
                    time.sleep(1.5)
                    continue

            try:
                if self.serial_conn.in_waiting > 0:
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    if line:
                        self._parse_line(line)
            except Exception as e:
                if self.is_connected:
                    print(f"[Arduino] Error reading serial or dropped connection: {e}")
                self.is_connected = False
                self.last_error = str(e)
                try:
                    if self.serial_conn and self.serial_conn.is_open:
                        self.serial_conn.close()
                except Exception:
                    pass
                self.serial_conn = None
            
            time.sleep(0.1)

    def _parse_line(self, line):
        # Receiver can emit lines like: LIFI:{...json...}|AB
        if line.startswith("LIFI:"):
            self.last_source = "lifi"
            self._parse_framed_payload(line[5:])
            return

        # Backward-compatible plain JSON from Arduino serial.
        if line.startswith("{"):
            self.last_source = "arduino"
            self._parse_json(line)
            return

    @staticmethod
    def _crc8_simple(payload):
        crc = 0
        for b in payload.encode("utf-8"):
            crc ^= b
        return crc

    def _parse_framed_payload(self, body):
        # Backward compatibility: accept old format without CRC.
        if "|" not in body:
            self._parse_json(body)
            return

        payload, provided_crc = body.rsplit("|", 1)
        provided_crc = provided_crc.strip().upper()
        if len(provided_crc) != 2:
            self.bad_crc_count += 1
            return

        try:
            expected_crc = self._crc8_simple(payload)
            if provided_crc != f"{expected_crc:02X}":
                self.bad_crc_count += 1
                return
        except Exception:
            self.bad_crc_count += 1
            return

        self._parse_json(payload)

    def _parse_json(self, json_str):
        try:
            data = json.loads(json_str)

            packet_type = data.get("type", "sensor")

            if packet_type == "route":
                self._parse_route_packet(data)
                return

            with self._lock:
                self.smoke_value = data.get("smoke", self.smoke_value)
                self.gas_value = data.get("gas", self.gas_value)
                self.temperature = data.get("temperature", self.temperature)
                self.humidity = data.get("humidity", self.humidity)
                self.shock_state = data.get("shock", self.shock_state)
                self.motion_state = data.get("motion", self.motion_state)
                self.last_update_ts = time.time()

            # Check thresholds
            if self.smoke_value > self.smoke_threshold:
                if self.on_fire_alert:
                    self.on_fire_alert()
                    
            if self.gas_value > self.gas_threshold:
                if self.on_gas_alert:
                    self.on_gas_alert()
                    
            if self.shock_state == 1:
                if self.on_shock_alert:
                    self.on_shock_alert()

        except json.JSONDecodeError:
            # Ignore malformed JSON strings
            pass
        except Exception as e:
            print(f"[Arduino] JSON parsing error: {e}")

    def _parse_route_packet(self, data):
        with self._lock:
            self.route_next_turn = data.get("next_turn", self.route_next_turn)
            self.route_distance_m = float(data.get("distance_m", self.route_distance_m))
            self.route_target_exit = data.get("target_exit", self.route_target_exit)
            self.route_hazard = data.get("hazard", self.route_hazard)
            self.route_seq = int(data.get("seq", self.route_seq))
            self.route_ttl_ms = int(data.get("ttl_ms", self.route_ttl_ms))
            self.route_last_update_ts = time.time()

    def get_latest_data(self):
        with self._lock:
            age_sec = time.time() - self.last_update_ts if self.last_update_ts else None
            return {
                "smoke": self.smoke_value,
                "gas": self.gas_value,
                "temperature": self.temperature,
                "humidity": self.humidity,
                "shock": self.shock_state,
                "motion": self.motion_state,
                "connected": self.is_connected,
                "source": self.last_source,
                "age_sec": age_sec,
                "port": self.port,
                "error": self.last_error,
                "bad_crc_count": self.bad_crc_count,
            }

    def get_latest_route(self):
        with self._lock:
            age_sec = time.time() - self.route_last_update_ts if self.route_last_update_ts else None
            return {
                "next_turn": self.route_next_turn,
                "distance_m": self.route_distance_m,
                "target_exit": self.route_target_exit,
                "hazard": self.route_hazard,
                "seq": self.route_seq,
                "ttl_ms": self.route_ttl_ms,
                "age_sec": age_sec,
                "connected": self.is_connected,
                "source": self.last_source,
            }

