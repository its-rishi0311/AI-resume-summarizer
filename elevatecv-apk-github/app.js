/**
 * ElevateCV - AI Resume & Bio Bullet Summarizer
 * Comprehensive client-side NLP heuristics & optional Live AI Engine.
 */

(function () {
  'use strict';

  // ==========================================
  // 1. KNOWLEDGE BASES & POWER VERB MATRICES
  // ==========================================

  const POWER_VERBS = {
    leadership: [
      'Spearheaded', 'Orchestrated', 'Championed', 'Steered', 'Directed',
      'Mobilized', 'Governed', 'Guided', 'Mentored', 'Cultivated'
    ],
    technical: [
      'Architected', 'Engineered', 'Automated', 'Constructed', 'Refactored',
      'Deployed', 'Optimized', 'Integrated', 'Developed', 'Pioneered'
    ],
    growth: [
      'Accelerated', 'Expanded', 'Amplified', 'Maximized', 'Boosted',
      'Scaled', 'Catapulted', 'Drove', 'Generated', 'Captured'
    ],
    efficiency: [
      'Streamlined', 'Overhauled', 'Revitalized', 'Eliminated', 'Consolidated',
      'Restructured', 'Standardized', 'Modernized', 'Upgraded', 'Centralized'
    ],
    analytics: [
      'Analyzed', 'Modeled', 'Synthesized', 'Audited', 'Benchmarked',
      'Forecasted', 'Quantified', 'Discovered', 'Evaluated', 'Diagnosed'
    ]
  };

  const ALL_POWER_VERBS = Object.values(POWER_VERBS).flat();

  // Passive / Weak phrases to eliminate
  const WEAK_PHRASES = [
    /^(responsible for\s*(the)?\s*)/i,
    /^(was responsible for\s*(the)?\s*)/i,
    /^(helped\s*(to)?\s*)/i,
    /^(helped with\s*(the)?\s*)/i,
    /^(assisted\s*(in|with)?\s*)/i,
    /^(worked on\s*(the)?\s*)/i,
    /^(worked with\s*(the)?\s*)/i,
    /^(duties included\s*)/i,
    /^(handled\s*(the)?\s*)/i,
    /^(in charge of\s*)/i,
    /^(took care of\s*)/i,
    /^(participated in\s*)/i,
    /^(supported\s*(the)?\s*)/i,
    /^(contributed to\s*)/i,
    /^(did\s*)/i,
    /^(made\s*)/i
  ];

  const COMMON_SKILLS = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker',
    'Kubernetes', 'CI/CD', 'SQL', 'NoSQL', 'Git', 'Agile', 'Scrum', 'Figma',
    'REST APIs', 'GraphQL', 'Microservices', 'Machine Learning', 'Data Analysis',
    'Product Management', 'A/B Testing', 'SEO', 'Conversion Rate', 'Go', 'Java',
    'Cloud Architecture', 'DevOps', 'Cybersecurity', 'Cross-functional Leadership'
  ];

  // ==========================================
  // 2. PRESETS DATA
  // ==========================================

  const PRESETS = {
    swe: {
      mode: 'bullets',
      raw: `- Responsible for writing code and fixing bugs on the web application
- Helped modernize old database queries and improved page load speeds
- Worked with Docker and AWS to set up automated deployment pipelines
- Assisted the QA team with writing automated end-to-end tests in Cypress
- Handled daily code reviews and gave feedback to other developers`,
      jd: `Senior Software Engineer looking for expertise in AWS, Docker, CI/CD pipelines, high-concurrency microservices, automated testing, and scalable database optimization.`
    },
    pm: {
      mode: 'bullets',
      raw: `- Managed product backlog and ran bi-weekly sprint planning meetings
- Worked with design and engineering teams to launch a new checkout flow
- Handled customer feedback interviews to find user pain points
- Helped increase user signups and retention rate over the last two quarters
- Created product specs and roadmap documentation for stakeholders`,
      jd: `Lead Product Manager to drive user retention, roadmap execution, stakeholder management, Agile sprints, conversion rate optimization, and data-driven product analytics.`
    },
    mkt: {
      mode: 'bullets',
      raw: `- Responsible for social media campaigns across LinkedIn, Twitter, and Instagram
- Wrote weekly email newsletters and managed subscriber list
- Helped with Google Ads and paid social ad spend to get new leads
- Worked on SEO optimization for company blog posts to increase traffic
- Analyzed campaign performance metrics using Google Analytics`,
      jd: `Growth Marketing Specialist experienced in multi-channel paid acquisition, SEO keyword strategy, conversion funnels, email automation, CAC/LTV optimization, and Google Analytics.`
    },
    ds: {
      mode: 'bullets',
      raw: `- Built machine learning models in Python to predict customer churn
- Cleaned and prepared large datasets using SQL and Pandas
- Worked on interactive business intelligence dashboards in Tableau
- Assisted product team with designing and evaluating A/B test experiments
- Presented monthly data findings to executive leadership`,
      jd: `Senior Data Scientist with hands-on proficiency in Python, SQL, predictive ML models, A/B testing, data visualization, Tableau, and stakeholder reporting.`
    },
    grad: {
      mode: 'bullets',
      raw: `- Completed capstone project building a full-stack e-commerce web app
- Worked in a team of 4 students following Agile and Scrum methodologies
- Implemented user authentication with JWT and secure password hashing
- Designed database schema in PostgreSQL and built RESTful API endpoints
- Maintained 3.8 GPA and served as Teaching Assistant for Data Structures`,
      jd: `Junior Software Developer entry-level with strong grasp of REST APIs, Git, PostgreSQL, full-stack web development, computer science fundamentals, and proactive teamwork.`
    }
  };

  // ==========================================
  // 3. APPLICATION STATE
  // ==========================================

  const state = {
    currentMode: 'bullets', // 'bullets' | 'bio' | 'ats'
    viewMode: 'polished',   // 'polished' | 'diff'
    aiEngine: localStorage.getItem('elevate_ai_engine') || 'builtin',
    apiKey: localStorage.getItem('elevate_api_key') || '',
    history: JSON.parse(localStorage.getItem('elevate_history') || '[]'),
    lastInput: '',
    lastOutputItems: [],
    lastBioText: '',
    lastScore: 0,
    deferredPrompt: null
  };

  // ==========================================
  // 4. DOM ELEMENTS
  // ==========================================

  const DOM = {
    tabBullets: document.getElementById('tab-bullets'),
    tabBio: document.getElementById('tab-bio'),
    tabAts: document.getElementById('tab-ats'),
    inputModeBadge: document.getElementById('input-mode-badge'),
    inputHeading: document.getElementById('input-heading'),
    labelRawInput: document.getElementById('label-raw-input'),
    rawInputText: document.getElementById('raw-input-text'),
    charWordCount: document.getElementById('char-word-count'),
    btnClearInput: document.getElementById('btn-clear-input'),
    groupAtsJd: document.getElementById('group-ats-jd'),
    jdInputText: document.getElementById('jd-input-text'),
    selectTone: document.getElementById('select-tone'),
    selectSeniority: document.getElementById('select-seniority'),
    bioFormatItem: document.getElementById('bio-format-item'),
    selectBioStyle: document.getElementById('select-bio-style'),
    toggleMetrics: document.getElementById('toggle-metrics'),
    btnGenerate: document.getElementById('btn-generate'),
    btnGenerateText: document.getElementById('btn-generate-text'),
    segPolished: document.getElementById('seg-polished'),
    segDiff: document.getElementById('seg-diff'),
    btnCopyAll: document.getElementById('btn-copy-all'),
    btnExportDropdown: document.getElementById('btn-export-dropdown'),
    exportMenu: document.getElementById('export-menu'),
    exportMarkdown: document.getElementById('export-markdown'),
    exportTxt: document.getElementById('export-txt'),
    exportDoc: document.getElementById('export-doc'),
    exportPrint: document.getElementById('export-print'),
    emptyState: document.getElementById('empty-state'),
    resultsWrapper: document.getElementById('results-wrapper'),
    outputPolishedList: document.getElementById('output-polished-list'),
    outputDiffView: document.getElementById('output-diff-view'),
    meterScoreText: document.getElementById('meter-score-text'),
    scoreProgressBar: document.getElementById('score-progress-bar'),
    pillVerbs: document.getElementById('pill-verbs'),
    pillMetrics: document.getElementById('pill-metrics'),
    pillXyz: document.getElementById('pill-xyz'),
    pillConcise: document.getElementById('pill-concise'),
    atsCard: document.getElementById('ats-card'),
    atsPercentVal: document.getElementById('ats-percent-val'),
    atsMatchedTags: document.getElementById('ats-matched-tags'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    aiStatusIndicator: document.getElementById('ai-status-indicator'),
    settingsModal: document.getElementById('settings-modal'),
    settingsBackdrop: document.getElementById('settings-backdrop'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    apiKeyContainer: document.getElementById('api-key-container'),
    inputApiKey: document.getElementById('input-api-key'),
    btnToggleKeyVis: document.getElementById('btn-toggle-key-vis'),
    historyDrawer: document.getElementById('history-drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    btnToggleHistory: document.getElementById('btn-toggle-history'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    historyCount: document.getElementById('history-count'),
    historyItemsContainer: document.getElementById('history-items-container'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    toastContainer: document.getElementById('toast-container'),
    printContainer: document.getElementById('print-container'),
    // Mobile & PWA elements
    btnInstallApp: document.getElementById('btn-install-app'),
    mobileBottomNav: document.getElementById('mobile-bottom-nav'),
    mobNavBullets: document.getElementById('mob-nav-bullets'),
    mobNavBio: document.getElementById('mob-nav-bio'),
    mobNavAts: document.getElementById('mob-nav-ats'),
    mobNavHistory: document.getElementById('mob-nav-history'),
    mobNavSettings: document.getElementById('mob-nav-settings'),
    mobileInstallBanner: document.getElementById('mobile-install-banner'),
    btnBannerInstall: document.getElementById('btn-banner-install'),
    btnBannerClose: document.getElementById('btn-banner-close'),
    iosInstallModal: document.getElementById('ios-install-modal'),
    btnCloseIosModal: document.getElementById('btn-close-ios-modal'),
    btnGotItIos: document.getElementById('btn-got-it-ios'),
    iosModalBackdrop: document.getElementById('ios-modal-backdrop')
  };

  // ==========================================
  // 5. INITIALIZATION & EVENT LISTENERS
  // ==========================================

  function init() {
    registerServiceWorker();
    updateEngineUI();
    updateHistoryCount();
    bindEvents();
    initInstallPrompt();
    // Default load Software Engineer preset for immediate rich presentation
    loadPreset('swe');
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('ElevateCV Service Worker registered:', reg.scope))
          .catch((err) => console.log('Service Worker registration failed:', err));
      });
    }
  }

  function triggerHaptic(duration = 12) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(duration); } catch (_) {}
    }
  }

  function initInstallPrompt() {
    // Detect if already installed as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      if (DOM.btnInstallApp) DOM.btnInstallApp.style.display = 'none';
      if (DOM.mobileInstallBanner) DOM.mobileInstallBanner.style.display = 'none';
      return;
    }

    // Android & Chrome PWA install trigger
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredPrompt = e;
      if (DOM.btnInstallApp) DOM.btnInstallApp.style.display = 'inline-flex';
      if (DOM.mobileInstallBanner) {
        // Show mobile banner after small delay if on phone
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            DOM.mobileInstallBanner.style.display = 'block';
          }, 2000);
        }
      }
    });

    window.addEventListener('appinstalled', () => {
      state.deferredPrompt = null;
      if (DOM.btnInstallApp) DOM.btnInstallApp.style.display = 'none';
      if (DOM.mobileInstallBanner) DOM.mobileInstallBanner.style.display = 'none';
      showToast('ElevateCV installed successfully on your device!', 'success');
      triggerHaptic(40);
    });
  }

  function triggerInstallApp() {
    triggerHaptic(20);

    // If iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !window.navigator.standalone) {
      if (DOM.iosInstallModal) {
        DOM.iosInstallModal.style.display = 'flex';
        DOM.iosInstallModal.setAttribute('aria-hidden', 'false');
      }
      return;
    }

    // Standard Chromium / Android / Edge PWA prompt
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      state.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('Installing ElevateCV...', 'info');
        }
        state.deferredPrompt = null;
        if (DOM.mobileInstallBanner) DOM.mobileInstallBanner.style.display = 'none';
      });
    } else {
      // Fallback instruction
      showToast('To install: Tap your browser menu (⋮) and choose "Install App" or "Add to Home screen"', 'info');
    }
  }

  function bindEvents() {
    // Tab switching (Desktop)
    DOM.tabBullets.addEventListener('click', () => { triggerHaptic(); switchMode('bullets'); });
    DOM.tabBio.addEventListener('click', () => { triggerHaptic(); switchMode('bio'); });
    DOM.tabAts.addEventListener('click', () => { triggerHaptic(); switchMode('ats'); });

    // Mobile Bottom Nav switching
    if (DOM.mobNavBullets) DOM.mobNavBullets.addEventListener('click', () => { triggerHaptic(); switchMode('bullets'); });
    if (DOM.mobNavBio) DOM.mobNavBio.addEventListener('click', () => { triggerHaptic(); switchMode('bio'); });
    if (DOM.mobNavAts) DOM.mobNavAts.addEventListener('click', () => { triggerHaptic(); switchMode('ats'); });
    if (DOM.mobNavHistory) DOM.mobNavHistory.addEventListener('click', () => { triggerHaptic(); openHistoryDrawer(); });
    if (DOM.mobNavSettings) DOM.mobNavSettings.addEventListener('click', () => { triggerHaptic(); openSettingsModal(); });

    // Install buttons
    if (DOM.btnInstallApp) DOM.btnInstallApp.addEventListener('click', triggerInstallApp);
    if (DOM.btnBannerInstall) DOM.btnBannerInstall.addEventListener('click', triggerInstallApp);
    if (DOM.btnBannerClose) DOM.btnBannerClose.addEventListener('click', () => {
      if (DOM.mobileInstallBanner) DOM.mobileInstallBanner.style.display = 'none';
    });

    // iOS install modal
    if (DOM.btnCloseIosModal) DOM.btnCloseIosModal.addEventListener('click', closeIosModal);
    if (DOM.btnGotItIos) DOM.btnGotItIos.addEventListener('click', closeIosModal);
    if (DOM.iosModalBackdrop) DOM.iosModalBackdrop.addEventListener('click', closeIosModal);

    // Input monitoring
    DOM.rawInputText.addEventListener('input', updateCharWordCount);
    DOM.btnClearInput.addEventListener('click', clearInput);

    // Presets
    document.querySelectorAll('.preset-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        triggerHaptic();
        const presetKey = chip.getAttribute('data-preset');
        loadPreset(presetKey);
      });
    });

    // View mode toggle
    DOM.segPolished.addEventListener('click', () => { triggerHaptic(); switchViewMode('polished'); });
    DOM.segDiff.addEventListener('click', () => { triggerHaptic(); switchViewMode('diff'); });

    // Generate action
    DOM.btnGenerate.addEventListener('click', () => {
      triggerHaptic(25);
      handleGenerate();
    });
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerHaptic(25);
        handleGenerate();
      }
    });

    // Copy All
    DOM.btnCopyAll.addEventListener('click', () => { triggerHaptic(); handleCopyAll(); });

    // Export dropdown toggle & items
    DOM.btnExportDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerHaptic();
      DOM.exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      DOM.exportMenu.classList.remove('show');
    });

    DOM.exportMarkdown.addEventListener('click', exportAsMarkdown);
    DOM.exportTxt.addEventListener('click', exportAsTxt);
    DOM.exportDoc.addEventListener('click', exportAsDoc);
    DOM.exportPrint.addEventListener('click', exportAsPrint);

    // Settings Modal
    DOM.btnOpenSettings.addEventListener('click', () => { triggerHaptic(); openSettingsModal(); });
    DOM.btnCloseSettings.addEventListener('click', closeSettingsModal);
    DOM.btnCancelSettings.addEventListener('click', closeSettingsModal);
    DOM.settingsBackdrop.addEventListener('click', closeSettingsModal);
    DOM.btnSaveSettings.addEventListener('click', saveSettingsModal);

    document.querySelectorAll('input[name="ai_provider"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        handleProviderRadioChange(e.target.value);
      });
    });

    DOM.btnToggleKeyVis.addEventListener('click', toggleKeyVisibility);

    // History Drawer
    DOM.btnToggleHistory.addEventListener('click', () => { triggerHaptic(); openHistoryDrawer(); });
    DOM.btnCloseDrawer.addEventListener('click', closeHistoryDrawer);
    DOM.drawerBackdrop.addEventListener('click', closeHistoryDrawer);
    DOM.btnClearHistory.addEventListener('click', clearHistory);
  }

  function closeIosModal() {
    if (DOM.iosInstallModal) {
      DOM.iosInstallModal.style.display = 'none';
      DOM.iosInstallModal.setAttribute('aria-hidden', 'true');
    }
  }

  // ==========================================
  // 6. UI INTERACTION HANDLERS
  // ==========================================

  function switchMode(mode) {
    state.currentMode = mode;
    [DOM.tabBullets, DOM.tabBio, DOM.tabAts].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    // Update Mobile Nav active buttons
    [DOM.mobNavBullets, DOM.mobNavBio, DOM.mobNavAts].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (mode === 'bullets') {
      DOM.tabBullets.classList.add('active');
      if (DOM.mobNavBullets) DOM.mobNavBullets.classList.add('active');
      DOM.inputModeBadge.textContent = 'Bullet Points';
      DOM.inputHeading.textContent = 'Input Raw Experience';
      DOM.labelRawInput.textContent = 'Paste your raw bullets, unformatted tasks, or responsibilities:';
      DOM.groupAtsJd.style.display = 'none';
      DOM.bioFormatItem.style.display = 'none';
      DOM.btnGenerateText.textContent = 'Generate High-Impact Bullets';
    } else if (mode === 'bio') {
      DOM.tabBio.classList.add('active');
      if (DOM.mobNavBio) DOM.mobNavBio.classList.add('active');
      DOM.inputModeBadge.textContent = 'Bio Summarizer';
      DOM.inputHeading.textContent = 'Input Career Story / Resume Text';
      DOM.labelRawInput.textContent = 'Paste your resume overview, experience bullets, or rough notes:';
      DOM.groupAtsJd.style.display = 'none';
      DOM.bioFormatItem.style.display = 'flex';
      DOM.btnGenerateText.textContent = 'Synthesize Professional Bio';
    } else if (mode === 'ats') {
      DOM.tabAts.classList.add('active');
      if (DOM.mobNavAts) DOM.mobNavAts.classList.add('active');
      DOM.inputModeBadge.textContent = 'ATS Matcher';
      DOM.inputHeading.textContent = 'Bullets & Target Job Description';
      DOM.labelRawInput.textContent = 'Your current resume bullets:';
      DOM.groupAtsJd.style.display = 'flex';
      DOM.bioFormatItem.style.display = 'none';
      DOM.btnGenerateText.textContent = 'Optimize & Match Bullets to JD';
    }
  }

  function switchViewMode(view) {
    state.viewMode = view;
    if (view === 'polished') {
      DOM.segPolished.classList.add('active');
      DOM.segDiff.classList.remove('active');
      DOM.outputPolishedList.style.display = 'flex';
      DOM.outputDiffView.style.display = 'none';
    } else {
      DOM.segDiff.classList.add('active');
      DOM.segPolished.classList.remove('active');
      DOM.outputPolishedList.style.display = 'none';
      DOM.outputDiffView.style.display = 'flex';
    }
  }

  function updateCharWordCount() {
    const text = DOM.rawInputText.value.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    DOM.charWordCount.textContent = `${words} words | ${chars} chars`;
  }

  function clearInput() {
    DOM.rawInputText.value = '';
    updateCharWordCount();
    DOM.emptyState.style.display = 'flex';
    DOM.resultsWrapper.style.display = 'none';
    showToast('Input cleared', 'info');
  }

  function loadPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    switchMode(preset.mode);
    DOM.rawInputText.value = preset.raw;
    DOM.jdInputText.value = preset.jd;
    updateCharWordCount();
    showToast(`Loaded ${key.toUpperCase()} preset`, 'info');
    handleGenerate();
  }

  // ==========================================
  // 7. TRANSFORMATION & NLP CORE ENGINE
  // ==========================================

  async function handleGenerate() {
    const rawInput = DOM.rawInputText.value.trim();
    if (!rawInput) {
      showToast('Please provide some bullet points or notes to summarize', 'info');
      DOM.rawInputText.focus();
      return;
    }

    setLoadingState(true);

    try {
      if (state.aiEngine === 'gemini' && state.apiKey) {
        await runGeminiAI(rawInput);
      } else if (state.aiEngine === 'openai' && state.apiKey) {
        await runOpenAI(rawInput);
      } else {
        // Run intelligent built-in NLP engine
        await runBuiltInEngine(rawInput);
      }

      DOM.emptyState.style.display = 'none';
      DOM.resultsWrapper.style.display = 'flex';
      saveToHistory();
      showToast('Transformation complete!', 'success');
    } catch (err) {
      console.error('Generation error:', err);
      showToast(`Error: ${err.message}. Falling back to built-in engine.`, 'info');
      await runBuiltInEngine(rawInput);
      DOM.emptyState.style.display = 'none';
      DOM.resultsWrapper.style.display = 'flex';
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(loading) {
    if (loading) {
      DOM.btnGenerate.disabled = true;
      DOM.btnGenerate.style.opacity = '0.7';
      DOM.btnGenerateText.textContent = 'Synthesizing with AI...';
    } else {
      DOM.btnGenerate.disabled = false;
      DOM.btnGenerate.style.opacity = '1';
      if (state.currentMode === 'bullets') {
        DOM.btnGenerateText.textContent = 'Generate High-Impact Bullets';
      } else if (state.currentMode === 'bio') {
        DOM.btnGenerateText.textContent = 'Synthesize Professional Bio';
      } else {
        DOM.btnGenerateText.textContent = 'Optimize & Match Bullets to JD';
      }
    }
  }

  // ------------------------------------------------
  // Built-in Smart Heuristic Engine (100% Client Side)
  // ------------------------------------------------
  async function runBuiltInEngine(rawInput) {
    // Artificial small micro-delay for realistic tactile feel
    await new Promise(r => setTimeout(r, 200));

    const tone = DOM.selectTone.value;
    const seniority = DOM.selectSeniority.value;
    const quantify = DOM.toggleMetrics.checked;
    const targetJD = DOM.jdInputText.value.trim();

    if (state.currentMode === 'bio') {
      const bioFormat = DOM.selectBioStyle.value;
      const bioResult = synthesizeBio(rawInput, bioFormat, seniority, tone);
      renderBioOutput(bioResult, rawInput);
      state.lastBioText = bioResult;
      updateScorecard(bioResult, true);
    } else {
      const rawLines = extractLines(rawInput);
      const transformedPairs = rawLines.map((line, idx) => {
        return transformSingleBullet(line, tone, seniority, quantify, targetJD, idx);
      });

      state.lastOutputItems = transformedPairs;
      renderBulletsOutput(transformedPairs);

      // Score calculation
      const combinedCleanText = transformedPairs.map(p => p.afterClean).join(' ');
      updateScorecard(combinedCleanText, false, transformedPairs);

      // ATS processing if in ATS mode or JD provided
      if (state.currentMode === 'ats' || targetJD) {
        processAtsKeywords(combinedCleanText, targetJD);
      } else {
        DOM.atsCard.style.display = 'none';
      }
    }
  }

  function extractLines(text) {
    return text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l => l.replace(/^[-*•–—\d+.)\]]+\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  function transformSingleBullet(rawLine, tone, seniority, quantify, targetJD, index) {
    let cleanLine = rawLine;

    // 1. Strip passive starter phrases
    for (const regex of WEAK_PHRASES) {
      if (regex.test(cleanLine)) {
        cleanLine = cleanLine.replace(regex, '');
        break;
      }
    }

    // Capitalize remaining sentence start
    cleanLine = cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1);

    // 2. Select contextual Power Verb based on content
    const selectedVerb = pickSmartVerb(cleanLine, tone, seniority, index);

    // Check if line already starts with a power verb
    const firstWord = cleanLine.split(/\s+/)[0];
    const startsWithPowerVerb = ALL_POWER_VERBS.some(v => v.toLowerCase() === firstWord.toLowerCase());

    let corePhrase = cleanLine;
    if (startsWithPowerVerb) {
      corePhrase = cleanLine.replace(new RegExp(`^${firstWord}\\s*`, 'i'), '');
    }

    // 3. Inject Metric if missing and toggle enabled
    const hasExistingMetric = /\b(\d+[%$kKmMbB]?|\d+x|\$\d+)\b/.test(cleanLine);
    let metricPhrase = '';
    let metricClean = '';

    if (!hasExistingMetric && quantify) {
      const metricOptions = getSeniorityMetrics(seniority, index);
      metricClean = metricOptions.text;
      metricPhrase = ` <span class="hl-metric">${metricClean}</span>`;
    }

    // 4. Inject Seniority & Tone Context
    let methodology = getMethodologyAddon(corePhrase, tone, seniority);

    // 5. Inject ATS keyword if matching
    if (targetJD) {
      const matchedSkill = findUnusedSkillFromJd(targetJD, corePhrase);
      if (matchedSkill && !corePhrase.toLowerCase().includes(matchedSkill.toLowerCase())) {
        methodology += ` leveraging ${matchedSkill}`;
      }
    }

    // Construct final XYZ statement:
    // Accomplished [X] as measured by [Y], by doing [Z]
    const polishedHtml = `<span class="hl-verb">${selectedVerb}</span> ${corePhrase}${metricPhrase}${methodology}.`;
    const polishedClean = `${selectedVerb} ${corePhrase} ${metricClean ? metricClean + ' ' : ''}${methodology}.`.replace(/\s+/g, ' ');

    return {
      before: rawLine,
      afterHtml: polishedHtml,
      afterClean: polishedClean,
      verb: selectedVerb,
      hasMetric: hasExistingMetric || quantify
    };
  }

  function pickSmartVerb(line, tone, seniority, index) {
    const lower = line.toLowerCase();

    if (lower.includes('code') || lower.includes('software') || lower.includes('bug') || lower.includes('api') || lower.includes('test') || lower.includes('database')) {
      return getRotatingItem(POWER_VERBS.technical, index);
    }
    if (lower.includes('team') || lower.includes('manage') || lower.includes('lead') || lower.includes('hire') || lower.includes('agile') || lower.includes('stakeholder')) {
      return getRotatingItem(POWER_VERBS.leadership, index);
    }
    if (lower.includes('data') || lower.includes('analy') || lower.includes('model') || lower.includes('metric') || lower.includes('report') || lower.includes('churn')) {
      return getRotatingItem(POWER_VERBS.analytics, index);
    }
    if (lower.includes('campaign') || lower.includes('grow') || lower.includes('market') || lower.includes('seo') || lower.includes('sales') || lower.includes('lead')) {
      return getRotatingItem(POWER_VERBS.growth, index);
    }
    if (lower.includes('process') || lower.includes('improve') || lower.includes('streamline') || lower.includes('clean') || lower.includes('deploy')) {
      return getRotatingItem(POWER_VERBS.efficiency, index);
    }

    // Default based on tone
    if (tone === 'technical') return getRotatingItem(POWER_VERBS.technical, index);
    if (tone === 'star' || tone === 'executive') return getRotatingItem(POWER_VERBS.leadership, index);
    return getRotatingItem(POWER_VERBS.growth, index);
  }

  function getRotatingItem(arr, index) {
    return arr[index % arr.length];
  }

  function getSeniorityMetrics(seniority, index) {
    const leadMetrics = [
      { text: '[reducing cycle latency by 38%]' },
      { text: '[boosting operational throughput by 45%]' },
      { text: '[mentoring 6 junior and mid-level contributors]' },
      { text: '[yielding $140K+ in annual infrastructure savings]' },
      { text: '[maintaining 99.99% system availability]' }
    ];

    const midMetrics = [
      { text: '[improving sprint delivery velocity by 25%]' },
      { text: '[decreasing bug frequency by 32%]' },
      { text: '[scaling performance across 50,000+ active users]' },
      { text: '[slashing turnaround time from 4 days to 4 hours]' },
      { text: '[raising CSAT scores to 94%]' }
    ];

    const entryMetrics = [
      { text: '[completing all deliverable milestones 2 weeks ahead of deadline]' },
      { text: '[increasing test coverage from 60% to 88%]' },
      { text: '[supporting 1,200+ daily student transactions]' },
      { text: '[optimizing routine workflow execution time by 20%]' }
    ];

    const pool = seniority === 'lead' || seniority === 'exec' ? leadMetrics : (seniority === 'mid' ? midMetrics : entryMetrics);
    return pool[index % pool.length];
  }

  function getMethodologyAddon(phrase, tone, seniority) {
    // If phrase already has "using", "via", "through", "by", avoid duplication
    if (/\b(using|via|through|by|utilizing|leveraging)\b/i.test(phrase)) {
      return '';
    }

    if (tone === 'concise') return '';

    if (tone === 'star') {
      return ' through structured root-cause analysis and automated quality checks';
    }

    if (seniority === 'exec' || seniority === 'lead') {
      return ' by establishing cross-functional alignment and robust engineering standards';
    }

    return '';
  }

  function findUnusedSkillFromJd(jd, currentText) {
    const jdLower = jd.toLowerCase();
    for (const skill of COMMON_SKILLS) {
      if (jdLower.includes(skill.toLowerCase()) && !currentText.toLowerCase().includes(skill.toLowerCase())) {
        return skill;
      }
    }
    return null;
  }

  // ------------------------------------------------
  // Bio Synthesis Engine
  // ------------------------------------------------
  function synthesizeBio(rawText, format, seniority, tone) {
    const lines = extractLines(rawText);
    const summaryPoints = lines.slice(0, 5).join(', ');

    const titleMap = {
      lead: 'Senior Technical Leader & Strategist',
      exec: 'Executive Director & Operations Leader',
      mid: 'Results-Driven Specialist & Engineer',
      entry: 'Aspiring Technical Innovator & Problem Solver'
    };

    const roleTitle = titleMap[seniority] || 'High-Impact Professional';

    switch (format) {
      case 'exec_summary':
        return `${roleTitle} with a proven track record of engineering scalable solutions and delivering high-value business outcomes. Recognized for driving measurable impact across ${lines.length > 0 ? lines.slice(0, 2).join(' and ') : 'mission-critical projects'}. Adept at combining rigorous technical execution with strategic vision to accelerate team throughput, optimize workflows, and maintain uncompromising quality standards. Passionate about empowering cross-functional teams and translating complex challenges into competitive advantages.`;

      case 'linkedin':
        return `🚀 ${roleTitle} | Builder & Problem Solver

I specialize in taking ambiguous, complex problems and transforming them into streamlined, high-performance systems. Over the course of my career, I have focused on delivering quantifiable results and building tools that users love.

💡 Core Competencies & Signature Wins:
${lines.map(l => `• ${l}`).join('\n')}

When I'm not architecting systems or optimizing performance, I'm passionate about mentoring emerging talent and staying ahead of technological frontiers. 

📬 Always excited to connect with fellow builders, founders, and leaders—feel free to reach out directly!`;

      case 'elevator':
        return `I am a ${roleTitle.toLowerCase()} dedicated to turning complex operational and technical challenges into measurable business growth. With expertise across ${lines.slice(0, 2).join(' and ')}, I help teams scale faster with higher precision.`;

      case 'speaker':
        return `A recognized voice in modern system architecture and operational leadership, this ${roleTitle} has spearheaded initiatives spanning ${lines.slice(0, 2).join(' and ')}. With a strong emphasis on quantifiable impact and engineering excellence, they regularly share insights on scaling workflows, building high-performing teams, and executing forward-thinking product roadmaps.`;

      default:
        return rawText;
    }
  }

  // ------------------------------------------------
  // Scorecard & Strength Meter Evaluation
  // ------------------------------------------------
  function updateScorecard(text, isBio, bulletPairs = []) {
    let score = 50;

    // 1. Power Verbs Presence
    const verbCount = ALL_POWER_VERBS.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(text)).length;
    const hasStrongVerbs = verbCount >= (isBio ? 2 : (bulletPairs.length || 1));
    if (hasStrongVerbs) score += 15;

    // 2. Metrics / Quantifiable Numbers
    const metricsMatches = text.match(/\b(\d+%?|\$\d+|\d+x|\[.*?\])\b/g);
    const hasMetrics = metricsMatches && metricsMatches.length >= (isBio ? 1 : Math.max(1, Math.floor(bulletPairs.length * 0.7)));
    if (hasMetrics) score += 15;

    // 3. Lack of passive / filler buzzwords
    let fillerCount = 0;
    for (const regex of WEAK_PHRASES) {
      if (regex.test(text)) fillerCount++;
    }
    const isClean = fillerCount === 0;
    if (isClean) score += 10;

    // 4. XYZ structure / sentence length optimal range (15 - 35 words per bullet)
    let lengthOk = true;
    if (!isBio && bulletPairs.length > 0) {
      lengthOk = bulletPairs.every(p => {
        const words = p.afterClean.split(/\s+/).length;
        return words >= 10 && words <= 45;
      });
    }
    if (lengthOk) score += 10;

    // Bound score
    score = Math.min(98, Math.max(65, score));
    state.lastScore = score;

    // Render Meter
    DOM.meterScoreText.textContent = `${score}/100`;
    DOM.scoreProgressBar.style.width = `${score}%`;

    // Dynamic gradient color
    if (score >= 85) {
      DOM.scoreProgressBar.style.background = 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)';
      DOM.meterScoreText.style.color = '#10b981';
    } else if (score >= 70) {
      DOM.scoreProgressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)';
      DOM.meterScoreText.style.color = '#f59e0b';
    } else {
      DOM.scoreProgressBar.style.background = 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 100%)';
      DOM.meterScoreText.style.color = '#f43f5e';
    }

    // Update Pills
    updatePill(DOM.pillVerbs, hasStrongVerbs, '✓ Power Verbs', '! Add Power Verbs');
    updatePill(DOM.pillMetrics, hasMetrics, '✓ Quantifiable Metrics', '! Needs Metrics');
    updatePill(DOM.pillXyz, lengthOk, '✓ XYZ Structure', '! Check Length');
    updatePill(DOM.pillConcise, isClean, '✓ Filler Free', '! Passive Words');
  }

  function updatePill(elem, isGood, goodText, badText) {
    elem.textContent = isGood ? goodText : badText;
    elem.className = isGood ? 'pill pill-good' : 'pill pill-warn';
  }

  // ------------------------------------------------
  // ATS Keyword Matching
  // ------------------------------------------------
  function processAtsKeywords(resumeText, jdText) {
    if (!jdText) {
      DOM.atsCard.style.display = 'none';
      return;
    }

    DOM.atsCard.style.display = 'block';

    const resumeLower = resumeText.toLowerCase();
    const jdLower = jdText.toLowerCase();

    // Extract skills present in JD
    const jdSkills = COMMON_SKILLS.filter(skill => jdLower.includes(skill.toLowerCase()));

    if (jdSkills.length === 0) {
      DOM.atsPercentVal.textContent = '85%';
      DOM.atsMatchedTags.innerHTML = `<span class="kw-tag">General Match</span>`;
      return;
    }

    const matchedSkills = jdSkills.filter(skill => resumeLower.includes(skill.toLowerCase()));
    const matchRatio = Math.round((matchedSkills.length / jdSkills.length) * 100);
    const finalAtsScore = Math.max(65, Math.min(99, matchRatio + 20));

    DOM.atsPercentVal.textContent = `${finalAtsScore}%`;

    // Render tags
    DOM.atsMatchedTags.innerHTML = jdSkills.map(skill => {
      const isMatched = resumeLower.includes(skill.toLowerCase());
      return `<span class="kw-tag" style="${isMatched ? 'background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4);' : 'opacity: 0.6;'}">${isMatched ? '✓ ' : '+ '}${skill}</span>`;
    }).join('');
  }

  // ==========================================
  // 8. RENDERING FUNCTIONS
  // ==========================================

  function renderBulletsOutput(pairs) {
    // 1. Polished View
    DOM.outputPolishedList.innerHTML = pairs.map((pair, index) => {
      return `
        <div class="bullet-item-card">
          <div class="bullet-indicator"></div>
          <div class="bullet-text-content" id="bullet-content-${index}">${pair.afterHtml}</div>
          <div class="bullet-item-actions">
            <button type="button" class="btn-item-copy" title="Copy Bullet" onclick="window.elevateCopyItem(${index})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 2. Diff View
    DOM.outputDiffView.innerHTML = pairs.map(pair => {
      return `
        <div class="diff-pair">
          <div class="diff-row">
            <span class="diff-tag diff-tag-before">Before</span>
            <span class="diff-text-before">${escapeHtml(pair.before)}</span>
          </div>
          <div class="diff-row">
            <span class="diff-tag diff-tag-after">After</span>
            <span class="diff-text-after">${pair.afterHtml}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderBioOutput(bioText, rawInput) {
    DOM.outputPolishedList.innerHTML = `
      <div class="bio-result-card">
        <h4>Synthesized Professional Bio</h4>
        <div class="bio-text-paragraph">${escapeHtml(bioText)}</div>
      </div>
    `;

    DOM.outputDiffView.innerHTML = `
      <div class="diff-pair">
        <div class="diff-row">
          <span class="diff-tag diff-tag-before">Raw Notes</span>
          <span class="diff-text-before" style="white-space: pre-wrap;">${escapeHtml(rawInput)}</span>
        </div>
        <div class="diff-row">
          <span class="diff-tag diff-tag-after">Executive Bio</span>
          <span class="diff-text-after" style="white-space: pre-wrap;">${escapeHtml(bioText)}</span>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 9. LIVE REAL AI INTEGRATIONS
  // ==========================================

  async function runGeminiAI(prompt) {
    const tone = DOM.selectTone.value;
    const seniority = DOM.selectSeniority.value;
    const mode = state.currentMode;
    const jd = DOM.jdInputText.value.trim();

    const systemInstruction = `You are a world-class executive resume strategist and FAANG career coach.
Your mission is to rewrite the user's raw resume notes into high-impact Google XYZ formula accomplishments: Accomplished [X] as measured by [Y], by doing [Z].
Apply action verbs, quantifiable metrics, and ${tone} tone for a ${seniority} level professional.
${jd ? `Optimize and include relevant keywords from this target job description: ${jd}` : ''}
${mode === 'bio' ? 'Output a cohesive professional summary bio based on the format requested.' : 'Output one polished bullet per line. Do not include introductory or concluding conversational text.'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\nUser Input:\n${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini API Error (${response.status})`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error('No response text received from Gemini');

    if (mode === 'bio') {
      renderBioOutput(generatedText.trim(), prompt);
      state.lastBioText = generatedText.trim();
      updateScorecard(generatedText, true);
    } else {
      const lines = extractLines(generatedText);
      const rawLines = extractLines(prompt);
      const pairs = lines.map((line, idx) => ({
        before: rawLines[idx] || rawLines[0] || 'Original task',
        afterHtml: formatLLMBullet(line),
        afterClean: line,
        hasMetric: true
      }));
      state.lastOutputItems = pairs;
      renderBulletsOutput(pairs);
      updateScorecard(generatedText, false, pairs);
    }
  }

  async function runOpenAI(prompt) {
    const tone = DOM.selectTone.value;
    const seniority = DOM.selectSeniority.value;
    const mode = state.currentMode;
    const jd = DOM.jdInputText.value.trim();

    const systemMsg = `You are a premier executive resume strategist. Rewrite raw bullets using Google XYZ formula (Accomplished X as measured by Y, by doing Z), power verbs, and ${tone} tone for a ${seniority} candidate. ${jd ? `Target JD: ${jd}` : ''} ${mode === 'bio' ? 'Output a cohesive bio.' : 'Output strictly one bullet per line without conversational filler.'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API Error (${response.status})`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('No content returned from OpenAI');

    if (mode === 'bio') {
      renderBioOutput(text, prompt);
      state.lastBioText = text;
      updateScorecard(text, true);
    } else {
      const lines = extractLines(text);
      const rawLines = extractLines(prompt);
      const pairs = lines.map((line, idx) => ({
        before: rawLines[idx] || rawLines[0] || 'Original task',
        afterHtml: formatLLMBullet(line),
        afterClean: line,
        hasMetric: true
      }));
      state.lastOutputItems = pairs;
      renderBulletsOutput(pairs);
      updateScorecard(text, false, pairs);
    }
  }

  function formatLLMBullet(line) {
    // Highlight first word as verb and bracketed numbers
    const words = line.split(' ');
    const first = words[0];
    const rest = words.slice(1).join(' ');
    return `<span class="hl-verb">${first}</span> ${rest}`.replace(/(\[\d+.*?\]|\b\d+%|\$\d+[\w]*)/g, '<span class="hl-metric">$1</span>');
  }

  // ==========================================
  // 10. EXPORT & COPY UTILITIES
  // ==========================================

  function getCleanResultText() {
    if (state.currentMode === 'bio') {
      return state.lastBioText || '';
    }
    return state.lastOutputItems.map(p => `• ${p.afterClean}`).join('\n');
  }

  function handleCopyAll() {
    const text = getCleanResultText();
    if (!text) {
      showToast('No content to copy', 'info');
      return;
    }
    copyTextToClipboard(text);
    showToast('All results copied to clipboard!', 'success');
  }

  window.elevateCopyItem = function (index) {
    if (state.lastOutputItems && state.lastOutputItems[index]) {
      const text = state.lastOutputItems[index].afterClean;
      copyTextToClipboard(text);
      showToast('Bullet copied to clipboard!', 'success');
    }
  };

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  function exportAsMarkdown() {
    const text = getCleanResultText();
    if (!text) return showToast('No content to export', 'info');

    const mdContent = `# Resume Accomplishments & Summary\n\nGenerated by ElevateCV on ${new Date().toLocaleDateString()}\n\n${text}\n`;
    downloadFile(mdContent, 'ElevateCV_Resume_Bullets.md', 'text/markdown');
    showToast('Exported Markdown file', 'success');
  }

  function exportAsTxt() {
    const text = getCleanResultText();
    if (!text) return showToast('No content to export', 'info');

    const txtContent = `ElevateCV - Resume Bullets & Summary\nGenerated: ${new Date().toLocaleString()}\n----------------------------------------\n\n${text}\n`;
    downloadFile(txtContent, 'ElevateCV_Resume_Bullets.txt', 'text/plain');
    showToast('Exported Text file', 'success');
  }

  function exportAsDoc() {
    const text = getCleanResultText();
    if (!text) return showToast('No content to export', 'info');

    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Resume Bullets</title><style>body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }</style></head>
      <body>
        <h2>Resume Accomplishments</h2>
        ${state.currentMode === 'bio' 
          ? `<p>${text.replace(/\n/g, '<br>')}</p>` 
          : `<ul>${state.lastOutputItems.map(p => `<li>${p.afterClean}</li>`).join('')}</ul>`
        }
      </body>
      </html>
    `;
    downloadFile(htmlDoc, 'ElevateCV_Resume_Bullets.doc', 'application/msword');
    showToast('Exported Word document', 'success');
  }

  function exportAsPrint() {
    window.print();
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // 11. HISTORY & LOCAL STORAGE
  // ==========================================

  function saveToHistory() {
    const text = getCleanResultText();
    if (!text) return;

    const item = {
      id: Date.now(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
      mode: state.currentMode,
      raw: DOM.rawInputText.value,
      snippet: text.slice(0, 140) + '...',
      fullResult: text
    };

    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('elevate_history', JSON.stringify(state.history));
    updateHistoryCount();
  }

  function updateHistoryCount() {
    DOM.historyCount.textContent = state.history.length;
  }

  function openHistoryDrawer() {
    renderHistoryItems();
    DOM.historyDrawer.classList.add('open');
    DOM.historyDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeHistoryDrawer() {
    DOM.historyDrawer.classList.remove('open');
    DOM.historyDrawer.setAttribute('aria-hidden', 'true');
  }

  function renderHistoryItems() {
    if (state.history.length === 0) {
      DOM.historyItemsContainer.innerHTML = '<p class="drawer-empty">No history saved yet. Generated results will appear here automatically.</p>';
      return;
    }

    DOM.historyItemsContainer.innerHTML = state.history.map(item => `
      <div class="history-card" onclick="window.elevateLoadHistory(${item.id})">
        <div class="history-date">${item.date} • <strong style="text-transform: uppercase;">${item.mode}</strong></div>
        <div class="history-snippet">${escapeHtml(item.snippet)}</div>
      </div>
    `).join('');
  }

  window.elevateLoadHistory = function (id) {
    const found = state.history.find(h => h.id === id);
    if (!found) return;
    DOM.rawInputText.value = found.raw;
    switchMode(found.mode);
    updateCharWordCount();
    closeHistoryDrawer();
    handleGenerate();
  };

  function clearHistory() {
    state.history = [];
    localStorage.removeItem('elevate_history');
    updateHistoryCount();
    renderHistoryItems();
    showToast('History cleared', 'info');
  }

  // ==========================================
  // 12. SETTINGS MODAL & API CONFIG
  // ==========================================

  function openSettingsModal() {
    DOM.settingsModal.style.display = 'flex';
    DOM.settingsModal.setAttribute('aria-hidden', 'false');

    // Set active radio
    document.querySelectorAll('input[name="ai_provider"]').forEach(r => {
      r.checked = r.value === state.aiEngine;
    });

    handleProviderRadioChange(state.aiEngine);
    DOM.inputApiKey.value = state.apiKey;
  }

  function closeSettingsModal() {
    DOM.settingsModal.style.display = 'none';
    DOM.settingsModal.setAttribute('aria-hidden', 'true');
  }

  function handleProviderRadioChange(val) {
    document.querySelectorAll('.engine-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.getElementById(`card-engine-${val}`);
    if (activeCard) activeCard.classList.add('active');

    if (val === 'builtin') {
      DOM.apiKeyContainer.style.display = 'none';
    } else {
      DOM.apiKeyContainer.style.display = 'flex';
      const label = val === 'gemini' ? 'Google Gemini API Key:' : 'OpenAI API Key:';
      const placeholder = val === 'gemini' ? 'AIzaSy...' : 'sk-...';
      document.getElementById('label-api-key').textContent = label;
      DOM.inputApiKey.placeholder = placeholder;
    }
  }

  function saveSettingsModal() {
    const selectedRadio = document.querySelector('input[name="ai_provider"]:checked');
    const engine = selectedRadio ? selectedRadio.value : 'builtin';
    const key = DOM.inputApiKey.value.trim();

    if (engine !== 'builtin' && !key) {
      showToast('Please enter an API key or select the Built-in Engine', 'info');
      return;
    }

    state.aiEngine = engine;
    state.apiKey = key;

    localStorage.setItem('elevate_ai_engine', engine);
    localStorage.setItem('elevate_api_key', key);

    updateEngineUI();
    closeSettingsModal();
    showToast(`Active engine: ${engine === 'builtin' ? 'Built-in Engine' : engine.toUpperCase()}`, 'success');
  }

  function updateEngineUI() {
    if (state.aiEngine === 'builtin') {
      DOM.aiStatusIndicator.className = 'status-indicator';
      DOM.aiStatusIndicator.title = 'Built-in Engine Active';
    } else {
      DOM.aiStatusIndicator.className = 'status-indicator ai-active';
      DOM.aiStatusIndicator.title = `${state.aiEngine.toUpperCase()} Live AI Active`;
    }
  }

  function toggleKeyVisibility() {
    const type = DOM.inputApiKey.type === 'password' ? 'text' : 'password';
    DOM.inputApiKey.type = type;
  }

  // ==========================================
  // 13. TOAST NOTIFICATION UTILITY
  // ==========================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : 'ℹ'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
