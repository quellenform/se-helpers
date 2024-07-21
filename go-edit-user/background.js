chrome.action.onClicked.addListener((tab) => {
    const urlPattern = /^(https:\/\/[^\/]+\/users(?:\/[^\/]*)*)\/(\d+)(?:\/.*)?$/;
    const editPattern = /^(https:\/\/.*?\/users\/edit\/\d+)$/;
    const match = tab.url.match(urlPattern);

    if (match) {
        const baseUrl = match[1];
        const userId = match[2];
        const trimmedBaseUrl = baseUrl.split('/users')[0] + '/users';
        const editProfileUrl = `${trimmedBaseUrl}/edit/${userId}`;

        console.log('Base URL:', baseUrl);
        console.log('Trimmed Base URL:', trimmedBaseUrl);
        console.log('User ID:', userId);
        console.log('Edit Profile URL:', editProfileUrl);

        if (!tab.url.match(editPattern)) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (url) => {
                    window.location.href = url;
                },
                args: [editProfileUrl]
            });
        } else {
            alert('Already on the edit profile page.');
        }
    } else {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (pattern) => {
                alert('URL does not match the expected pattern: ' + pattern);
                console.error('URL does not match the expected pattern:', pattern);
            },
            args: [urlPattern.toString()]
        });
    }
});
