document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm")
  const btn = document.getElementById("btn-login")
  let submitting = false

  form?.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (submitting) return
    submitting = true
    btn?.setAttribute("disabled", "true")

    const email = document.getElementById("login-email").value.trim()
    const password = document.getElementById("login-password").value

    const emailErr = document.getElementById("login-email-error")
    const passErr = document.getElementById("login-password-error")

    emailErr.textContent = ""
    passErr.textContent = ""

    let valid = true

    if (!email) {
      emailErr.textContent = "Email is required"
      valid = false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailErr.textContent = "Enter a valid email"
      valid = false
    }

    if (!password) {
      passErr.textContent = "Password is required"
      valid = false
    }

    if (!valid) {
      submitting = false
      btn?.removeAttribute("disabled")
      return
    }

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || res.statusText)

      Auth.setToken("session")
      if (data?.user?.name) localStorage.setItem("userName", data.user.name)

      const url = new URL(window.location.href)
      const redirect = url.searchParams.get("redirect") || "/frontend/dashboard.html"
      window.location.replace(redirect)
    } catch (err) {
      emailErr.textContent = err.message || "Login failed"
    } finally {
      submitting = false
      btn?.removeAttribute("disabled")
    }
  })
})
