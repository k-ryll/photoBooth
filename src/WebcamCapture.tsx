import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from 'uuid';

const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [images, setImages] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [caption, setCaption] = useState("");

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

  // Combine images into a photobooth strip with a border, background, and text
  const mergeImages = () => {
    if (images.length < 3) return;
  
    const imgElements = images.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  
    Promise.all(imgElements.map(img => new Promise((res) => img.onload = res))).then(() => {
      const imgWidth = imgElements[0].width;
      const imgHeight = imgElements[0].height;
      const spacing = 20;
      const borderWidth = 10;
      const footerHeight = 80;
      const headerHeight = 40;
      const captionHeight = 50;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      const width = imgWidth + borderWidth * 6;
      const height = headerHeight + captionHeight + imgHeight * 3 + spacing * 2 + footerHeight + borderWidth * 2;
  
      canvas.width = width;
      canvas.height = height;
  
      // Background color
      ctx.fillStyle = "#FFC0CB";
      ctx.fillRect(0, 0, width, height);
  
      // Header
      ctx.fillRect(0, 0, width, headerHeight);
  
      // Draw images
      imgElements.forEach((img, index) => {
        const x = (width - imgWidth) / 2;
        const y = headerHeight + index * (imgHeight + spacing);
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      });
  
      // Convert to image
      canvas.toBlob((blob) => {
        if (!blob) return;
  
        const file = new File([blob], `photobooth_${uuidv4()}.jpg`, { type: "image/jpeg" });
  
        if (navigator.share) {
          navigator.share({
            files: [file],
            title: "Photobooth Image",
            text: "Here's your photobooth image!",
          }).catch(err => console.log("Sharing failed", err));
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/jpeg");
    });
  };
  
  
  return (
    <div className='booth' style={{ textAlign: "center" }}>

      
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
      

      {images.length === 3 && (
        <div className="
        strip"><input 
        type="text" 
        placeholder="Enter your caption..." 
        value={caption} 
        onChange={(e) => setCaption(e.target.value)} 
        style={{ padding: "10px", fontSize: "16px", marginBottom: "10px", width: "100%" }}
      />
      <button onClick={mergeImages}>Download Photobooth Strip</button>
      </div>
        
      )}

      {/* Display Captured Images */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
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
