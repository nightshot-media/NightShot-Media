/*
 * Cookie / third-party content preferences.
 *
 * The site itself sets no cookies and runs no analytics or advertising.
 * The only optional third-party technology is the Vimeo video player, which
 * is loaded only after a visitor chooses to play a video (see js/site.js).
 *
 * The visitor's choice is stored in localStorage under KEY and expires after
 * MAX_AGE_MS, after which they are asked again. To add another optional
 * category later (e.g. analytics), add a boolean field next to `media`,
 * a checkbox in buildDialog(), and gate the script on NightshotConsent.
 */
(function () {
  'use strict';

  var KEY = 'nightshot_consent';
  var VERSION = 1;
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // re-ask after 12 months
  var memory = null; // fallback when localStorage is unavailable

  function read() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    if (raw) {
      try {
        var r = JSON.parse(raw);
        if (r && r.v === VERSION && typeof r.media === 'boolean' &&
            typeof r.ts === 'number' && Date.now() - r.ts < MAX_AGE_MS) {
          return r;
        }
      } catch (e) { /* corrupt value: treat as no choice */ }
    }
    if (memory && Date.now() - memory.ts < MAX_AGE_MS) return memory;
    return null;
  }

  function save(media) {
    var r = { v: VERSION, media: !!media, ts: Date.now() };
    memory = r;
    try { window.localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('nightshot:consent', { detail: r }));
    return r;
  }

  function announce(msg) {
    var live = document.getElementById('consent-live');
    if (!live) {
      live = document.createElement('div');
      live.id = 'consent-live';
      live.className = 'sr-only';
      live.setAttribute('role', 'status');
      document.body.appendChild(live);
    }
    live.textContent = '';
    window.setTimeout(function () { live.textContent = msg; }, 50);
  }

  function buildDialog() {
    var d = document.createElement('dialog');
    d.id = 'consent-dialog';
    d.className = 'consent-dialog';
    d.setAttribute('aria-labelledby', 'consent-title');
    d.innerHTML =
      '<div class="consent-inner">' +
        '<button type="button" class="consent-close" data-action="close" aria-label="Close cookie preferences">&times;</button>' +
        '<h2 id="consent-title">Cookie Preferences</h2>' +
        '<p>Choose which optional technologies this site may use. Your choice is saved on this device for 12 months. You can change it at any time from the footer.</p>' +
        '<div class="consent-row">' +
          '<div><strong>Strictly necessary</strong><p>Remembers your choices on this page. Contains no tracking. Always on.</p></div>' +
        '</div>' +
        '<div class="consent-row">' +
          '<label for="consent-media"><strong>Third-party video (Vimeo)</strong>' +
          '<span class="consent-desc">Lets the site load the Vimeo video player when you press play. Vimeo may receive your IP address and device information and may set cookies. Off by default.</span></label>' +
          '<input type="checkbox" id="consent-media">' +
        '</div>' +
        '<p class="consent-links"><a href="cookies.html">Cookie Policy</a> · <a href="privacy.html">Privacy Policy</a></p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn" data-action="accept">Accept All</button>' +
          '<button type="button" class="btn" data-action="reject">Reject Non-Essential</button>' +
          '<button type="button" class="btn" data-action="save">Save Preferences</button>' +
        '</div>' +
      '</div>';

    d.addEventListener('click', function (e) {
      if (e.target === d) { d.close(); return; } // click on backdrop
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'accept') { save(true); announce('All optional content allowed. Preferences saved.'); }
      else if (action === 'reject') { save(false); announce('Non-essential content rejected. Preferences saved.'); }
      else if (action === 'save') {
        save(d.querySelector('#consent-media').checked);
        announce('Preferences saved.');
      }
      d.close();
    });
    document.body.appendChild(d);
    return d;
  }

  function openDialog() {
    var d = document.getElementById('consent-dialog') || buildDialog();
    var r = read();
    d.querySelector('#consent-media').checked = !!(r && r.media);
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-cookie-prefs]');
    if (opener) { e.preventDefault(); openDialog(); }
  });

  window.NightshotConsent = {
    allowsMedia: function () { var r = read(); return !!(r && r.media); },
    hasChoice: function () { return read() !== null; },
    save: save,
    open: openDialog
  };
})();
