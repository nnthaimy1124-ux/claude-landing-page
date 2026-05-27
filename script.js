/* ============================================================
   SUNEXT AI - Premium Landing Page JavaScript
   Clean, performant vanilla JS with no dependencies
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY FUNCTIONS
  ---------------------------------------------------------- */

  /**
   * Debounce function to limit execution frequency
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  const debounce = (fn, delay = 16) => {
    let timer = null;
    return (...args) => {
      if (timer) cancelAnimationFrame(timer);
      timer = requestAnimationFrame(() => fn(...args));
    };
  };

  /**
   * EaseOutQuart easing for smooth counter animation
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value
   */
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  /* ----------------------------------------------------------
     1. SCROLL REVEAL ANIMATION
     Uses Intersection Observer to trigger entrance animations
     on elements with .reveal class
  ---------------------------------------------------------- */

  const initScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('active');

            // Stagger children animations with incremental delay
            const children = el.querySelectorAll('.reveal-child');
            children.forEach((child, index) => {
              child.style.transitionDelay = `${index * 0.1}s`;
              child.classList.add('active');
            });

            // Unobserve after revealing (one-time animation)
            revealObserver.unobserve(el);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  };

  /* ----------------------------------------------------------
     2. NAVBAR SCROLL EFFECT
     Adds .scrolled class when user scrolls past 50px
     for a darker/more opaque navbar background
  ---------------------------------------------------------- */

  const initNavbarScroll = () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const SCROLL_THRESHOLD = 50;

    const handleNavScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    // Check initial state on load
    handleNavScroll();

    window.addEventListener('scroll', debounce(handleNavScroll), { passive: true });
  };

  /* ----------------------------------------------------------
     3. COUNTDOWN TIMER
     48-hour countdown from page load (persisted in localStorage)
     Displays HH : MM : SS with labels in Vietnamese
  ---------------------------------------------------------- */

  const initCountdown = () => {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    // Persist deadline so refresh doesn't reset the timer
    const STORAGE_KEY = 'sunext_countdown_deadline';
    let deadline = localStorage.getItem(STORAGE_KEY);

    if (!deadline || parseInt(deadline, 10) <= Date.now()) {
      // Set deadline 48 hours from now
      deadline = Date.now() + 48 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, deadline.toString());
    } else {
      deadline = parseInt(deadline, 10);
    }

    /**
     * Build the countdown DOM structure
     * Creates: countdown-item > countdown-value + countdown-label
     */
    const buildCountdownHTML = (hours, minutes, seconds) => {
      const items = [
        { value: hours, label: 'Giờ' },
        { value: minutes, label: 'Phút' },
        { value: seconds, label: 'Giây' },
      ];

      return items
        .map(
          (item, index) => `
          <div class="countdown-item">
            <span class="countdown-value">${item.value}</span>
            <span class="countdown-label">${item.label}</span>
          </div>
          ${index < items.length - 1 ? '<span class="countdown-separator">:</span>' : ''}
        `
        )
        .join('');
    };

    /**
     * Pad number with leading zero
     */
    const pad = (num) => String(num).padStart(2, '0');

    /**
     * Update the countdown display every second
     */
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = deadline - now;

      if (remaining <= 0) {
        countdownEl.innerHTML = '<span class="countdown-expired">Ưu đãi đã kết thúc!</span>';
        countdownEl.classList.add('expired');
        clearInterval(timer);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = pad(Math.floor(totalSeconds / 3600));
      const minutes = pad(Math.floor((totalSeconds % 3600) / 60));
      const seconds = pad(totalSeconds % 60);

      countdownEl.innerHTML = buildCountdownHTML(hours, minutes, seconds);
    };

    // Initial render + interval
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  };

  /* ----------------------------------------------------------
     4. COUNTER ANIMATION (Stats Section)
     Animates numbers from 0 to data-target value
     with easing over ~2 seconds
  ---------------------------------------------------------- */

  const initCounterAnimation = () => {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (!statNumbers.length) return;

    const ANIMATION_DURATION = 2000; // 2 seconds

    /**
     * Animate a single counter element
     * @param {HTMLElement} el - The stat number element
     */
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.floor(easedProgress * target);

        el.textContent = currentValue.toLocaleString('vi-VN') + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          // Ensure final value is exact
          el.textContent = target.toLocaleString('vi-VN') + suffix;
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    statNumbers.forEach((el) => counterObserver.observe(el));
  };

  /* ----------------------------------------------------------
     5. FAQ ACCORDION
     Toggle FAQ answers with smooth slide animation
     Only one item open at a time
  ---------------------------------------------------------- */

  const initFAQAccordion = () => {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    /**
     * Close a single FAQ item smoothly
     * @param {HTMLElement} item - The faq-item element to close
     */
    const closeFAQ = (item) => {
      const answer = item.querySelector('.faq-answer');
      const arrow = item.querySelector('.faq-arrow, .faq-icon');
      if (!answer) return;

      item.classList.remove('active');
      answer.style.maxHeight = '0';
      answer.style.opacity = '0';
      if (arrow) arrow.classList.remove('active');
    };

    /**
     * Open a single FAQ item smoothly
     * @param {HTMLElement} item - The faq-item element to open
     */
    const openFAQ = (item) => {
      const answer = item.querySelector('.faq-answer');
      const arrow = item.querySelector('.faq-arrow, .faq-icon');
      if (!answer) return;

      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.style.opacity = '1';
      if (arrow) arrow.classList.add('active');
    };

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other items first (single-open accordion)
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) closeFAQ(otherItem);
        });

        // Toggle clicked item
        if (isActive) {
          closeFAQ(item);
        } else {
          openFAQ(item);
        }
      });
    });

    // Recalculate maxHeight on window resize (for responsive)
    window.addEventListener(
      'resize',
      debounce(() => {
        faqItems.forEach((item) => {
          if (item.classList.contains('active')) {
            const answer = item.querySelector('.faq-answer');
            if (answer) {
              answer.style.maxHeight = answer.scrollHeight + 'px';
            }
          }
        });
      }),
      { passive: true }
    );
  };

  /* ----------------------------------------------------------
     6. SMOOTH SCROLL
     All anchor links scroll smoothly to their target
     with offset for fixed navbar
  ---------------------------------------------------------- */

  const initSmoothScroll = () => {
    const NAVBAR_OFFSET = 80;
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // Skip empty or standalone # links
        if (!href || href === '#') return;

        const targetEl = document.querySelector(href);
        if (!targetEl) return;

        e.preventDefault();

        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });

        // Close mobile menu after clicking a nav link
        closeMobileMenu();
      });
    });
  };

  /* ----------------------------------------------------------
     7. MOBILE MENU TOGGLE
     Hamburger menu for mobile navigation
  ---------------------------------------------------------- */

  let isMobileMenuOpen = false;

  const closeMobileMenu = () => {
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.mobile-toggle');
    if (!navbar) return;

    navbar.classList.remove('mobile-open');
    if (toggle) toggle.classList.remove('active');
    isMobileMenuOpen = false;
    document.body.style.overflow = '';
  };

  const openMobileMenu = () => {
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.mobile-toggle');
    if (!navbar) return;

    navbar.classList.add('mobile-open');
    if (toggle) toggle.classList.add('active');
    isMobileMenuOpen = true;
    document.body.style.overflow = 'hidden';
  };

  const initMobileMenu = () => {
    const toggle = document.querySelector('.mobile-toggle');
    const navbar = document.querySelector('.navbar');
    if (!toggle || !navbar) return;

    // Toggle button click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMobileMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close on clicking outside the menu
    document.addEventListener('click', (e) => {
      if (!isMobileMenuOpen) return;

      const navLinks = navbar.querySelector('.nav-links, .nav-menu');
      if (
        navLinks &&
        !navLinks.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    });

    // Close menu on window resize to desktop breakpoint
    window.addEventListener(
      'resize',
      debounce(() => {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
          closeMobileMenu();
        }
      }),
      { passive: true }
    );
  };

  /* ----------------------------------------------------------
     8. CTA BUTTON SCROLL TO PRICING
     All CTA buttons linking to #pricing smooth scroll
  ---------------------------------------------------------- */

  const initCTAButtons = () => {
    const ctaButtons = document.querySelectorAll('.cta-button, .btn-cta, [href="#pricing"], #pricingCta, .btn-primary:not(.btn-submit)');
    const modal = document.getElementById('registrationModal');
    
    if (!modal) return;

    ctaButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        // Prevent default jump for any CTA button
        e.preventDefault();
        
        // Open Modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
      });
    });
  };

  const initRegistrationModal = () => {
    const modal = document.getElementById('registrationModal');
    const closeBtn = document.querySelector('.modal-close');
    const form = document.getElementById('registrationForm');
    
    if (!modal || !closeBtn || !form) return;

    // Close on X button
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Khôi phục lại trạng thái form nếu đã hiển thị QR
      setTimeout(() => {
        const qrWrapper = document.getElementById('qrContentWrapper');
        const formWrapper = document.getElementById('modalContentWrapper');
        if (qrWrapper && formWrapper) {
          qrWrapper.style.display = 'none';
          formWrapper.style.display = 'block';
        }
      }, 400);
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
          const qrWrapper = document.getElementById('qrContentWrapper');
          const formWrapper = document.getElementById('modalContentWrapper');
          if (qrWrapper && formWrapper) {
            qrWrapper.style.display = 'none';
            formWrapper.style.display = 'block';
          }
        }, 400);
      }
    });

    // Handle form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      const originalText = btn.textContent;
      
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;

      const scriptURL = 'https://script.google.com/macros/s/AKfycbztP9s3SY0DpeH7CiudBCrHXkYDQaigbZZknePwjYI-DtQw0GiXvtEEeFN6LRZEDHYg/exec';
      const formData = new FormData(form);
      
      // Tạo mã đơn hàng ngẫu nhiên (AI + 5 số)
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const orderCode = 'AI' + randomCode;

      // Đính kèm thêm thông tin giá tiền và mã đơn hàng để đổ vào Google Sheet
      formData.append('price', '997.000đ');
      formData.append('orderCode', orderCode);

      // Thêm mode: 'no-cors' để Google Apps Script không bị trình duyệt chặn (lỗi CORS)
      fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' })
        .then(response => {
          btn.textContent = 'Đang tạo mã QR...';
          btn.style.background = '#10B981'; // Green
          
          setTimeout(() => {
            // Thay vì đóng form, ta hiển thị QR code
            document.getElementById('modalContentWrapper').style.display = 'none';
            
            const qrWrapper = document.getElementById('qrContentWrapper');
            qrWrapper.style.display = 'block';
            
            // Cập nhật thông tin QR code SePay
            const qrUrl = `https://qr.sepay.vn/img?acc=957686&bank=ACB&amount=997000&des=${orderCode}&template=compact`;
            document.getElementById('qrImage').src = qrUrl;
            document.getElementById('qrTransferContent').textContent = orderCode;
            
            // Reset lại form ẩn phía sau
            form.reset();
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
          }, 800);
        })
        .catch(error => {
          console.error('Lỗi khi gửi form:', error);
          btn.textContent = 'Đã có lỗi!';
          btn.style.background = '#EF4444'; // Red
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
          }, 2000);
        });
    });
  };

  /* ----------------------------------------------------------
     9. PARALLAX-LITE EFFECT
     Subtle parallax on hero section based on mouse position
     Uses GPU-accelerated transforms for performance
  ---------------------------------------------------------- */

  const initParallax = () => {
    const hero = document.querySelector('.hero, .hero-section');
    if (!hero) return;

    const heroBackground = hero.querySelector(
      '.hero-bg, .hero-background, .hero-visual, .hero-image'
    );

    // Also apply subtle movement to floating elements
    const floatingEls = hero.querySelectorAll(
      '.floating, .hero-float, .hero-decoration'
    );

    // Parallax intensity (lower = more subtle)
    const INTENSITY = 0.02;
    const FLOAT_INTENSITY = 0.04;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isAnimating = false;

    /**
     * Smooth animation loop using lerp (linear interpolation)
     * for butter-smooth parallax movement
     */
    const animateParallax = () => {
      // Lerp for smooth following
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (heroBackground) {
        heroBackground.style.transform = `translate(${currentX * INTENSITY}px, ${currentY * INTENSITY}px) scale(1.02)`;
      }

      floatingEls.forEach((el, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        el.style.transform = `translate(${currentX * FLOAT_INTENSITY * direction}px, ${currentY * FLOAT_INTENSITY * direction}px)`;
      });

      // Stop animating if movement is negligible
      if (
        Math.abs(mouseX - currentX) > 0.1 ||
        Math.abs(mouseY - currentY) > 0.1
      ) {
        requestAnimationFrame(animateParallax);
      } else {
        isAnimating = false;
      }
    };

    hero.addEventListener(
      'mousemove',
      (e) => {
        const rect = hero.getBoundingClientRect();
        // Center the coordinates (0,0 is center of hero)
        mouseX = (e.clientX - rect.left - rect.width / 2);
        mouseY = (e.clientY - rect.top - rect.height / 2);

        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(animateParallax);
        }
      },
      { passive: true }
    );

    // Reset position when mouse leaves hero
    hero.addEventListener(
      'mouseleave',
      () => {
        mouseX = 0;
        mouseY = 0;
        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(animateParallax);
        }
      },
      { passive: true }
    );
  };

  /* ----------------------------------------------------------
     10. ACTIVE NAV LINK HIGHLIGHT
     Highlights the current section's nav link as user scrolls
  ---------------------------------------------------------- */

  const initActiveNavHighlight = () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-menu a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const NAVBAR_OFFSET = 100;

    const highlightNav = () => {
      let currentSection = '';

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - NAVBAR_OFFSET;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', debounce(highlightNav), { passive: true });
    highlightNav(); // Initial check
  };

  /* ----------------------------------------------------------
     11. SCROLL TO TOP BUTTON
     Shows a "back to top" button when user scrolls down
  ---------------------------------------------------------- */

  const initScrollToTop = () => {
    const scrollTopBtn = document.querySelector('.scroll-top, .back-to-top');
    if (!scrollTopBtn) return;

    const SHOW_THRESHOLD = 400;

    const toggleButton = () => {
      if (window.scrollY > SHOW_THRESHOLD) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    };

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });

    window.addEventListener('scroll', debounce(toggleButton), { passive: true });
    toggleButton(); // Initial check
  };

  /* ----------------------------------------------------------
     12. PRICING TOGGLE (Monthly/Yearly)
     Toggle between monthly and yearly pricing if present
  ---------------------------------------------------------- */

  const initPricingToggle = () => {
    const toggle = document.querySelector('.pricing-toggle, .billing-toggle');
    if (!toggle) return;

    const toggleInput = toggle.querySelector('input[type="checkbox"]');
    const monthlyPrices = document.querySelectorAll('.price-monthly');
    const yearlyPrices = document.querySelectorAll('.price-yearly');

    if (!toggleInput) return;

    toggleInput.addEventListener('change', () => {
      const isYearly = toggleInput.checked;

      monthlyPrices.forEach((el) => {
        el.style.display = isYearly ? 'none' : 'block';
      });
      yearlyPrices.forEach((el) => {
        el.style.display = isYearly ? 'block' : 'none';
      });
    });
  };

  /* ----------------------------------------------------------
     13. FORM VALIDATION (if contact/signup form exists)
     Lightweight client-side validation
  ---------------------------------------------------------- */

  const initFormValidation = () => {
    const forms = document.querySelectorAll('form[data-validate]');
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach((field) => {
          // Remove previous error state
          field.classList.remove('error');

          if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
          }

          // Email validation
          if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
              isValid = false;
              field.classList.add('error');
            }
          }
        });

        if (!isValid) {
          e.preventDefault();
        }
      });
    });
  };

  /* ----------------------------------------------------------
     14. LOADING SCREEN
     Hide loading overlay once page is fully ready
  ---------------------------------------------------------- */

  const initLoadingScreen = () => {
    const loader = document.querySelector('.loading-screen, .loader, .preloader');
    if (!loader) return;

    // Add a small delay for visual polish
    setTimeout(() => {
      loader.classList.add('loaded');
      // Remove from DOM after transition
      loader.addEventListener('transitionend', () => {
        loader.remove();
      });
    }, 500);
  };

  /* ----------------------------------------------------------
     14. SMART STICKY FOOTER
  ---------------------------------------------------------- */
  const initSmartStickyFooter = () => {
    const footer = document.querySelector('.hello-bar');
    if (!footer) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      // Hide if scrolling down and past 100px. Show if scrolling up.
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        footer.classList.add('hidden');
      } else if (currentScrollY < lastScrollY) {
        footer.classList.remove('hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  };

  /* ----------------------------------------------------------
     INITIALIZE ALL MODULES
     Boot up all features in correct order
  ---------------------------------------------------------- */

  const init = () => {
    initLoadingScreen();
    initNavbarScroll();
    initMobileMenu();
    initSmoothScroll();
    initCTAButtons();
    initRegistrationModal();
    initScrollReveal();
    initCounterAnimation();
    initCountdown();
    initFAQAccordion();
    initParallax();
    initActiveNavHighlight();
    initScrollToTop();
    initPricingToggle();
    initFormValidation();
    initSmartStickyFooter();

    // Log successful initialization (dev mode)
    console.log('%c✨ Sunext AI Landing Page Initialized', 'color: #6C63FF; font-weight: bold; font-size: 14px;');
  };

  init();
});
