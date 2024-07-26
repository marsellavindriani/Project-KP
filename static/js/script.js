// document.getElementById('uploadForm').addEventListener('submit', function(event) {
//     event.preventDefault();
//     var uploadButton = document.getElementById('uploadButton');
//     uploadButton.innerHTML = 'Uploading...';
//     uploadButton.disabled = true;

//     const fileInput = document.getElementById('fileInput');
//     const formData = new FormData();
//     Array.from(fileInput.files).forEach(file => {
//         formData.append('files', file);
//     });

//     fetch('/upload', {
//         method: 'POST',
//         body: formData
//     }).then(response => response.text())
//       .then(data => {
//         document.body.innerHTML = data;
//     }).catch(error => console.error('Error:', error));
// });

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadForm = document.getElementById('uploadForm');
    const uploadButton = document.getElementById('uploadButton');

    // Display file previews and info
    fileInput.addEventListener('change', () => {
        fileList.innerHTML = '';
        Array.from(fileInput.files).forEach((file, index) => {
            const listItem = document.createElement('div');
            listItem.classList.add('file-list-item', 'd-flex', 'align-items-center', 'mb-2');
            listItem.setAttribute('data-file-index', index);  // Set index for file identification

            let preview;
            if (file.type.startsWith('image/')) {
                preview = document.createElement('img');
                preview.src = URL.createObjectURL(file);
                preview.classList.add('file-preview');
                preview.alt = file.name;
            } else if (file.type.startsWith('video/')) {
                preview = document.createElement('video');
                preview.src = URL.createObjectURL(file);
                preview.classList.add('file-preview');
                preview.controls = true;
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
    });

    // Remove file from the file list and input
    function removeFile(index) {
        // Remove file from the input
        const dataTransfer = new DataTransfer();
        Array.from(fileInput.files).forEach((file, i) => {
            if (i !== index) {
                dataTransfer.items.add(file);
            }
        });
        fileInput.files = dataTransfer.files;

        // Remove the file from the list
        const listItem = fileList.querySelector(`[data-file-index="${index}"]`);
        if (listItem) {
            listItem.remove();
        }
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
                title: 'Uploading Files...',
                text: 'Please wait while the files are being uploaded.',
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
            //     showAlert({
            //     title: 'Upload Successful!',
            //     text: 'Your files have been successfully uploaded.',
            //     icon: 'success',
            //     showConfirmButton: true,
            //     backdrop: `
            //         rgba(0,0,123,0.4)
            //         left top
            //         no-repeat
            //     `
            // });
            return response.text()})
            .then(data => {
                document.body.innerHTML = data;
            }).catch(error => console.error('Error:', error));

           
        }
    });
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
