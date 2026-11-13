(function () {
  'use strict';

  // Footer year
  document.querySelectorAll('.yr').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Video: click to load (Vimeo) ---------- */

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
      if (window.NightshotConsent && window.NightshotConsent.allowsMedia()) loadVideo(box);
      else askBeforeLoading(box, btn);
    });
  });

  /* ---------- Forms: compose an email in the visitor's mail app ---------- */

  var TO = 'contact@nightshot.media';

  function val(form, id) {
    var el = form.querySelector('#' + id);
    return el ? el.value.trim() : '';
  }

  var builders = {
    form: function (f) {
      var name = val(f, 'name'), email = val(f, 'email'), msg = val(f, 'message');
      return {
        subject: 'Inquiry from ' + name,
        body: msg + '\n\n— ' + name + '\n' + email
      };
    },
    'privacy-form': function (f) {
      var name = val(f, 'name'), email = val(f, 'email'),
          type = val(f, 'type'), details = val(f, 'details');
      return {
        subject: 'Privacy request: ' + type,
        body: 'Request type: ' + type + '\nName: ' + name + '\nEmail: ' + email +
              (details ? '\n\nDetails:\n' + details : '')
      };
    }
  };

  Object.keys(builders).forEach(function (id) {
    var form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var m = builders[id](form);
      var status = form.querySelector('.form-status');
      if (status) {
        status.textContent = 'Opening your email app with your message addressed to ' + TO +
          '. If nothing opens, please email us directly at that address.';
      }
      window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(m.subject) +
        '&body=' + encodeURIComponent(m.body);
    });
  });
})();
