import React, { useRef, useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./cropUtils";
import { Upload, Camera } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
window.tf = tf;

function App() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [modelA, setModelA] = useState(null);
  const [modelB, setModelB] = useState(null);
  const [selectedModel, setSelectedModel] = useState("A");
  const [classLabels, setClassLabels] = useState([]);

  useEffect(() => {
    tf.loadGraphModel("/modelA/model.json").then(setModelA);
    tf.loadGraphModel("/modelB/model.json").then(setModelB);
  }, []);

  useEffect(() => {
    fetch("/class_names.json")
      .then((res) => res.json())
      .then(setClassLabels)
      .catch(() => setClassLabels([]));
  }, []);

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setPreview(url);
  };

  const onCropComplete = (_, pixelCrop) => {
    setCroppedAreaPixels(pixelCrop);
  };

  const confirmCrop = async () => {
    const blob = await getCroppedImg(src, croppedAreaPixels);
    const previewUrl = URL.createObjectURL(blob);
    setCroppedBlob(blob);
    setPreview(previewUrl);
    setSrc(null);
  };

  const preprocessInput = (img) => {
    const base = tf.browser
      .fromPixels(img)
      .resizeBilinear([224, 224])
      .toFloat();

    if (selectedModel === "B") {
      // ResNet50 (Model B): BGR with mean subtraction
      return base.reverse(-1).sub([103.939, 116.779, 123.68]).expandDims(0);
    } else {
      // MobileNetV2 (Model A): normalize to [0, 1]
      return base.div(255.0).expandDims(0);
    }
  };

  const handleUpload = async () => {
    const imageToUpload = croppedBlob || fileInputRef.current.files[0];
    if (!imageToUpload) return;

    const model = selectedModel === "A" ? modelA : modelB;
    if (!model) return;

    setLoading(true);
    setResult(null);

    const img = await blobToImage(imageToUpload);

    const tensor = preprocessInput(img);

    try {
      const predictionsTensor = await model.executeAsync(tensor);
      const output = Array.isArray(predictionsTensor)
        ? predictionsTensor[0]
        : predictionsTensor;

      const predictions = output.dataSync();

      const topIndex = predictions.indexOf(Math.max(...predictions));
      const confidence = predictions[topIndex];

      if (confidence < 0.5) {
        setResult({ id: "Not recognized", confidence });
      } else {
        const label = classLabels[topIndex] || `Class ${topIndex}`;
        setResult({ id: label, confidence });
      }

      output.dispose();
      tensor.dispose();
    } catch (err) {
      setResult({ error: "Prediction failed" });
      console.error(err);
    }

    setLoading(false);
  };

  const triggerFile = () => fileInputRef.current.click();

  const startCamera = async () => {
    setCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setSrc(url);
      setPreview(url);
      setCroppedBlob(null);
      setCameraOpen(false);
      video.srcObject.getTracks().forEach((track) => track.stop());
    }, "image/jpeg");
  };

  const cancelCamera = () => {
    setCameraOpen(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const blobToImage = (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 flex items-center justify-center px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="bg-white/60 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-semibold text-zinc-900 text-center mb-6">
          🐄 Cattle Identifier
        </h1>

        <div className="mb-6">
          <label
            htmlFor="model-select"
            className="block text-sm font-semibold text-zinc-800 mb-2"
          >
            🧠 Choose Model
          </label>
          <div className="relative">
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full appearance-none px-4 py-2 pr-10 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            >
              <option value="A">MobileNetV2</option>
              <option value="B">ResNet50</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">

          <button
            onClick={triggerFile}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 rounded-full"
          >
            <Upload className="w-4 h-4" /> <span>Upload File</span>
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 rounded-full"
          >
            <Camera className="w-4 h-4" /> <span>Use Camera</span>
          </button>
        </div>

        {cameraOpen && (
          <div className="mb-4">
            <video ref={videoRef} className="w-full rounded-xl mb-2" />
            <div className="flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Capture
              </button>
              <button
                onClick={cancelCamera}
                className="px-4 py-2 bg-zinc-300 rounded-xl hover:bg-zinc-400"
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {src && (
          <>
            <div className="relative w-full h-64 mb-4 bg-zinc-100 rounded-xl overflow-hidden">
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={9 / 16}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={confirmCrop}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95"
              >
                Crop
              </button>
              <button
                onClick={() => {
                  setSrc(null);
                  setPreview(null);
                  setCroppedBlob(null);
                }}
                className="px-4 py-2 bg-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-400 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {preview && !src && (
          <img
            src={preview}
            alt="preview"
            className="w-full h-64 object-contain rounded-xl border border-zinc-200 shadow-inner mb-4 bg-zinc-100"
          />
        )}

        <button
          onClick={handleUpload}
          disabled={!preview || loading}
          className={`w-full py-3 rounded-xl text-white font-medium transition ${
            loading
              ? "bg-zinc-400"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }`}
        >
          {loading ? "Identifying..." : "Upload & Identify"}
        </button>

        {result && (
          <div className="mt-6 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-inner">
            <p className="text-sm text-zinc-600 mb-1">Prediction</p>
            {result.error ? (
              <p className="text-red-600 font-semibold">{result.error}</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-zinc-900">
                  ID: {result.id}
                </p>
                <p className="text-sm text-zinc-700">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
