const stopEvent = function (e) {
  e.preventDefault();
  e.stopPropagation();
};

const getFileSizeInMB = (size) => {
  return (size / (1024 * 1024)).toFixed(2); // 바이트를 MB로 변환하여 소수점 2자리까지 표시
};

const fileIconsMap = {
  doc: { background: "#235d9c" },
  docx: { background: "#2980b9" },
  ppt: { background: "#ce4123" },
  pptx: { background: "#ac3a1f" },
  xls: { background: "#86d44c" },
  xlsx: { background: "#6cbf2e" },
  pdf: { background: "#f88e21" },
  hwp: { background: "#1e5cb3" }, // 한글 전용 추가 색상
};

function getFileIconStyle(extension) {
  const icon = fileIconsMap[extension] || { background: "#ccc", color: "#fff" };
  return {
    backgroundColor: icon.background,
    color: icon.color || "#fff",
  };
}

function getFileIcon(props) {
  const extension = props.extension || "txt";
  const { backgroundColor, color } = getFileIconStyle(extension);

  return `
  <svg
      fill="none"
      aria-hidden="true"
      style="width: 20px; height: 20px;"
      viewBox="0 0 20 20"
    >
      <g clipPath="url(#clip0_3173_1381)">
        <path
          fill="#E2E5E7"
          d="M5.024.5c-.688 0-1.25.563-1.25 1.25v17.5c0 .688.562 1.25 1.25 1.25h12.5c.687 0 1.25-.563 1.25-1.25V5.5l-5-5h-8.75z"
        />
        <path
          fill="#B0B7BD"
          d="M15.024 5.5h3.75l-5-5v3.75c0 .688.562 1.25 1.25 1.25z"
        />
        <path fill="#CAD1D8" d="M18.774 9.25l-3.75-3.75h3.75v3.75z" />
        <path
          fill="${backgroundColor}"
          d="M16.274 16.75a.627.627 0 01-.625.625H1.899a.627.627 0 01-.625-.625V10.5c0-.344.281-.625.625-.625h13.75c.344 0 .625.281.625.625v6.25z"
        />
      </g>
      <text
        x="45%"
        y="16"
        fill="${color}"
        font-weight="bolder"
        text-anchor="middle"
        style="font-size: 5px;"
      >${extension.trim().toUpperCase()}</text>
    </svg>
  `
}

function getSummarizeIcon () {
  return `
  <span class="file-summarize" style="cursor: pointer;">
    <svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-ai"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M10 21h-3a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M14 21v-4a2 2 0 1 1 4 0v4" /><path d="M14 19h4" /><path d="M21 15v6" /></svg>
  </span>
  `
}

// 모달 제어 함수
function showSummaryModal(fileMessageNode, fileName = '', fileContent = '') {  
  // 모달 표시
  // const modal = document.getElementById('summaryModal');
  
  // // 파일 제목 설정
  // const fileNameElement = document.getElementById('fileName');
  // fileNameElement.textContent = fileName || '파일 제목 없음';
  
  // // 파일 내용 설정
  // const fileContentElement = document.getElementById('fileContent');
  // fileContentElement.textContent = fileContent || '표시할 내용이 없습니다.';
  
  // // 모달 표시
  // modal.style.display = 'flex';
  
  // // 확인 버튼 이벤트 리스너
  // document.getElementById('confirmSummary').onclick = function() {
  //   modal.style.display = 'none';
  //   summarizeText(fileMessageNode, fileName, fileContent);
  //   fileMessageNode.setAttribute("data-start-summary", "true");
  // };
  
  // // 취소 버튼 이벤트 리스너
  // document.getElementById('cancelSummary').onclick = function() {
  //   modal.style.display = 'none';
  // };

  summarizeText(fileMessageNode, fileName, fileContent);
  fileMessageNode.setAttribute("data-start-summary", "true");
}

function getPodCastIcon () {
  return `
  <span class="podcast-icon">
    <svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-headphones"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 13m0 2a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" /><path d="M15 13m0 2a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" /><path d="M4 15v-3a8 8 0 0 1 16 0v3" /></svg>
  </span>
  `
}

