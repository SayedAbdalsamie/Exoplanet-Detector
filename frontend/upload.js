// Upload page functionality
const fileInput = document.getElementById("fileInput")
const uploadZone = document.getElementById("uploadZone")
const uploadText = document.getElementById("uploadText")
const analyzeBtn = document.getElementById("analyzeBtn")
const loadingAnimation = document.getElementById("loadingAnimation")

let selectedFile = null
let selectedDataset = null

const datasetCards = document.querySelectorAll(".dataset-preview-card")

datasetCards.forEach((card) => {
    card.addEventListener("click", () => {
        datasetCards.forEach((c) => c.classList.remove("selected"))
        card.classList.add("selected")
        selectedDataset = card.dataset.dataset
        updateAnalyzeButton()
    })
})

function drawLightCurve(canvasId, datasetType) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const points = 100
    const data = []

    for (let i = 0; i < points; i++) {
        const x = (i / points) * width
        let y = height / 2
        y += (Math.random() - 0.5) * 10

        if (datasetType === "kepler-90") {
            if ((i > 20 && i < 25) || (i > 45 && i < 50) || (i > 70 && i < 75)) {
                y += 20
            }
        } else if (datasetType === "tess-1") {
            if (i > 40 && i < 50) {
                y += 25
            }
        } else if (datasetType === "k2-18") {
            if (i > 35 && i < 42) {
                y += 18
            }
        } else if (datasetType === "trappist-1") {
            if ((i > 15 && i < 18) || (i > 30 && i < 33) || (i > 50 && i < 53) || (i > 70 && i < 73) || (i > 85 && i < 88)) {
                y += 15
            }
        }

        data.push({ x, y })
    }

    ctx.strokeStyle = "rgba(160, 168, 212, 0.1)"
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
        const y = (i / 4) * height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
    }

    ctx.strokeStyle = "#3c46d1"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(data[0].x, data[0].y)
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(data[i].x, data[i].y)
    }
    ctx.stroke()

    ctx.fillStyle = "#3c46d1"
    data.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
        ctx.fill()
    })
}

window.addEventListener("load", () => {
    drawLightCurve("chart-kepler-90", "kepler-90")
    drawLightCurve("chart-tess-1", "tess-1")
    drawLightCurve("chart-k2-18", "k2-18")
    drawLightCurve("chart-trappist-1", "trappist-1")
})

fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
        selectedFile = e.target.files[0]
        uploadText.textContent = selectedFile.name
        datasetCards.forEach((c) => c.classList.remove("selected"))
        selectedDataset = null
        updateAnalyzeButton()
    }
})

uploadZone.addEventListener("dragenter", (e) => {
    e.preventDefault()
    uploadZone.classList.add("drag-active")
})

uploadZone.addEventListener("dragleave", (e) => {
    e.preventDefault()
    uploadZone.classList.remove("drag-active")
})

uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault()
})

uploadZone.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadZone.classList.remove("drag-active")

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        selectedFile = e.dataTransfer.files[0]
        fileInput.files = e.dataTransfer.files
        uploadText.textContent = selectedFile.name
        datasetCards.forEach((c) => c.classList.remove("selected"))
        selectedDataset = null
        updateAnalyzeButton()
    }
})

function updateAnalyzeButton() {
    if (selectedFile || selectedDataset) {
        analyzeBtn.disabled = false
    } else {
        analyzeBtn.disabled = true
    }
}

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : ""

let backendAvailable = true

async function checkBackendHealth() {
    try {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal })
        clearTimeout(id)
        backendAvailable = res.ok
    } catch (_) {
        backendAvailable = false
    }

    if (!backendAvailable) {
        // Create or update a banner to inform the user
        let banner = document.getElementById("backendDownBanner")
        if (!banner) {
            banner = document.createElement("div")
            banner.id = "backendDownBanner"
            banner.style.cssText =
                "margin: 1rem auto; max-width: 42rem; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #2a3166; background: rgba(239,68,68,0.1); color: #fca5a5; font-weight:600; text-align:center;"
            banner.textContent = "Backend is not running. Please start the server to enable predictions."
            const container = document.querySelector(".upload-content") || document.body
            container.prepend(banner)
        }
        analyzeBtn.disabled = true
    }
}

