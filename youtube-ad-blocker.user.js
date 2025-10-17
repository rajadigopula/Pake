// ==UserScript==
// @name         YouTube Ad Blocker for Pake (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Block all YouTube video and UI ads in Pake-packaged YouTube app
// @author       You
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  console.log("YouTube Ad Blocker Enhanced: Initialized");

  // Comprehensive CSS to hide all ad elements
  function injectAdBlockCSS() {
    const style = document.createElement("style");
    style.id = "youtube-adblock-style";
    style.textContent = `
            /* Video ads */
            .video-ads,
            .ytp-ad-module,
            .ytp-ad-overlay-container,
            .ytp-ad-overlay-image,
            .ytp-ad-text-overlay,
            .ytp-ad-image-overlay,
            .ytp-ad-player-overlay,
            .ytp-ad-player-overlay-instream-info,
            .ytp-ad-button-icon,
            
            /* Display ads */
            ytd-display-ad-renderer,
            ytd-ad-slot-renderer,
            ytd-in-feed-ad-layout-renderer,
            yt-mealbar-promo-renderer,
            ytd-statement-banner-renderer,
            ytd-banner-promo-renderer-background,
            
            /* Promoted content */
            ytd-promoted-sparkles-web-renderer,
            ytd-compact-promoted-video-renderer,
            ytd-promoted-video-renderer,
            ytd-promoted-sparkles-text-search-renderer,
            ytd-compact-promoted-item-renderer,
            ytd-video-masthead-ad-v3-renderer,
            ytd-primetime-promo-renderer,
            
            /* Masthead and banner ads */
            #masthead-ad,
            .ytd-action-companion-ad-renderer,
            ytd-action-companion-ad-renderer,
            
            /* Sidebar and feed ads */
            #player-ads,
            #panels-ads,
            .ytd-compact-promoted-video-renderer,
            ytd-carousel-ad-renderer,
            ytd-ad-slot-renderer,
            
            /* Search ads */
            .ytd-search-pyv-renderer,
            ytd-search-pyv-renderer,
            
            /* Overlay ads */
            .ytp-ce-element,
            .ytp-cards-teaser,
            
            /* Shopping ads */
            ytd-merch-shelf-renderer,
            ytd-product-details-renderer,
            
            /* General ad containers */
            [id^="ad-"],
            [class*="ad-container"],
            [class*="google_ads"],
            [class*="doubleclick"],
            div[id^="google_ads"],
            div[class^="ad-"],
            
            /* Additional ad elements */
            ytd-rich-item-renderer:has(ytd-display-ad-renderer),
            ytd-reel-item-renderer:has(ytd-display-ad-renderer) {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                min-height: 0 !important;
                max-height: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;

    if (document.head) {
      document.head.appendChild(style);
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.head) {
          document.head.appendChild(style);
          obs.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Block ad-related network requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (
      url.includes("/api/stats/ads") ||
      url.includes("/pagead/") ||
      url.includes("/ptracking") ||
      url.includes("doubleclick.net") ||
      url.includes("googleadservices.com") ||
      url.includes("googlesyndication.com") ||
      url.includes("/ad_data_204") ||
      url.includes("/get_midroll_info") ||
      url.includes("&ad_") ||
      url.includes("adunit=") ||
      url.includes("adformat=") ||
      url.includes("/api/stats/atr")
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
        url.includes("/ptracking") ||
        url.includes("doubleclick.net") ||
        url.includes("googleadservices.com") ||
        url.includes("googlesyndication.com"))
    ) {
      console.log("YouTube Ad Blocker: Blocked XHR to", url);
      return;
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  // Aggressive ad element removal
  function removeAds() {
    // Auto-click skip buttons
    const skipButtons = document.querySelectorAll(
      ".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button",
    );
    skipButtons.forEach((btn) => {
      if (btn.offsetParent !== null) {
        console.log("YouTube Ad Blocker: Clicking skip button");
        btn.click();
      }
    });

    // Comprehensive ad selectors
    const adSelectors = [
      // Video player ads
      ".video-ads",
      ".ytp-ad-module",
      ".ytp-ad-overlay-container",
      ".ytp-ad-text-overlay",
      ".ytp-ad-image-overlay",
      ".ytp-ad-player-overlay",

      // UI ads
      "ytd-display-ad-renderer",
      "ytd-ad-slot-renderer",
      "ytd-in-feed-ad-layout-renderer",
      "ytd-statement-banner-renderer",
      "ytd-banner-promo-renderer",
      "yt-mealbar-promo-renderer",

      // Promoted content
      "ytd-promoted-sparkles-web-renderer",
      "ytd-compact-promoted-video-renderer",
      "ytd-promoted-video-renderer",
      "ytd-promoted-sparkles-text-search-renderer",
      "ytd-video-masthead-ad-v3-renderer",
      "ytd-primetime-promo-renderer",

      // Specific ad containers
      "#masthead-ad",
      "#player-ads",
      "#panels-ads",
      "ytd-action-companion-ad-renderer",
      "ytd-carousel-ad-renderer",
      "ytd-merch-shelf-renderer",

      // Generic ad patterns
      '[id^="ad-"]',
      '[class*="ad-container"]',
      'div[id^="google_ads"]',
      'div[class^="ad-"]',
    ];

    let removedCount = 0;
    adSelectors.forEach((selector) => {
      try {
        const ads = document.querySelectorAll(selector);
        ads.forEach((ad) => {
          if (ad && ad.parentNode) {
            ad.remove();
            removedCount++;
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    if (removedCount > 0) {
      console.log(`YouTube Ad Blocker: Removed ${removedCount} ad element(s)`);
    }

    // Remove ad containers by checking text content
    const allElements = document.querySelectorAll(
      "ytd-rich-item-renderer, ytd-compact-video-renderer",
    );
    allElements.forEach((el) => {
      const adBadge = el.querySelector(
        ".ytd-ad-slot-renderer, ytd-ad-slot-renderer",
      );
      if (adBadge) {
        el.remove();
        console.log("YouTube Ad Blocker: Removed sponsored content");
      }
    });
  }

  // Speed up and skip video ads
  function handleVideoAds() {
    const video = document.querySelector("video.html5-main-video");
    if (!video) return;

    const adIndicators = [
      ".ytp-ad-player-overlay",
      ".ytp-ad-text",
      ".ytp-ad-preview-text",
      ".ad-showing",
    ];

    const hasAd = adIndicators.some((selector) =>
      document.querySelector(selector),
    );

    if (hasAd) {
      console.log("YouTube Ad Blocker: Video ad detected");

      // Try to skip to end
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = video.duration;
      }

      // Speed up and mute
      video.playbackRate = 16;
      video.muted = true;
      video.volume = 0;

      // Click skip button if available
      const skipBtn = document.querySelector(
        ".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button",
      );
      if (skipBtn) {
        skipBtn.click();
      }
    } else {
      // Restore normal playback
      if (video.playbackRate === 16) {
        video.playbackRate = 1;
        video.muted = false;
      }
    }
  }

  // Modify YouTube config to disable ads
  function interceptConfig() {
    const originalParse = JSON.parse;
    JSON.parse = function (...args) {
      const result = originalParse.apply(this, args);

      if (result && typeof result === "object") {
        // Remove ad-related configurations
        const adKeys = [
          "playerAds",
          "adPlacements",
          "adSlots",
          "playerResponse",
          "adBreakParams",
          "adSafetyReason",
          "adsToken",
        ];

        adKeys.forEach((key) => {
          if (result[key]) {
            delete result[key];
          }
        });

        // Clean nested ad data
        if (result.playerResponse) {
          if (result.playerResponse.playerAds) {
            delete result.playerResponse.playerAds;
          }
          if (result.playerResponse.adPlacements) {
            delete result.playerResponse.adPlacements;
          }
        }
      }

      return result;
    };
  }

  // Initialize immediately
  injectAdBlockCSS();
  interceptConfig();

  // Run ad removal aggressively
  const fastInterval = setInterval(removeAds, 200);
  const videoInterval = setInterval(handleVideoAds, 100);

  // MutationObserver for dynamic content
  const observer = new MutationObserver((mutations) => {
    removeAds();
  });

  // Start observing
  function startObserving() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
      console.log("YouTube Ad Blocker Enhanced: Observer started");
    } else {
      setTimeout(startObserving, 100);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserving);
  } else {
    startObserving();
  }

  // Also inject CSS when DOM is ready
  document.addEventListener("DOMContentLoaded", injectAdBlockCSS);

  console.log("YouTube Ad Blocker Enhanced: Fully loaded");
})();
