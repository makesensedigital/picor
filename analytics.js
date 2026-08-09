(function () {
  const placeholderId = 'GTM-XXXXXXX';

  window.trackPicorEvent = window.trackPicorEvent || function () {};

  const containerId = (window.PICOR_GTM_ID || '').trim();
  if (!containerId || containerId === placeholderId) {
    console.warn('Google Tag Manager is not configured. Update analytics-config.js with your GTM container ID.');
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const existingScript = document.querySelector('script[data-gtm-container="' + containerId + '"]');
  if (!existingScript) {
    const tagScript = document.createElement('script');
    tagScript.async = true;
    tagScript.dataset.gtmContainer = containerId;
    tagScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tagScript, firstScript);
    } else {
      document.head.appendChild(tagScript);
    }
  }

  window.trackPicorEvent = function trackPicorEvent(eventName, params) {
    if (!eventName) {
      return;
    }

    window.dataLayer.push({
      event: eventName,
      page_title: document.title,
      page_location: window.location.href,
      debug_mode: Boolean(window.PICOR_ANALYTICS_DEBUG),
      ...params,
    });
  };

  const normalizeText = function (value) {
    return value.replace(/\s+/g, ' ').trim().slice(0, 80);
  };

  document.addEventListener('click', function (event) {
    const element = event.target.closest('[data-analytics-event]');
    if (!element) {
      return;
    }

    const linkUrl = element.getAttribute('href') || '';
    window.trackPicorEvent(element.dataset.analyticsEvent, {
      event_category: element.dataset.analyticsCategory || 'engagement',
      event_label: element.dataset.analyticsLabel || element.id || linkUrl || normalizeText(element.textContent || ''),
      link_url: linkUrl || undefined,
      link_text: normalizeText(element.textContent || ''),
    });
  });
}());