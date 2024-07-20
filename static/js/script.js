document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var uploadButton = document.getElementById('uploadButton');
    uploadButton.innerHTML = 'Uploading...';
    uploadButton.disabled = true;

    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    Array.from(fileInput.files).forEach(file => {
        formData.append('files', file);
    });

    fetch('/upload', {
        method: 'POST',
        body: formData
    }).then(response => response.text())
      .then(data => {
        document.body.innerHTML = data;
    }).catch(error => console.error('Error:', error));
});

function handleHomeButtonClick() {
    var uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.textContent = 'Uploading...';
        uploadButton.disabled = true;
    }

    var items = document.querySelectorAll('#fileList .list-group-item');
    console.log("List items found:", items);

    var filenames = Array.from(items).map(item => item.getAttribute('data-filename'));
    console.log("Filenames:", filenames);

    fetch('/delete-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filenames: filenames })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Files successfully deleted");
            window.location.href = '/';
        } else {
            console.error('Failed to delete files');
        }
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    var homeButton = document.getElementById('homeButton');
    if (homeButton) {
        homeButton.addEventListener('click', handleHomeButtonClick);
    }
});
