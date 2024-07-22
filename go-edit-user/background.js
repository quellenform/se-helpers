chrome.action.onClicked.addListener((tab) => {
    const url = tab.url;
    const segments = url.split('/');
    const userId = segments.find(segment => /^\d+$/.test(segment));

    if (!userId) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Error',
            message: 'User ID not found in the URL.'
        });
        return;
    }

    const baseUrl = url.split('/users')[0];
    const editProfileUrl = `${baseUrl}/users/edit/${userId}`;

    if (url === editProfileUrl) {
        console.log("Already on Edit Profile page!")
    } else {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (redirectUrl) => window.location.href = redirectUrl,
            args: [editProfileUrl]
        }).catch(error => console.error('Failed to execute script:', error));
    }
});
