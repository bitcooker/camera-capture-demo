import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
	onCapture: (imageData: string) => void;
	resolution?: { width: number; height: number };
	autoPlay?: boolean;
	showControls?: boolean;
}

export default function CameraCapture({
	onCapture,
	resolution = { width: 1920, height: 1080 },
	autoPlay = true,
	showControls = true,
}: CameraCaptureProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isReady, setIsReady] = useState(false);

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
		<div className='flex flex-col items-center'>
			<video
				ref={videoRef}
				autoPlay={autoPlay}
				playsInline
				muted
				onLoadedMetadata={() => setIsReady(true)}
				className='w-full max-w-md aspect-video rounded-md bg-gray-500'
			/>

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
