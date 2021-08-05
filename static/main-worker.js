const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const workerPoolSize = params.size ? params.size * 1 : null;

window.workerPool = null;
const createWorkerPool = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'dist/docToText.js', true);
    xhr.responseType = 'blob';
    xhr.onload = function() {
        if (xhr.status == 200) {
            window.workerPool = WorkerPool(URL.createObjectURL(this.response), {size: workerPoolSize});
        }
    };
    xhr.send();
};

const WorkerPool = (url, {size = 4}) => {
    const pool = [];
    const workerJob = [];

    for (let i = 0; i < size; i++) {
        pool.push(new Worker(url));
    }

    const getIdleWorker = () => {
        return pool.filter(worker => worker.onmessage === null);
    };

    const runWorker = () => {
        if (workerJob.length) {
            const [worker] = getIdleWorker();
            if (worker) {
                const {onMessage, postMessage} = workerJob.shift();
                worker.onmessage = (event) => {
                    const onComplete = () => {
                        worker.onmessage = null;
                        runWorker();
                    };

                    onMessage(worker, event, onComplete);
                };
                worker.postMessage(postMessage);
            }
        }
    };

    return {
        add: (job) => {
            workerJob.push(job);
            runWorker();
        },
        release: (worker) => {
            worker.onmessage = null;
        },
        destroy: () => {
            pool.forEach((worker) => worker.terminate());
        },
    };
};

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
                    '<textarea id="text-result">' + text + '</textarea>' +
                    '</div>' +
               '</div>';
    };

    const items = data instanceof Array ? data : [{name, text: data}];
    let textHtml = '';
    items.forEach((value) => {
        const {name: fileName, text} = value;
        textHtml += createHtml(fileName, text);
    });

    const div = document.createElement('div');
    div.innerHTML = textHtml;
    textResultWrapper.appendChild(div);
};

const loadWorker = ({type, url, files}) => {
    const startTime = new Date().getTime();
    const promises = [];

    if (!workerPool) {
        alert('worker load failed');
        return;
    }

    const runner = (uri) => new Promise((resolve) => {
        workerPool.add({
            onMessage: (worker, event, onComplete) => {
                const {message, fileName, data} = event.data;

                if (message === 'error') {
                    resolve([fileName, data]);
                    onComplete();
                    return;
                }

                // zip 파일인 경우 다시 worker pool 추가
                if (message === 'extractPackage') {
                    workerPool.release(worker);
                    Promise
                        .all(data.map((file) => {
                            return runner(file);
                        }))
                        .then((textList) => {
                            const textResult = textList.map(([name, text]) => {
                                return {name, text};
                            });
                            resolve([fileName, textResult]);
                        }).catch((error) => {
                            resolve([fileName, error]);
                        })
                    return;
                }

                if (message === 'checkPassword') {
                    worker.postMessage({
                        message: 'setPassword',
                        password: prompt('input your password')
                    });
                }

                if (message === 'textResult') {
                    resolve([fileName, data]);
                    onComplete();
                }
            },
            postMessage: {message: 'parseFile', uri, password: getInitialPassword()},
        });
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
        .then((data) => {
            const loadTime = (new Date().getTime() - startTime) / 1000;
            if (confirm('실행시간은 ' + loadTime + ' 입니다. 결과를 보시겠습니까?')) {
                data.forEach(([fileName, text]) => {
                    showTexts(fileName, text);
                });
            }
        })
        .catch((error) => {
            console.log('error:', error);
        })
        .finally(() => {
            // workerPool.destroy();
            console.log('load time:', (new Date().getTime() - startTime) / 1000)
        });
};

document.addEventListener('DOMContentLoaded', () => {
    const dragDropArea = document.getElementById('drag-drop-area');
    const dragFile = document.getElementById('drag-file');
    const urlLoadButton = document.getElementById('url-button');
    const urlInput = document.getElementById('url-input');

    createWorkerPool();

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
        stopEvent(e);
        currentTarget.className = '';

        loadWorker({type: 'file', files});
    });

    dragFile.addEventListener('change', (e) => {
        const {target} = e;
        const {files} = target;
        stopEvent(e);

        loadWorker({type: 'file', files});
    });
});