// Run health check on page load
checkBackendHealth()

// Whitelist of numeric-only features and common aliases
const FEATURE_ALIASES = {
    orbital_period: ["orbital_period", "period", "koi_period", "pl_orbper"],
    transit_depth: ["transit_depth", "depth", "koi_depth", "tran_depth"],
    radius_ratio: ["radius_ratio", "rp_rs", "koi_ror", "pl_ratror"],
    stellar_radius: ["stellar_radius", "st_radius", "koi_srad", "st_rad"],
    stellar_mass: ["stellar_mass", "st_mass", "koi_smass", "st_mass"],
    signal_to_noise: ["signal_to_noise", "snr", "koi_snr"],
    duration_hours: ["duration_hours", "dur_hours", "koi_duration", "tran_dur"]
}

function normalizeHeader(h) {
    return String(h).trim().toLowerCase().replace(/\s+/g, "_")
}

function selectHeaderIndices(headerRow) {
    const indices = []
    const headers = headerRow.map(normalizeHeader)
    for (const target in FEATURE_ALIASES) {
        const aliases = FEATURE_ALIASES[target]
        const idx = headers.findIndex(h => aliases.includes(h))
        if (idx !== -1) indices.push({ idx, name: target })
    }
    return indices
}

async function buildFilteredCSVBlob(file) {
    try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(l => l.length > 0)
        if (lines.length === 0) return null
        const header = lines[0].split(/,|\t|;|\|/)
        const selected = selectHeaderIndices(header)
        if (selected.length === 0) return null
        const outHeader = selected.map(s => s.name).join(",")
        const outLines = [outHeader]
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/,|\t|;|\|/)
            const row = selected.map(s => (parts[s.idx] !== undefined ? parts[s.idx] : ""))
            outLines.push(row.join(","))
        }
        const outCSV = outLines.join("\n")
        return new Blob([outCSV], { type: "text/csv" })
    } catch (e) {
        return null
    }
}

analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile && !selectedDataset) {
        alert("Please upload a file or select a sample dataset")
        return
    }

    if (!backendAvailable) {
        alert("Backend is not running. Start the server and try again.")
        return
    }

    loadingAnimation.style.display = "block"
    analyzeBtn.disabled = true

    try {
        const formData = new FormData()
        if (selectedFile) {
            let fileToSend = selectedFile
            if (selectedFile.name.toLowerCase().endsWith(".csv")) {
                const filtered = await buildFilteredCSVBlob(selectedFile)
                if (filtered) {
                    fileToSend = new File([filtered], selectedFile.name.replace(/\.csv$/i, "_filtered.csv"), { type: "text/csv" })
                }
            }
            formData.append("file", fileToSend)
        }
        if (selectedDataset) formData.append("dataset", selectedDataset)

        const response = await fetch(`${API_BASE}/api/predict`, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            let serverMsg = ""
            try {
                const ct = response.headers.get("content-type") || ""
                if (ct.includes("application/json")) {
                    const err = await response.json()
                    serverMsg = err && err.error ? `\nDetails: ${err.error}` : ""
                } else {
                    const text = await response.text()
                    serverMsg = text ? `\nDetails: ${text.substring(0, 300)}` : ""
                }
            } catch (_) { }
            throw new Error(`Request failed: ${response.status}${serverMsg}`)
        }

        const result = await response.json()
        sessionStorage.setItem("exoplanetResults", JSON.stringify(result))
        window.location.href = "results.html"
    } catch (err) {
        console.error(err)
        alert(`Prediction failed. Please ensure the backend is running.${err && err.message ? "\n" + err.message : ""}`)
    } finally {
        loadingAnimation.style.display = "none"
        analyzeBtn.disabled = false
    }
})



