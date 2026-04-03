<img width="1500" height="270" alt="image" src="https://github.com/user-attachments/assets/c6c7eaec-b358-4890-8a18-c5af1af80e7d" />

---

Firefly — Advanced Disaster Detection & Evacuation System

Firefly is designed to detect emergencies in real time, navigate people to safe exits, manage crowd flow, and assist emergency services during disasters.

---

## Overview

Firefly provides a unified solution for emergency management, integrating:
	•	Real-time hazard detection via IoT sensors
	•	Intelligent evacuation routing
	•	Crowd management and congestion reduction
	•	Integration with emergency services for faster response

This system ensures faster, safer evacuations, reduces human error during crises, and empowers responders with actionable insights.

---

## Problem Statement

Traditional emergency systems face challenges:
	•	Delayed hazard detection
	•	Inefficient evacuation routing leading to congestion
	•	Lack of real-time data for emergency responders
	•	Inadequate notifications to affected individuals

Firefly addresses these challenges by delivering a proactive, automated, and intelligent disaster management platform.

---
## Mind-Map

<img width="1441" height="1023" alt="image" src="https://github.com/user-attachments/assets/f5cf0c39-8dcf-4bce-b0ad-141b029d3298" />
---


## Key Use Cases

Use Case	Description
Building Evacuations	Calculates and displays optimal exit routes during emergencies.
Public Spaces	Manages crowd flow in large venues, airports, and stations.
Multi-Hazard Detection	Detects earthquakes, floods, fires, gas/chemical leaks, and security threats.
Emergency Response	Provides responders with real-time location and hazard data.


---
Features
	•	Real-Time Emergency Detection — Continuous monitoring using IoT sensors.
	•	Optimal Evacuation Routing — Calculates nearest safe exits dynamically.
	•	Crowd Management — Prevents congestion during mass evacuations.
	•	Emergency Service Integration — Provides live situational data to first responders.
	•	Alerts & Notifications — Push notifications, SMS alerts, and dashboard updates.

---

## Architecture

High-Level Flow:

[IoT Sensors] → [Local Processing Node] → [Cloud Analytics & Routing] → [Dashboards / User Devices / Emergency Services]

Components:
	1.	IoT Sensors – Detect environmental hazards (fire, smoke, gas, motion).
	2.	Local Node – Aggregates sensor data, performs preliminary analysis.
	3.	Cloud Backend – Executes predictive analytics, pathfinding, and alert distribution.
	4.	Dashboards / Devices – Displays evacuation paths, hazard status, and notifications.

Suggested Diagram:


---

## Technology Stack
	•	Hardware: IoT sensors, Raspberry Pi, Arduino
	•	Backend: Python, Node.js
	•	Frontend: React / React Native
	•	Database: PostgreSQL / MongoDB
	•	Routing Algorithms: A*, Dijkstra
	•	Integration: REST APIs, SMS / Push notifications
	•	Deployment: Docker, Kubernetes

---

## Getting Started

Prerequisites
	•	Python 3.11+
	•	Node.js 18+
	•	Docker (optional)
	•	Connected IoT sensors

Installation
```bash
git clone https://github.com/Sai-Deepan/firefly
cd firefly
```
Backend Setup:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Frontend Setup:
```bash
cd frontend
npm install
npm start
```
Connecting Sensors: Connect your IoT sensors to the backend to enable real-time hazard detection. The system automatically calculates evacuation routes and notifies users and responders.

---

Usage Example

from firefly import EvacuationSystem

# Initialize system
system = EvacuationSystem(sensor_config="config.json")

# Start monitoring hazards
system.start_monitoring()

# Get optimal route for a location
route = system.calculate_route(current_location="Room 101")
print("Evacuation route:", route)


---

Visual Guides

Evacuation Flow Example:

Sensor detects hazard → Backend computes optimal exit → Dashboard displays routes → Notifications sent → Emergency services updated

Crowd Management Illustration:
	•	Routes dynamically adjust to prevent congestion
	•	Emergency services receive live updates

---

## Contribution

We welcome contributions to improve Firefly:
	
	1.	Fork the repository
	2.	Create a branch: git checkout -b feature-name
	3.	Commit: git commit -m "Add feature"
	4.	Push: git push origin feature-name
	5.	Open a Pull Request

---

## License

Firefly is an officially licensed product. See LICENSE for details.

---

Firefly — enabling safer, faster evacuations, and saving lives.
