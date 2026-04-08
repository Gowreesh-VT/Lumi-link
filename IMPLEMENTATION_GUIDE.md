# Firefly Implementation Guide

This guide is your single reference to run and demonstrate the prototype.

## 1) Objective

Demonstrate all three outcomes clearly:

1. Real sensor data is coming from Arduino Uno.
2. Firefly ML model is classifying risk (CLEAR/WARNING/DANGER).
3. Evacuation direction is generated from floor-map planning (not random).

---

## 2) Current Architecture (Demo Mode)

1. Arduino Uno reads sensors and sends plain JSON over USB serial.
2. Firefly app reads Uno serial directly.
3. LiFi receiver/transmitter path is bypassed for this demo.
4. EVAC screen shows floor-map route visualization with path lines and markers.

---

## 3) Hardware Setup

1. Keep Uno connected to Mac via USB.
2. Ensure Arduino sketch is uploaded from [Sensors/sensors.ino](Sensors/sensors.ino).
3. Close Arduino Serial Monitor/Plotter before running Firefly.

---

## 4) Start Firefly (Exact Command)

Run from terminal:

```bash
pkill -f "firefly-master/app.*python app.py" || true
cd /Users/gowreeshvt/Documents/GitHub/Light-Fidelity/firefly-master/app
FIREFLY_SENSOR_PORT=/dev/cu.usbserial-1110 /Users/gowreeshvt/Documents/GitHub/Light-Fidelity/.venv/bin/python app.py
```

Expected terminal signal:

```text
[Arduino] Connected to /dev/cu.usbserial-1110 at 115200 baud
```

If your serial path changes, check with:

```bash
ls /dev/tty.*
ls /dev/cu.*
```

Use the matching `/dev/cu.usbserial-...` in `FIREFLY_SENSOR_PORT`.

---

## 5) Live Demo Script (for Presentation)

### Step A: Prove Real Data

1. Open Dashboard.
2. Show smoke/gas/temp/humidity values changing.
3. Trigger sensor condition physically (smoke/gas source).
4. Show corresponding values rise immediately.

What to say:
"These values are live JSON from Arduino over USB serial, not simulator values."

### Step B: Prove ML Model

1. Keep increasing hazard input.
2. Show hazard progression CLEAR -> WARNING -> DANGER.
3. Show EVAC mode auto-activation on DANGER.

What to say:
"Risk state is predicted by the model in Firefly from live sensor values."

### Step C: Prove Floor Map Routing

1. In EVAC mode, show:
	1. Direction arrow
	2. Distance/time
	3. FLOOR MAP ROUTE (DEMO) panel
2. Show route line, YOU marker, EXIT marker.
3. Show that route updates are tied to the map path.

What to say:
"The route is computed from the floor-map planner and visualized as path lines; it is not random fallback."

---

## 6) Multiple Fire-Location Demonstration

To show different fire/location cases deterministically:

1. Stop app.
2. Start with scenario variables:

```bash
FIREFLY_SENSOR_PORT=/dev/cu.usbserial-1110 FIREFLY_START_CELL=10,15 FIREFLY_EXIT_CELL=70,70 /Users/gowreeshvt/Documents/GitHub/Light-Fidelity/.venv/bin/python /Users/gowreeshvt/Documents/GitHub/Light-Fidelity/firefly-master/app/app.py
```

3. Repeat with different `FIREFLY_START_CELL`, for example:
	1. `10,15`
	2. `35,35`
	3. `60,20`

Use this line in viva:
"Same model and map, different start location gives a different deterministic route."

---

## 7) Quick Troubleshooting

### Problem: Sensor Offline

Likely cause: serial port locked by another process.

Fix:

```bash
lsof /dev/cu.usbserial-1110
kill <PID>
```

Then restart Firefly.

### Problem: `No such file or directory` on serial path

1. Re-plug USB.
2. Re-check current path with `ls /dev/cu.*`.
3. Relaunch using updated path.

### Problem: EVAC route not visible

1. Ensure hazard reaches DANGER.
2. Ensure floor map exists at [firefly-master/path_algorithm/floor_map_1.png](firefly-master/path_algorithm/floor_map_1.png).
3. Restart app.

---

## 8) Files Used in Demo

1. Arduino sender: [Sensors/sensors.ino](Sensors/sensors.ino)
2. App entry: [firefly-master/app/app.py](firefly-master/app/app.py)
3. Serial reader: [firefly-master/app/utils/sensor_reader.py](firefly-master/app/utils/sensor_reader.py)
4. EVAC UI: [firefly-master/app/screens/evac_mode.py](firefly-master/app/screens/evac_mode.py)
5. Planner: [firefly-master/path_algorithm/path_calculation.py](firefly-master/path_algorithm/path_calculation.py)
6. Floor map image: [firefly-master/path_algorithm/floor_map_1.png](firefly-master/path_algorithm/floor_map_1.png)