const defaultImages = [
  "https://i.scdn.co/image/ab67616d0000b273bc3199856f3a6eabc0fdf9d9",
  "https://mediaproxy.tvtropes.org/width/1200/https://static.tvtropes.org/pmwiki/pub/images/44ea7aac5aaa2959cbb296d10989eff51000x820x1_6.png"
];

let isEnabled = true;
let customImages = [...defaultImages];

let isGradual = false;
let gradualDurationHours = 8;
let gradualStartTime = Date.now();

function shouldReplaceImage() {
  if (!isGradual) return true;

  const now = Date.now();
  const elapsedMs = now - gradualStartTime;
  const durationMs = gradualDurationHours * 60 * 60 * 1000;

  let percentage = 0.01 + (elapsedMs / durationMs) * 0.99;
  if (percentage > 1) percentage = 1;
  if (percentage < 0.01) percentage = 0.01;

  return Math.random() <= percentage;
}

function getRandomImage() {
  const images = customImages.length > 0 ? customImages : defaultImages;
  return images[Math.floor(Math.random() * images.length)];
}

function replaceImageElement(img) {
  // Skip if already replaced
  if (img.dataset.nsanityReplaced) return;
  if (img.dataset.nsanitySkipped) return;

  if (!shouldReplaceImage()) {
    img.dataset.nsanitySkipped = 'true';
    return;
  }

  const newSrc = getRandomImage();

  // Attempt to keep dimensions to avoid breaking page layout too badly
  const w = img.width || img.clientWidth;
  const h = img.height || img.clientHeight;

  img.src = newSrc;
  if (img.srcset) {
    img.srcset = '';
  }
  img.dataset.nsanityReplaced = 'true';

  if (w && h) {
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    img.style.objectFit = 'cover';
  }
}

function replaceImages(node = document) {
  if (!isEnabled) return;

  // Replace <img> tags
  const imgs = node.getElementsByTagName ? node.getElementsByTagName('img') : [];
  for (let i = 0; i < imgs.length; i++) {
    replaceImageElement(imgs[i]);
  }

  if (node.tagName && node.tagName.toLowerCase() === 'img') {
    replaceImageElement(node);
  }
}

// Load settings and execute
chrome.storage.sync.get(['nsanityEnabled', 'nsanityImages', 'nsanityGradual', 'nsanityDuration', 'nsanityStartTime'], (result) => {
  if (result.nsanityEnabled !== undefined) {
    isEnabled = result.nsanityEnabled;
  }
  if (result.nsanityImages && result.nsanityImages.length > 0) {
    customImages = result.nsanityImages;
  }
  if (result.nsanityGradual !== undefined) {
    isGradual = result.nsanityGradual;
  }
  if (result.nsanityDuration !== undefined) {
    gradualDurationHours = result.nsanityDuration;
  }
  if (result.nsanityStartTime !== undefined) {
    gradualStartTime = result.nsanityStartTime;
  } else if (isGradual) {
    gradualStartTime = Date.now();
    chrome.storage.sync.set({ nsanityStartTime: gradualStartTime });
  }

  if (isEnabled) {
    // Initial replacement
    replaceImages(document.body);

    // Setup observer for dynamically added content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              replaceImages(node);
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          if (mutation.target.tagName.toLowerCase() === 'img' && !mutation.target.dataset.nsanityReplaced) {
            replaceImageElement(mutation.target);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
  }
});
