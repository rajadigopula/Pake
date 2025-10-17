// ==UserScript==
// @name         YouTube Ad Blocker for Pake (Filter-based)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Block YouTube ads using proper filter list approach like Brave/uBlock Origin
// @author       You
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Ad Blocker (Filter-based): Initialized');

    // ===== NETWORK BLOCKING =====
    // Block ad-serving domains (like EasyList/EasyPrivacy)
    const adDomains = [
        'doubleclick.net',
        'googleadservices.com',
        'googlesyndication.com',
        'google-analytics.com',
        'googletagmanager.com',
        'googletagservices.com'
    ];

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        
        if (adDomains.some(domain => url.includes(domain))) {
            console.log('YouTube Ad Blocker: Blocked ad domain request');
            return Promise.reject(new Error('Blocked by ad filter'));
        }
        
        return originalFetch.apply(this, args);
    };

    // ===== COSMETIC FILTERING =====
    // Based on uBlock Origin filter syntax for YouTube
    // These are cosmetic filters that hide ad elements
    
    const cosmeticFilters = `
        /* Video player ads - network filters */
        .video-ads.ytp-ad-module,
        .ytp-ad-module,
        .ytp-ad-player-overlay,
        .ytp-ad-overlay-container,
        .ytp-ad-image-overlay,
        .ytp-ad-text-overlay,
        
        /* Display ads in feed */
        ytd-display-ad-renderer,
        ytd-ad-slot-renderer,
        ytd-in-feed-ad-layout-renderer,
        
        /* Promoted/sponsored content */
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-sparkles-text-search-renderer,
        ytd-compact-promoted-video-renderer,
        ytd-promoted-video-renderer,
        
        /* Masthead ads */
        #masthead-ad,
        ytd-video-masthead-ad-v3-renderer,
        ytd-primetime-promo-renderer,
        
        /* Banner ads */
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        yt-mealbar-promo-renderer,
        
        /* Action companion ads */
        ytd-action-companion-ad-renderer,
        
        /* Merch shelf */
        ytd-merch-shelf-renderer,
        
        /* Carousel ads */
        ytd-carousel-ad-renderer,
        
        /* Additional ad containers */
        #player-ads,
        #panels-ads,
        
        /* Ad badges on videos */
        ytd-compact-video-renderer:has(.ytd-ad-slot-renderer),
        ytd-rich-item-renderer:has(ytd-display-ad-renderer) {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            min-height: 0 !important;
        }
    `;

    // Inject cosmetic filters as CSS
    function injectCosmetic Filters() {
        const style = document.createElement('style');
        style.id = 'yt-adblock-cosmetic';
        style.textContent = cosmeticFilters;
        
        if (document.head) {
            document.head.appendChild(style);
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.head) {
                    document.head.appendChild(style);
                    obs.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    // ===== PLAYER ADS HANDLING =====
    // This mimics how uBlock Origin handles video ads
    
    function blockPlayerAds() {
        // Intercept player ad configuration
        const originalDefineProperty = Object.defineProperty;
        Object.defineProperty = function(obj, prop, descriptor) {
            if (prop === 'playerResponse' || prop === 'playerConfig') {
                if (descriptor && descriptor.value && typeof descriptor.value === 'object') {
                    // Remove ad placements from player response
                    if (descriptor.value.playerAds) {
                        delete descriptor.value.playerAds;
                    }
                    if (descriptor.value.adPlacements) {
                        delete descriptor.value.adPlacements;
                    }
                    if (descriptor.value.adSlots) {
                        delete descriptor.value.adSlots;
                    }
                }
            }
            return originalDefineProperty(obj, prop, descriptor);
        };
    }

    // ===== PROCEDURAL COSMETIC FILTERS =====
    // Remove elements that match specific patterns (like uBlock's procedural filters)
    
    function applyProceduralFilters() {
        // Remove sponsored content with ad badges
        const sponsoredElements = document.querySelectorAll('[overlay-style="SHORTS_DRAWER_SHELF"] ytd-ad-slot-renderer');
        sponsoredElements.forEach(el => {
            const parent = el.closest('ytd-rich-item-renderer') || el.closest('ytd-compact-video-renderer');
            if (parent) parent.remove();
        });

        // Remove elements with "Ad" badge
        const adBadges = document.querySelectorAll('.badge-style-type-ad, .ytp-ad-badge');
        adBadges.forEach(badge => {
            const videoContainer = badge.closest('ytd-rich-item-renderer') || 
                                  badge.closest('ytd-compact-video-renderer') ||
                                  badge.closest('ytd-video-renderer');
            if (videoContainer) videoContainer.remove();
        });
    }

    // ===== YOUTUBE POLYMER APP OBSERVER =====
    // Watch for dynamically loaded content (YouTube is a SPA)
    
    function observeYouTube() {
        const observer = new MutationObserver((mutations) => {
            applyProceduralFilters();
        });

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            setTimeout(observeYouTube, 100);
        }
    }

    // ===== INITIALIZATION =====
    
    // Inject cosmetic filters immediately
    injectCosmeticFilters();
    
    // Block player ads
    blockPlayerAds();
    
    // Apply procedural filters periodically
    setInterval(applyProceduralFilters, 2000);
    
    // Start observing DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeYouTube);
    } else {
        observeYouTube();
    }

    console.log('YouTube Ad Blocker (Filter-based): Ready');

})();