const showTexts = (name, data, files) => {
  const textResultWrapper = document.getElementById("text-result-wrapper");
  const createHtml = (fileName, text) => {
    return (
      '<div class="row">' +
      '<div class="col-3">' +
      '<div class="result-title"><i class="bi bi-file-earmark-text"></i>' +
      fileName +
      "</div>" +
      "</div>" +
      '<div class="col">' +
      '<textarea id="text-result">' +
      text +
      "</textarea>" +
      "</div>" +
      "</div>"
    );
  };

  const items = data instanceof Array ? data : [{ name, text: data }];
  items.forEach((value, index) => {
    const { name: fileName, text, blob } = value;
    if (text?.isZip) {
      const listWrapper = document.createElement("div");
      listWrapper.className = "message sent file-list";

      let listHTML = `
                <div class="file-list-content">
                    <div class="file-list-header">
                        <i class="bi bi-file-earmark-zip"></i>
                        <span class="file-list-name">${fileName.substring(0, fileName.lastIndexOf(".")).toUpperCase()}</span>
                    </div>
                    <div style="padding: 2px 0; font-size: 8px;">
                        아래의 문서가 포함되어 있습니다.<br>(클릭하면 새로운 첨부로 선택할 수 있습니다.)
                    </div>
                    <ul class="file-list-items">`;

      text.items.forEach((item) => {
        listHTML += `
                    <li class="file-list-item">
                        ${getFileIcon({ extension: item.name.split(".").pop() })}
                        <span>${item.name.substring(
                          item.name.indexOf("/") + 1
                        ).trim()}</span>
                    </li>`;
      });

      listHTML += `
                    </ul>
                </div>`;

      listWrapper.innerHTML = listHTML;
      document.getElementById("chat-messages").appendChild(listWrapper);

      // 리스트 아이템 클릭 시 해당 파일 표시
      listWrapper
        .querySelectorAll(".file-list-item")
        .forEach((itemEl, index) => {
          itemEl.addEventListener("click", () => {
            const item = text.items[index];
            showTexts(item.name, item.text, [item.blob]);
          });
        });

      return;
    }

    const messageDiv = document.createElement("div");
    const displayFileName = fileName.substring(0, fileName.lastIndexOf("."));
    messageDiv.className = "message sent file-message";
    messageDiv.innerHTML = `
            <div class="file-message-content">
            <div class="file-header">
                <span class="file-name">${displayFileName}</span>
                <span class="file-icon">${getFileIcon({ extension: fileName.split(".").pop()})}</span>
                ${getSummarizeIcon()}
                ${getPodCastIcon()}
            </div>
            <div class="file-description">
                <span>유효기간: ~2025.12.31<br>용량: ${getFileSizeInMB(
                  blob?.size || files[index]?.size
                )}MB</span> 
            </div>
            <div class="file-text">${text.trim()}</div>
            <div class="file-summarize-text">
              <span class="summarize-stream-text">
                <span>텍스트 요약 중...</span>
              </span>
            </div>
            <div class="file-audio">
              <span class="stream-text">
                <span>스트리밍 중...</span>
              </span>
              <audio id="podcast-audio"></audio>
              <div class="audio-controls">
                <button id="podcast-play-pause" class="paused">
                  <svg class="play-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                  </svg>
                  <div class="stop-icon"></div>
                </button>
                <div class="audio-time">
                  <span id="current-time">00:00</span> / <span id="duration">00:00</span>
                </div>
              </div>
              <div class="seekbar">
                <input type="range" id="seekbar" value="0" step="1">
              </div>
            </div>
        `;
    const messagesContainer = document.getElementById("chat-messages");
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const fileDescription = messageDiv.querySelector(".file-description");
    const messageContent = messageDiv.querySelector(".file-message-content");
    const fileText = messageDiv.querySelector(".file-text");
    const podcastIcon = messageDiv.querySelector(".podcast-icon");
    const fileAudio = messageDiv.querySelector(".file-audio");
    const summarizeBtn = messageDiv.querySelector('.file-summarize');
    // 초기에는 initial 클래스 추가
    messageContent.classList.add("initial");
    messageContent.style.transform = "translateY(0px)";

    fileText.addEventListener("click", (e) => {
      // 현재 확장 상태 토글
      const isExpanding = messageContent.classList.contains("expanded");

      if (messageContent.classList.contains("initial")) {
        messageContent.classList.remove("initial");
      }

      fileText.scrollTop = 0;
      // 확장 상태에 따라 클래스 토글
      if (isExpanding) {
        messageContent.classList.remove("expanded");
        podcastIcon.style.display = "";
      } else {
        messageContent.classList.add("expanded");
        podcastIcon.style.display = "none";
      }
    });

    let togglePodcast = false;
    let isStreamStarted = false;
    podcastIcon.addEventListener("click", (e) => {
      if (!isStreamStarted) {
        isStreamStarted = true;
        (async () => {
          await streamChat(messageDiv, displayFileName, text);
        })();
      }
      if (togglePodcast) {
        fileText.style.display = "";
        fileAudio.style.display = "";
        podcastIcon.classList.remove("active");
      } else {
        fileText.style.display = "none";
        fileAudio.style.display = "flex";
        podcastIcon.classList.add("active");
      }

      togglePodcast = !togglePodcast;
    });

    summarizeBtn.addEventListener("click", () => {
      if (messageDiv.getAttribute("data-start-summary") !== 'true') {
        showSummaryModal(messageDiv, displayFileName, text);
      }
    });
  });
};

const loadNonWorker = (files) => {
  const startTime = new Date().getTime();
  const promises = Object.entries(files).map(
    ([, file]) =>
      new Promise((resolve) => {
        const docToText = new DocToText({ password: "" });
        const { name } = file;
        docToText
          .parse(file)
          .then((text) => {
            resolve([name, text]);
          })
          .catch((error) => {
            resolve([name, error]);
          });
      })
  );

  Promise.all(promises)
    .then((data) => {
      data.forEach(([fileName, text]) => {
        console.log('text:', text);
        if (typeof text === "string") {
          const resultText = text.replace(/\n{2,}/g, "\n\n");
          showTexts(fileName, resultText, files);
        } else {
          showTexts(fileName, text, files);
        }
      });
    })
    .catch((error) => {
      console.log("error:", error);
    })
    .finally(() => {
      console.log("load time:", (new Date().getTime() - startTime) / 1000);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  const dragDropArea = document.getElementById("chat-messages");
  const dragFile = document.getElementById("file-input");

  dragDropArea.addEventListener("dragover", (e) => {
    stopEvent(e);
    e.currentTarget.classList.add("drag-on");
  });

  dragDropArea.addEventListener("dragenter", (e) => {
    stopEvent(e);
  });

  dragDropArea.addEventListener("dragleave", (e) => {
    stopEvent(e);
    e.currentTarget.classList.remove("drag-on");
  });

  dragDropArea.addEventListener("drop", (e) => {
    const { currentTarget, dataTransfer } = e;
    const { files } = dataTransfer;

    currentTarget.classList.remove("drag-on");

    stopEvent(e);
    loadNonWorker(files);
  });

  dragFile.addEventListener("change", (e) => {
    const { target } = e;
    const { files } = target;
    stopEvent(e);

    loadNonWorker(files);
  });
});
