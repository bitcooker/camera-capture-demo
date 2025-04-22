const FACE_3D_MODEL_POINTS = [
	{ index: 1, name: 'noseTip', coords: [0.0, 0.0, 0.0] },
	{ index: 152, name: 'chin', coords: [0.0, -63.6, -12.5] },
	{ index: 263, name: 'rightEye', coords: [43.3, 32.7, 26.0] },
	{ index: 33, name: 'leftEye', coords: [-43.3, 32.7, 26.0] },
	{ index: 291, name: 'rightMouth', coords: [28.9, -28.9, 20.0] },
	{ index: 61, name: 'leftMouth', coords: [-28.9, -28.9, 20.0] },
];

export function getFaceOrientation2DTo3D(
	landmarks: { x: number; y: number }[],
	width: number,
	height: number
) {
	const points2D = FACE_3D_MODEL_POINTS.map((pt) => {
		const lm = landmarks[pt.index];
		return [lm.x * width, lm.y * height];
	});

	// const points3D = FACE_3D_MODEL_POINTS.map((pt) => pt.coords);

	const leftEye = points2D[3];
	const rightEye = points2D[2];
	const nose = points2D[0];
	const chin = points2D[1];

	const dx = rightEye[0] - leftEye[0];
	const dy = rightEye[1] - leftEye[1];
	const yaw = (Math.atan2(dy, dx) * 180) / Math.PI;

	const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
	const pitch =
		(Math.atan2(chin[1] - eyeCenterY, chin[0] - nose[0]) * 180) / Math.PI;

	return { yaw, pitch };
}
