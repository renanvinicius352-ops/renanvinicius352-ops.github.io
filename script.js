(function () {
  "use strict";

  const config = window.PORTFOLIO_CONFIG;
  const projectGrid = document.getElementById("projectGrid");
  const toast = document.getElementById("toast");
  let toastTimer;

  if (!config) {
    console.error("Configuração não carregada. Confira config.js.");
    return;
  }

  document.title = `${config.name} | Portfólio`;
  document.getElementById("availabilityText").textContent = config.availability;
  document.getElementById("currentYear").textContent = String(new Date().getFullYear());
  setMeta('meta[property="og:title"]', "content", `${config.name} | Desenvolvedor Web`);
  setMeta('meta[property="og:image"]', "content", config.shareImage);

  const profileVisual = document.getElementById("profileVisual");
  if (config.profileImage) {
    const img = document.createElement("img");
    img.src = config.profileImage;
    img.alt = `Foto de perfil de ${config.name}`;
    img.className = "profile-photo";
    img.addEventListener("error", () => {
      img.remove();
      showToast("Não encontrei a foto. Confira o caminho em config.js.");
    }, { once: true });
    profileVisual.prepend(img);
    profileVisual.classList.add("has-photo");
  }

  renderProjects();
  setupContactLinks();
  setupReveal();
  setupInteractions();
  setupLogoMotion();

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute(attribute, value);
  }

  function renderProjects() {
    projectGrid.replaceChildren();
    const projects = Array.isArray(config.projects) ? config.projects : [];
    projects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card reveal";
      card.style.setProperty("--card-index", String(index));

      const visual = document.createElement("div");
      visual.className = `project-visual visual-${safeClass(project.id)}`;
      visual.setAttribute("role", "img");
      visual.setAttribute("aria-label", project.image ? `Imagem do projeto ${project.name}` : project.imageLabel || `Ilustração abstrata do projeto ${project.name}`);
      if (project.image) {
        const img = document.createElement("img");
        img.src = project.image;
        img.alt = "";
        img.loading = "lazy";
        img.addEventListener("error", () => {
          img.remove();
          showToast(`A imagem de ${project.name} não foi encontrada. Confira config.js.`);
        }, { once: true });
        visual.append(img);
      } else {
        const art = document.createElement("div");
        art.className = "abstract-art";
        art.setAttribute("aria-hidden", "true");
        art.innerHTML = '<span class="art-ring"></span><span class="art-orb"></span><span class="art-grid"></span><span class="art-label">VISUAL ILUSTRATIVO</span>';
        visual.append(art);
      }
      const number = document.createElement("span");
      number.className = "project-index";
      number.textContent = `0${index + 1}`;
      visual.append(number);

      const body = document.createElement("div");
      body.className = "project-body";
      const category = document.createElement("span");
      category.className = "project-category";
      category.textContent = project.category || "Projeto";
      const title = document.createElement("h3");
      title.textContent = project.name;
      const description = document.createElement("p");
      description.textContent = project.description;
      const tags = document.createElement("div");
      tags.className = "tech-tags";
      (Array.isArray(project.technologies) ? project.technologies : []).forEach((tech) => {
        const tag = document.createElement("span");
        tag.textContent = tech;
        tags.append(tag);
      });

      const actions = document.createElement("div");
      actions.className = "project-actions";
      const view = document.createElement("a");
      view.className = `project-link${project.url ? "" : " is-disabled"}`;
      view.textContent = project.url ? "Visualizar projeto ↗" : "Link ainda não configurado";
      if (isSafeExternalUrl(project.url)) {
        view.href = project.url;
        view.target = "_blank";
        view.rel = "noopener noreferrer";
      } else {
        view.href = "#projetos";
        view.setAttribute("aria-disabled", "true");
        view.title = "Adicione o endereço publicado deste projeto em config.js";
        view.addEventListener("click", (event) => {
          event.preventDefault();
          showToast("Adicione o link publicado deste projeto em config.js para ativar este botão.");
        });
      }
      actions.append(view);
      if (project.detail) {
        const details = document.createElement("button");
        details.type = "button";
        details.className = "detail-toggle";
        details.textContent = "Ver detalhes +";
        details.setAttribute("aria-expanded", "false");
        const detailText = document.createElement("p");
        detailText.className = "project-detail";
        detailText.textContent = project.detail;
        detailText.hidden = true;
        details.addEventListener("click", () => {
          const expanded = details.getAttribute("aria-expanded") === "true";
          details.setAttribute("aria-expanded", String(!expanded));
          details.textContent = expanded ? "Ver detalhes +" : "Ocultar detalhes −";
          detailText.hidden = expanded;
        });
        actions.append(details);
        body.append(category, title, description, tags, actions, detailText);
      } else {
        body.append(category, title, description, tags, actions);
      }
      card.append(visual, body);
      projectGrid.append(card);
    });
    setupReveal();
  }

  function setupContactLinks() {
    const instagram = isSafeExternalUrl(config.instagramUrl) ? config.instagramUrl : "";
    document.querySelectorAll("[data-instagram-link]").forEach((link) => {
      if (instagram) {
        link.href = instagram;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "#contato";
        link.addEventListener("click", (event) => {
          event.preventDefault();
          showToast("Configure seu link do Instagram em config.js.");
        });
        link.setAttribute("aria-label", `${link.textContent.trim()}. Link ainda não configurado.`);
      }
    });

    const whatsappNumber = String(config.whatsappNumber || "").replace(/\D/g, "");
    const whatsappUrl = /^\d{10,15}$/.test(whatsappNumber)
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage || "Olá, Renan! Gostaria de conversar sobre um projeto.")}`
      : "";
    document.querySelectorAll("[data-contact-link], [data-whatsapp-link]").forEach((link) => {
      if (whatsappUrl) {
        link.href = whatsappUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "#contato";
        link.addEventListener("click", (event) => {
          event.preventDefault();
          showToast("Configure seu número internacional do WhatsApp em config.js.");
        });
        if (link.matches("[data-whatsapp-link]")) link.classList.add("is-unconfigured");
      }
    });
    if (!whatsappUrl) {
      document.getElementById("contactHint").textContent = "WhatsApp ainda não configurado. Adicione seu número em config.js para receber contatos.";
    }

    const socials = document.getElementById("heroSocials");
    if (instagram) {
      const anchor = document.createElement("a");
      anchor.href = instagram;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = "INSTAGRAM ↗";
      socials.append(anchor);
    } else {
      const note = document.createElement("span");
      note.textContent = "INSTAGRAM A CONFIGURAR";
      socials.append(note);
    }
  }

  function setupReveal() {
    const elements = document.querySelectorAll(".reveal:not([data-reveal-ready])");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });
    elements.forEach((element) => {
      element.dataset.revealReady = "true";
      observer.observe(element);
    });
  }

  function setupInteractions() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        link.classList.add("is-clicked");
        window.setTimeout(() => link.classList.remove("is-clicked"), 450);
      });
    });
  }

  function setupLogoMotion() {
    const frame = document.querySelector(".profile-frame");
    const orbitOne = document.querySelector(".orbit-one");
    const orbitTwo = document.querySelector(".orbit-two");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouseAvailable = window.matchMedia("(hover: hover) and (pointer: fine)");

    // O efeito usa apenas ponteiro de mouse; em celular e com movimento reduzido, fica parado.
    if (!frame || reducedMotion.matches || !mouseAvailable.matches) return;

    frame.addEventListener("pointermove", (event) => {
      const bounds = frame.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      frame.style.setProperty("--shine-x", `${((x + 1) / 2) * 100}%`);
      frame.style.setProperty("--shine-y", `${((y + 1) / 2) * 100}%`);
      frame.style.transform = `perspective(700px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg) scale(1.025)`;
      frame.classList.add("is-hovering");

      if (orbitOne) orbitOne.style.transform = `translate(${x * 5}px, ${y * 4}px) rotate(-25deg) scaleY(.35)`;
      if (orbitTwo) orbitTwo.style.transform = `translate(${-x * 5}px, ${-y * 4}px) rotate(32deg) scaleY(.32)`;
    });

    frame.addEventListener("pointerleave", () => {
      frame.style.transform = "";
      frame.style.removeProperty("--shine-x");
      frame.style.removeProperty("--shine-y");
      frame.classList.remove("is-hovering");
      if (orbitOne) orbitOne.style.transform = "";
      if (orbitTwo) orbitTwo.style.transform = "";
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }

  function isSafeExternalUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }

  function safeClass(value) {
    return String(value || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }
})();
