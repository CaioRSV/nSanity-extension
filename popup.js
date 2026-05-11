const defaultImages = [
    "https://i.scdn.co/image/ab67616d0000b273bc3199856f3a6eabc0fdf9d9",
    "https://mediaproxy.tvtropes.org/width/1200/https://static.tvtropes.org/pmwiki/pub/images/44ea7aac5aaa2959cbb296d10989eff51000x820x1_6.png"
];

document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');
    const imageUrls = document.getElementById('imageUrls');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusMsg = document.getElementById('statusMsg');
    const gradualToggle = document.getElementById('gradualToggle');
    const gradualSettings = document.getElementById('gradualSettings');
    const gradualHours = document.getElementById('gradualHours');
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    const previewToggle = document.getElementById('previewToggle');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    // Load current settings
    chrome.storage.sync.get(['nsanityEnabled', 'nsanityImages', 'nsanityGradual', 'nsanityDuration'], (result) => {
        const isEnabled = result.nsanityEnabled !== undefined ? result.nsanityEnabled : true;
        enableToggle.checked = isEnabled;
        updateStatusText(isEnabled);

        const images = result.nsanityImages && result.nsanityImages.length > 0 ? result.nsanityImages : defaultImages;
        imageUrls.value = images.join('\n');

        const isGradual = result.nsanityGradual !== undefined ? result.nsanityGradual : false;
        gradualToggle.checked = isGradual;
        gradualSettings.style.display = isGradual ? 'block' : 'none';

        const duration = result.nsanityDuration !== undefined ? result.nsanityDuration : 8;
        gradualHours.value = duration;
    });

    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Enabled' : 'Disabled';
        statusText.style.color = enabled ? '#e94560' : '#888';
    }

    enableToggle.addEventListener('change', () => {
        const isEnabled = enableToggle.checked;
        updateStatusText(isEnabled);
        chrome.storage.sync.set({ nsanityEnabled: isEnabled }, () => {
            showStatus('Toggle saved. Reload page to see changes.');
        });
    });

    gradualToggle.addEventListener('change', () => {
        const isGradual = gradualToggle.checked;
        gradualSettings.style.display = isGradual ? 'block' : 'none';

        const updates = { nsanityGradual: isGradual };
        if (isGradual) {
            updates.nsanityStartTime = Date.now();
        }
        chrome.storage.sync.set(updates, () => {
            showStatus('Gradual mode updated.');
        });
    });

    gradualHours.addEventListener('change', () => {
        let val = parseFloat(gradualHours.value);
        if (isNaN(val) || val <= 0) val = 8;
        chrome.storage.sync.set({ nsanityDuration: val }, () => {
            showStatus('Duration saved.');
        });
    });

    resetTimerBtn.addEventListener('click', () => {
        chrome.storage.sync.set({ nsanityStartTime: Date.now() }, () => {
            showStatus('Timer reset. Back to 1%.');
        });
    });

    function updatePreview() {
        if (!previewToggle.checked) return;
        imagePreviewContainer.innerHTML = '';
        const urls = imageUrls.value.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) {
            imagePreviewContainer.style.display = 'flex';
            imagePreviewContainer.innerHTML = '<span style="color: #888; font-size: 12px; margin: auto;">No images</span>';
            return;
        }
        imagePreviewContainer.style.display = 'grid';
        urls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '60px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '3px';
            img.title = url;
            img.onerror = () => { img.style.opacity = 0.5; };
            imagePreviewContainer.appendChild(img);
        });
    }

    previewToggle.addEventListener('change', () => {
        if (previewToggle.checked) {
            imageUrls.style.display = 'none';
            updatePreview();
        } else {
            imageUrls.style.display = 'block';
            imagePreviewContainer.style.display = 'none';
        }
    });

    saveBtn.addEventListener('click', () => {
        const urls = imageUrls.value.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) {
            showStatus('Error: List cannot be empty.', true);
            return;
        }
        chrome.storage.sync.set({ nsanityImages: urls }, () => {
            showStatus('Images saved. Reload page to see changes.');
        });
    });

    resetBtn.addEventListener('click', () => {
        imageUrls.value = defaultImages.join('\n');
        chrome.storage.sync.set({ nsanityImages: defaultImages }, () => {
            showStatus('Reset to defaults.');
            if (previewToggle.checked) updatePreview();
        });
    });

    function showStatus(msg, isError = false) {
        statusMsg.textContent = msg;
        statusMsg.style.color = isError ? '#ff4d4d' : '#4CAF50';
        setTimeout(() => {
            statusMsg.textContent = '';
        }, 3000);
    }
});
