const form = document.getElementById('uploadForm');
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });
    if (response.ok) {
        alert('Image uploaded successfully!');
    } else {
        alert('Failed to upload image.');
    }
});
