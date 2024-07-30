document.body.innerHTML +=
    `<app id="tpenxgt">
        <h1 id="tools-switch">Tpenxgt</h1>
        <div id="gallery"></div>
        <div id="tools-encode">
            <textarea type="text" id="text-input"></textarea>
            <div class="d-flex row jc-end">
                <button id="paste" class="ios-def-btn">Paste</button>
                <button id="encode" class="ios-def-btn">Encode</button>
            </div>
            <canvas id="canvas" width="200" height="200"></canvas>
            <a id="download-link" class="ios-def-btn" href="#" download="encoded-image.png">Download</a>
        </div>
        <div id="tools-decode">
            <input type="file" id="upload-input" class="ios-def-btn" accept="image/png">
            <div class="d-flex row jc-end">
                <button id="decode" class="ios-def-btn">Read</button>
                <button id="edit" class="ios-def-btn">Edit</button>
            </div>
            <p id="decoded-text"></p>
        </div>
    </app>`;
const imagePaths = [
    'src/img/《星際命運：探索者號的傳奇》.png',
    'src/img/《時空裂縫：諾瓦斯的預言》.png',
];
imagePaths.forEach(path => {
    const element = document.createElement('img');
    element.src = path;
    element.alt = 'Image';
    element.addEventListener('click', (e) => {
        decodeTextURL(e.target.src);
    });
    document.getElementById('gallery').appendChild(element);
});
document.getElementById('tools-decode').style.display = 'flex';
document.getElementById('tools-switch').addEventListener('click', () => {
    if (document.getElementById('tools-encode').style.display === '') {
        document.getElementById('tools-encode').style.display = 'flex';
        document.getElementById('tools-decode').style.display = '';
    } else {
        document.getElementById('tools-encode').style.display = '';
        document.getElementById('tools-decode').style.display = 'flex';
    }
});
document.getElementById('paste').onclick = () => { pasteFromClipboard(); }
document.getElementById('encode').onclick = () => { encodeText(); }
document.getElementById('decode').onclick = () => { decodeText(); }
document.getElementById('upload-input').onchange = () => {
    if (document.getElementById('upload-input').files.length > 0) {
        document.getElementById('decode').style.display = 'flex';
    } else {
        document.getElementById('decode').style.display = '';
    }
}
async function pasteFromClipboard() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        const element = document.getElementById('text-input');
        element.value = clipboardText;
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
}
function encodeText() {
    const text = document.getElementById('text-input').value;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    canvas.width = 200;
    canvas.height = 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const textLength = Math.min(text.length, canvas.width * canvas.height);
    for (let i = 0; i < textLength; i++) {
        const charCode = text.charCodeAt(i);
        const x = i % canvas.width;
        const y = Math.floor(i / canvas.width);
        const index = (y * canvas.width + x) * 4;

        data[index] = (charCode >> 16) & 0xFF;
        data[index + 1] = (charCode >> 8) & 0xFF;
        data[index + 2] = charCode & 0xFF;
        data[index + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const croppedImageData = cropCanvas(canvas);

    const link = document.getElementById('download-link');
    const imageDataUrl = croppedImageData.toDataURL('image/png');

    link.href = imageDataUrl;
    link.style.display = 'block';
}

function decodeText() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const uploadInput = document.getElementById('upload-input');
    const file = uploadInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const croppedCanvas = cropCanvas(canvas);
            canvas.width = croppedCanvas.width;
            canvas.height = croppedCanvas.height;
            ctx.drawImage(croppedCanvas, 0, 0);

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

            document.getElementById('decoded-text').innerHTML = text + `<br><br><h6>UTF-8: ${utf8SizeInKB(text)}kb Base64: ${base64SizeInKB(file)}kb File: ${fileSizeInKB(file)}kb</h6>`;
            document.getElementById('edit').style.display = 'block';
            document.getElementById('edit').onclick = () => {
                document.getElementById('text-input').value = text;
                document.getElementById('decoded-text').innerHTML = '';
                document.getElementById('edit').style.display = '';
                document.getElementById('tools-encode').style.display = 'flex';
                document.getElementById('tools-decode').style.display = '';
            };
        }
        img.onerror = function () {
            alert('Failed to load image.');
        }
        img.src = event.target.result;
    }

    reader.onerror = function () {
        alert('Failed to read file.');
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image.');
    }
}

function decodeTextURL(imageUrl) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!imageUrl) {
        alert('No image URL provided.');
        return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // This is important if the image is from a different origin
    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const croppedCanvas = cropCanvas(canvas); // Make sure you have cropCanvas function defined
        canvas.width = croppedCanvas.width;
        canvas.height = croppedCanvas.height;
        ctx.drawImage(croppedCanvas, 0, 0);

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

        document.getElementById('decoded-text').innerHTML = text + `<br><br><h6>UTF-8: ${utf8SizeInKB(text)}kb Base64: ${base64SizeInKB(imageUrl)}kb</h6>`;
        document.getElementById('edit').style.display = 'block';
        document.getElementById('edit').onclick = () => {
            document.getElementById('text-input').value = text;
            document.getElementById('decoded-text').innerHTML = '';
            document.getElementById('edit').style.display = '';
            document.getElementById('tools-encode').style.display = 'flex';
            document.getElementById('tools-decode').style.display = '';
        };
    }
    img.onerror = function () {
        alert('Failed to load image from URL.');
    }
    img.src = imageUrl;
}

function cropCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let top = height;
    let bottom = 0;
    let left = width;
    let right = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            if (data[index + 3] > 0) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
            }
        }
    }

    const croppedWidth = right - left + 1;
    const croppedHeight = bottom - top + 1;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, left, top, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

    return croppedCanvas;
}

function utf8SizeInKB(text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const sizeInKB = blob.size / 1024;
    return sizeInKB.toFixed(2);
}

function fileSizeInKB(file) {
    const sizeInBytes = file.size;
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB.toFixed(2);
}

function base64SizeInKB(text) {
    const base64String = btoa(unescape(encodeURIComponent(text)));

    const sizeInBytes = base64String.length;

    const sizeInKB = (sizeInBytes / 1024).toFixed(2);

    return sizeInKB;
}