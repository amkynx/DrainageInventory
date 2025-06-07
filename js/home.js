// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 70,
        behavior: "smooth",
      });
    }
  });
});

// Navbar color change on scroll
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("bg-dark");
    navbar.classList.remove("bg-transparent");
  } else if (window.location.pathname === "/") {
    navbar.classList.add("bg-transparent");
    navbar.classList.remove("bg-dark");
  }
});

// Feature card hover animation
const featureCards = document.querySelectorAll(".features .card");
featureCards.forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-10px)";
    this.style.transition = "transform 0.3s ease";
  });

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
  });
});

// Form validation
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Simple validation
    let valid = true;
    const inputs = form.querySelectorAll("input[required], textarea[required]");

    inputs.forEach((input) => {
      if (!input.value.trim()) {
        valid = false;
        input.classList.add("is-invalid");
      } else {
        input.classList.remove("is-invalid");
      }
    });

    if (valid) {
      // Simulate form submission with success message
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

      setTimeout(function () {
        form.innerHTML =
          '<div class="alert alert-success" role="alert">' +
          '<h4 class="alert-heading">Message Sent!</h4>' +
          "<p>Thank you for contacting us. We will get back to you shortly.</p>" +
          "</div>";
      }, 2000);
    }
  });
}

// Testimonial carousel (if more than 3 testimonials)
function initTestimonialCarousel() {
  const testimonials = document.querySelectorAll(".testimonial-card");
  if (testimonials.length > 3) {
    // Initialize carousel with jQuery
    $(document).ready(function () {
      $(".testimonial-carousel").carousel({
        interval: 5000,
      });
    });
  }
}

// Dropdown menu behavior
const dropdowns = document.querySelectorAll(".dropdown");
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("mouseenter", function () {
    if (window.innerWidth > 992) {
      const dropdownMenu = this.querySelector(".dropdown-menu");
      dropdownMenu.classList.add("show");
    }
  });

  dropdown.addEventListener("mouseleave", function () {
    if (window.innerWidth > 992) {
      const dropdownMenu = this.querySelector(".dropdown-menu");
      dropdownMenu.classList.remove("show");
    }
  });
});

// Loading animation
window.addEventListener("load", function () {
  // Add a loading spinner if needed
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = "none";
  }

  // Fade in content
  const content = document.getElementById("main-content");
  if (content) {
    content.classList.add("loaded");
  }
});

// Counter animation for statistics
function animateCounter(element, target, duration) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    element.textContent = Math.floor(progress * target).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Start counter animation when scrolled into view
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  const options = {
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute("data-target"));
        animateCounter(entry.target, target, 2000);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  counters.forEach((counter) => {
    observer.observe(counter);
  });
}

// Initialize tooltip for any elements with data-bs-toggle="tooltip"
var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Initialize popovers
var popoverTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="popover"]')
);
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl);
});

// Lazy load images for better performance
document.addEventListener("DOMContentLoaded", function () {
  const lazyImages = document.querySelectorAll("img.lazy");

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function (
      entries,
      observer
    ) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
});

// Dark mode toggle functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    // Check for saved dark mode preference
    const darkMode = localStorage.getItem("darkMode") === "enabled";

    // Set initial state
    if (darkMode) {
      document.body.classList.add("dark-mode");
      darkModeToggle.checked = true;
    }

    // Toggle dark mode
    darkModeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
      }
    });
  }
}

// Dynamic year for copyright
const yearSpan = document.getElementById("current-year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Initialize all JavaScript components
document.addEventListener("DOMContentLoaded", function () {
  initCounters();
  initTestimonialCarousel();
  initDarkMode();
});
