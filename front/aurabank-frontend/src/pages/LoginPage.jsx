import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import apiClient from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showWebcam, setShowWebcam] = useState(false);
    const navigate = useNavigate();
    
    const videoRef = useRef();
    const canvasRef = useRef();

    // This hook loads the face-api models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
        };
        loadModels();
    }, []);
    
    const startWebcam = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => console.error("Webcam error:", err));
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setMessage('Logging in...');
        try {
            const response = await apiClient.post('/api/login', { username, password });
            if (response.data.status === 'success') {
                localStorage.setItem('user_id', response.data.user_id);
                navigate('/dashboard');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'An error occurred.');
        }
    };

    const handleFaceScanClick = () => {
        if (!username) {
            setMessage('Please enter your username first.');
            return;
        }
        setShowWebcam(true);
        startWebcam();
    };

    const handleVideoPlay = () => {
        const intervalId = setInterval(async () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                
                faceapi.matchDimensions(canvas, displaySize);
                const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                if (detections) {
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                    
                    // Once a face is detected, automatically attempt to log in
                    if (detections.descriptor) {
                        clearInterval(intervalId); // Stop scanning
                        verifyFace(detections.descriptor);
                    }
                }
            }
        }, 500);
    };

    const verifyFace = async (descriptor) => {
        setMessage('Face detected. Verifying...');
        try {
            const descriptorArray = Array.from(descriptor);
            const response = await apiClient.post('/api/login_face', {
                username: username,
                face_descriptor: descriptorArray
            });

            if (response.data.status === 'success') {
                setMessage('Face login successful!');
                localStorage.setItem('user_id', response.data.user_id);
                navigate('/dashboard');
            } else {
                setMessage(response.data.message);
                setShowWebcam(false); // Hide webcam on failure
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'An error occurred.');
            setShowWebcam(false);
        }
    };

    return (
        <div className="form-container">
            <h1>Welcome Back!</h1>
            
            {!showWebcam ? (
                <>
                    <form onSubmit={handlePasswordLogin}>
                        <input type="text" name="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        <input type="password" name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="submit">Login with Password</button>
                    </form>
                    <button onClick={handleFaceScanClick} style={{ marginTop: '1rem' }}>Login with Face</button>
                </>
            ) : (
                <div className="video-container" style={{ position: 'relative', width: '320px', height: '240px', margin: 'auto' }}>
                    <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                </div>
            )}
            
            {message && <p className="message">{message}</p>}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/register" style={{ color: 'white' }}>Don't have an account? Register</Link>
            </div>
        </div>
    );
}

export default LoginPage;