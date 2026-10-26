(() => {
  "use strict";

  const form = document.querySelector("#contact .contact-form");
  if (!form) return;

  const fields = form.querySelector("fieldset");
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".contact-form-status");
  const notice = document.querySelector("#contact-form-notice");
  const privacyLink = form.querySelector(".contact-privacy-link");
  const consent = form.elements.namedItem("privacy_consent");
  const originalLabel = button.textContent;
  let pending = false;

  function configuredPrivacy() {
    const href = privacyLink.getAttribute("href")?.trim();
    return Boolean(
      href && !href.startsWith("#") && !/^(javascript|data):/i.test(href),
    );
  }

  function configuredKey() {
    const field = form.elements.namedItem("access_key");
    const key = field?.value?.trim();
    return Boolean(key && key !== "WEB3FORMS_ACCESS_KEY_AQUI");
  }

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;

    if (!configuredKey() || !configuredPrivacy()) {
      showStatus(
        "El formulario está pendiente de configuración. Escríbenos a info@77soluciones.com.",
        "error",
      );
      return;
    }

    for (const name of ["name", "email", "message"]) {
      const field = form.elements.namedItem(name);
      field.value = field.value.trim();
    }
    if (!form.reportValidity() || !consent.checked) return;
    if (form.elements.namedItem("botcheck").checked) {
      showStatus(
        "No se ha podido enviar el mensaje. Puedes contactarnos por correo electrónico.",
        "error",
      );
      return;
    }

    pending = true;
    button.disabled = true;
    button.textContent = "Enviando…";
    form.setAttribute("aria-busy", "true");
    showStatus("Enviando tu mensaje…", "pending");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      // The official `email` field is used by Web3Forms as Reply-To.
      const payload = Object.fromEntries(new FormData(form));
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error("Submission not confirmed");
      }
      form.reset();
      showStatus(
        "Tu mensaje se ha enviado correctamente. Gracias por escribirnos.",
        "success",
      );
    } catch {
      // Do not echo API responses or log personal data.
      showStatus(
        "No hemos podido confirmar el envío. Inténtalo más tarde o escríbenos a info@77soluciones.com.",
        "error",
      );
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      button.textContent = originalLabel;
      form.removeAttribute("aria-busy");
    }
  });

  fields.disabled = false;
  button.disabled = false;
  consent.disabled = !configuredPrivacy();
  if (configuredPrivacy()) {
    privacyLink.removeAttribute("aria-disabled");
  }
  if (configuredKey() && configuredPrivacy()) notice.hidden = true;
})();
