import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from "uuid";

const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [images, setImages] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("normal"); // "normal" or "framed"

  // Function to start automatic capture (3 pics, 5 seconds apart)
  const startAutoCapture = () => {
    if (capturing) return;
    setImages([]); // Clear previous photos
    setCapturing(true);
    captureWithDelay(3, 5);
  };

  // Recursive function to capture images with a delay
  const captureWithDelay = (count: number, delay: number) => {
    if (count === 0) {
      setCapturing(false);
      return;
    }

    setCountdown(delay);
    let timer = delay;

    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);

      if (timer === 0) {
        clearInterval(interval);
        setCountdown(null);
        capture();
        captureWithDelay(count - 1, delay);
      }
    }, 1000);
  };

  // Capture & Flip Image
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (!video) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const flippedImage = canvas.toDataURL("image/jpeg");

      setImages((prevImages) => {
        const updatedImages = [...prevImages, flippedImage];
        return updatedImages.length > 3 ? updatedImages.slice(-3) : updatedImages;
      });
    }
  }, []);

  // Normal mergeImages (without extra overlay)
  const mergeImages = () => {
    if (images.length < 3) return;

    const imgElements = images.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    Promise.all(imgElements.map((img) => new Promise((res) => (img.onload = res)))).then(() => {
      const imgWidth = imgElements[0].width;
      const imgHeight = imgElements[0].height;
      const spacing = 20; // Space between images
      const borderWidth = 10; // Border thickness
      const footerHeight = 80; // Space for footer text
      const headerHeight = 40;
      const captionHeight = 50;
      const width = imgWidth + borderWidth * 6;
      const height =
        headerHeight +
        captionHeight +
        imgHeight * 3 +
        spacing * 2 +
        footerHeight +
        borderWidth * 2;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background color
      ctx.fillStyle = "#FFC0CB";
      ctx.fillRect(0, 0, width, height);

      // Header
      ctx.fillStyle = "#FFC0CB"; // Header background color
      ctx.fillRect(0, 0, width, headerHeight);

      // Optional border
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = "#FFC0CB";
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

      // Draw images centered horizontally
      imgElements.forEach((img, index) => {
        const x = (width - imgWidth) / 2;
        const y = headerHeight + index * (imgHeight + spacing);
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      });

      // Caption area
      ctx.fillStyle = "#FFC0CB";
      ctx.fillRect(0, height - footerHeight - captionHeight, width, captionHeight);
      ctx.fillStyle = "#000";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(caption, width / 2, height - footerHeight - 15);

      // Footer text
      ctx.fillStyle = "#FFC0CB";
      ctx.fillRect(0, height - footerHeight, width, footerHeight);
      ctx.fillStyle = "#000";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Photo Booth", width / 2, height - 50);
      ctx.fillText(new Date().toLocaleDateString(), width / 2, height - 25);

      // Download the image as JPEG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `photobooth_${uuidv4()}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg");
    });
  };

  // Merge images and add a frame overlay (framed version)
  const mergeImagesFramed = () => {
    if (images.length < 3) return;

    const imgElements = images.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    Promise.all(imgElements.map((img) => new Promise((res) => (img.onload = res)))).then(() => {
      const imgWidth = imgElements[0].width;
      const imgHeight = imgElements[0].height;
      const spacing = 10;
      const borderWidth = 10;
      const footerHeight = 80;
      const headerHeight = 30;
      const captionHeight = 50;
      const width = imgWidth + borderWidth * 6;
      const height =
        headerHeight +
        captionHeight +
        imgHeight * 3 +
        spacing * 2 +
        footerHeight +
        borderWidth * 2;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // For the framed version, we use a white background
      ctx.fillStyle = "#FFF";
      ctx.fillRect(0, 0, width, height);

      // Header area
      ctx.fillStyle = "#FFF";
      ctx.fillRect(0, 0, width, headerHeight);

      // Draw images centered horizontally
      imgElements.forEach((img, index) => {
        const x = (width - imgWidth) / 2;
        const y = headerHeight + index * (imgHeight + spacing);
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      });

      

      // Load the frame overlay image (PNG with transparency)
      const frameOverlay = new Image();
      frameOverlay.src = "/coquette-frame.png"; // <-- update this path!

      frameOverlay.onload = () => {
        // Draw the frame overlay on top of the entire canvas
        ctx.drawImage(frameOverlay, 0, 0, width, height);
        // Caption area
      ctx.fillStyle = "#FF8CA2";
      ctx.fillRect(0, height - footerHeight - captionHeight, width, captionHeight);
      ctx.fillStyle = "#000";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(caption, width / 2, height - footerHeight - 15);

      // Footer area
      ctx.fillStyle = "#FF8CA2";
      ctx.fillRect(0, height - footerHeight, width, footerHeight);
      ctx.fillStyle = "#000";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Photo Booth", width / 2, height - 50);
      ctx.fillText(new Date().toLocaleDateString(), width / 2, height - 25);

        // Download the final image as PNG
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `photobooth_framed_${uuidv4()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }, "image/png");
      };
    });
  };

  // Handler for the final download button – choose merge method based on selection
  const downloadStrip = () => {
    if (selectedFrame === "normal") {
      mergeImages();
    } else {
      mergeImagesFramed();
    }
  };

  return (
    <div className="booth" style={{ textAlign: "center" }}>
      <Webcam
        className="webcam"
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={400}
        videoConstraints={{ facingMode: "user" }}
        style={{ transform: flipped ? "scaleX(-1)" : "none" }}
      />

      {countdown !== null && <h2 style={{ fontSize: "2rem" }}>{countdown}</h2>}
      <br />

      <div>
        <button onClick={() => setFlipped((prev) => !prev)}>Flip</button>
        <button onClick={startAutoCapture} disabled={capturing}>
          {capturing ? `Capturing...` : `Start Photobooth`}
        </button>
      </div>

      {/* Radio button group for selecting frame option */}
      {images.length === 3 && (
        <div style={{ marginTop: "10px" }}>
          <label style={{ marginRight: "10px" }}>
            <input
              type="radio"
              name="frame"
              value="normal"
              checked={selectedFrame === "normal"}
              onChange={() => setSelectedFrame("normal")}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              name="frame"
              value="framed"
              checked={selectedFrame === "framed"}
              onChange={() => setSelectedFrame("framed")}
            />
            With Frame
          </label>
        </div>
      )}

      {images.length === 3 && (
        <div className="strip" style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Enter your caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              marginBottom: "10px",
              width: "100%",
            }}
          />
          <button onClick={downloadStrip}>Download Photobooth Strip</button>
        </div>
      )}

      {/* Display Captured Images */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Captured ${index + 1}`}
            style={{
              width: "200px",
              height: "150px",
              border: "5px solid black",
              borderRadius: "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WebcamCapture;
