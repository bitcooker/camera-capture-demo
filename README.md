# Simple CameraCapture Component Demo

A demo app for a simple React component that lets you capture high-quality photos from the front camera using the browser's Camera API.

---

## Features

-   Uses front-facing camera (`facingMode: user`)
-   Control resolution via props
-   Captures from `<video>` to `<canvas>` for full quality
-   Outputs base64 image via `onCapture` callback
-   Real-time face detection box
-   Detects if face is **centered in frame**
-   Optional mirror preview
-   Light adjustment
-   Face guidance (center, distance, yaw, tilt)

---

## Usage

1. **Import the component**

```tsx
import CameraCapture from '@/components/CameraCapture';
```

2. **Use it inside your page**

```tsx
<CameraCapture
	resolution={{ width: 1920, height: 1080 }}
	onCapture={(imageBase64) => {
		console.log('Captured image:', imageBase64);
		// Upload, preview, or process the image
	}}
/>
```

---

## Props

| Prop            | Type                                | Description                                       |
| --------------- | ----------------------------------- | ------------------------------------------------- |
| `onCapture`     | `(dataUrl: string) => void`         | **Required.** Called with base64 image on capture |
| `resolution`    | `{ width: number; height: number }` | Optional. Ideal camera resolution                 |
| `autoPlay`      | `boolean`                           | Optional. Defaults to `true`                      |
| `showControls`  | `boolean`                           | Optional. Show/hide the default capture button    |
| `showFaceFrame` | `boolean`                           | Optional. Show real-time face detection overlay   |
| `mirrored`      | `boolean`                           | Optional. Mirror the video feed and face box      |

---

## Preview

https://camera-capture-demo.vercel.app/

---

## Notes

-   Uses `getUserMedia()` under the hood with ideal resolution hints
-   Supports both mobile and desktop, but results depend on device camera quality
-   You can use `canvas.toBlob()` instead if you need binary file uploads
-   Face detection via @tensorflow-models/face-detection + MediaPipe

---

Made by [BitCookr](https://github.com/bitcooker)
