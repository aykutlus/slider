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

function addThumbnail(imageUrl, container, index) {
    const thumb = document.createElement('img');
    thumb.src = imageUrl;
    thumb.classList.add(`thumbnail-${index}`);  // Add unique class based on index

    // // Only show the first 4 thumbnails initially
    // if (index < 4) {
    //     thumb.style.opacity = 1;  // Make it visible
    // } else {
    //     thumb.style.opacity = 0;  // Start hidden
    //     thumb.style.visibility = 'hidden';  // Ensure it doesn't take up space
    // }

    container.appendChild(thumb);

    // Set a fixed gap (e.g., 20px) between thumbnails
    const gap = 20;
    const thumbnailHeight = 100;  // Assume a fixed height for each thumbnail (adjust as needed)
    const initialTranslateY = (thumbnailHeight + gap) * index;  // Calculate initial Y position based on index

    thumb.style.transform = `translateY(${initialTranslateY}px)`;  // Set initial position

    // Delay the animation for each thumbnail
    setTimeout(() => {
        thumb.style.visibility = 'visible';  // Make it visible
        thumb.style.opacity = 1;  // Reveal the image as the animation starts
        thumb.style.animation = `scrollThumbnail 10s linear infinite ${index * 2}s`;  // Apply delay with animation
    }, 100);  // Minor delay to ensure proper rendering before animation starts

    thumb.onclick = () => {
        const previousIndex = currentIndex;
        currentIndex = images.indexOf(imageUrl);
        updateImage(imageUrl, images[previousIndex]);
    };
}


fetch('/photos')
    .then(response => response.json())
    .then(data => {
        images = data;
        if (images.length > 0) {
            updateImage(images[0]);
            images.forEach((imageUrl, index) => {
                // Pass the index to the addThumbnail function
                addThumbnail(imageUrl, leftThumbnailsContainer, index);
                addThumbnail(imageUrl, rightThumbnailsContainer, index);
            });
            startSlider();
        }
    });
