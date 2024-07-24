import os
import cv2
import torch
import ultralytics
from ultralytics import YOLO
from moviepy.editor import VideoFileClip
from flask import Flask, render_template, request, send_from_directory, jsonify

app = Flask(__name__)
model = None

# def loadModel(pilihanUser):
#     global model
#     deviceName = "cpu"
#     if pilihanUser is None:
#         if torch.cuda.is_available():
#             os.environ["CUDA_VISIBLE_DEVICES"] = "0"
#             print("Prediksi Menggunakan CUDA!")
#             deviceName = "0"
#         else:
#             print("Prediksi Menggunakan CPU!")
#         model = YOLO(r"models\default\best.pt")
#     else:
#         print(f"Prediksi Menggunakan CUDA: {pilihanUser}")
#         os.environ["CUDA_VISIBLE_DEVICES"] = str(pilihanUser)
#         model = YOLO(r"models\default\best.pt")
#         deviceName = str(pilihanUser)
#     model.fuse()
#     ultralytics.checks(device=deviceName)

def loadModel(choiceUser=None, modelPath="models/default/best.pt"):
    """
    Loads a YOLO model using the specified device and model path.

    Parameters:
        choiceUser (str, optional): The user's choice of GPU. Use None for automatic selection.
        modelPath (str): The path to the model file (.pt format).
    """
    global model
    deviceName = "cpu"  # Default to CPU

    # Check for user choice or automatic device selection
    if choiceUser is None:
        if torch.cuda.is_available():
            os.environ["CUDA_VISIBLE_DEVICES"] = "0"
            print("Prediction Using CUDA!")
            deviceName = "0"
        else:
            print("Prediction Using CPU!")
    else:
        print(f"Prediction Using CUDA: {choiceUser}")
        os.environ["CUDA_VISIBLE_DEVICES"] = str(choiceUser)
        deviceName = str(choiceUser)

    # Load the model with the specified path
    try:
        model = YOLO(modelPath)
        print(f"Model loaded successfully from {modelPath}")
    except Exception as e:
        print(f"Failed to load model from {modelPath}: {e}")
        return

    # Perform additional model setup
    model.fuse()  # Optimize model for inference
    ultralytics.checks(device=deviceName)  # Check device compatibility

    # Output model details
    print(f"Using device: {deviceName}")
    print(f"Model path: {modelPath}")
    print(f"Model input: {modelPath.split('/')[-1]}")





names = {0: 'Abnormal', 1: 'Normal'}
UPLOAD_FOLDER = 'temp-media'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def imageORvideo(path):
    if path.endswith('.jpg') or path.endswith('.png'):
        return 'image'
    elif path.endswith('.mp4') or path.endswith('.avi'):
        return 'video'
    else:
        return 'error'


def processVideo(path):
    prediction = ''
    abnormal, normal = 0, 0

    namaFile = os.path.basename(path)
    print(f"\nSedang Memproses {namaFile}")
    cap = cv2.VideoCapture(path)
    totalFrames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    processedFrame = 4

    while (True):
        ret, frame = cap.read()
        if not ret:
            break

        processedFrame += 1
        print(f"\r{processedFrame}/{totalFrames} Frames", end='')

        results = model(frame, verbose=False, save=False)
        if names[results[0].probs.top1] == 'Normal':
            normal += 1
        else:
            abnormal += 1
    cap.release()

    if normal > abnormal:
        prediction = 'Normal'
    else:
        prediction = 'Abnormal'

    outPath = f"temp-media/{'.'.join(namaFile.split('.')[:-1])}.mp4"
    clip = VideoFileClip(path)
    clip.write_videofile(outPath, codec="libx264", audio_codec="aac")

    return prediction, abnormal, normal, outPath


def processImage(path):
    namaFile = os.path.basename(path)
    print(f"\nSedang Memproses {namaFile}", end='')
    frame = cv2.imread(path)
    results = model(frame, verbose=False, save=False)

    return results[0].probs.top1, results[0].probs.data.cpu().numpy()


def get_prediction(paths):
    hasilPrediksi = {"video": {}, "image": {}}

    for path in paths:
        if imageORvideo(path) == 'image':
            prediction, probs = processImage(path)
            hasilPrediksi["image"][path] = {
                "prediction": names[prediction], "probability": f"{probs[prediction]*100:.2f}", "abnormal": probs[0], "normal": probs[1]}
        elif imageORvideo(path) == 'video':
            prediction, abnormal, normal, outpath = processVideo(path)
            hasilPrediksi["video"][path] = {
                "prediction": prediction, "abnormal": abnormal, "normal": normal, "pathVid": outpath}

    return hasilPrediksi


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'})

    files = request.files.getlist('files')
    paths = []
    for file in files:
        if file.filename == '':
            continue
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        paths.append(file_path)

    print(f"Files {paths} berhasil diupload")
    results = get_prediction(paths)
    return render_template('result.html', results=results)


@app.route('/list-files')
def list_files():
    files = os.listdir(UPLOAD_FOLDER)
    file_data = []
    for file in files:
        file_data.append({
            'name': file,
            'url': f'/temp-media/{file}',
            'type': 'image' if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')) else 'video'
        })
    return jsonify(file_data)


@app.route('/temp-media/<filename>')
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route('/delete-files', methods=['POST'])
def delete_files():
    data = request.get_json()
    filenames = data.get('filenames', [])
    success = True

    for filename in filenames:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        print(f"Deleting file {file_path}")
        if os.path.exists(file_path):
            try:
                if imageORvideo(file_path) == 'image':
                    os.remove(file_path)
                elif imageORvideo(file_path) == 'video':
                    os.remove(file_path)
                    os.remove(
                        f"temp-media/{'.'.join(filename.split('.')[:-1])}.mp4")
            except Exception as e:
                print(f"Error deleting file {filename}: {e}")
                success = False

    return jsonify({'success': success})


if __name__ == '__main__':
    loadModel(0)
    app.run(debug=True)
