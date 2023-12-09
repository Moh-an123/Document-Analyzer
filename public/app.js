const dragArea1 = document.querySelector('.drag-area1');
const dragArea2 = document.querySelector('.drag-area2');

let button1 = document.querySelector('.button1');
let button2 = document.querySelector('.button2');
let input1 = document.querySelector('.input1');
let input2 = document.querySelector('.input2');
let file1, file2;
const validExtensions = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

button1.onclick = () => {
    input1.click();
}
button2.onclick = () => {
    input2.click();
}
dragArea1.addEventListener('dragover', (event) => {
    event.preventDefault();
    dragArea1.classList.add('active');
})

dragArea2.addEventListener('dragover', (event) => {
    event.preventDefault();
    dragArea2.classList.add('active');
})

dragArea1.addEventListener('dragleave', () => {
    dragArea1.classList.remove('active');
})

dragArea2.addEventListener('dragleave', () => {
    dragArea2.classList.remove('active');
})

function sendfile1(file) {
    const type = file.type;

    if (validExtensions.includes(type)) {
        file1 = file;
    } else {
        alert('Unsupported format for file1');
        dragArea1.classList.remove('active');
    }
}

function sendfile2(file) {
    const type = file.type;

    if (validExtensions.includes(type)) {
        file2 = file;
    } else {
        alert('Unsupported format for file2');
        dragArea2.classList.remove('active');
    }
}
input1.addEventListener('change', function () {
    file1 = this.files[0];
    dragArea1.classList.add('active');
    sendfile1(file1);
});
input2.addEventListener('change', function () {
    file2 = this.files[0];
    dragArea2.classList.add('active');
    sendfile2(file2);
});

dragArea1.addEventListener('drop', (event) => {
    event.preventDefault();
    file1 = event.dataTransfer.files[0];
    sendfile1(file1)
});

dragArea2.addEventListener('drop', (event) => {
    event.preventDefault();
    file2 = event.dataTransfer.files[0];
    sendfile2(file2);
});

async function sendFileToServer(file, endpoint) {
    const formData = new FormData();
    formData.append("file", file);

    fetch(`http://localhost:3000/${endpoint}`, {
        method: "POST",
        body: formData,
    }).then((response) => response.json())
        .then(() => {
            console.log(`File ${endpoint} uploaded successfully`);
        })
        .catch(() => {
            console.error(`Error uploading file ${endpoint}`);
        });
}
async function uploadFiles() {
    return new Promise(async (resolve, reject) => {
        try {
            if (file1 && file2) {
                await sendFileToServer(file1, 'file1');
                await sendFileToServer(file2, 'file2');
                resolve();
            } else {
                reject('Please upload both files.');
            }
        } catch (error) {
            reject(error);
        }
    });
}
document.querySelector('button').onclick = () => {
    uploadFiles().then(() => {
        setTimeout(function () {
            window.location.href = "load.html";
        }, 10000);
    })
        .catch((error) => alert(error));
};
