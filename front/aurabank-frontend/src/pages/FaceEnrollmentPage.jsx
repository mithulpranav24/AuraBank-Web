import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import apiClient from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function FaceEnrollmentPage() {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [message, setMessage] = useState('Initializing...');
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const setupFaceAPI = async () => {
            try {
                setMessage('Loading face recognition models...');
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                startWebcam();
            } catch (error) {
                console.error("Error loading models:", error);
                setMessage("Error: Could not load models. Please refresh.");
            }
        };

        setupFaceAPI();
    }, []);

    const startWebcam = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setMessage('Please position your face in the center.');
                }
            })
            .catch(err => {
                console.error("Webcam access error:", err);
                setMessage("Error: Webcam access denied. Please allow permissions.");
            });
    };

    const handleVideoPlay = () => {
        const intervalId = setInterval(async () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                if (detections) {
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    
                    if (detections.descriptor && !faceDescriptor) {
                        setFaceDescriptor(detections.descriptor);
                        setMessage('Face captured! Click Enroll to save.');
                    }
                } else {
                    if (!faceDescriptor) {
                        setMessage('Detecting face...');
                    }
                }
            }
        }, 300);
        return () => clearInterval(intervalId);
    };

    const handleEnroll = async () => {
        if (!faceDescriptor) {
            setMessage('No face captured.');
            return;
        }
        setMessage('Enrolling your face...');
        try {
            const descriptorArray = Array.from(faceDescriptor);
            const response = await apiClient.post('/api/user/enroll_face', { face_descriptor: descriptorArray });

            if (response.data.status === 'success') {
                setMessage(response.data.message);
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setMessage(`Error: ${response.data.message}`);
            }
        } catch (error) {
            setMessage('An error occurred during enrollment.');
            console.error('Enrollment error:', error);
        }
    };

    return (
        <div className="form-container">
            <h1>Face Enrollment</h1>
            <div className="video-container" style={{ position: 'relative', width: '320px', height: '240px', margin: 'auto' }}>
                <video
                    ref={videoRef}
                    onPlay={handleVideoPlay}
                    autoPlay
                    muted
                    playsInline
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
                {/* MODIFIED: Added 'pointerEvents: none' to make the canvas unclickable */}
                <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                />
            </div>
            <p className="message">{message}</p>
            <button onClick={handleEnroll} disabled={!faceDescriptor}>
                Enroll Face
            </button>
            <Link to="/dashboard" style={{color: 'white', marginTop: '1rem', display: 'block'}}>Back to Dashboard</Link>
        </div>
    );
}

export default FaceEnrollmentPage;