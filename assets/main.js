const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

const links = document.querySelectorAll(".nav-link");
const path = window.location.pathname.split("/").pop() || "index.html";

links.forEach((link) => {
  const href = link.getAttribute("href");
  if (href === path) {
    link.classList.add("active");
  }
});

const SETTINGS_KEY = "kkroy_settings_v1";
const ADMIN_AUTH_KEY = "kkroy_admin_auth";
const SUBMISSIONS_KEY = "kkroy_submissions_v1";
const ADMIN_CREDENTIALS = {
  id: "rupeshyadav@gmail.com",
  password: "Anand845424",
};
const SETTINGS_ENDPOINT = "/.netlify/functions/settings";
const SUBMISSIONS_ENDPOINT = "/.netlify/functions/submissions";
const DEFAULT_SETTINGS = {
  phone: "+91 98765 43210",
  email: "kkrry.nursinghome@gmail.com",
  address: "Station Road, Muzaffarpur, Bihar 842001",
  logoUrl: "",
  heroImageUrl: "",
  doctorPhotos: {
    "kk-roy": "",
    "r-sinha": "",
    "a-patel": "",
  },
  doctorEmails: {
    "kk-roy": "kkroy.nursinghome@gmail.com",
    "r-sinha": "rsinha.nursinghome@gmail.com",
    "a-patel": "apatel.nursinghome@gmail.com",
  },
};

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      doctorPhotos: {
        ...DEFAULT_SETTINGS.doctorPhotos,
        ...(parsed.doctorPhotos || {}),
      },
      doctorEmails: {
        ...DEFAULT_SETTINGS.doctorEmails,
        ...(parsed.doctorEmails || {}),
      },
    };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

async function fetchSettings() {
  try {
    const response = await fetch(SETTINGS_ENDPOINT);
    if (!response.ok) throw new Error("Failed to fetch settings");
    const data = await response.json();
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      doctorPhotos: {
        ...DEFAULT_SETTINGS.doctorPhotos,
        ...(data.doctorPhotos || {}),
      },
      doctorEmails: {
        ...DEFAULT_SETTINGS.doctorEmails,
        ...(data.doctorEmails || {}),
      },
    };
  } catch (error) {
    return getSettings();
  }
}

async function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    await fetch(SETTINGS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  } catch (error) {
    // Fallback to localStorage only when offline.
  }
}

function applySettings(settings) {
  document.querySelectorAll("[data-phone]").forEach((el) => {
    el.textContent = settings.phone;
  });
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = settings.email;
  });
  document.querySelectorAll("[data-address]").forEach((el) => {
    el.textContent = settings.address;
  });

  document.querySelectorAll(".brand").forEach((brand) => {
    const logo = brand.querySelector("[data-brand-logo]");
    if (logo && settings.logoUrl) {
      logo.src = settings.logoUrl;
      brand.classList.add("has-logo");
    } else {
      brand.classList.remove("has-logo");
    }
  });

  document.querySelectorAll("[data-hero-image]").forEach((img) => {
    if (settings.heroImageUrl) {
      img.src = settings.heroImageUrl;
    }
  });

  document.querySelectorAll("[data-doctor-id]").forEach((img) => {
    const id = img.dataset.doctorId;
    const url = settings.doctorPhotos[id];
    if (url) {
      img.src = url;
    }
  });

  document.querySelectorAll("[data-doctor-email]").forEach((el) => {
    const id = el.dataset.doctorEmail;
    const email = settings.doctorEmails[id];
    if (email) {
      el.textContent = email;
    }
  });
}

fetchSettings().then((settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applySettings(settings);
});

const appointmentForm = document.querySelector("[data-appointment-form]");
const contactForm = document.querySelector("[data-contact-form]");

function saveSubmission(type, values) {
  const existing = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]");
  const entry = {
    id: Date.now(),
    type,
    values,
    submittedAt: new Date().toISOString(),
  };
  existing.unshift(entry);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(existing));

  fetch(SUBMISSIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, values }),
  }).catch(() => {});
}

function handleFormSubmit(form, messageId, type) {
  if (!form) return;

  const status = document.getElementById(messageId);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    saveSubmission(type, values);

    if (status) {
      status.classList.add("show");
      status.textContent =
        "Thank you, " +
        (values.name || "patient") +
        "! We received your request and will call you shortly.";
    }
    form.reset();
  });
}

handleFormSubmit(appointmentForm, "appointment-status", "Appointment");
handleFormSubmit(contactForm, "contact-status", "Contact");

const adminForm = document.querySelector("[data-admin-form]");
const loginForm = document.querySelector("[data-login-form]");

function requireAdminAuth() {
  if (!adminForm) return;
  const isAuthed = localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  if (!isAuthed) {
    window.location.href = "admin-login.html";
  }
}

function setupLoginForm() {
  if (!loginForm) return;
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const id = String(formData.get("login-id") || "").trim();
    const password = String(formData.get("login-password") || "").trim();
    const status = document.getElementById("login-status");

    if (id === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      window.location.href = "admin.html";
      return;
    }

    if (status) {
      status.classList.add("show");
      status.textContent = "Invalid login. Please check your credentials.";
    }
  });
}

