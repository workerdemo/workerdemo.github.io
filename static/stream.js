let sentenceBuffer = '';

function processStreamChunk(text) {
  sentenceBuffer += text;

  // 마침표나 개행 단위로 끊어서 출력
  const parts = sentenceBuffer.split(/(?<=[.?!])\s|\n/); // 마침표 + 공백 or 개행 기준

  while (parts.length > 1) {
    const sentence = parts.shift();
    console.log('완성된 문장:', sentence.trim());
  }

  sentenceBuffer = parts[0]; // 남은 덜 끝난 문장은 다시 저장
}

async function fetchTTS(text) {
  const res = await fetch('https://motiveko.mooo.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer sk-kLTf_EJKcp5CEcua7iundw`
    },
    body: JSON.stringify({
      model: 'tts-1', // 또는 'tts-1-hd'
      input: text,
      /*
      alloy 중성적이고 차분한 남성 목소리
      echo 따뜻하고 친근한 여성 목소리
      fable 약간 서사적인 느낌의 목소리, 동화 느낌 가능
      onyx 저음이고 깊이 있는 남성 목소리
      nova 기본 여성형 목소리, 명료하고 자연스러움
      shimmer 밝고 생동감 있는 여성 목소리, 약간의 발랄함
      */
      voice: 'nova',
      response_format: 'mp3'
    })
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function extractGPTReply(data) {
  if (!data || !Array.isArray(data.choices)) return '';

  return data.choices
    .map(c => c.message?.content || '')
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

async function streamChat(continer, fileName, message) {
  const podcastIcon = continer.querySelector(".podcast-icon");
  const fileText = continer.querySelector(".file-text");
  const podcastAudio = continer.querySelector("#podcast-audio");
  const streamTextWrapper = continer.querySelector(".stream-text");
  const streamText = continer.querySelector(".stream-text span");

  podcastAudio.style.display = "none";
  streamText.textContent = "텍스트 요약 중...";

  console.log('message:', message.length);

  const summaryData = continer.getAttribute("data-summary-data");
  let streamResponseData = summaryData;
  
  if (!summaryData) {
    const response = await fetch("https://motiveko.mooo.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer sk-kLTf_EJKcp5CEcua7iundw`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // stream: true,
        messages: [
          {
            role: "system",
            content:
              "입력한 내용을 요약해서 알려줘",
          },
          { role: "user", content: `fine name: ${fileName}\n\n${message.substring(0, 190000)}` },
        ],
      }),
    });

    const data = await response.json();
    streamResponseData = extractGPTReply(data);
  }

  streamTextWrapper.classList.add('audio-streaming');
  streamText.textContent = "음성 생성 중...";
  
  const url = await fetchTTS(streamResponseData);

  streamTextWrapper.classList.remove('audio-streaming');
  podcastAudio.style.display = "";
  streamTextWrapper.parentNode.removeChild(streamTextWrapper);

  const currentTime = continer.querySelector("#current-time");
  const duration = continer.querySelector("#duration");
  const podcastPlayPause = continer.querySelector("#podcast-play-pause");
  const seekbar = continer.querySelector("#seekbar");

  // 시크바 업데이트 함수
  const updateSeekbar = () => {
    const value = (seekbar.value / seekbar.max) * 100;
    seekbar.style.backgroundSize = `${value}% 100%`;
  };

  // 사용자가 시크바를 조작할 때
  seekbar.addEventListener('input', () => {
    podcastAudio.currentTime = seekbar.value;
    updateSeekbar();
  });

  podcastAudio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(podcastAudio.duration);
    seekbar.max = Math.floor(podcastAudio.duration);
    updateSeekbar();
  });

  podcastAudio.addEventListener('timeupdate', () => {
    currentTime.textContent = formatTime(podcastAudio.currentTime);
    seekbar.value = Math.floor(podcastAudio.currentTime);
    updateSeekbar();
  });
  
  // 초기 시크바 스타일 설정
  updateSeekbar();

  podcastAudio.playbackRate = 1.1;
  podcastAudio.src = url // 'static/test.mp3';
  podcastAudio.play();

  // 재생 상태에 따라 클래스 토글 함수
  function togglePlayPauseIcon(element, isPlaying) {
    if (isPlaying) {
      element.classList.add('playing');
      element.classList.remove('paused');
    } else {
      element.classList.add('paused');
      element.classList.remove('playing');
    }
  }

  podcastPlayPause.addEventListener('click', () => {
    if (podcastAudio.paused) {
      podcastAudio.play();
      togglePlayPauseIcon(podcastPlayPause, true);
    } else {
      podcastAudio.pause();
      togglePlayPauseIcon(podcastPlayPause, false);
    }
  });

  podcastAudio.addEventListener('play', () => {
    togglePlayPauseIcon(podcastPlayPause, true);
  });

  podcastAudio.addEventListener('pause', () => {
    togglePlayPauseIcon(podcastPlayPause, false);
  });

  // 초기 상태 설정 (일시정지 상태)
  togglePlayPauseIcon(podcastPlayPause, false);

  // const reader = response.body.getReader();
  // const decoder = new TextDecoder("utf-8");
  // let buffer = "";

  // while (true) {
  //   const { value, done } = await reader.read();
  //   if (done) break;

  //   buffer += decoder.decode(value, { stream: true });

  //   // OpenAI는 "data: {json}" 형태로 SSE 전송
  //   const lines = buffer
  //     .split("\n")
  //     .filter((line) => line.trim().startsWith("data: "));
  //   for (const line of lines) {
  //     const json = line.replace(/^data: /, "");
  //     if (json === "[DONE]") return;

  //     const delta = JSON.parse(json).choices?.[0]?.delta?.content;
  //     if (delta) {
  //       // 🔽 여기에서 마침표 또는 개행 단위로 처리 가능
  //       processStreamChunk(delta);
  //     }
  //   }

  //   // 남은 버퍼 정리
  //   buffer = buffer.split("\n").pop(); // 마지막 덜 끝난 줄만 남김
  // }
}
