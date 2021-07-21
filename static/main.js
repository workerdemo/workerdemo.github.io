const stopEvent = function (e) {
    e.preventDefault();
    e.stopPropagation();
};

const showTextResultList = (name, data) => {
    const textResultWrapper = document.getElementById('text-result-wrapper');
    const listItem = document.createElement('div');
    listItem.innerHTML = '<div class="row">\n' +
        '                        <div class="col-3">\n' +
        '                            <div class="result-title"><i class="bi bi-file-earmark-text"></i>' + name + '</div>\n' +
        '                        </div>\n' +
        '                        <div class="col">\n' +
        '                            <textarea id="text-result">' + data + '</textarea>\n' +
        '                        </div>\n' +
        '                    </div>';
    textResultWrapper.appendChild(listItem);
};

const loadWorker = (files) => {
    const entries = Object.entries(files);
    entries.forEach(([key, file]) => {
        const {name} = file;
        const ext = name.toLowerCase().substring(name.lastIndexOf('.') + 1);

        const worker = new Worker('dist/docToText.js');
        worker.onmessage = (event) => {
            const {command, data, message} = event.data;

            if (command === 'error') {
                showTextResultList(name, message);
                worker.terminate();
                return;
            }

            if (command === 'checkPassword') {
                // const password = prompt('input your password');
                worker.postMessage({command: 'setPassword', data: '1234'});
            }

            if (command === 'result') {
                showTextResultList(name, data);
                // worker.terminate();
                setTimeout(() => {
                    worker.terminate();
                }, 1000);
            }
        };

        worker.postMessage({command: 'file', data: [file, ext]});
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const dragDropArea = document.getElementById('drag-drop-area');
    const dragFile = document.getElementById('drag-file');

    dragDropArea.addEventListener('click', (e) => {
        stopEvent(e);

        dragFile.value = '';
        dragFile.click();
    });

    dragDropArea.addEventListener('dragover', (e) => {
        stopEvent(e);
        e.currentTarget.className = 'drag-on';
    });

    dragDropArea.addEventListener('dragenter', (e) => {
        stopEvent(e);
    });

    dragDropArea.addEventListener('dragleave', (e) => {
        stopEvent(e);
        e.currentTarget.className = '';
    });

    dragDropArea.addEventListener('drop', (e) => {
        const {currentTarget, dataTransfer} = e;
        const {files} = dataTransfer;

        currentTarget.className = '';

        stopEvent(e);
        loadWorker(files);
    });

    dragFile.addEventListener('change', (e) => {
        const {target} = e;
        const {files} = target;
        stopEvent(e);
        loadWorker(files);
    });
});
