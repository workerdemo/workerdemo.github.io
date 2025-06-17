function summarizeText(fileMessageNode, fileName, message) {
    (async () => {
        const fileSummaryText = fileMessageNode.querySelector(".file-summarize-text");
        fileSummaryText.style.display = "flex";

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
        const gptReply = extractGPTReply(data);

        fileSummaryText.remove();
        fileMessageNode.setAttribute("data-summary-data", gptReply);
        fileMessageNode.querySelector(".file-text").textContent = gptReply;
        fileMessageNode.querySelector('.file-summarize').remove();
    })();
}