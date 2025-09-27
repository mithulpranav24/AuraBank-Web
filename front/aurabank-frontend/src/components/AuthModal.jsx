import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import apiClient from '../api/axios';

function AuthModal({ isOpen, onClose, onSuccess, transferDetails }) {
    const [authMode, setAuthMode] = useState('select'); // 'select', 'password', or 'face'
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const videoRef = useRef();
    const canvasRef = useRef();

    // Reset state when the modal is closed or opened
    useEffect(() => {
        if (isOpen) {
            setAuthMode('select');
            setMessage('Please confirm your identity to send money.');
            setPassword('');
        }
    }, [isOpen]);

    const startWebcam = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(err => setMessage("Webcam error. Please allow permissions."));
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
                    
                    if (detections.descriptor) {
                        clearInterval(intervalId); // Stop scanning
                        setMessage('Face recognized. Authorizing...');
                        performTransfer('face', detections.descriptor);
                    }
                }
            }
        }, 500);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setMessage('Authorizing with password...');
        performTransfer('password', password);
    };

    const performTransfer = async (auth_type, auth_token) => {
        const token = (auth_type === 'face') ? Array.from(auth_token) : auth_token;
        try {
            const response = await apiClient.post('/api/transfer', {
                ...transferDetails,
                auth_type,
                auth_token: token
            });
            if (response.data.status === 'success') {
                onSuccess(response.data); // Call the success handler from the dashboard
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Transaction failed.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Authorize Transaction</h2>
                <p className="message">{message}</p>

                {authMode === 'select' && (
                    <div className="auth-options">
                        <button onClick={() => { setAuthMode('face'); startWebcam(); }}>Authorize with Face</button>
                        <button onClick={() => setAuthMode('password')}>Authorize with Password</button>
                    </div>
                )}

                {authMode === 'face' && (
                     <div style={{ position: 'relative', width: '320px', height: '240px', margin: 'auto' }}>
                        <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
                    </div>
                )}

                {authMode === 'password' && (
                    <form onSubmit={handlePasswordSubmit}>
                        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                        <button type="submit">Confirm Transfer</button>
                    </form>
                )}

                <button onClick={onClose} style={{marginTop: '1rem', backgroundColor: '#555'}}>Cancel</button>
            </div>
        </div>
    );
}

export default AuthModal;