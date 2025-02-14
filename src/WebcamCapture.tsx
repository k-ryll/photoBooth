import { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";

const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [images, setImages] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState(1);

  // Countdown before capturing
  const startCountdown = () => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capture();
      }
    }, 1000);
  };

  // Capture & Flip Image
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (!video) return;

      // Create a canvas to process the flipped image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match webcam video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Flip the image by scaling negatively on X-axis
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas image to data URL
      const flippedImage = canvas.toDataURL("image/jpeg");

      // Save to state
      setImages((prevImages) => {
        const updatedImages = [...prevImages];
        updatedImages[imageCount - 1] = flippedImage;
        return updatedImages;
      });

      // Cycle between 1 → 2 → 3 → back to 1
      setImageCount((prev) => (prev < 3 ? prev + 1 : 1));
    }
  }, [imageCount]);

  // Flip only the live webcam view
  const flipLiveView = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <span>{imageCount}/3</span>

      {/* Webcam Preview */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={400}
        videoConstraints={{ facingMode: "user" }}
        style={{ transform: flipped ? "scaleX(-1)" : "none" }}
      />

      {/* Countdown Display */}
      {countdown !== null && <h2 style={{ fontSize: "2rem" }}>{countdown}</h2>}

      {/* Buttons */}
      <button onClick={flipLiveView}>Flip Live View</button>
      <button onClick={startCountdown} disabled={countdown !== null}>
        {countdown !== null ? `Taking photo...` : `Capture Photo`}
      </button>

      {/* Display Captured Images */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Captured ${index + 1}`}
            style={{
              border: "2px solid #000",
              borderRadius: "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WebcamCapture;
