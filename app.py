
import os
import cv2
import torch
import ultralytics
from ultralytics import YOLO
from moviepy.editor import VideoFileClip
from flask import Flask, render_template, request, send_from_directory, jsonify

DEFAULT_MODEL_PATH = 'models/default/best.pt'
current_model_path = DEFAULT_MODEL_PATH

DEFAULT_DEVICE = 'cpu'
current_device = DEFAULT_DEVICE

app = Flask(__name__)
model = None

deviceCount = torch.cuda.device_count() if torch.cuda.is_available() else 0
# if deviceCount > 0:
#     deviceCount += 1

names = {0: 'Abnormal', 1: 'Normal'}
UPLOAD_FOLDER = 'temp-media'
UPLOAD_MODEL = 'models'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

if not os.path.exists(UPLOAD_MODEL):
    os.makedirs(UPLOAD_MODEL)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_MODEL'] = UPLOAD_MODEL


def loadModel(choiceUser=None, modelPath="models/default/best.pt", initModel=False):
    global current_device
    deviceName = "cpu"  # Defaultnya CPU

    if choiceUser is None:
        if torch.cuda.is_available():
            os.environ["CUDA_VISIBLE_DEVICES"] = "0"
            deviceName = "cuda:0"
        else:
            deviceName = "cpu"
    else:
        if choiceUser == "cpu":
            deviceName = "cpu"
        elif torch.cuda.is_available():
            deviceUse = int(choiceUser.split(':')[-1])
            os.environ["CUDA_VISIBLE_DEVICES"] = str(deviceUse)
            deviceName = f"cuda:{deviceUse}"
        else:
            deviceName = "cpu"

    try:
        model = YOLO(modelPath)
        model = model.to(deviceName)
        model.fuse()
        ultralytics.checks(device=deviceName)
        if initModel:
            current_device = deviceName
        return model
    except Exception as e:
        print(f"Failed to load model from {modelPath}: {e}")
        return None


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
    print(f"Current model path: {current_model_path}")
    return render_template('index.html', device_count=deviceCount, device=current_device.upper(), model_path=current_model_path)


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


@app.route('/update_config', methods=['POST'])
def update_config():
    global current_model_path, model, current_device
    data = request.json
    current_device = data.get('device_type', 'cpu')

    print(f"Memuat model {current_model_path} dengan device: {current_device}")
    try:
        model = loadModel(choiceUser=current_device, modelPath=current_model_path)
    except:
        return jsonify({'error': 'Invalid CUDA device index'}), 400

    return jsonify({'message': 'Device updated successfully', 'device': str(current_device)})


@app.route('/upload_model', methods=['POST'])
def upload_model():
    global current_model_path, current_device, model
    if 'model_file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['model_file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        model_path = os.path.join(app.config['UPLOAD_MODEL'], file.filename)
        file.save(model_path)
        uploaded_model = loadModel(choiceUser=current_device, modelPath=model_path)
        if uploaded_model:
            model = uploaded_model
            current_model_path = model_path
            return jsonify({'message': 'Model uploaded and loaded successfully', 'model_path': current_model_path})
        else:
            return jsonify({'error': 'Failed to load uploaded model'}), 400


if __name__ == '__main__':
    model = loadModel(initModel=True)
    app.run(debug=True)
