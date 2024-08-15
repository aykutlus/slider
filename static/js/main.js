const imgElement = document.getElementById('current-image');
const newPhotoText = document.getElementById('new-photo-text');
const backgroundBlur = document.getElementById('background-blur');
const leftThumbnailsContainer = document.getElementById('left-thumbnails');
const rightThumbnailsContainer = document.getElementById('right-thumbnails');
let images = [];
let currentIndex = 0;
let intervalId = null;
let isShowingNewPhoto = false;

function startSlider() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        showNextImage();
    }, 6000);
}

function showNextImage() {
    if (images.length > 0) {
        const previousIndex = currentIndex;
        currentIndex = (currentIndex + 1) % images.length;
        updateImage(images[currentIndex], images[previousIndex]);
        hideNewPhotoText(); // Ensure "New Photo" text is hidden when switching to the next image
    }
}

function showNewPhotoText() {
    newPhotoText.style.display = 'block';
}

function hideNewPhotoText() {
    newPhotoText.style.display = 'none';
}

function updateImage(newImageUrl, previousImageUrl) {
    imgElement.classList.remove('active');  // Reset the animation class
    void imgElement.offsetWidth;  // Trigger reflow to restart the animation
    imgElement.src = newImageUrl;
    imgElement.classList.add('active');  // Re-apply the animation class

    backgroundBlur.style.backgroundImage = `url(${newImageUrl})`;
}

function addThumbnail(imageUrl, container) {
    const thumb = document.createElement('img');
    thumb.src = imageUrl;
    thumb.onclick = () => {
        const previousIndex = currentIndex;
        currentIndex = images.indexOf(imageUrl);
        updateImage(imageUrl, images[previousIndex]);
        showNewPhotoText();
        setTimeout(hideNewPhotoText, 6000); // Hide "New Photo" text after 6 seconds
    };
    container.appendChild(thumb);
}

function duplicateThumbnailsForSeamlessLoop(container) {
    const thumbnails = Array.from(container.children);
    thumbnails.forEach(thumb => {
        const clone = thumb.cloneNode(true);
        container.appendChild(clone);
    });
}

const socket = io();

socket.on('new-image', (data) => {
    const newImageUrl = data.url;
    images.splice(currentIndex, 0, newImageUrl);
    updateImage(newImageUrl, images[currentIndex]);
    addThumbnail(newImageUrl, leftThumbnailsContainer);
    addThumbnail(newImageUrl, rightThumbnailsContainer);
    showNewPhotoText();
    setTimeout(hideNewPhotoText, 6000); // Hide "New Photo" text after 6 seconds
    isShowingNewPhoto = true;
    startSlider();
});

fetch('/photos')
    .then(response => response.json())
    .then(data => {
        images = data;
        if (images.length > 0) {
            updateImage(images[0]);
            images.forEach(imageUrl => {
                addThumbnail(imageUrl, leftThumbnailsContainer);
                addThumbnail(imageUrl, rightThumbnailsContainer);
            });
            duplicateThumbnailsForSeamlessLoop(leftThumbnailsContainer); // Duplicate for smooth loop
            duplicateThumbnailsForSeamlessLoop(rightThumbnailsContainer); // Duplicate for smooth loop
            startSlider();
        }
    });
