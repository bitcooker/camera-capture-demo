'use client';

import { useState } from 'react';
import Image from 'next/image';
import CameraCapture from '@/components/CameraCapture';

export default function CameraDemoPage() {
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [width, setWidth] = useState(1920);
	const [height, setHeight] = useState(1080);

	const handleImageCapture = (imageData: string) => {
		setCapturedImage(imageData);
	};

	return (
		<div className='min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center'>
			<h1 className='text-2xl font-bold mb-4'>Camera Capture Demo</h1>

			{!capturedImage && (
				<>
					<div className='flex space-x-4 mb-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Width
							</label>
							<input
								type='number'
								value={width}
								onChange={(e) =>
									setWidth(Number(e.target.value))
								}
								className='px-3 py-2 border rounded shadow-sm w-28'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Height
							</label>
							<input
								type='number'
								value={height}
								onChange={(e) =>
									setHeight(Number(e.target.value))
								}
								className='px-3 py-2 border rounded shadow-sm w-28'
							/>
						</div>
					</div>

					<CameraCapture
						resolution={{ width, height }}
						onCapture={handleImageCapture}
						showFaceFrame={true}
						mirrored={true}
					/>
				</>
			)}

			{capturedImage && (
				<div className='flex flex-col items-center'>
					<Image
						src={capturedImage}
						alt='Captured'
						className='max-w-md rounded shadow'
					/>
					<button
						onClick={() => setCapturedImage(null)}
						className='mt-4 hover:cursor-pointer bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900'
					>
						Retake
					</button>
				</div>
			)}
		</div>
	);
}
