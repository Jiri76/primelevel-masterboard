/* PrimeLevel's ONE front door (owner, 2026-10-02: "one code, one door, which
   is accessed in the Masterboard. Once I access the Masterboard, no more
   boxes.")

   Every private page loads this FIRST, in its <head>, before anything is
   drawn:
       <script src="door.js"></script>
       (Renewals, on the same website: /primelevel-masterboard/door.js)
   Pages: Masterboard home (the front door itself), Insider Edge,
   Investments, Inbox Report, Renewals. A new private page does the same.

   1. FIRST DECISION, before the first paint. It stamps <html data-view>:
        owner  this browser holds a session for the user already confirmed as
               the owner -> the page shows at once (instant, no waiting);
        wait   signed in but not confirmed yet (e.g. a different account), or
               just back from the emailed link -> nothing private shows yet;
        door   anyone else -> nothing private shows.
      Everything private carries class="pl-private" and stays hidden unless
      the stamp is "owner" (CSS below), so nothing private can ever flash.
   2. THE REAL CHECK: PrimeLevelDoor.gate(supabase, handlers). The database's
      own allow-list decides (is_email_report_viewer(), today only
      info@primelevel.co.uk), so a page can never disagree with the tables.
      Not signed in, another account, or a failed check -> the Masterboard
      front door (the home page passes its own handlers: it IS the door).
      PrimeLevelDoor.whenOwner(fn) runs a page's private loading once the
      owner is known (at once when the first decision already said owner).
   3. SIGN OUT (LOCKED 2026-10-01, SIGNIN-BOX-STANDARD.md "Sign out"): drawn
      by this file, identical on every page: top-right, 40/40 by eye
      (phones 20/20), Montserrat 20px bold gold. It signs out everywhere and
      wipes everything private this browser remembers (PRIVATE_KEYS).
   4. BACK ARROW (owner, 2026-10-03): Sign out's mirror, top-LEFT, on every
      page except the Masterboard home (which tells gate() frontDoor: true);
      always leads to the Masterboard, the hub. Owner only, like Sign out.

   This file only decides what the SCREEN shows. The real lock is the
   database, which refuses anyone but the owner whatever a page shows. */
