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
        return '<div class="row">' +
                 '<div class="col-3">' +
                    '<div class="result-title"><i class="bi bi-file-earmark-text"></i>' + fileName + '</div>' +
                 '</div>' +
                 '<div class="col">' +
                    '<textarea id="text-result" style="height: 256px">' + text + '</textarea>' +
                 '</div>' +
               '</div>';
    };

    const items = data instanceof Array ? data : [{name, text: data}];
    let textHtml = '';
    items.forEach((value) => {
        const {name: fileName, text} = value;
        const textLength = text.length;
        textHtml += createHtml(fileName, text);
    });

    const div = document.createElement('div');
    div.innerHTML = textHtml;
    textResultWrapper.appendChild(div);
};

const loadNonWorker = (files) => {
    const startTime = new Date().getTime();
    const promises = Object
        .entries(files)
        .map(([, file]) => new Promise((resolve) => {
            const docToText = new DocToText({password: getInitialPassword()});
            const {name} = file;
            docToText.parse(file)
                .then((text) => {
                    resolve([name, text]);
                })
                .catch((error) => {
                    resolve([name, error]);
                });
        }));

    Promise
        .all(promises)
        .then((data) => {
            const loadTime = (new Date().getTime() - startTime) / 1000;
            data.forEach(([fileName, text]) => {
                showTexts(fileName, text);
            });
        })
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
        loadNonWorker(files);
    });

    dragFile.addEventListener('change', (e) => {
        const {target} = e;
        const {files} = target;
        stopEvent(e);

        loadNonWorker(files);
    });
});
