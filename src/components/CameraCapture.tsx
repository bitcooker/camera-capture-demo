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
	mirrored?: boolean;
}

export default function CameraCapture({
	onCapture,
	resolution = { width: 1920, height: 1080 },
	autoPlay = true,
	showControls = true,
	showFaceFrame = true,
	mirrored = false,
}: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayRef = useRef<HTMLCanvasElement | null>(null);
	const modelRef = useRef<faceDetection.FaceDetector | null>(null);

	const [isCentered, setIsCentered] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [modelLoaded, setModelLoaded] = useState(false);
	const [adjustLight, setAdjustLight] = useState(false);
	const [brightness, setBrightness] = useState(100);

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
				{
					runtime: 'mediapipe',
					solutionPath:
						'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
					modelType: 'short',
					maxFaces: 1,
				}
			);
			setModelLoaded(true);
		};

		if (showFaceFrame) loadModel();
	}, [showFaceFrame]);

	useEffect(() => {
		if (!showFaceFrame || !modelLoaded) return;

		let frameId: number;

		const detectFaces = async () => {
			const video = videoRef.current;
			const canvas = overlayRef.current;
			const model = modelRef.current;

			if (
				!video ||
				!canvas ||
				!model ||
				video.videoWidth === 0 ||
				video.videoHeight === 0 ||
				video.readyState < 2
			) {
				frameId = requestAnimationFrame(detectFaces);
				return;
			}

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const centerZone = {
				xMin: canvas.width * 0.4,
				xMax: canvas.width * 0.6,
				yMin: canvas.height * 0.4,
				yMax: canvas.height * 0.6,
			};

			ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
			ctx.lineWidth = 1.5;
			ctx.strokeRect(
				centerZone.xMin,
				centerZone.yMin,
				centerZone.xMax - centerZone.xMin,
				centerZone.yMax - centerZone.yMin
			);

			const faces = await model.estimateFaces(video);
			let centered = false;

			for (const face of faces) {
				const { xMin, yMin, width, height } = face.box;

				const faceCenterX = xMin + width / 2;
				const faceCenterY = yMin + height / 2;

				centered =
					faceCenterX >= centerZone.xMin &&
					faceCenterX <= centerZone.xMax &&
					faceCenterY >= centerZone.yMin &&
					faceCenterY <= centerZone.yMax;

				ctx.save();
				if (mirrored) {
					ctx.translate(canvas.width, 0);
					ctx.scale(-1, 1);
				}
				ctx.strokeStyle = centered ? 'lime' : 'white';
				ctx.lineWidth = 3;
				ctx.strokeRect(xMin, yMin, width, height);
				ctx.restore();
			}

			setIsCentered(centered);
			frameId = requestAnimationFrame(detectFaces);
		};

		frameId = requestAnimationFrame(detectFaces);
		return () => cancelAnimationFrame(frameId);
	}, [modelLoaded, showFaceFrame, mirrored]);

	const handleCapture = () => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			if (mirrored) {
				ctx.translate(canvas.width, 0);
				ctx.scale(-1, 1);
			}
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
				className={`w-full h-full object-cover rounded-md shadow bg-gray-500 ${
					mirrored ? 'transform scale-x-[-1]' : ''
				}`}
				style={{
					filter: `brightness(${brightness}%)`,
				}}
			/>

			{showFaceFrame && (
				<canvas
					ref={overlayRef}
					className='absolute top-0 left-0 w-full h-full pointer-events-none'
				/>
			)}

			{showFaceFrame && (
				<p className={`mt-2 text-sm font-medium text-gray-500`}>
					{isCentered
						? 'Ready to capture!'
						: 'Please center your face...'}
				</p>
			)}

			<div className='mt-3 w-full flex flex-col items-center'>
				<label className='flex items-center space-x-2 text-sm text-gray-700'>
					<input
						type='checkbox'
						checked={adjustLight}
						onChange={(e) => setAdjustLight(e.target.checked)}
						className='accent-blue-600'
					/>
					<span>Adjust brightness</span>
				</label>

				{adjustLight && (
					<input
						type='range'
						min='50'
						max='200'
						value={brightness}
						onChange={(e) => setBrightness(Number(e.target.value))}
						className='w-full mt-2'
					/>
				)}
			</div>

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