function collectSettingsFromForm() {
  return {
    phone: adminForm.querySelector("#clinic-phone").value.trim(),
    email: adminForm.querySelector("#clinic-email").value.trim(),
    address: adminForm.querySelector("#clinic-address").value.trim(),
    logoUrl: adminForm.querySelector("#clinic-logo-url").value.trim(),
    heroImageUrl: adminForm.querySelector("#clinic-hero-url").value.trim(),
    doctorPhotos: {
      "kk-roy": adminForm.querySelector("#doctor-kk-roy-url").value.trim(),
      "r-sinha": adminForm.querySelector("#doctor-r-sinha-url").value.trim(),
      "a-patel": adminForm.querySelector("#doctor-a-patel-url").value.trim(),
    },
    doctorEmails: {
      "kk-roy": adminForm.querySelector("#doctor-kk-roy-email").value.trim(),
      "r-sinha": adminForm.querySelector("#doctor-r-sinha-email").value.trim(),
      "a-patel": adminForm.querySelector("#doctor-a-patel-email").value.trim(),
    },
  };
}

function populateAdminForm(settings) {
  adminForm.querySelector("#clinic-phone").value = settings.phone;
  adminForm.querySelector("#clinic-email").value = settings.email;
  adminForm.querySelector("#clinic-address").value = settings.address;
  adminForm.querySelector("#clinic-logo-url").value = settings.logoUrl;
  adminForm.querySelector("#clinic-hero-url").value = settings.heroImageUrl;

  adminForm.querySelector("#doctor-kk-roy-url").value =
    settings.doctorPhotos["kk-roy"];
  adminForm.querySelector("#doctor-r-sinha-url").value =
    settings.doctorPhotos["r-sinha"];
  adminForm.querySelector("#doctor-a-patel-url").value =
    settings.doctorPhotos["a-patel"];
  adminForm.querySelector("#doctor-kk-roy-email").value =
    settings.doctorEmails["kk-roy"];
  adminForm.querySelector("#doctor-r-sinha-email").value =
    settings.doctorEmails["r-sinha"];
  adminForm.querySelector("#doctor-a-patel-email").value =
    settings.doctorEmails["a-patel"];

  const logoPreview = document.getElementById("logo-preview");
  if (settings.logoUrl && logoPreview) {
    logoPreview.src = settings.logoUrl;
  }
  const heroPreview = document.getElementById("hero-preview");
  if (settings.heroImageUrl && heroPreview) {
    heroPreview.src = settings.heroImageUrl;
  }

  document.querySelectorAll("[data-preview]").forEach((img) => {
    const id = img.dataset.preview;
    const url = settings.doctorPhotos[id];
    if (url) img.src = url;
  });
}

function showAdminStatus(message) {
  const status = document.getElementById("admin-status");
  if (status) {
    status.classList.add("show");
    status.textContent = message;
  }
}

function setupAdminForm() {
  if (!adminForm) return;
  requireAdminAuth();

  fetchSettings().then((settings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    populateAdminForm(settings);
    applySettings(settings);
  });

  adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextSettings = collectSettingsFromForm();
    applySettings(nextSettings);
    saveSettings(nextSettings);
    showAdminStatus("Settings saved to the database.");
  });

  const resetButton = document.getElementById("admin-reset");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      localStorage.removeItem(SETTINGS_KEY);
      window.location.reload();
    });
  }

  const logoutButton = document.getElementById("admin-logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem(ADMIN_AUTH_KEY);
      window.location.href = "admin-login.html";
    });
  }

  document.querySelectorAll("[data-file-input]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const dataUrl = await compressImage(file, 900, 900, 0.8);
      const targetId = input.dataset.fileInput;
      const urlInput = document.getElementById(targetId);
      const preview = document.querySelector(
        `[data-preview="${input.dataset.previewTarget}"]`
      );
      if (urlInput) urlInput.value = dataUrl;
      if (preview) preview.src = dataUrl;
      const nextSettings = collectSettingsFromForm();
      applySettings(nextSettings);
      saveSettings(nextSettings);
      showAdminStatus("Image uploaded and saved.");
    });
  });

  let autosaveTimer;
  adminForm.addEventListener("input", () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const nextSettings = collectSettingsFromForm();
      applySettings(nextSettings);
      saveSettings(nextSettings);
      showAdminStatus("Changes auto-saved.");
    }, 800);
  });

  renderSubmissions();
  const clearButton = document.getElementById("admin-clear-submissions");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      localStorage.removeItem(SUBMISSIONS_KEY);
      fetch(SUBMISSIONS_ENDPOINT, { method: "DELETE" }).catch(() => {});
      renderSubmissions();
    });
  }
}

setupAdminForm();
setupLoginForm();

function renderSubmissions() {
  const tableBody = document.querySelector("[data-submissions-body]");
  const emptyState = document.querySelector("[data-submissions-empty]");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  fetch(SUBMISSIONS_ENDPOINT)
    .then((response) => response.json())
    .catch(() => JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]"))
    .then((submissions) => {
      if (submissions.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
      }
      if (emptyState) emptyState.style.display = "none";

      submissions.slice(0, 50).forEach((entry) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><strong>${entry.type}</strong><small>${new Date(
          entry.submittedAt
        ).toLocaleString()}</small></td>
          <td>${entry.values?.name || "-"}</td>
          <td>${entry.values?.phone || "-"}</td>
          <td>${entry.values?.service || entry.values?.topic || "-"}</td>
          <td>${entry.values?.message || "-"}</td>
        `;
        tableBody.appendChild(row);
      });
    });
}

function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
