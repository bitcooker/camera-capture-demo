'use client';

import { useState } from 'react';

export default function CameraUploadPage() {
	const [imageSrc, setImageSrc] = useState<string | null>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImageSrc(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className='min-h-screen flex flex-col items-center justify-center p-4'>
			<h1 className='text-2xl font-bold mb-6'>Take a Photo</h1>

			<label className='bg-blue-600 text-white px-6 py-3 rounded-xl cursor-pointer hover:bg-blue-700 transition'>
				Take a Photo
				<input
					type='file'
					accept='image/*'
					capture='user'
					onChange={handleFileChange}
					className='hidden'
				/>
			</label>

			{imageSrc && (
				<div className='mt-6'>
					<p className='mb-2 text-gray-600'>Preview:</p>
					<img
						src={imageSrc}
						alt='Captured'
						className='rounded shadow-lg max-w-xs max-h-96'
					/>
				</div>
			)}
		</div>
	);
}
