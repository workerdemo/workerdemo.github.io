const stopEvent = function (e) {
    e.preventDefault();
    e.stopPropagation();
};

const getInitialPassword = () => {
    return document.getElementById('initial-password').value;
};

const showTexts = (name, data) => {
    const textResultWrapper = document.getElementById('text-result-wrapper');
    const createHtml = (fileName, text) => {
        return '<div class="row">\n' +
            '    <div class="col-3">\n' +
            '        <div class="result-title"><i class="bi bi-file-earmark-text"></i>' + fileName + '</div>\n' +
            '    </div>\n' +
            '    <div class="col">\n' +
            '        <textarea id="text-result">' + text + '</textarea>\n' +
            '     </div>\n' +
            '</div>'
    };

    const items = data instanceof Array ? data : [{name, text: data}];
    items.forEach((value) => {
        const {name: fileName, text} = value;
        const listItem = document.createElement('div');
        listItem.innerHTML = createHtml(fileName, text);
        textResultWrapper.appendChild(listItem);
    });
};

const loadWorker = ({type, url, files}) => {
    const startTime = new Date().getTime();
    const promises = [];

    const runner = (uri) => new Promise((resolve, reject) => {
        const worker = new Worker('dist/docToText.js');
        worker.onmessage = (event) => {
            const {error, command, fileName, data} = event.data;

            if (error) {
                showTexts(fileName, error);
                worker.terminate();
                reject(error);
                return;
            }

            if (command === 'checkPassword') {
                worker.postMessage({
                    command: 'setPassword',
                    password: prompt('input your password')
                });
            }

            if (command === 'result') {
                showTexts(fileName, data);
                worker.terminate();
                resolve();
            }
        };

        worker.postMessage({command: 'file', uri, password: getInitialPassword()});
    });

    if (type === 'file') {
        const entries = Object.entries(files);
        entries.forEach(([, file]) => {
            promises.push(runner(file));
        });
    } else {
        promises.push(runner(url));
    }

    Promise
        .all(promises)
        .catch((error) => {
            console.log('error:', error);
        })
        .finally(() => {
            console.log('load time:', (new Date().getTime() - startTime) / 1000)
        });
};

const loadNonWorker = (files) => {
    const startTime = new Date().getTime();
    const promises = Object
        .entries(files)
        .map(([, file]) => new Promise((resolve, reject) => {
            const docToText = new DocToText({password: getInitialPassword()});
            const {name} = file;
            docToText.parse(file)
                .then((text) => {
                    resolve();
                    showTexts(name, text);
                })
                .catch((error) => {
                    reject();
                    showTexts(name, error);
                });
        }));

    Promise
        .all(promises)
        .catch((error) => {
            console.log('error:', error);
        })
        .finally(() => {
            console.log('load time:', (new Date().getTime() - startTime) / 1000)
        });
};

document.addEventListener('DOMContentLoaded', () => {
    const dragDropArea = document.getElementById('drag-drop-area');
    const dragFile = document.getElementById('drag-file');
    const urlLoadButton = document.getElementById('url-button');
    const urlInput = document.getElementById('url-input');

    urlLoadButton.addEventListener('click', (e) => {
        e.preventDefault();
        const {value} = urlInput;

        if (value !== '') {
            loadWorker({type: 'url', url: value});
        }
    });

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
        loadWorker({type: 'file', files});
    });

    dragFile.addEventListener('change', (e) => {
        const {target} = e;
        const {files} = target;
        stopEvent(e);

        loadNonWorker(files);
        loadWorker({type: 'file', files});
    });
});
