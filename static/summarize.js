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
