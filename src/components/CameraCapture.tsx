import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
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
	const cameraRef = useRef<Camera | null>(null);

	const [isReady, setIsReady] = useState(false);
	const [adjustLight, setAdjustLight] = useState(false);
	const [brightness, setBrightness] = useState(100);
	const [poseGuidance, setPoseGuidance] = useState('Loading...');

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
		if (!showFaceFrame || !videoRef.current || !overlayRef.current) return;

		const faceMesh = new FaceMesh({
			locateFile: (file) =>
				`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
		});

		faceMesh.setOptions({
			maxNumFaces: 1,
			refineLandmarks: true,
			minDetectionConfidence: 0.5,
			minTrackingConfidence: 0.5,
		});

		faceMesh.onResults((results) => {
			const canvas = overlayRef.current!;
			const ctx = canvas.getContext('2d')!;
			const video = videoRef.current!;
			const width = video.videoWidth;
			const height = video.videoHeight;

			canvas.width = width;
			canvas.height = height;
			ctx.clearRect(0, 0, width, height);

			if (
				!results.multiFaceLandmarks ||
				results.multiFaceLandmarks.length === 0
			) {
				setPoseGuidance('No face detected');
				return;
			}

			const face = results.multiFaceLandmarks[0];
			const leftEye = face[33];
			const rightEye = face[263];
			const chin = face[152];
			const forehead = face[10];

			const xValues = face.map((p) => p.x);
			const yValues = face.map((p) => p.y);
			const faceCenterX =
				(Math.min(...xValues) + Math.max(...xValues)) / 2;
			const faceCenterY =
				(Math.min(...yValues) + Math.max(...yValues)) / 2;

			const centerOffsetX = faceCenterX - 0.5;
			const centerOffsetY = faceCenterY - 0.5;

			// yaw
			const dx = rightEye.x - leftEye.x;
			const dy = rightEye.y - leftEye.y;
			const yaw = Math.atan2(dy, dx) * (180 / Math.PI);

			// tilt detection
			const avgEyeY = (leftEye.y + rightEye.y) / 2;
			const topLength = avgEyeY - forehead.y;
			const bottomLength = chin.y - avgEyeY;
			const tiltRatio = topLength / bottomLength;

			let goodPitch = true;
			let tiltMessage = '';

			if (tiltRatio > 0.75) {
				tiltMessage = 'Tilt face down';
				goodPitch = false;
			} else if (tiltRatio < 0.55) {
				tiltMessage = 'Tilt face up';
				goodPitch = false;
			}

			const yawTolerance = 7;
			const centerTolerance = 0.12;
			const faceSpan = chin.y - avgEyeY;
			const minSpan = 0.32;
			const maxSpan = 0.42;

			let message = '';
			const goodYaw = Math.abs(yaw) < yawTolerance;
			const goodCenter =
				Math.abs(centerOffsetX) < centerTolerance &&
				Math.abs(centerOffsetY) < centerTolerance;

			if (faceSpan < minSpan) {
				message = 'Move closer — face too small';
			} else if (faceSpan > maxSpan) {
				message = 'Move slightly back — too close';
			} else if (!goodCenter) {
				if (centerOffsetX < -centerTolerance)
					message = 'Move face right';
				else if (centerOffsetX > centerTolerance)
					message = 'Move face left';
				else if (centerOffsetY < -centerTolerance)
					message = 'Move face down';
				else if (centerOffsetY > centerTolerance)
					message = 'Move face up';
				else message = 'Center your face';
			} else if (!goodYaw) {
				message = yaw < 0 ? 'Turn face right' : 'Turn face left';
			} else if (!goodPitch) {
				message = tiltMessage;
			} else {
				message = 'Perfect! Hold still';
			}

			setPoseGuidance(message);

			const outlineIndices = [
				10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397,
				365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58,
				132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
			];

			ctx.beginPath();
			for (let i = 0; i < outlineIndices.length; i++) {
				const point = face[outlineIndices[i]];
				const x = point.x * width;
				const y = point.y * height;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.strokeStyle = message.includes('Perfect') ? 'lime' : 'white';
			ctx.lineWidth = 2;
			ctx.stroke();
		});

		cameraRef.current = new Camera(videoRef.current, {
			onFrame: async () => {
				await faceMesh.send({ image: videoRef.current! });
			},
			width: resolution.width,
			height: resolution.height,
		});
		cameraRef.current.start();

		return () => {
			cameraRef.current?.stop();
		};
	}, [showFaceFrame, resolution]);

	const handleCapture = () => {
		if (!videoRef.current || !canvasRef.current) return;
		const video = videoRef.current;
		const canvas = canvasRef.current;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (mirrored) {
			ctx.translate(canvas.width, 0);
			ctx.scale(-1, 1);
		}

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		if (adjustLight) {
			const imageData = ctx.getImageData(
				0,
				0,
				canvas.width,
				canvas.height
			);
			const data = imageData.data;
			const brightnessFactor = brightness / 100;

			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.min(255, data[i] * brightnessFactor);
				data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
				data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
			}

			ctx.putImageData(imageData, 0, 0);
		}

		const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
		onCapture(dataUrl);
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
				<p
					className={`mt-2 text-sm font-medium ${
						poseGuidance.includes('Perfect')
							? 'text-green-600'
							: 'text-yellow-500'
					}`}
				>
					{poseGuidance}
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
