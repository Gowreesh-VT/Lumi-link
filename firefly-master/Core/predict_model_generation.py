import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib


# ----------------------------
# Load dataset
# ----------------------------

df = pd.read_csv("../Dataset/fire_detection_dataset_10000.csv")

# ----------------------------
# Create labels if missing
# ----------------------------

def label_status(row):

    smoke = row["smoke"]
    gas = row["gas"]
    temp = row["temperature"]

    # Danger condition
    if smoke > 800 or gas > 350 or temp > 60:
        return 2

    # Warning condition
    elif smoke > 650 or gas > 300 or temp > 45:
        return 1

    # Clear
    else:
        return 0


# If dataset does not contain proper labels
df["status"] = df.apply(label_status, axis=1)


# ----------------------------
# Features and Target
# ----------------------------

X = df[[
    "smoke",
    "gas",
    "temperature",
    "humidity",
    "shock",
    "motion"
]]

y = df["status"]


# ----------------------------
# Train Test Split
# ----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ----------------------------
# Train Model (Leakage Test)
# ----------------------------

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42
)

# shuffle only training labels
y_train_shuffled = np.random.permutation(y_train)

model.fit(X_train, y_train_shuffled)

# ----------------------------
# Evaluation
# ----------------------------

predictions = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, predictions))

print("\nClassification Report:\n")
print(classification_report(y_test, predictions))


# ----------------------------
# Save Model
# ----------------------------

joblib.dump(model, "fire_detection_model.pkl")

print("\nModel saved as fire_detection_model.pkl")