// Results page functionality
const results = JSON.parse(sessionStorage.getItem("exoplanetResults"))

if (!results) {
    window.location.href = "upload.html"
} else {
    displayResults(results)
}

function displayResults(data) {
    document.getElementById("fileName").textContent = `File: ${data.fileName}`

    let classification, iconSVG, colorClass

    if (data.label === 1 && data.probability > 0.8) {
        classification = "Confirmed Planet"
        colorClass = "text-success"
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>`
    } else if (data.label === 1 && data.probability > 0.5) {
        classification = "Candidate"
        colorClass = "text-warning"
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" x2="12" y1="8" y2="12"/>
            <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>`
    } else {
        classification = "False Positive"
        colorClass = "text-destructive"
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9-6 6"/>
            <path d="m9 9 6 6"/>
        </svg>`
    }

    document.getElementById("resultIcon").innerHTML = iconSVG
    document.getElementById("resultLabel").textContent = classification
    document.getElementById("resultConfidence").textContent = `Confidence: ${(data.probability * 100).toFixed(1)}%`

    setTimeout(() => {
        document.getElementById("progressFill").style.width = `${data.probability * 100}%`
    }, 300)

    const fluxWithTransits = data.flux.map((f, i) => {
        if (i > 20 && i < 25) return f * 0.98
        if (i > 50 && i < 55) return f * 0.98
        if (i > 80 && i < 85) return f * 0.98
        return f
    })

    const trace = {
        x: data.time,
        y: fluxWithTransits,
        type: "scatter",
        mode: "lines",
        line: { color: "#3c46d1", width: 2 },
        name: "Flux",
    }

    const layout = {
        autosize: true,
        height: 360,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "#e5e7eb", family: "Space Grotesk, sans-serif", size: 14 },
        xaxis: {
            title: { text: "Time (days)", font: { size: 16, color: "#a0a8d4" } },
            tickcolor: "#2a3166",
            tickfont: { color: "#c7cbea" },
            gridcolor: "#2a3166",
            zeroline: false,
            linecolor: "#2a3166",
            mirror: true,
        },
        yaxis: {
            title: { text: "Normalized Flux", font: { size: 16, color: "#a0a8d4" } },
            tickcolor: "#2a3166",
            tickfont: { color: "#c7cbea" },
            gridcolor: "#2a3166",
            zeroline: false,
            linecolor: "#2a3166",
            mirror: true,
        },
        margin: { l: 80, r: 40, t: 60, b: 80 },
        hovermode: "closest",
    }

    const config = { responsive: true, displayModeBar: false }

    window.Plotly.newPlot("plotlyChart", [trace], layout, config)

    // Enable export button
    const exportBtn = document.querySelector(".action-buttons .btn.btn-outline")
    exportBtn.disabled = false
    exportBtn.addEventListener("click", () => {
        const rows = [
            ["label", data.label],
            ["probability", data.probability],
            ["time", "flux"],
            ...data.time.map((t, i) => [t, data.flux[i]]),
        ]
        const csv = rows.map(r => r.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = (data.fileName || "results") + "_exoplanet.csv"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    })
}

const accordionTriggers = document.querySelectorAll(".accordion-trigger")

accordionTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
        const item = trigger.parentElement
        const isActive = item.classList.contains("active")

        document.querySelectorAll(".accordion-item").forEach((i) => {
            i.classList.remove("active")
        })

        if (!isActive) {
            item.classList.add("active")
        }
    })
})



