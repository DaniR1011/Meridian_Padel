/* =========================================================
   Meridian Padel — main.js
   Base scripts (mobile menu + small utilities)
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Enable scroll reveal styles (keeps content visible if JS is disabled)
  document.body.classList.add('js-reveal')

  // =======================================================
  // 1) Mobile hamburger menu
  // =======================================================
  const toggle = document.querySelector('.navToggle')
  const nav = document.querySelector('#primary-nav')

  // If the header doesn't exist on some pages, don't break anything
  if (toggle && nav) {
    const openMenu = () => {
      nav.classList.add('is-open')
      toggle.classList.add('is-open')
      toggle.setAttribute('aria-expanded', 'true')
    }

    const closeMenu = () => {
      nav.classList.remove('is-open')
      toggle.classList.remove('is-open')
      toggle.setAttribute('aria-expanded', 'false')
    }

    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeMenu() : openMenu()
    })

    // Close on nav link click
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMenu)
    })

    // Close if you click outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu()
    })

    // Close with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu()
    })

    // If back to desktop, reset
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu()
    })
  }

  // =======================================================
  // 2) Footer year auto-update
  // =======================================================
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = new Date().getFullYear()

  // =======================================================
  // 2.1) Form helpers (populate hidden page_url fields)
  // =======================================================
  document.querySelectorAll('input[name="page_url"]').forEach((el) => {
    el.value = window.location.href
  })

  // =======================================================
  // 2.2) Custom select (Topic + Builder selects)
  //      Uses a portal (menu appended to <body>) so it
  //      never gets clipped by overflow:hidden glass cards.
  // =======================================================
  initMpSelects()

  function initMpSelects() {
    const selects = [...document.querySelectorAll('select[data-mp-select]')]
    if (!selects.length) return

    const instances = []
    const GAP = 8
    const MARGIN = 12

    const resetMenuStyles = (menu) => {
      menu.style.left = ''
      menu.style.top = ''
      menu.style.bottom = ''
      menu.style.width = ''
      menu.style.maxHeight = ''
      menu.style.visibility = ''
    }

    const closeAll = (exceptWrapper = null) => {
      instances.forEach((inst) => {
        if (exceptWrapper && inst.wrapper === exceptWrapper) return
        inst.wrapper.classList.remove('is-open', 'is-up')
        inst.btn.setAttribute('aria-expanded', 'false')
        inst.menu.classList.remove('is-open', 'is-up')
        inst.menu.setAttribute('aria-hidden', 'true')
        resetMenuStyles(inst.menu)
      })
    }

    const positionMenu = (inst) => {
      const btnRect = inst.btn.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      const width = Math.min(btnRect.width, vw - MARGIN * 2)
      const left = Math.min(
        Math.max(btnRect.left, MARGIN),
        Math.max(MARGIN, vw - MARGIN - width)
      )

      inst.menu.style.width = `${width}px`
      inst.menu.style.left = `${left}px`

      // Default: open down
      const spaceBelow = vh - btnRect.bottom - GAP - MARGIN
      inst.menu.style.top = `${btnRect.bottom + GAP}px`
      inst.menu.style.bottom = 'auto'
      inst.menu.style.maxHeight = `${Math.max(140, spaceBelow)}px`

      // Measure, then flip up if needed
      inst.menu.style.visibility = 'hidden'
      requestAnimationFrame(() => {
        const rect = inst.menu.getBoundingClientRect()
        const menuH = rect.height
        const spaceBelow2 = vh - btnRect.bottom - GAP - MARGIN
        const spaceAbove = btnRect.top - GAP - MARGIN

        const openUp =
          (menuH > spaceBelow2 && spaceAbove > spaceBelow2) ||
          (spaceBelow2 < 180 && spaceAbove > 180)

        if (openUp) {
          inst.wrapper.classList.add('is-up')
          inst.menu.classList.add('is-up')
          inst.menu.style.top = 'auto'
          inst.menu.style.bottom = `${vh - btnRect.top + GAP}px`
          inst.menu.style.maxHeight = `${Math.max(140, spaceAbove)}px`
        } else {
          inst.wrapper.classList.remove('is-up')
          inst.menu.classList.remove('is-up')
          inst.menu.style.bottom = 'auto'
          inst.menu.style.top = `${btnRect.bottom + GAP}px`
          inst.menu.style.maxHeight = `${Math.max(140, spaceBelow2)}px`
        }

        inst.menu.style.visibility = 'visible'
      })
    }

    const openInstance = (inst) => {
      closeAll(inst.wrapper)
      inst.wrapper.classList.add('is-open')
      inst.btn.setAttribute('aria-expanded', 'true')
      inst.menu.style.visibility = 'hidden'
      inst.menu.classList.add('is-open')
      inst.menu.setAttribute('aria-hidden', 'false')
      positionMenu(inst)
    }

    const attachFormValidation = (form) => {
      if (!form || form.dataset.mpSelectValidated) return
      form.dataset.mpSelectValidated = '1'

      form.addEventListener('submit', (e) => {
        // Enforce native HTML validation (name/email/message, etc.)
        // Prevents sending when required fields are missing or email is not valid.
        const nameEl = form.querySelector('input[name="name"]')
        const emailEl = form.querySelector('input[name="email"]')
        if (nameEl && typeof nameEl.value === 'string')
          nameEl.value = nameEl.value.trim()
        if (emailEl && typeof emailEl.value === 'string')
          emailEl.value = emailEl.value.trim()

        if (!form.checkValidity()) {
          e.preventDefault()
          form.reportValidity()
          closeAll()
          return
        }

        let firstInvalid = null

        instances
          .filter(({ select }) => form.contains(select))
          .forEach((inst) => {
            const value = inst.select.value
            const isEmpty = value === '' || value == null

            if (
              isEmpty &&
              inst.select.getAttribute('aria-required') === 'true'
            ) {
              inst.wrapper.classList.add('is-error')
              inst.error.textContent = 'Please select a topic.'
              inst.error.hidden = false
              if (!firstInvalid) firstInvalid = inst
            }
          })

        if (firstInvalid) {
          e.preventDefault()
          firstInvalid.btn.focus()
          closeAll()
        }
      })
    }

    selects.forEach((select) => {
      if (select.dataset.mpSelectReady) return
      select.dataset.mpSelectReady = '1'

      // Remove native required validation (we validate manually when needed)
      select.required = false
      select.classList.add('mpSelect__native')

      const row = select.closest('.formRow') || select.parentElement
      if (!row) return

      const wrapper = document.createElement('div')
      wrapper.className = 'mpSelect'

      // Insert wrapper exactly where the native select was
      row.insertBefore(wrapper, select)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'mpSelect__button'
      btn.setAttribute('aria-haspopup', 'listbox')
      btn.setAttribute('aria-expanded', 'false')
      btn.id = `${select.id || select.name || 'topic'}__btn`
      btn.innerHTML =
        '<span class="mpSelect__value"></span><span class="mpSelect__chev" aria-hidden="true"></span>'

      const valueEl = btn.querySelector('.mpSelect__value')

      const menu = document.createElement('div')
      menu.className = 'mpSelect__menu'
      menu.setAttribute('role', 'listbox')
      menu.setAttribute('aria-hidden', 'true')

      const error = document.createElement('div')
      error.className = 'mpSelect__error'
      error.setAttribute('aria-live', 'polite')
      error.hidden = true

      // Wrap UI: button + error, and keep native select for submission
      wrapper.appendChild(btn)
      wrapper.appendChild(error)
      wrapper.appendChild(select)

      // Portal the menu to <body> to avoid clipping (glass cards have overflow:hidden)
      document.body.appendChild(menu)

      // Link label to the custom button (if there is an explicit for=)
      const label = row.querySelector(`label[for="${select.id}"]`)
      if (label) label.setAttribute('for', btn.id)

      const buildOptions = () => {
        menu.innerHTML = ''
        ;[...select.options].forEach((opt) => {
          const ob = document.createElement('button')
          ob.type = 'button'
          ob.className = 'mpSelect__option'
          ob.textContent = opt.textContent
          ob.dataset.value = opt.value
          ob.setAttribute('role', 'option')
          const isSelected = opt.selected
          ob.classList.toggle('is-selected', isSelected)
          ob.setAttribute('aria-selected', isSelected ? 'true' : 'false')

          if (opt.disabled) ob.disabled = true

          ob.addEventListener('click', (ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            if (ob.disabled) return

            select.value = opt.value
            select.dispatchEvent(new Event('input', { bubbles: true }))
            select.dispatchEvent(new Event('change', { bubbles: true }))

            wrapper.classList.remove('is-error')
            error.hidden = true
            closeAll()
            btn.focus()
          })

          menu.appendChild(ob)
        })
      }

      const syncUI = () => {
        const selected = select.options[select.selectedIndex]
        valueEl.textContent = selected ? selected.textContent : 'Select'
        ;[...menu.querySelectorAll('.mpSelect__option')].forEach((b) => {
          const isSel = b.dataset.value === select.value
          b.classList.toggle('is-selected', isSel)
          b.setAttribute('aria-selected', isSel ? 'true' : 'false')
        })
      }

      buildOptions()
      syncUI()

      const inst = { wrapper, btn, menu, select, error }
      instances.push(inst)

      btn.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        if (wrapper.classList.contains('is-open')) closeAll()
        else openInstance(inst)
      })

      // Keep in sync when JS updates the native select
      select.addEventListener('change', () => {
        wrapper.classList.remove('is-error')
        error.hidden = true
        syncUI()
      })

      // Form-level validation
      attachFormValidation(select.closest('form'))
    })

    // Close on outside click (including portal menus)
    document.addEventListener('click', (e) => {
      const inWrapper = e.target.closest('.mpSelect')
      const inMenu = e.target.closest('.mpSelect__menu')
      if (!inWrapper && !inMenu) closeAll()
    })

    // Close with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll()
    })

    // Close on scroll/resize (prevents misalignment if the page moves)
    window.addEventListener('resize', () => closeAll())
    window.addEventListener('scroll', () => closeAll(), true)
  }

  // =======================================================
  // 3) Sponsors marquee (injected + seamless loop)
  // =======================================================
  function injectSponsorsSection() {
    const mount = document.querySelector('#sponsorsMount')
    if (!mount) return

    const sponsors = [
      { src: 'assets/sponsors/sponsor-1.png', alt: 'Sponsor 1' },
      { src: 'assets/sponsors/sponsor-2.png', alt: 'Sponsor 2' },
      { src: 'assets/sponsors/sponsor-3.png', alt: 'Sponsor 3' },
      { src: 'assets/sponsors/sponsor-4.png', alt: 'Sponsor 4' },
      { src: 'assets/sponsors/sponsor-5.png', alt: 'Sponsor 5' },
      { src: 'assets/sponsors/sponsor-6.png', alt: 'Sponsor 6' },
      { src: 'assets/sponsors/sponsor-7.png', alt: 'Sponsor 7' },
      { src: 'assets/sponsors/sponsor-8.png', alt: 'Sponsor 8' },
      { src: 'assets/sponsors/sponsor-9.png', alt: 'Sponsor 9' },
      { src: 'assets/sponsors/sponsor-10.png', alt: 'Sponsor 10' },
      { src: 'assets/sponsors/sponsor-11.png', alt: 'Sponsor 11' },
      { src: 'assets/sponsors/sponsor-12.png', alt: 'Sponsor 12' }
    ]

    // ✅ IMPORTANTE: ya NO metemos un <section> dentro (evitamos duplicados)
    mount.innerHTML = `
      <div class="sponsorMarqueeElegant">
        <div class="sponsorTrackElegant">
          <div class="sponsorGroup sponsorGroup--base"></div>
        </div>
      </div>
    `

    const baseGroup = mount.querySelector('.sponsorGroup--base')

    // Insertamos logos 1 vez
    sponsors.forEach((s) => {
      const box = document.createElement('div')
      box.className = 'sponsorLogoBox'
      box.innerHTML = `<img class="sponsorLogo" src="${s.src}" alt="${s.alt}" loading="lazy" decoding="async">`
      baseGroup.appendChild(box)
    })

    // Guardamos cuántos logos "semilla" tiene el grupo (para poder reconstruirlo en resizes)
    baseGroup.dataset.seedCount = String(baseGroup.children.length)

    // ✅ Cuando carguen las imágenes, montamos el loop perfecto
    setupSponsorsInfiniteLoop()
  }

  function setupSponsorsInfiniteLoop() {
    const marquee = document.querySelector('.sponsorMarqueeElegant')
    const track = document.querySelector('.sponsorTrackElegant')
    const baseGroup = document.querySelector('.sponsorGroup--base')
    if (!marquee || !track || !baseGroup) return

    setupSponsorsInfiniteLoop._runId =
      (setupSponsorsInfiniteLoop._runId || 0) + 1
    const runId = setupSponsorsInfiniteLoop._runId

    const seedCount = Math.max(
      1,
      parseInt(
        baseGroup.dataset.seedCount || String(baseGroup.children.length),
        10
      ) || baseGroup.children.length
    )
    while (baseGroup.children.length > seedCount) {
      baseGroup.removeChild(baseGroup.lastElementChild)
    }

    track
      .querySelectorAll(".sponsorGroup[aria-hidden='true']")
      .forEach((n) => n.remove())

    requestAnimationFrame(() => {
      if (runId !== setupSponsorsInfiniteLoop._runId) return

      const marqueeWidth = marquee.getBoundingClientRect().width
      const seedNodes = [...baseGroup.children].slice(0, seedCount)

      while (baseGroup.scrollWidth < marqueeWidth * 1.25) {
        seedNodes.forEach((node) => baseGroup.appendChild(node.cloneNode(true)))
      }

      const clone = baseGroup.cloneNode(true)
      clone.setAttribute('aria-hidden', 'true')
      track.appendChild(clone)

      const distance = baseGroup.scrollWidth
      const speed = window.innerWidth <= 560 ? 45 : 70 // px/seg
      const duration = Math.max(12, distance / Math.max(1, speed))

      track.style.animation = 'none'
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight
      track.style.animation = ''

      track.style.setProperty('--marquee-duration', `${duration}s`)
    })
  }

  // ✅ Recalcula SOLO si cambia el ancho (evita resets por iOS address bar durante scroll)
  let sponsorsResizeT = 0
  let lastSponsorsWidth = 0

  const scheduleSponsorsRebuild = () => {
    window.clearTimeout(sponsorsResizeT)
    sponsorsResizeT = window.setTimeout(() => {
      setupSponsorsInfiniteLoop()
    }, 180)
  }

  const onSponsorsResize = () => {
    const marquee = document.querySelector('.sponsorMarqueeElegant')
    if (!marquee) return

    const w = Math.round(marquee.getBoundingClientRect().width)

    // iOS: al hacer scroll cambia la altura del viewport -> dispara resize
    // pero el ancho es el mismo, así que NO reconstruimos (evita el reset)
    if (w && w === lastSponsorsWidth) return
    lastSponsorsWidth = w

    scheduleSponsorsRebuild()
  }

  window.addEventListener('resize', onSponsorsResize, { passive: true })

  window.addEventListener('orientationchange', () => {
    lastSponsorsWidth = 0 // fuerza recalcular tras rotación
    scheduleSponsorsRebuild()
  })

  window.addEventListener('pageshow', () => {
    const mount = document.querySelector('#sponsorsMount')
    if (!mount) return

    if (!mount.querySelector('.sponsorMarqueeElegant')) {
      injectSponsorsSection()
      return
    }

    // Rebuild solo si cambia el ancho (o si lastSponsorsWidth aún no está seteado)
    onSponsorsResize()
  })

  // =======================================================
  // 4) Cities ticker marquee (seamless loop, no gaps)
  // =======================================================
  function setupCitiesTickerInfiniteLoop() {
    const marquees = document.querySelectorAll('.citiesTicker__marquee')
    if (!marquees.length) return

    marquees.forEach((marquee) => {
      const track = marquee.querySelector('.citiesTicker__track')
      const baseGroup = track && track.querySelector('.citiesTicker__group')
      if (!track || !baseGroup) return

      if (!baseGroup.dataset.seedHtml)
        baseGroup.dataset.seedHtml = baseGroup.innerHTML
      const seedHtml = baseGroup.dataset.seedHtml

      ;[...track.querySelectorAll('.citiesTicker__group')].forEach((g, i) => {
        if (i > 0) g.remove()
      })

      baseGroup.innerHTML = seedHtml

      let guard = 0
      while (baseGroup.scrollWidth < marquee.clientWidth * 1.25 && guard < 8) {
        baseGroup.insertAdjacentHTML('beforeend', seedHtml)
        guard += 1
      }

      const clone = baseGroup.cloneNode(true)
      clone.setAttribute('aria-hidden', 'true')
      track.appendChild(clone)

      const distance = baseGroup.scrollWidth
      track.style.setProperty('--ticker-shift', `${distance}px`)

      const speed = window.innerWidth <= 560 ? 55 : 90 // px/sec
      const duration = Math.max(18, distance / Math.max(1, speed))
      track.style.setProperty('--ticker-duration', `${duration}s`)

      track.style.animation = 'none'
      // eslint-disable-next-line no-unused-expressions
      track.offsetHeight
      track.style.animation = ''
    })
  }

  let citiesTickerResizeT = 0
  const scheduleCitiesTickerRebuild = () => {
    window.clearTimeout(citiesTickerResizeT)
    citiesTickerResizeT = window.setTimeout(() => {
      setupCitiesTickerInfiniteLoop()
    }, 180)
  }
  window.addEventListener('resize', scheduleCitiesTickerRebuild, {
    passive: true
  })
  window.addEventListener('orientationchange', scheduleCitiesTickerRebuild)

  // =======================================================
  // WOW features (Hero + conversion sections)
  // =======================================================
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ✅ NEW: Force hero video autoplay (best effort for iOS/Safari)
  function initHeroVideoAutoplay() {
    const videos = [
      ...document.querySelectorAll('video.videoCta__video, .videoCta__video')
    ].filter(Boolean)

    if (!videos.length) return
    if (prefersReducedMotion) return

    videos.forEach((v) => {
      // Required flags for autoplay across browsers
      v.muted = true
      v.defaultMuted = true
      v.playsInline = true
      v.preload = 'auto'

      v.setAttribute('muted', '')
      v.setAttribute('playsinline', '')
      v.setAttribute('webkit-playsinline', '')
      v.setAttribute('autoplay', '')
      v.setAttribute('loop', '')

      // If you do NOT want to see the poster at all, keep it empty
      if (v.hasAttribute('poster')) v.setAttribute('poster', '')

      const tryPlay = () => {
        if (document.hidden) return
        const p = v.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }

      // 1) Immediate attempt
      tryPlay()

      // 2) Retry when the browser has enough data
      v.addEventListener('loadeddata', tryPlay, { once: true })
      v.addEventListener('canplay', tryPlay, { once: true })

      // 3) When returning from bfcache / tab changes
      window.addEventListener('pageshow', tryPlay)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) tryPlay()
      })

      // 4) Fallback: first user gesture (some iOS versions require it)
      ;['touchstart', 'click', 'keydown'].forEach((evt) => {
        document.addEventListener(evt, tryPlay, {
          once: true,
          passive: true,
          capture: true
        })
      })
    })
  }

  function initReveal(elements, { stagger = 70 } = {}) {
    if (!elements || !elements.length) return
    if (prefersReducedMotion) return

    const isInView = (el) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.9 && r.bottom > 0
    }

    elements.forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = `${Math.min(i * stagger, 420)}ms`
    })

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -12% 0px' }
    )

    elements.forEach((el) => {
      if (isInView(el)) {
        el.classList.add('is-visible')
      } else {
        io.observe(el)
      }
    })
  }

  function initHeroParallax() {
    if (prefersReducedMotion) return

    const hero = document.querySelector('.hero')
    const img = document.querySelector('.heroCard__media img')
    if (!hero || !img) return

    let raf = 0

    const update = () => {
      raf = 0
      const r = hero.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))
      const y = progress * 16
      img.style.transform = `translateY(${y}px) scale(1.04)`
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
  }

  function initHowStepsActive() {
    const cards = [...document.querySelectorAll('#howSteps .stepCard')]
    if (!cards.length) return

    const setActive = (el) => {
      cards.forEach((c) => c.classList.toggle('is-active', c === el))
    }

    setActive(cards[0])

    if (!('IntersectionObserver' in window) || prefersReducedMotion) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          setActive(entry.target)
        })
      },
      { threshold: 0.55, rootMargin: '0px 0px -35% 0px' }
    )

    cards.forEach((c) => io.observe(c))
  }

  function initExperienceTabs() {
    const root = document.querySelector('[data-tabs]')
    if (!root) return

    const buttons = [...root.querySelectorAll('.tabsBtn')]
    const panels = [...root.querySelectorAll('.tabsPanel')]

    const setTab = (key) => {
      buttons.forEach((b) => {
        const active = b.dataset.tab === key
        b.classList.toggle('is-active', active)
        b.setAttribute('aria-selected', active ? 'true' : 'false')
      })
      panels.forEach((p) =>
        p.classList.toggle('is-active', p.dataset.panel === key)
      )
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab))
    })

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const idx = buttons.findIndex((b) => b.classList.contains('is-active'))
      const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1
      const clamped = (next + buttons.length) % buttons.length
      buttons[clamped].focus()
      setTab(buttons[clamped].dataset.tab)
    })

    initReveal(
      [
        ...document.querySelectorAll('#experiences .sectionHead'),
        document.querySelector('#experiences .tabsCard')
      ].filter(Boolean),
      { stagger: 90 }
    )
  }

  function initExperienceMediaCarousel() {
    const root = document.querySelector('[data-tabs]')
    if (!root) return

    const sets = {
      accommodation: [
        {
          src: 'assets/img/accommodation-1.jpg',
          alt: 'Accommodation experience photo 1'
        },
        {
          src: 'assets/img/accommodation-2.jpg',
          alt: 'Accommodation experience photo 2'
        },
        {
          src: 'assets/img/accommodation-3.jpg',
          alt: 'Accommodation experience photo 3'
        },
        {
          src: 'assets/img/accommodation-4.jpg',
          alt: 'Accommodation experience photo 4'
        },
        {
          src: 'assets/img/accommodation-5.jpg',
          alt: 'Accommodation experience photo 5'
        }
      ],
      transport: [
        {
          src: 'assets/img/chauffeur-1.jpg',
          alt: 'Transport and chauffeur experience photo 1'
        },
        {
          src: 'assets/img/chauffeur-2.jpg',
          alt: 'Transport and chauffeur experience photo 2'
        },
        {
          src: 'assets/img/chauffeur-3.jpg',
          alt: 'Transport and chauffeur experience photo 3'
        }
      ],
      gastronomy: [
        {
          src: 'assets/img/gastronomy-1.jpg',
          alt: 'Gastronomy experience photo 1'
        },
        {
          src: 'assets/img/gastronomy-2.jpg',
          alt: 'Gastronomy experience photo 2'
        },
        {
          src: 'assets/img/gastronomy-3.jpg',
          alt: 'Gastronomy experience photo 3'
        },
        {
          src: 'assets/img/gastronomy-4.jpg',
          alt: 'Gastronomy experience photo 4'
        },
        {
          src: 'assets/img/gastronomy-5.jpg',
          alt: 'Gastronomy experience photo 5'
        },
        {
          src: 'assets/img/gastronomy-6.jpg',
          alt: 'Gastronomy experience photo '
        },
        {
          src: 'assets/img/gastronomy-7.jpg',
          alt: 'Gastronomy experience photo '
        },
        {
          src: 'assets/img/gastronomy-8.jpg',
          alt: 'Gastronomy experience photo '
        },
        {
          src: 'assets/img/gastronomy-9.jpg',
          alt: 'Gastronomy experience photo '
        }
      ]
    }

    const state = {
      accommodation: 0,
      transport: 0,
      gastronomy: 0
    }

    const timers = new Map()

    const initOne = (key) => {
      const media = root.querySelector(`[data-exp-media="${key}"]`)
      if (!media) return

      const slides = sets[key]
      const img = media.querySelector('img')
      const prev = media.querySelector('[data-exp-prev]')
      const next = media.querySelector('[data-exp-next]')

      if (!img || !slides || slides.length < 2) {
        prev && (prev.style.display = 'none')
        next && (next.style.display = 'none')
        return
      }

      const render = () => {
        const current = slides[state[key]]
        if (!current) return

        media.classList.add('is-switching')
        window.clearTimeout(timers.get(media))

        img.src = current.src
        img.alt = current.alt || ''

        const t = window.setTimeout(
          () => media.classList.remove('is-switching'),
          170
        )
        timers.set(media, t)
      }

      const go = (dir) => {
        state[key] = (state[key] + dir + slides.length) % slides.length
        render()
      }

      prev && prev.addEventListener('click', () => go(-1))
      next && next.addEventListener('click', () => go(1))

      media.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        go(e.key === 'ArrowRight' ? 1 : -1)
      })

      render()
    }

    Object.keys(sets).forEach(initOne)
  }

  function initDestinationsMap() {
    const root = document.querySelector('[data-destinations]')
    if (!root) return

    const points = [...root.querySelectorAll('.destinationsPoint')]
    const imgEl = root.querySelector('#destCityImg')
    const nameEl = root.querySelector('#destCityName')
    const descEl = root.querySelector('#destCityDesc')
    const prevBtn = root.querySelector('[data-dest-prev]')
    const nextBtn = root.querySelector('[data-dest-next]')
    const card = root.querySelector('.destinationsCityCard')

    if (!points.length || !imgEl || !nameEl || !descEl) return

    const cities = {
      madrid: {
        name: 'Madrid',
        image: 'assets/img/city-madrid.jpg',
        desc: 'Elite academies, premium hospitality and high-performance training environment.'
      },
      barcelona: {
        name: 'Barcelona',
        image: 'assets/img/city-barcelona.jpg',
        desc: 'Mediterranean energy combined with world-class training facilities.'
      },
      bilbao: {
        name: 'Bilbao',
        image: 'assets/img/city-bilbao.jpg',
        desc: 'Northern Spain’s design-forward city — ideal for focused training and great food.'
      },
      alicante: {
        name: 'Alicante',
        image: 'assets/img/city-alicante.jpg',
        desc: 'A Mediterranean escape with premium sessions and a relaxed schedule.'
      },
      marbella: {
        name: 'Marbella',
        image: 'assets/img/city-marbella.jpg',
        desc: 'Luxury vibe and top-tier clubs — perfect for premium groups and hospitality.'
      },
      mallorca: {
        name: 'Mallorca',
        image: 'assets/img/city-mallorca.jpg',
        desc: 'Island performance camp energy with world-class facilities and recovery options.'
      }
    }

    const order = Object.keys(cities)

    const getCurrentKey = () => {
      const active = points.find((p) => p.classList.contains('is-active'))
      return (active && active.dataset.city) || order[0]
    }

    let index = Math.max(0, order.indexOf(getCurrentKey()))
    let switchT = 0

    const setActive = (key) => {
      if (!cities[key]) return

      index = Math.max(0, order.indexOf(key))

      points.forEach((p) => {
        p.classList.toggle('is-active', p.dataset.city === key)
      })

      if (card) card.classList.add('is-switching')
      window.clearTimeout(switchT)

      imgEl.src = cities[key].image
      imgEl.alt = cities[key].name
      nameEl.textContent = cities[key].name
      descEl.textContent = cities[key].desc

      switchT = window.setTimeout(() => {
        if (card) card.classList.remove('is-switching')
      }, 180)
    }

    points.forEach((p) => {
      p.addEventListener('click', () => setActive(p.dataset.city))
      p.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setActive(p.dataset.city)
        }
      })
    })

    const go = (dir) => {
      const next = (index + dir + order.length) % order.length
      setActive(order[next])
    }

    prevBtn && prevBtn.addEventListener('click', () => go(-1))
    nextBtn && nextBtn.addEventListener('click', () => go(1))

    setActive(order[index])

    initReveal(
      [
        root.querySelector('.destinationsHead'),
        root.querySelector('.destinationsMap'),
        root.querySelector('.destinationsCityCard')
      ].filter(Boolean),
      { stagger: 90 }
    )
  }

  function initTimelineActive() {
    const items = [...document.querySelectorAll('[data-timeline-item]')]
    if (!items.length) return

    const setActive = (el) => {
      items.forEach((it) => it.classList.toggle('is-active', it === el))
    }

    setActive(items[0])

    if (!('IntersectionObserver' in window) || prefersReducedMotion) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          setActive(entry.target)
        })
      },
      { threshold: 0.55, rootMargin: '0px 0px -40% 0px' }
    )

    items.forEach((it) => io.observe(it))

    initReveal(
      [...document.querySelectorAll('#journey .sectionHead'), ...items],
      { stagger: 70 }
    )
  }

  function initTestimonialsCarousel() {
    const root = document.querySelector('[data-carousel]')
    if (!root) return

    const track = root.querySelector('.testimonials__track')
    const slides = [...root.querySelectorAll('.testimonial')]
    const dotsMount = root.querySelector('[data-carousel-dots]')
    const prevBtn = root.querySelector('[data-carousel-prev]')
    const nextBtn = root.querySelector('[data-carousel-next]')

    if (!track || slides.length < 2 || !dotsMount) return

    let index = 0
    let timer = null

    const dots = slides.map((_, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'dot'
      b.setAttribute('aria-label', `Go to testimonial ${i + 1}`)
      b.addEventListener('click', () => {
        index = i
        render()
        restart()
      })
      dotsMount.appendChild(b)
      return b
    })

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index))
    }

    const go = (dir) => {
      index = (index + dir + slides.length) % slides.length
      render()
    }

    const start = () => {
      if (prefersReducedMotion) return
      timer = window.setInterval(() => go(1), 6500)
    }

    const stop = () => {
      if (timer) window.clearInterval(timer)
      timer = null
    }

    const restart = () => {
      stop()
      start()
    }

    prevBtn &&
      prevBtn.addEventListener('click', () => {
        go(-1)
        restart()
      })

    nextBtn &&
      nextBtn.addEventListener('click', () => {
        go(1)
        restart()
      })

    root.addEventListener('mouseenter', stop)
    root.addEventListener('mouseleave', start)
    root.addEventListener('focusin', stop)
    root.addEventListener('focusout', start)

    render()
    start()

    initReveal(
      [
        ...document.querySelectorAll('#proof .sectionHead'),
        ...document.querySelectorAll('#proof .card')
      ],
      { stagger: 75 }
    )
  }

  function initWow() {
    // ✅ NEW: autoplay hero video (best effort)
    initHeroVideoAutoplay()

    initHeroParallax()
    initHowStepsActive()
    initExperienceTabs()
    initExperienceMediaCarousel()
    initTimelineActive()
    initTestimonialsCarousel()
    initDestinationsMap()

    initReveal(
      [
        ...document.querySelectorAll('#how .sectionHead'),
        ...document.querySelectorAll('#how .stepCard')
      ],
      { stagger: 70 }
    )
  }

  initWow()

  // =======================================================
  // 4) Scroll reveal animation (FAQ)
  // =======================================================
  function initFaqReveal() {
    const faq = document.querySelector('#faq')
    if (!faq) return

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const elements = [
      ...faq.querySelectorAll('.sectionHead'),
      ...faq.querySelectorAll('details.faqItem')
    ]

    if (!elements.length) return

    elements.forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`
    })

    const isInView = (el) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight * 0.88 && r.bottom > 0
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    )

    elements.forEach((el) => {
      if (isInView(el)) {
        el.classList.add('is-visible')
      } else {
        io.observe(el)
      }
    })
  }

  // =======================================================
  // 5) FAQ accordion (close others on open)
  // =======================================================
  const faqSection = document.querySelector('#faq')
  if (faqSection) {
    const items = [...faqSection.querySelectorAll('details.faqItem')]
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return
        items.forEach((other) => {
          if (other !== item) other.removeAttribute('open')
        })
      })
    })
  }

  // =======================================================
  // WOW add-ons (Builder + Spotlight + Progress + Lightbox)
  // =======================================================

  function initScrollProgress() {
    const existing = document.querySelector('.scrollProgress')
    if (existing) return

    const bar = document.createElement('div')
    bar.className = 'scrollProgress'
    document.body.appendChild(bar)

    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const p = max > 0 ? doc.scrollTop / max : 0
      bar.style.width = `${Math.min(1, Math.max(0, p)) * 100}%`
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
  }

  function initCardSpotlight() {
    const cards = document.querySelectorAll('.card--glass')
    if (!cards.length) return
    if (prefersReducedMotion) return

    cards.forEach((card) => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * 100
        const y = ((e.clientY - r.top) / r.height) * 100
        card.style.setProperty('--mx', `${x}%`)
        card.style.setProperty('--my', `${y}%`)
      }
      card.addEventListener('pointermove', onMove)
    })
  }

  function initOnlineTimePill() {
    const nav = document.querySelector('.nav')
    const header = document.querySelector('.header')
    if (!nav && !header) return

    let pill = document.querySelector('[data-online-pill]')
    if (!pill) {
      pill = document.createElement('div')
      pill.className = 'onlineTimePill'
      pill.setAttribute('data-online-pill', 'true')
      pill.setAttribute('aria-live', 'polite')
      pill.innerHTML = `
        <span class="onlineDot" aria-hidden="true"></span>
        <span class="onlineText">Online Now</span>
        <span class="onlineSep" aria-hidden="true">·</span>
        <span class="onlineClocks">Doha --:-- / Madrid --:--</span>
      `
    }

    const ensureDock = () => {
      if (!header) return null

      let dock = document.querySelector('.onlineDock')
      if (!dock) {
        dock = document.createElement('div')
        dock.className = 'onlineDock'
        dock.innerHTML = `<div class="container onlineDock__inner"></div>`
        header.insertAdjacentElement('afterend', dock)
      } else if (dock.parentElement === header) {
        header.insertAdjacentElement('afterend', dock)
      }

      return dock.querySelector('.onlineDock__inner')
    }

    const placePill = () => {
      const isMobile = window.matchMedia('(max-width: 560px)').matches
      if (isMobile) {
        const dockInner = ensureDock()
        if (dockInner) dockInner.appendChild(pill)
        return
      }

      if (!nav) return
      const cta = nav.querySelector('.nav__cta')
      if (cta) nav.insertBefore(pill, cta)
      else nav.appendChild(pill)
    }

    placePill()
    window.addEventListener('resize', placePill)

    const fmt = (tz) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit'
      })

    const tick = () => {
      const now = new Date()
      const madridStr = fmt('Europe/Madrid').format(now)
      const dohaStr = fmt('Asia/Qatar').format(now)

      pill.classList.remove('is-offline')
      pill.querySelector('.onlineText').textContent = 'Online Now'
      pill.querySelector(
        '.onlineClocks'
      ).textContent = `Doha ${dohaStr} / Spain ${madridStr}`
    }

    tick()
    window.setInterval(tick, 60 * 1000)
  }

  function formatDateShort(iso) {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(d)
    } catch (e) {
      return iso
    }
  }

  function formatDateRange(startIso, endIso) {
    if (startIso && endIso)
      return `${formatDateShort(startIso)} → ${formatDateShort(endIso)}`
    if (startIso && !endIso) return `${formatDateShort(startIso)} → (flexible)`
    if (!startIso && endIso) return `(flexible) → ${formatDateShort(endIso)}`
    return 'Flexible'
  }

  // =======================================================
  // Custom calendar date picker (desktop)
  // =======================================================
  const MP_MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const MP_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const mpIsCoarsePointer = () => {
    try {
      return window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    } catch (e) {
      return false
    }
  }

  function mpIsoToDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
    const d = new Date(`${iso}T00:00:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  function mpDateToIso(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function mpAddMonths(date, delta) {
    const d = new Date(date.getFullYear(), date.getMonth() + delta, 1)
    return d
  }

  const mpCal = {
    el: null,
    backdrop: null,
    input: null,
    anchor: null,
    view: null,
    isModal: false
  }

  function mpEnsureCalendar() {
    if (mpCal.el) return mpCal.el

    const el = document.createElement('div')
    el.className = 'mpCal'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', 'Select date')
    el.setAttribute('aria-hidden', 'true')
    el.hidden = true

    el.innerHTML = `
    <div class="mpCal__head">
      <button class="mpCal__nav" type="button" data-mpcal-prev aria-label="Previous month">‹</button>
      <div class="mpCal__title">
        <span class="mpCal__month" data-mpcal-month>Month</span>
        <span class="mpCal__year" data-mpcal-year>Year</span>
      </div>
      <button class="mpCal__nav" type="button" data-mpcal-next aria-label="Next month">›</button>
    </div>
    <div class="mpCal__dow" aria-hidden="true">
      ${MP_DOW.map((d) => `<span>${d}</span>`).join('')}
    </div>
    <div class="mpCal__grid" data-mpcal-grid></div>
  `

    document.body.appendChild(el)
    mpCal.el = el

    // Backdrop (used for mobile/modal)
    const back = document.createElement('div')
    back.className = 'mpCalBackdrop'
    back.setAttribute('aria-hidden', 'true')
    back.hidden = true
    document.body.appendChild(back)
    mpCal.backdrop = back

    back.addEventListener('click', () => mpCloseCalendar(true))

    // Global close handlers (once)
    document.addEventListener('pointerdown', (e) => {
      if (!mpCal.el || mpCal.el.hidden) return
      const t = e.target
      if (mpCal.el.contains(t)) return
      if (mpCal.anchor && mpCal.anchor.contains(t)) return
      mpCloseCalendar()
    })

    document.addEventListener('keydown', (e) => {
      if (!mpCal.el || mpCal.el.hidden) return
      if (e.key === 'Escape') {
        e.preventDefault()
        mpCloseCalendar(true)
      }
    })

    window.addEventListener('resize', () => {
      if (!mpCal.el || mpCal.el.hidden) return
      mpPositionCalendar()
    })
    window.addEventListener(
      'scroll',
      () => {
        if (!mpCal.el || mpCal.el.hidden) return
        mpPositionCalendar()
      },
      true
    )

    el.addEventListener('click', (e) => {
      const prev = e.target.closest('[data-mpcal-prev]')
      const next = e.target.closest('[data-mpcal-next]')
      const dayBtn = e.target.closest('[data-mpcal-iso]')
      if (prev) {
        mpCal.view = mpAddMonths(mpCal.view, -1)
        mpRenderCalendar()
        mpPositionCalendar()
        return
      }
      if (next) {
        mpCal.view = mpAddMonths(mpCal.view, 1)
        mpRenderCalendar()
        mpPositionCalendar()
        return
      }
      if (dayBtn && mpCal.input) {
        const iso = dayBtn.getAttribute('data-mpcal-iso')
        if (dayBtn.hasAttribute('disabled')) return
        mpCal.input.value = iso
        mpCal.input.dispatchEvent(new Event('input', { bubbles: true }))
        mpCal.input.dispatchEvent(new Event('change', { bubbles: true }))
        mpCloseCalendar(true)
      }
    })

    return el
  }

  function mpOpenCalendar(input, anchor) {
    const el = mpEnsureCalendar()
    mpCal.input = input
    mpCal.anchor = anchor || input

    // Modal on responsive / touch (same Meridian style, but optimized for mobile)
    const isModal =
      mpIsCoarsePointer() ||
      (window.matchMedia && window.matchMedia('(max-width: 860px)').matches)
    mpCal.isModal = !!isModal
    el.classList.toggle('mpCal--modal', mpCal.isModal)

    if (mpCal.backdrop) {
      mpCal.backdrop.hidden = false
      mpCal.backdrop.classList.add('is-open')
    }
    document.body.classList.add('mpNoScroll')

    const selected = mpIsoToDate(input.value)
    const base = selected || new Date()
    mpCal.view = new Date(base.getFullYear(), base.getMonth(), 1)

    mpRenderCalendar()
    el.hidden = false
    el.setAttribute('aria-hidden', 'false')

    // Clear any previous inline positioning when switching between modes.
    if (mpCal.isModal) {
      el.style.left = ''
      el.style.top = ''
      el.style.transform = ''
      return
    }

    window.requestAnimationFrame(() => mpPositionCalendar())
  }

  function mpCloseCalendar(refocus) {
    if (!mpCal.el) return
    mpCal.el.hidden = true
    mpCal.el.setAttribute('aria-hidden', 'true')

    if (mpCal.backdrop) {
      mpCal.backdrop.hidden = true
      mpCal.backdrop.classList.remove('is-open')
    }
    document.body.classList.remove('mpNoScroll')

    mpCal.el.classList.remove('mpCal--modal')
    mpCal.isModal = false

    const a = mpCal.anchor
    mpCal.input = null
    mpCal.anchor = null
    if (refocus && a && typeof a.focus === 'function') {
      try {
        a.focus({ preventScroll: true })
      } catch (e) {
        a.focus()
      }
    }
  }

  function mpPositionCalendar() {
    if (!mpCal.el || mpCal.el.hidden || !mpCal.anchor) return
    if (mpCal.isModal) return

    // Ensure it has a size
    mpCal.el.style.left = '0px'
    mpCal.el.style.top = '0px'

    const rect = mpCal.anchor.getBoundingClientRect()
    const calRect = mpCal.el.getBoundingClientRect()
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const pad = 12

    let left = rect.left
    let top = rect.bottom + 10

    if (left + calRect.width > vw - pad)
      left = Math.max(pad, vw - calRect.width - pad)
    if (top + calRect.height > vh - pad) top = rect.top - calRect.height - 10
    if (top < pad) top = pad

    mpCal.el.style.left = `${Math.round(left)}px`
    mpCal.el.style.top = `${Math.round(top)}px`
  }

  function mpRenderCalendar() {
    if (!mpCal.el || !mpCal.input || !mpCal.view) return
    const monthEl = mpCal.el.querySelector('[data-mpcal-month]')
    const yearEl = mpCal.el.querySelector('[data-mpcal-year]')
    const grid = mpCal.el.querySelector('[data-mpcal-grid]')
    if (!monthEl || !yearEl || !grid) return

    const y = mpCal.view.getFullYear()
    const m = mpCal.view.getMonth()

    monthEl.textContent = MP_MONTHS[m]
    yearEl.textContent = String(y)

    const first = new Date(y, m, 1)
    const startDow = first.getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()

    const minIso =
      mpCal.input.min && /^\d{4}-\d{2}-\d{2}$/.test(mpCal.input.min)
        ? mpCal.input.min
        : null
    const maxIso =
      mpCal.input.max && /^\d{4}-\d{2}-\d{2}$/.test(mpCal.input.max)
        ? mpCal.input.max
        : null
    const selectedIso =
      mpCal.input.value && /^\d{4}-\d{2}-\d{2}$/.test(mpCal.input.value)
        ? mpCal.input.value
        : null
    const todayIso = mpDateToIso(new Date())

    const cells = []
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startDow + 1
      const d = new Date(y, m, dayNum)
      const iso = mpDateToIso(d)

      const isOut = dayNum < 1 || dayNum > daysInMonth
      const isSelected = selectedIso && iso === selectedIso
      const isToday = iso === todayIso

      let isDisabled = false
      if (minIso && iso < minIso) isDisabled = true
      if (maxIso && iso > maxIso) isDisabled = true

      const cls = [
        'mpCal__day',
        isOut ? 'is-out' : '',
        isSelected ? 'is-selected' : '',
        isToday ? 'is-today' : '',
        isDisabled ? 'is-disabled' : ''
      ]
        .filter(Boolean)
        .join(' ')

      cells.push(
        `<button type="button" class="${cls}" data-mpcal-iso="${iso}" ${
          isDisabled ? 'disabled' : ''
        } aria-label="${iso}">
        ${d.getDate()}
      </button>`
      )
    }

    grid.innerHTML = cells.join('')
  }

  function buildBuilderMessage(state) {
    const lines = [
      `Hi Meridian Padel,`,
      ``,
      `I’d like to request a premium padel experience with:`
    ]

    if (state.city) lines.push(`• City: ${state.city}`)

    if (typeof state.days === 'number' && Number.isFinite(state.days))
      lines.push(`• Duration: ${state.days} days`)
    else if (state.days) lines.push(`• Duration: ${state.days}`)

    if (state.dateStart || state.dateEnd) {
      lines.push(`• Dates: ${formatDateRange(state.dateStart, state.dateEnd)}`)
    }

    if (state.level) lines.push(`• Package level: ${state.level}`)
    if (state.group != null) lines.push(`• Group size: ${state.group}`)
    if (Array.isArray(state.addons) && state.addons.length) {
      lines.push(`• Add-ons: ${state.addons.join(', ')}`)
    }

    return lines.join('\n')
  }

  function parseDaysValue(val) {
    if (val == null) return null
    const s = String(val)
    if (/^\d+$/.test(s)) return parseInt(s, 10)
    return s
  }

  function readQueryState() {
    const sp = new URLSearchParams(window.location.search)
    const city = sp.get('city')
    const days = sp.get('days')
    const level = sp.get('level')
    const group = sp.get('group')
    const addons = sp.get('addons')
    const dateStart = sp.get('date_start')
    const dateEnd = sp.get('date_end')
    return {
      city: city || null,
      days: days ? parseDaysValue(days) : null,
      level: level || null,
      group: group ? parseInt(group, 10) : null,
      dateStart: dateStart || null,
      dateEnd: dateEnd || null,
      addons: addons
        ? addons
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null
    }
  }

  function setQueryState(state) {
    const sp = new URLSearchParams(window.location.search)
    sp.set('city', state.city)
    sp.set('days', String(state.days))
    sp.set('level', state.level)
    sp.set('group', String(state.group))

    if (state.dateStart) sp.set('date_start', state.dateStart)
    else sp.delete('date_start')

    if (state.dateEnd) sp.set('date_end', state.dateEnd)
    else sp.delete('date_end')

    if (state.addons.length) sp.set('addons', state.addons.join(','))
    else sp.delete('addons')

    const next = `${window.location.pathname}?${sp.toString()}${
      window.location.hash || ''
    }`
    window.history.replaceState({}, '', next)
    return next
  }

  function initExperienceBuilder() {
    const roots = [...document.querySelectorAll('[data-experience-builder]')]
    if (!roots.length) return

    const urlState = readQueryState()

    roots.forEach((root) => {
      const citySel = root.querySelector('select[name="city"]')
      const daysSel = root.querySelector('select[name="days"]')
      const daysCustomWrap = root.querySelector('[data-eb-days-custom]')
      const daysCustomInp = root.querySelector('[data-eb-days-custom-input]')
      const levelSel = root.querySelector('select[name="level"]')
      const groupInp = root.querySelector('input[name="group"]')

      const startInp = root.querySelector('input[name="date_start"]')
      const endInp = root.querySelector('input[name="date_end"]')

      const addonBtns = [...root.querySelectorAll('.ebAddOn')]
      const summary = root.querySelector('[data-eb-summary]')
      const copyBtn = root.querySelector('[data-eb-copy]')
      const sendBtn = root.querySelector('[data-eb-send]')
      const targetSel = root.dataset.ebTarget || '#contact'

      if (!citySel || !daysSel || !levelSel || !groupInp || !summary) return

      const bindMpDate = (input) => {
        if (!input) return
        const wrap = input.closest('.mpDate')
        if (!wrap || wrap.dataset.mpDateBound) return
        wrap.dataset.mpDateBound = '1'

        const btn = wrap.querySelector('[data-mp-date-btn]')
        const label = wrap.querySelector('[data-mp-date-label]')
        const clearBtn = wrap.querySelector('[data-mp-date-clear]')

        const update = () => {
          if (!label) return
          if (!input.value) {
            label.textContent = 'Choose a date'
            label.classList.add('is-placeholder')
            if (clearBtn) clearBtn.hidden = true
            return
          }
          label.textContent = formatDateShort(input.value)
          label.classList.remove('is-placeholder')
          if (clearBtn) clearBtn.hidden = false
        }

        const open = () => {
          // Custom Meridian calendar on all devices (modal on mobile).
          mpOpenCalendar(input, btn || wrap)
        }

        btn && btn.addEventListener('click', open)
        input.addEventListener('input', update)
        input.addEventListener('change', update)

        if (clearBtn) {
          clearBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()

            input.value = ''
            input.dispatchEvent(new Event('input', { bubbles: true }))
            input.dispatchEvent(new Event('change', { bubbles: true }))

            // If the calendar is open for this input, close it.
            if (
              typeof mpCal !== 'undefined' &&
              mpCal &&
              mpCal.input === input
            ) {
              mpCloseCalendar(false)
            }

            update()
          })
        }

        update()
      }

      bindMpDate(startInp)
      bindMpDate(endInp)

      const syncDaysCustomUI = () => {
        if (!daysCustomWrap) return
        const on = daysSel && daysSel.value === 'Customize'
        daysCustomWrap.hidden = !on
        if (!on && daysCustomInp) daysCustomInp.value = ''
      }

      const getDaysValue = () => {
        if (!daysSel) return null
        if (daysSel.value === 'Customize') {
          const raw = daysCustomInp
            ? String(daysCustomInp.value || '').trim()
            : ''
          const n = raw ? parseInt(raw, 10) : NaN
          if (Number.isFinite(n) && n > 0) return n
          return 'Customize'
        }
        return parseDaysValue(daysSel.value)
      }

      syncDaysCustomUI()

      const state = {
        city: citySel.value,
        days: getDaysValue(),
        level: levelSel.value,
        group: parseInt(groupInp.value, 10) || 4,
        dateStart: startInp ? startInp.value || null : null,
        dateEnd: endInp ? endInp.value || null : null,
        addons: []
      }

      if (
        urlState.city &&
        [...citySel.options].some((o) => o.value === urlState.city)
      ) {
        citySel.value = urlState.city
        state.city = urlState.city
      }
      if (urlState.days != null) {
        const val = String(urlState.days)
        // If it's a normal option, select it.
        if ([...daysSel.options].some((o) => o.value === val)) {
          daysSel.value = val
          state.days = urlState.days
        } else if (
          typeof urlState.days === 'number' &&
          Number.isFinite(urlState.days)
        ) {
          // If it's a custom numeric value, switch to Customize and show the exact-days input.
          const hasCustomize = [...daysSel.options].some(
            (o) => o.value === 'Customize'
          )
          if (hasCustomize) {
            daysSel.value = 'Customize'
            if (daysCustomInp) daysCustomInp.value = String(urlState.days)
            state.days = urlState.days
            syncDaysCustomUI()
          }
        }
      }
      if (
        urlState.level &&
        [...levelSel.options].some((o) => o.value === urlState.level)
      ) {
        levelSel.value = urlState.level
        state.level = urlState.level
      }
      if (urlState.group && urlState.group >= 1 && urlState.group <= 50) {
        groupInp.value = String(urlState.group)
        state.group = urlState.group
      }
      if (
        startInp &&
        urlState.dateStart &&
        /^\d{4}-\d{2}-\d{2}$/.test(urlState.dateStart)
      ) {
        startInp.value = urlState.dateStart
        state.dateStart = urlState.dateStart
      }
      if (
        endInp &&
        urlState.dateEnd &&
        /^\d{4}-\d{2}-\d{2}$/.test(urlState.dateEnd)
      ) {
        endInp.value = urlState.dateEnd
        state.dateEnd = urlState.dateEnd
      }
      // Keep dates coherent + enforce duration (days)
      let mpSyncingDates = false
      const mpIsoAddDays = (iso, delta) => {
        const d = mpIsoToDate(iso)
        if (!d) return null
        d.setDate(d.getDate() + delta)
        return mpDateToIso(d)
      }
      const getDaysLimit = () => {
        const v = getDaysValue()
        return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
      }

      const syncDateBounds = () => {
        if (mpSyncingDates) return
        mpSyncingDates = true
        try {
          const limit = getDaysLimit()
          const startIso = startInp ? startInp.value || '' : ''
          const endIso = endInp ? endInp.value || '' : ''

          // Basic ordering
          if (startInp && endInp) {
            endInp.min = startIso || ''
            startInp.max = endIso || ''
          }

          // Duration limits
          if (endInp) {
            if (limit && startIso) {
              const maxEnd = mpIsoAddDays(startIso, limit - 1)
              endInp.max = maxEnd || ''
            } else {
              endInp.max = ''
            }
          }
          if (startInp) {
            if (limit && endIso) {
              const minStart = mpIsoAddDays(endIso, -(limit - 1))
              startInp.min = minStart || ''
            } else {
              startInp.min = ''
            }
          }

          // Clamp invalid selections (no more days than selected)
          if (startInp && endInp && startIso && endIso) {
            if (endIso < startIso) {
              endInp.value = ''
              state.dateEnd = null
              endInp.dispatchEvent(new Event('input', { bubbles: true }))
              endInp.dispatchEvent(new Event('change', { bubbles: true }))
              return
            }

            if (limit) {
              const maxEnd = mpIsoAddDays(startIso, limit - 1)
              if (maxEnd && endIso > maxEnd) {
                endInp.value = maxEnd
                state.dateEnd = maxEnd
                endInp.dispatchEvent(new Event('input', { bubbles: true }))
                endInp.dispatchEvent(new Event('change', { bubbles: true }))
              }

              // If end is set first, keep start inside the valid window too
              const minStart = mpIsoAddDays(
                endInp.value || endIso,
                -(limit - 1)
              )
              if (minStart && startInp.value && startInp.value < minStart) {
                startInp.value = minStart
                state.dateStart = minStart
                startInp.dispatchEvent(new Event('input', { bubbles: true }))
                startInp.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }
          }
        } finally {
          mpSyncingDates = false
        }
      }

      // Re-sync whenever dates OR duration changes
      startInp && startInp.addEventListener('change', syncDateBounds)
      startInp && startInp.addEventListener('input', syncDateBounds)
      endInp && endInp.addEventListener('change', syncDateBounds)
      endInp && endInp.addEventListener('input', syncDateBounds)
      daysSel && daysSel.addEventListener('change', syncDateBounds)
      daysSel && daysSel.addEventListener('input', syncDateBounds)
      daysCustomInp && daysCustomInp.addEventListener('change', syncDateBounds)
      daysCustomInp && daysCustomInp.addEventListener('input', syncDateBounds)
      syncDateBounds()

      if (urlState.addons && Array.isArray(urlState.addons)) {
        state.addons = urlState.addons
        addonBtns.forEach((b) =>
          b.classList.toggle('is-on', state.addons.includes(b.dataset.addon))
        )
      }

      ;[citySel, daysSel, levelSel].forEach((sel) => {
        sel.dispatchEvent(new Event('input', { bubbles: true }))
        sel.dispatchEvent(new Event('change', { bubbles: true }))
      })

      const render = () => {
        syncDateBounds()
        state.city = citySel.value
        syncDaysCustomUI()
        state.days = getDaysValue()
        state.level = levelSel.value
        state.group = Math.max(
          1,
          Math.min(50, parseInt(groupInp.value, 10) || 1)
        )

        state.dateStart = startInp ? startInp.value || null : null
        state.dateEnd = endInp ? endInp.value || null : null

        const addons = state.addons.length
          ? state.addons
              .map((a) => `<span class="chip chip--gold">${a}</span>`)
              .join('')
          : `<span class="chip">None</span>`

        const daysLabel =
          typeof state.days === 'number' && Number.isFinite(state.days)
            ? `${state.days}`
            : daysSel && daysSel.value === 'Customize'
            ? 'Custom'
            : `${state.days}`

        const datesLabel = formatDateRange(state.dateStart, state.dateEnd)

        summary.innerHTML = `
          <div class="ebSummary__row"><span class="muted">City</span><strong>${state.city}</strong></div>
          <div class="ebSummary__row"><span class="muted">Days</span><strong>${daysLabel}</strong></div>
          <div class="ebSummary__row"><span class="muted">Dates</span><strong>${datesLabel}</strong></div>
          <div class="ebSummary__row"><span class="muted">Level</span><strong>${state.level}</strong></div>
          <div class="ebSummary__row"><span class="muted">Group</span><strong>${state.group}</strong></div>
          <div class="ebSummary__addons">${addons}</div>
        `

        const link = setQueryState(state)
        root.dataset.ebShare = link
        window.dispatchEvent(
          new CustomEvent('mp:builderChange', {
            detail: { ...state, share: link }
          })
        )
      }

      addonBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.addon
          const idx = state.addons.indexOf(key)
          if (idx >= 0) state.addons.splice(idx, 1)
          else state.addons.push(key)
          btn.classList.toggle('is-on', idx < 0)
          render()
        })
      })
      ;[citySel, daysSel, levelSel].forEach((el) => {
        el.addEventListener('input', render)
        el.addEventListener('change', render)
      })
      ;[groupInp].forEach((el) => {
        el.addEventListener('input', render)
        el.addEventListener('change', render)
      })

      daysCustomInp && daysCustomInp.addEventListener('input', render)
      daysCustomInp && daysCustomInp.addEventListener('change', render)
      ;[startInp, endInp].filter(Boolean).forEach((el) => {
        el.addEventListener('input', render)
        el.addEventListener('change', render)
      })

      copyBtn &&
        copyBtn.addEventListener('click', async () => {
          const link = root.dataset.ebShare || setQueryState(state)
          try {
            await navigator.clipboard.writeText(window.location.origin + link)
            copyBtn.textContent = 'Copied!'
            window.setTimeout(() => (copyBtn.textContent = 'Copy link'), 1300)
          } catch (e) {
            window.prompt('Copy this link:', window.location.origin + link)
          }
        })

      sendBtn &&
        sendBtn.addEventListener('click', () => {
          const target = document.querySelector(targetSel)
          if (target)
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })

          const form = target
            ? target.querySelector('form')
            : document.querySelector('form')
          if (!form) return

          let hidden = form.querySelector('input[name="experience_builder"]')
          if (!hidden) {
            hidden = document.createElement('input')
            hidden.type = 'hidden'
            hidden.name = 'experience_builder'
            form.appendChild(hidden)
          }
          hidden.value = JSON.stringify(state)

          const textarea = form.querySelector('textarea[name="message"]')
          if (textarea) textarea.value = buildBuilderMessage(state)

          const topic = form.querySelector('select[name="topic"]')
          if (topic) {
            const hasTC = [...topic.options].some(
              (o) => o.value === 'Training Camp'
            )
            if (hasTC) {
              topic.value = 'Training Camp'
              topic.dispatchEvent(new Event('input', { bubbles: true }))
              topic.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }

          const name = form.querySelector('input[name="name"]')
          name && name.focus()
        })

      render()
    })
  }

  function initItinerary() {
    const root = document.querySelector('[data-itinerary]')
    if (!root) return

    const tabs = [...root.querySelectorAll('.itTab')]
    const body = root.querySelector('[data-itinerary-body]')
    if (!tabs.length || !body) return

    const data = {
      3: [
        {
          title: 'Day 1 · Arrival + assessment',
          items: [
            'Airport transfer + check-in',
            'Light session: technique baseline + mobility',
            'Dinner reservation (optional)'
          ]
        },
        {
          title: 'Day 2 · High-performance training',
          items: [
            'Morning: technical drills + patterns',
            'Afternoon: match play + curated sparring',
            'Recovery / physio (optional)'
          ]
        },
        {
          title: 'Day 3 · Match day + departure',
          items: [
            'Competitive set-tracking session',
            'Highlights review + next-steps plan',
            'Transfer to airport'
          ]
        }
      ],
      5: [
        {
          title: 'Day 1 · Arrival + assessment',
          items: [
            'Airport transfer + check-in',
            'Light session: baseline + objectives',
            'Welcome dinner (optional)'
          ]
        },
        {
          title: 'Day 2 · Technique focus',
          items: [
            'Morning: technical drills',
            'Afternoon: coached points',
            'Recovery block'
          ]
        },
        {
          title: 'Day 3 · Tactical day',
          items: [
            'Pattern training: transitions + net play',
            'Match play: curated sparring partners',
            'City / gastronomy plan (optional)'
          ]
        },
        {
          title: 'Day 4 · Performance intensity',
          items: [
            'High-intensity session',
            'Video feedback',
            'Premium dinner (optional)'
          ]
        },
        {
          title: 'Day 5 · Match day + wrap-up',
          items: [
            'Competitive sets',
            'Personal plan + recommendations',
            'Airport transfer'
          ]
        }
      ],
      7: [
        {
          title: 'Day 1 · Arrival + assessment',
          items: [
            'Airport transfer + check-in',
            'Mobility + baseline session',
            'Dinner (optional)'
          ]
        },
        {
          title: 'Day 2 · Technique + volume',
          items: ['Technical drills', 'Coached points', 'Recovery']
        },
        {
          title: 'Day 3 · Tactical build',
          items: ['Transitions + net dominance', 'Match play', 'Lifestyle plan']
        },
        {
          title: 'Day 4 · Mid-camp reset',
          items: [
            'Light session + prevention',
            'Spa / recovery (optional)',
            'Gastronomy (optional)'
          ]
        },
        {
          title: 'Day 5 · Performance intensity',
          items: [
            'High-intensity session',
            'Video feedback',
            'Curated sparring'
          ]
        },
        {
          title: 'Day 6 · Competition simulation',
          items: ['Tournament format', 'Pressure patterns', 'Dinner (optional)']
        },
        {
          title: 'Day 7 · Wrap-up + departure',
          items: [
            'Final sets',
            'Personal plan + next steps',
            'Airport transfer'
          ]
        }
      ]
    }

    const render = (days) => {
      const blocks = data[days] || data[5]
      body.innerHTML = blocks
        .map(
          (b) => `
        <div class="itDay">
          <div class="itDay__head">
            <h3 class="itDay__title">${b.title}</h3>
          </div>
          <ul class="itList">
            ${b.items.map((it) => `<li>${it}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('')

      tabs.forEach((t) => {
        const active = String(days) === t.dataset.days
        t.classList.toggle('is-active', active)
        t.setAttribute('aria-selected', active ? 'true' : 'false')
      })
    }

    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        const d = parseInt(t.dataset.days, 10)
        render(d)
        window.dispatchEvent(
          new CustomEvent('mp:daysChange', { detail: { days: d } })
        )
      })
    })

    window.addEventListener('mp:builderChange', (e) => {
      const d = e.detail && e.detail.days
      if ([3, 5, 7].includes(d)) render(d)
    })

    render(3)
  }

  function initAcademySpotlight() {
    const root = document.querySelector('[data-spotlight]')
    if (!root) return

    const rail = root.querySelector('[data-spotlight-rail]')
    if (!rail) return

    const isCoarsePointer =
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (navigator && navigator.maxTouchPoints && navigator.maxTouchPoints > 0)

    // ✅ En móvil/touch: no activamos drag-to-scroll (dejamos scroll nativo)
    if (isCoarsePointer) return

    // --- Drag-to-scroll (solo desktop) ---
    let isDown = false
    let startX = 0
    let startLeft = 0
    let didDrag = false

    const onDown = (e) => {
      isDown = true
      didDrag = false
      startX = e.clientX
      startLeft = rail.scrollLeft
      rail.classList.add('is-dragging')
    }

    const onMove = (e) => {
      if (!isDown) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 6) didDrag = true
      rail.scrollLeft = startLeft - dx
    }

    const onUp = () => {
      isDown = false
      rail.classList.remove('is-dragging')
      window.setTimeout(() => {
        didDrag = false
      }, 40)
    }

    rail.addEventListener('pointerdown', onDown)
    rail.addEventListener('pointermove', onMove)
    rail.addEventListener('pointerup', onUp)
    rail.addEventListener('pointercancel', onUp)
    rail.addEventListener('pointerleave', onUp)

    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  // Init WOW add-ons
  if (document.body.classList.contains('page--packages')) initScrollProgress()
  initCardSpotlight()
  initOnlineTimePill()
  initExperienceBuilder()
  initItinerary()
  initAcademySpotlight()

  // Trigger scroll reveal once everything is mounted
  initFaqReveal()

  injectSponsorsSection()

  // Cities ticker (home)
  requestAnimationFrame(() => setupCitiesTickerInfiniteLoop())
})
