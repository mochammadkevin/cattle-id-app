export function createImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (err) => reject(err));
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = url;
    });
  }
  
  export function getRadianAngle(degree) {
    return (degree * Math.PI) / 180;
  }
  
  export function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    return createImage(imageSrc).then((image) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { width: bBoxWidth, height: bBoxHeight } = {
        width: image.width,
        height: image.height,
      };
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg');
      });
    });
  }
  