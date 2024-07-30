document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadForm = document.getElementById('uploadForm');
    const uploadButton = document.getElementById('uploadButton');

    // Function to update the file list and handle layout
    function updateFileList() {
        fileList.innerHTML = '';
        const files = Array.from(fileInput.files);
        
        // Handle layout based on the number of files
        if (files.length === 1) {
            fileList.classList.remove('grid-layout');
            fileList.classList.add('single-media-container');
        } else {
            fileList.classList.add('grid-layout');
            fileList.classList.remove('single-media-container');
        }

        files.forEach((file, index) => {
            const listItem = document.createElement('div');
            listItem.classList.add('file-list-item');
            listItem.setAttribute('data-file-index', index);  // Set index for file identification

            let preview;
            if (file.type.startsWith('image/')) {
                preview = document.createElement('img');
                preview.src = URL.createObjectURL(file);
                preview.classList.add('file-preview');
                preview.alt = file.name;
            } else if (file.type.startsWith('video/')) {
                preview = document.createElement('img');
                preview.src = 'static/images/video-upload.png'; // Use image preview for videos
                preview.classList.add('file-preview');
                preview.alt = 'Video preview';
            }

            const info = document.createElement('div');
            info.innerHTML = `<strong>${file.name}</strong> (${Math.round(file.size / 1024)} KB)`;
            info.classList.add('me-2');

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
            deleteButton.addEventListener('click', () => removeFile(index));

            listItem.appendChild(preview);
            listItem.appendChild(info);
            listItem.appendChild(deleteButton);

            fileList.appendChild(listItem);
        });
    }

    // Add event listener for file input change
    fileInput.addEventListener('change', updateFileList);

    // Function to remove a file
    function removeFile(index) {
        // Remove file from the input
        const dataTransfer = new DataTransfer();
        Array.from(fileInput.files).forEach((file, i) => {
            if (i !== index) {
                dataTransfer.items.add(file);
            }
        });
        fileInput.files = dataTransfer.files;

        // Update the file list
        updateFileList();
    }


    // Show SweetAlert2 alert with dynamic content
    async function showAlert({ title, text, icon, showConfirmButton, backdrop }) {
        await Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: 'OK',
            showConfirmButton: showConfirmButton,
            backdrop: backdrop,
            width: 600,
            padding: '3em',
            color: '#716add',
            background: '#fff',
        });
    }

    // Handle form submission
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (fileInput.files.length === 0) {
            // Show SweetAlert2 alert for no files selected
            showAlert({
                title: 'No Files Selected!',
                text: 'Please select at least one file to upload.',
                icon: 'warning',
                showConfirmButton: true,
                backdrop: `
                  rgba(0,0,123,0.4)
                  left top
                  no-repeat
                `
            });
        } else {
            // Show SweetAlert2 alert for upload start
            showAlert({
                title: 'Processing Files...',
                text: 'Please wait while the files are being processed.',
                icon: 'info',
                showConfirmButton: false,
                backdrop: `
                  rgba(0,0,123,0.4)
                  left top
                  no-repeat
                `
            });

            // Disable the upload button and update text
            uploadButton.innerHTML = 'Uploading...';
            uploadButton.disabled = true;

            const formData = new FormData();
            Array.from(fileInput.files).forEach(file => {
                formData.append('files', file);
            });

            fetch('/upload', {
                method: 'POST',
                body: formData
            }).then(response => { 
                showAlert({
                title: 'Upload Successful!',
                text: 'Your files have been successfully uploaded.',
                icon: 'success',
                showConfirmButton: true,
                backdrop: `
                    rgba(0,0,123,0.4)
                    left top
                    no-repeat
                `
            });
            return response.text()})
            .then(data => {
                document.body.innerHTML = data;
            }).catch(error => console.error('Error:', error));

           
        }
    });
});

function handleHomeButtonClick() {
    var homeButton = document.getElementById('homeButton');
    if (homeButton) {
        homeButton.textContent = 'Returning...';
        homeButton.disabled = true;
    }

    var items = document.querySelectorAll('#fileList .grid-item');
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

async function initializeResultPage() {
    try {
        var homeButton = document.getElementById('homeButton');
        if (homeButton) {
            homeButton.addEventListener('click', handleHomeButtonClick);
        }

        var fileList = document.getElementById('fileList');
        // console.log("Berapo? ", document.getElementById('fileList').querySelectorAll('.grid-item').length);
        if (fileList) {
            var items = fileList.querySelectorAll('.grid-item');
            // console.log(items.length);  // Log the number of grid items
            if (items.length > 1) {
                fileList.classList.add('grid-layout-2');
            } else {
                fileList.classList.add('grid-layout-1');
            }
        }

        var captions = document.querySelectorAll('.result-captions');
        captions.forEach(function(caption) {
            if (caption.children.length === 4) {
                caption.classList.add('double-row');
            } else if (caption.children.length === 3) {
                caption.classList.add('single-row');
            }
        });

    } catch (error) {
        console.error('Error initializing result page:', error);
    }
}

// Function to continuously call initializeResultPage
function startPeriodicInitialization(interval) {
    initializeResultPage(); // Call once initially
    setInterval(initializeResultPage, interval); // Call repeatedly at specified interval
}

// Call the function when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    startPeriodicInitialization(1000);
});

function openConfigPopup() {
    document.getElementById('configPopup').style.display = 'block';
    document.getElementById('blurredBackground').style.display = 'block';
}

function closeConfigPopup() {
    document.getElementById('configPopup').style.display = 'none';
    document.getElementById('blurredBackground').style.display = 'none';
}

function saveConfig() {
    const deviceSelect = document.getElementById('deviceSelect');
    const deviceType = deviceSelect.value;
    console.log('Device type:', deviceType);

    fetch('/update_config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_type: deviceType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Configuration updated successfully');
            closeConfigPopup();
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the configuration.');
    });
}


function uploadModel() {
    const modelFile = document.getElementById('modelFile').files[0];
    if (!modelFile) {
        alert('No file selected.');
        return;
    }

    const fileExtension = modelFile.name.split('.').pop();

    if (fileExtension !== 'pt') {
        alert('Please upload a file with the .pt extension only.');
        return;
    }

    const formData = new FormData();
    formData.append('model_file', modelFile);

    console.log('Uploading model...');
    fetch('/upload_model', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert('Model uploaded and loaded successfully');
            closeConfigPopup();
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while uploading the model.');
    });
}