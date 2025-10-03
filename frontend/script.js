// Starfield animation
const canvas = document.getElementById("starfield")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const stars = []
const numStars = 200

for (let i = 0; i < numStars; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random(),
        speed: Math.random() * 0.5,
    })
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    stars.forEach((star) => {
        star.opacity += star.speed * (Math.random() > 0.5 ? 1 : -1)
        if (star.opacity > 1) star.opacity = 1
        if (star.opacity < 0.3) star.opacity = 0.3

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
    })

    requestAnimationFrame(animateStars)
}

animateStars()

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
})

const currentPage = window.location.pathname.split("/").pop() || "index.html"
const navLinks = document.querySelectorAll(".nav-link")

navLinks.forEach((link) => {
    const href = link.getAttribute("href")
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
        link.classList.add("active")
    } else {
        link.classList.remove("active")
    }
})