(function () {
  'use strict';

  var FRONT_DOOR_URL = 'https://jiri76.github.io/primelevel-masterboard/';
  var AUTH_STORAGE_KEY = 'sb-kenlhcatkjthhzuaznpg-auth-token'; // where supabase-js keeps the session
  var OWNER_KEY = 'masterboard-owner-v1'; // the user id confirmed as the owner on this browser
  // Everything private this browser may remember. Sign out (and any check
  // that finds no owner) wipes it all. ADD every new private cache here.
  // (insider-edge-read-reports-v1 is NOT here on purpose: it only holds
  // report id numbers, and wiping it would make every report glow as new.)
  var PRIVATE_KEYS = [OWNER_KEY, 'masterboard-picture-cache-v1', 'insider-edge-reports-cache-v1'];

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function forgetPrivate() {
    PRIVATE_KEYS.forEach(function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* storage blocked: nothing stored either */ }
    });
  }

  // ---- 1. The first decision ----
  var view = 'door';
  try {
    var token = JSON.parse(read(AUTH_STORAGE_KEY) || 'null');
    if (token && token.user && token.user.id) view = read(OWNER_KEY) === token.user.id ? 'owner' : 'wait';
  } catch (e) { /* unreadable: stay on the door, the real check decides */ }
  if (view === 'door' && window.location.hash.indexOf('access_token') !== -1) view = 'wait';
  document.documentElement.setAttribute('data-view', view);

  function setView(next) {
    view = next;
    document.documentElement.setAttribute('data-view', next);
  }
  function isOwnerView() {
    return view === 'owner';
  }

  // Private parts hidden unless owner; the Sign out style (owner only).
  var style = document.createElement('style');
  style.textContent =
    ':root:not([data-view="owner"]) .pl-private { display: none !important; }' +
    '.signout { position: fixed; top: 37px; right: 40px; z-index: 10; margin: 0; padding: 0; border: 0;' +
    ' background: none; font-family: "Montserrat", sans-serif; font-size: 20px; font-weight: 700;' +
    ' color: #B29B68; text-decoration: none; cursor: pointer; transition: transform 0.15s ease; }' +
    // Only ever for the signed-in owner (owner, 2026-10-02: "the Sign out
    // shouldn't be there… I'm not in"): another account is signed out
    // automatically instead (endSession, used by the front door).
    ':root:not([data-view="owner"]) .signout { display: none; }' +
    // A gentle pop, like every other button in the family (owner, 2026-10-02:
    // "the button is dead… pop out gently"): 5% on hover (a small word needs a
    // little more than the tiles' 2.5% to show the same movement), a dip on
    // press. Only where a real pointer hovers; none if the device asks for less motion.
    '@media (hover: hover) { .signout:hover { transform: scale(1.05); } }' +
    '.signout:active { transform: scale(0.97); }' +
    '@media (prefers-reduced-motion: reduce) { .signout { transition: none; } .signout:hover, .signout:active { transform: none; } }' +
    '.signout:focus-visible { outline: 2px solid #B29B68; outline-offset: 2px; }' +
    '@media (max-width: 720px) { .signout { top: 17px; right: 20px; } }' +
    // The back arrow (owner, 2026-10-03): Sign out's mirror in the top-LEFT
    // corner, identical in everything but the words. Its ink is exactly its
    // drawing's box (see BACK_ARROW_SVG), so: drawing at 40 / 40 by eye
    // (phones 20 / 20), as long as the letters "Sign out" (88px), as tall as
    // their letters (16px: top of the tallest letters -> baseline), lines as
    // thick as the bold letters (3.2px), the same gold, the same pop. The 14px
    // padding is an invisible tap area (116 x 44); 26 + 14 = 40, 6 + 14 = 20.
    '.back { position: fixed; top: 26px; left: 26px; z-index: 10; padding: 14px; line-height: 0;' +
    ' color: #B29B68; transition: transform 0.15s ease; }' +
    '.back svg { display: block; width: 88px; height: 16px; overflow: visible; }' +
    ':root:not([data-view="owner"]) .back { display: none; }' +
    '@media (hover: hover) { .back:hover { transform: scale(1.05); } }' +
    '.back:active { transform: scale(0.97); }' +
    '@media (prefers-reduced-motion: reduce) { .back { transition: none; } .back:hover, .back:active { transform: none; } }' +
    '.back:focus-visible { outline: none; } .back:focus-visible svg { outline: 2px solid #B29B68; outline-offset: 2px; }' +
    '@media (max-width: 720px) { .back { top: 6px; left: 6px; } }';
  document.head.appendChild(style);

  function goToFrontDoor() {
    window.location.replace(FRONT_DOOR_URL); // replace: Back never returns to a private page
  }

  // ---- 3. Sign out ----
  // Ends the session on this browser: wipes everything private, signs out
  // with Supabase, and if Supabase can't be reached (no connection: it then
  // keeps the session) removes the session directly. Never leaves a page
  // signed in. Used by the Sign out button and by the front door to sign
  // another account out automatically.
  function endSession(supabase) {
    forgetPrivate();
    return supabase.auth.signOut().then(function (result) {
      if (result && result.error) {
        console.error('Sign out could not reach Supabase:', result.error);
        try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) { /* nothing stored */ }
      }
    });
  }

  var signOutButton = null;
  function addSignOut(supabase) {
    if (signOutButton) return;
    signOutButton = document.createElement('button');
    signOutButton.type = 'button';
    signOutButton.className = 'signout';
    signOutButton.id = 'signOutButton';
    signOutButton.textContent = 'Sign out';
    signOutButton.addEventListener('click', function () {
      endSession(supabase).then(goToFrontDoor);
    });
    document.body.appendChild(signOutButton);
  }

  // ---- 3b. The back arrow (every page but the Masterboard itself) ----
  // Always to the Masterboard, the hub (owner, 2026-10-03: "the Masterboard is
  // the hub"): the same place every time, even when a page was opened from an
  // email link, a bookmark or a new tab. A plain link, so it is instant and
  // the keyboard reaches it; the Masterboard is fetched ahead of time the
  // moment the arrow appears, so the click lands without waiting.
  // The drawing: a "<" head and a shaft, stroke 3.2. With butt ends and a
  // mitred tip the ink sits EXACTLY on the 88 x 16 box: the tip's mitre
  // reaches 1.6 / sin 45 = 2.263 left of its point, each arm's end 1.6 x
  // cos 45 = 1.131 above / below its point, the shaft ends square at 88.
  var BACK_ARROW_SVG =
    '<svg viewBox="0 0 88 16" aria-hidden="true" focusable="false">' +
    '<path d="M9.132 1.131 L2.263 8 L9.132 14.869 M2.263 8 H88" fill="none" stroke="currentColor"' +
    ' stroke-width="3.2" stroke-linejoin="miter" stroke-miterlimit="4" stroke-linecap="butt"/></svg>';
  var backLink = null;
  function addBack() {
    if (backLink) return;
    backLink = document.createElement('a');
    backLink.className = 'back';
    backLink.id = 'backLink';
    backLink.href = FRONT_DOOR_URL;
    backLink.setAttribute('aria-label', 'Back to the Masterboard');
    backLink.innerHTML = BACK_ARROW_SVG;
    document.body.appendChild(backLink);
    var ahead = document.createElement('link');
    ahead.rel = 'prefetch';
    ahead.href = FRONT_DOOR_URL;
    document.head.appendChild(ahead);
  }

  // ---- 2. The real check ----
  var ownerWaiting = [];
  function whenOwner(fn) {
    if (isOwnerView()) fn();
    else ownerWaiting.push(fn);
  }

  function gate(supabase, handlers) {
    handlers = handlers || {};
    var routedFor = null; // ignore repeat events for the same state (e.g. token refreshes)

    function route(session) {
      var key = session ? session.user.id : 'signed-out';
      if (key === routedFor) return;
      routedFor = key;

      if (!session) {
        forgetPrivate();
        // Signed out elsewhere, or the session ended, while private things
        // are on screen: reload, so nothing private stays in the page.
        if (isOwnerView()) { window.location.reload(); return; }
        if (handlers.notSignedIn) handlers.notSignedIn(); else goToFrontDoor();
        return;
      }

      // The emailed link comes back with tokens in the address: tidy it.
      if (window.location.hash.indexOf('access_token') !== -1) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      supabase.rpc('is_email_report_viewer').then(function (result) {
        if (result.error) {
          console.error('Could not check access:', result.error);
          if (isOwnerView()) return; // keep the page; the database still guards every read
          if (handlers.checkFailed) handlers.checkFailed(result.error); else goToFrontDoor();
          return;
        }
        if (result.data) {
          try { localStorage.setItem(OWNER_KEY, session.user.id); } catch (e) { /* just not instant next time */ }
          setView('owner');
          addSignOut(supabase);
          if (!handlers.frontDoor) addBack(); // the Masterboard itself is where the arrow leads
          var waiting = ownerWaiting;
          ownerWaiting = [];
          waiting.forEach(function (fn) { fn(); });
          return;
        }
        forgetPrivate();
        if (isOwnerView()) { window.location.reload(); return; }
        if (handlers.notOwner) handlers.notOwner(session); else goToFrontDoor();
      });
    }

    // Supabase's advice: no Supabase calls inside this callback, so the
    // check runs just after it.
    supabase.auth.onAuthStateChange(function (_event, session) {
      setTimeout(function () { route(session); }, 0);
    });
    // Back/forward can restore a frozen copy of a page: re-check, so a page
    // left signed in never reappears after a sign out.
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted) return;
      routedFor = null;
      supabase.auth.getSession().then(function (r) { route(r.data.session); });
    });
    supabase.auth.getSession().then(function (r) { route(r.data.session); });
  }

  // Only what the pages use (Sign out, the back arrow and the private wipe
  // are drawn / run by this file itself).
  window.PrimeLevelDoor = {
    FRONT_DOOR_URL: FRONT_DOOR_URL,
    gate: gate,
    whenOwner: whenOwner,
    isOwnerView: isOwnerView,
    setView: setView,
    endSession: endSession,
  };
})();
