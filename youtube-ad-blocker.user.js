// ==UserScript==
// @name         YouTube Ad Blocker for Pake
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Block YouTube video ads in Pake-packaged YouTube app
// @author       You
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  console.log("YouTube Ad Blocker: Initialized");

  // Block ad-related network requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];
    if (
      typeof url === "string" &&
      (url.includes("/api/stats/ads") ||
        url.includes("/pagead/") ||
        url.includes("/doubleclick.net") ||
        url.includes("/googleadservices.com") ||
        url.includes("&ad_") ||
        url.includes("adformat="))
    ) {
      console.log("YouTube Ad Blocker: Blocked fetch to", url);
      return Promise.reject(new Error("Ad blocked"));
    }
    return originalFetch.apply(this, args);
  };

  // Block XMLHttpRequest ad requests
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (
      typeof url === "string" &&
      (url.includes("/api/stats/ads") ||
        url.includes("/pagead/") ||
        url.includes("/doubleclick.net") ||
        url.includes("/googleadservices.com"))
    ) {
      console.log("YouTube Ad Blocker: Blocked XHR to", url);
      return;
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  // Remove ad elements from the DOM
  function removeAds() {
    // Skip button ads
    const skipButtons = document.querySelectorAll(
      ".ytp-ad-skip-button, .ytp-ad-skip-button-modern",
    );
    skipButtons.forEach((btn) => {
      console.log("YouTube Ad Blocker: Clicking skip button");
      btn.click();
    });

    // Remove ad containers
    const adSelectors = [
      ".video-ads",
      ".ytp-ad-module",
      ".ytp-ad-overlay-container",
      ".ytp-ad-text-overlay",
      "ytd-display-ad-renderer",
      "ytd-promoted-sparkles-web-renderer",
      "ytd-compact-promoted-video-renderer",
      "ytd-promoted-video-renderer",
      "#masthead-ad",
      ".ytd-action-companion-ad-renderer",
      "ytd-banner-promo-renderer",
      ".ytd-video-masthead-ad-v3-renderer",
      "ytd-statement-banner-renderer",
    ];

    adSelectors.forEach((selector) => {
      const ads = document.querySelectorAll(selector);
      if (ads.length > 0) {
        console.log(
          `YouTube Ad Blocker: Removing ${ads.length} ad(s) with selector ${selector}`,
        );
        ads.forEach((ad) => ad.remove());
      }
    });
  }

  // Speed up ads if they can't be skipped
  function speedUpAds() {
    const video = document.querySelector("video.html5-main-video");
    if (!video) return;

    const adIndicator =
      document.querySelector(".ytp-ad-player-overlay") ||
      document.querySelector(".ytp-ad-text");

    if (adIndicator) {
      console.log("YouTube Ad Blocker: Ad detected, speeding up playback");
      video.playbackRate = 16;
      video.volume = 0;
      video.currentTime = video.duration || 9999;
    } else if (video.playbackRate === 16) {
      // Restore normal playback when ad ends
      video.playbackRate = 1;
      video.volume = 1;
    }
  }

  // Hide ad overlay containers
  function hideAdOverlays() {
    const style = document.createElement("style");
    style.textContent = `
            .video-ads.ytp-ad-module,
            .ytp-ad-overlay-container,
            .ytp-ad-text-overlay,
            ytd-display-ad-renderer,
            ytd-promoted-sparkles-web-renderer,
            ytd-banner-promo-renderer,
            #masthead-ad {
                display: none !important;
            }
        `;
    document.head.appendChild(style);
  }

  // Modify YouTube player config to disable ads
  function blockPlayerAds() {
    // Intercept player configuration
    const originalParse = JSON.parse;
    JSON.parse = function (...args) {
      const result = originalParse.apply(this, args);

      if (result && typeof result === "object") {
        // Disable ad-related properties in player config
        if (result.playerAds) {
          console.log("YouTube Ad Blocker: Disabled playerAds");
          result.playerAds = undefined;
        }
        if (result.adPlacements) {
          console.log("YouTube Ad Blocker: Disabled adPlacements");
          result.adPlacements = undefined;
        }
        if (result.adSlots) {
          console.log("YouTube Ad Blocker: Disabled adSlots");
          result.adSlots = undefined;
        }
      }

      return result;
    };
  }

  // Initialize
  hideAdOverlays();
  blockPlayerAds();

  // Run ad removal continuously
  setInterval(removeAds, 500);
  setInterval(speedUpAds, 100);

  // Observe DOM changes for dynamically loaded ads
  const observer = new MutationObserver(function (mutations) {
    removeAds();
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  console.log("YouTube Ad Blocker: Fully loaded");
})();
