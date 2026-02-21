import cv2
import mediapipe as mp
import sys
import base64
import numpy as np
import json

mp_face = mp.solutions.face_detection
face_detection = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

try:
    image_base64 = sys.stdin.read()

    # decode base64
    image_bytes = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        print(json.dumps({"emotion": "Neutral"}))
        sys.exit(0)

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = face_detection.process(rgb)

    emotion = "Neutral"

    if results.detections:
        emotion = "Engaged"

    print(json.dumps({"emotion": emotion}))

except Exception as e:
    print(json.dumps({"emotion": "Neutral", "error": str(e)}))