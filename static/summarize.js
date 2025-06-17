const token = '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';

function summarizeText(fileMessageNode, fileName, message) {
    (async () => {
        const fileSummaryText = fileMessageNode.querySelector(".file-summarize-text");
        fileSummaryText.style.display = "flex";

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
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
        const gptReply = extractGPTReply(data);

        fileSummaryText.remove();
        fileMessageNode.setAttribute("data-summary-data", gptReply);
        fileMessageNode.querySelector(".file-text").textContent = gptReply;
        fileMessageNode.querySelector('.file-summarize').remove();
    })();
}
