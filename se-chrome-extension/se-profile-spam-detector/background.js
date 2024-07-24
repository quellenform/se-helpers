function updateBadge() {
    chrome.storage.local.get('spamProfilesCount', data => {
        const count = data.spamProfilesCount || 0;
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    });
}

function fetchHTML() {
    fetch('https://blender.stackexchange.com/users?page=1&tab=newusers&sort=creationdate')
        .then(response => response.text())
        .then(pageContent => {
            chrome.storage.local.set({ pageContent: pageContent }, () => {
                console.log('Page content saved to storage');
                updateBadge();
            });
        })
        .catch(error => console.error('Error fetching HTML:', error));
}

chrome.alarms.create('fetchHTML', { periodInMinutes: 1 / 12 }); // fetch every 5 seconds

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'fetchHTML') {
        fetchHTML();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'spamProfilesCount' in changes) {
        updateBadge();
    }
});
