import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs-backend-webgl';

interface CameraCaptureProps {
	onCapture: (imageData: string) => void;
	resolution?: { width: number; height: number };
	autoPlay?: boolean;
	showControls?: boolean;
	showFaceFrame?: boolean;
}

export default function CameraCapture({
	onCapture,
	resolution = { width: 1920, height: 1080 },
	autoPlay = true,
	showControls = true,
	showFaceFrame = true,
}: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayRef = useRef<HTMLCanvasElement | null>(null);
	const [isReady, setIsReady] = useState(false);
	const modelRef = useRef<faceDetection.FaceDetector | null>(null);

	useEffect(() => {
		const startCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: 'user',
						width: { ideal: resolution.width },
						height: { ideal: resolution.height },
					},
					audio: false,
				});

				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error('Failed to access camera:', err);
			}
		};

		startCamera();
	}, [resolution]);

	useEffect(() => {
		const loadModel = async () => {
			await tf.setBackend('webgl');
			await tf.ready();
			modelRef.current = await faceDetection.createDetector(
				faceDetection.SupportedModels.MediaPipeFaceDetector,
				{ runtime: 'tfjs' }
			);
		};

		if (showFaceFrame) loadModel();
	}, [showFaceFrame]);

	useEffect(() => {
		if (!showFaceFrame) return;

		const detectFaces = async () => {
			if (
				!videoRef.current ||
				!overlayRef.current ||
				!modelRef.current ||
				videoRef.current.readyState !== 4
			)
				return;

			const ctx = overlayRef.current.getContext('2d');
			if (!ctx) return;

			const width = videoRef.current.videoWidth;
			const height = videoRef.current.videoHeight;

			overlayRef.current.width = width;
			overlayRef.current.height = height;

			ctx.clearRect(0, 0, width, height);

			const faces = await modelRef.current.estimateFaces(
				videoRef.current
			);

			for (const face of faces) {
				const { xMin, yMin, width, height } = face.box;

				ctx.strokeStyle = 'lime';
				ctx.lineWidth = 3;
				ctx.strokeRect(xMin, yMin, width, height);
			}
		};

		const interval = setInterval(detectFaces, 200);
		return () => clearInterval(interval);
	}, [isReady, showFaceFrame]);

	const handleCapture = () => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
			onCapture(dataUrl);
		}
	};

	return (
		<div className='relative flex flex-col items-center w-full max-w-md aspect-video'>
			<video
				ref={videoRef}
				autoPlay={autoPlay}
				playsInline
				muted
				onLoadedMetadata={() => setIsReady(true)}
				className='w-full h-full object-cover rounded-md shadow bg-gray-500'
			/>

			{showFaceFrame && (
				<canvas
					ref={overlayRef}
					className='absolute top-0 left-0 w-full h-full pointer-events-none'
				/>
			)}

			{showControls && (
				<button
					onClick={handleCapture}
					disabled={!isReady}
					className='mt-3 hover:cursor-pointer bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50'
				>
					{isReady ? 'Capture Photo' : 'Loading Camera...'}
				</button>
			)}

			<canvas ref={canvasRef} className='hidden' />
		</div>
	);
}
