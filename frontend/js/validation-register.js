document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm")

  form?.addEventListener("submit", async (e) => {
    e.preventDefault()
    let valid = true

    const name = document.getElementById("reg-name").value.trim()
    const email = document.getElementById("reg-email").value.trim()
    const password = document.getElementById("reg-password").value
    const chk = document.getElementById("human-check")
    const notRobot = chk.checked

    const nameErr = document.getElementById("reg-name-error")
    const emailErr = document.getElementById("reg-email-error")
    const passErr = document.getElementById("reg-password-error")
    const robotErr = document.getElementById("human-check-error")

    nameErr.textContent = ""
    emailErr.textContent = ""
    passErr.textContent = ""
    robotErr.textContent = ""

    if (!name) {
      nameErr.textContent = "Name is required"
      valid = false
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      nameErr.textContent = "Name can only contain letters"
      valid = false
    }

    if (!email) {
      emailErr.textContent = "Email is required"
      valid = false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailErr.textContent = "Enter a valid email"
      valid = false
    }

    if (password.length < 8) {
      passErr.textContent = "Password must be at least 8 characters"
      valid = false
    }

    if (!notRobot) {
      robotErr.textContent = "Please confirm you are not a bot"
      valid = false
    }

    if (!valid) return

    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || res.statusText)

      Auth.setToken("session")
      localStorage.setItem("userName", data?.user?.name || name)
      Auth.completeLoginAndRedirect("/frontend/dashboard.html")
    } catch (err) {
      emailErr.textContent = err.message || "Registration failed"
    }
  })
})
