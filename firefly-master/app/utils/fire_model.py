# Sai

import joblib
import os
import numpy as np

try:
    import pandas as pd
except ImportError:
    pd = None


class FireDetectionModel:

    def __init__(self):

        base_dir = os.path.dirname(os.path.abspath(__file__))

        model_path = os.path.join(
            base_dir,
            "..",
            "..",
            "Core",
            "fire_detection_model.pkl"
        )

        model_path = os.path.normpath(model_path)

        # Check if model exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")

        print(f"Loading fire model from: {model_path}")

        self.model = joblib.load(model_path)

    def predict(self, smoke, gas, temperature, humidity, shock, motion):
        values = [smoke, gas, temperature, humidity, shock, motion]

        if pd is not None and hasattr(self.model, "feature_names_in_"):
            X = pd.DataFrame([values], columns=list(self.model.feature_names_in_))
        else:
            X = np.array([values])

        pred = self.model.predict(X)[0]

        if pred == 0:
            return "CLEAR"
        elif pred == 1:
            return "WARNING"
        else:
            return "DANGER"