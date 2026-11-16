(function () {
  'use strict';

  // Footer year
  document.querySelectorAll('.yr').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Video: loads Vimeo's player when play is pressed ---------- */
  /* Visitors who turned Vimeo off in Cookie Preferences get a notice first. */

  function loadVideo(box) {
    var url = box.getAttribute('data-video');
    if (!url) return;
    var f = document.createElement('iframe');
    // dnt=1 asks Vimeo not to track the session / set analytics cookies.
    f.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'dnt=1&autoplay=1';
    f.title = box.getAttribute('data-title') || 'Video player';
    f.allow = 'autoplay; fullscreen; picture-in-picture'; // 'fullscreen' here replaces allowfullscreen
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    box.textContent = '';
    box.appendChild(f);
    f.focus();
  }

  function askBeforeLoading(box, playBtn) {
    if (box.querySelector('.video-consent')) return;
    var p = document.createElement('div');
    p.className = 'video-consent';
    p.setAttribute('role', 'group');
    p.setAttribute('aria-label', 'Third-party video notice');
    p.innerHTML =
      '<p>This video is hosted by Vimeo. Playing it loads Vimeo’s player, which may collect your IP address and device information and set cookies. ' +
      '<a href="cookies.html">Cookie Policy</a></p>' +
      '<div class="btn-row">' +
        '<button type="button" class="btn" data-choice="once">Play video</button>' +
        '<button type="button" class="btn" data-choice="always">Always allow Vimeo</button>' +
        '<button type="button" class="btn" data-choice="no">Not now</button>' +
      '</div>';
    p.addEventListener('click', function (e) {
      var c = e.target.closest('[data-choice]');
      if (!c) return;
      var choice = c.getAttribute('data-choice');
      if (choice === 'always') { window.NightshotConsent.save(true); loadVideo(box); }
      else if (choice === 'once') { loadVideo(box); }
      else { p.remove(); playBtn.focus(); }
    });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { p.remove(); playBtn.focus(); }
    });
    box.appendChild(p);
    p.querySelector('button').focus();
  }

  document.querySelectorAll('.video').forEach(function (box) {
    var btn = box.querySelector('.video-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.NightshotConsent && window.NightshotConsent.blocksMedia()) askBeforeLoading(box, btn);
      else loadVideo(box);
    });
  });

  /* ---------- Forms: submit to send.php, show the result on the page ---------- */

  var loadedAt = Date.now();

  document.querySelectorAll('form[data-ajax]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');

    function show(text, kind) {
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var data = new FormData(form);
      data.set('elapsed', String(Date.now() - loadedAt)); // time spent on the page (anti-bot)
      show('Sending\u2026', '');
      btn.disabled = true;

      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            show(res.message || 'Message submitted.', 'ok');
            loadedAt = Date.now();
            window.setTimeout(function () { btn.disabled = false; }, 8000); // avoid accidental double-sends
          } else {
            show((res && res.message) || 'Sorry, your message could not be sent. Please email contact@nightshot.media directly.', 'error');
            btn.disabled = false;
          }
        })
        .catch(function () {
          show('Sorry, your message could not be sent. Please email contact@nightshot.media directly.', 'error');
          btn.disabled = false;
        });
    });
  });
})();
