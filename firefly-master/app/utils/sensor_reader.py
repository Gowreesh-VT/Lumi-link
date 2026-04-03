import threading
import json
import time

try:
    import serial
except ImportError:
    serial = None


class ArduinoSensorReader:
    """Reads JSON data from an Arduino over Serial in a background thread."""

    def __init__(self, port="COM11", baudrate=9600):
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
        
        # Threat thresholds
        self.smoke_threshold = 700
        self.gas_threshold = 400

        # Callbacks if a threat is detected
        self.on_fire_alert = None
        self.on_gas_alert = None
        self.on_shock_alert = None
        
        self._lock = threading.Lock()

    def start(self):
        self.is_running = True
        t = threading.Thread(target=self._run_loop, daemon=True)
        t.start()

    def stop(self):
        self.is_running = False
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()

    def _run_loop(self):
        # Attempt to open serial connection
        if serial is None:
            print("[Arduino] pyserial is not installed. Run: pip install pyserial")
            self.is_connected = False
            return

        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            print(f"[Arduino] Connected to {self.port} at {self.baudrate} baud")
            self.is_connected = True
        except Exception as e:
            print(f"[Arduino] Failed to connect to {self.port}: {e}")
            self.is_connected = False
            return

        while self.is_running:
            try:
                if self.serial_conn.in_waiting > 0:
                    # Read line and decode
                    line = self.serial_conn.readline().decode('utf-8').strip()
                    if line:
                        self._parse_json(line)
            except Exception as e:
                # Connection might have dropped
                if self.is_connected:
                    print(f"[Arduino] Error reading serial or dropped connection: {e}")
                self.is_connected = False
            
            # Small delay to prevent tight loop if no data
            time.sleep(0.1)

    def _parse_json(self, json_str):
        try:
            data = json.loads(json_str)
            with self._lock:
                self.smoke_value = data.get("smoke", self.smoke_value)
                self.gas_value = data.get("gas", self.gas_value)
                self.temperature = data.get("temperature", self.temperature)
                self.humidity = data.get("humidity", self.humidity)
                self.shock_state = data.get("shock", self.shock_state)
                self.motion_state = data.get("motion", self.motion_state)

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

    def get_latest_data(self):
        with self._lock:
            return {
                "smoke": self.smoke_value,
                "gas": self.gas_value,
                "temperature": self.temperature,
                "humidity": self.humidity,
                "shock": self.shock_state,
                "motion": self.motion_state,
                "connected": self.is_connected
            }

