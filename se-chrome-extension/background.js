chrome.runtime.onInstalled.addListener(() => {
    console.log('SE Helper: Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('SE Helper: Received message:', message);

    if (message.action === 'navigate') {
        const url = message.url;
        console.log('SE Helper: Navigating to:', url);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length <= 0) {
                console.error('SE Helper: No active tab found.');
                return;
            }
            const tab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (redirectUrl) => window.location.href = redirectUrl,
                args: [url]
            }).catch(error => console.error('SE Helper: Failed to execute script:', error));
        });
    } else if (message.action === 'notify') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: message.title,
            message: message.message
        }).catch(error => console.error('SE Helper: Failed to create notification:', error));
    } else if (message.action === 'executeScriptDestroyUser') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length <= 0) {
                console.error('SE Helper: No active tab found.');
                return;
            }
            const tab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    var modButton = document.querySelector('.js-mod-menu-button');
                    if (!modButton) {
                        alert('Mod button not found!');
                        return;
                    }
                    modButton.click();
                    var observer = new MutationObserver((mutations, obs) => {
                        var destroyRadioButton = document.getElementById('se-mod-menu-action-destroy');
                        if (!destroyRadioButton) {
                            alert('Destroy radio button not found!');
                            obs.disconnect();
                            return;
                        }
                        destroyRadioButton.click();
                        var reasonRadioButton = document.querySelector('input[name="destroyReason"][value="User primarily posts spam or nonsense"]');
                        if (!reasonRadioButton) {
                            alert('Destroy reason radio button not found!');
                            obs.disconnect();
                            return;
                        }
                        reasonRadioButton.click();
                        var submitButton = document.querySelector('button[data-se-mod-menu-target="submitButton"]');
                        if (submitButton) {
                            submitButton.click();
                        } else {
                            alert('No Submit button found!');
                        }
                        obs.disconnect();
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            }).catch(error => console.error('SE Helper: Failed to execute script:', error));
        });
    } else if (message.action === 'executeScriptForSpam') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length <= 0) {
                console.error('SE Helper: No active tab found.');
                return;
            }
            const tab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async () => {
                    function updateInputElement(id, text) {
                        const elem = document.getElementById(id);
                        if (elem) {
                            elem.value = text;
                        } else {
                            alert('Input Element ' + id + ' not found! Make sure you are on the Edit Profile page!');
                            throw new Error('SE Helper: Input Element ' + id + ' not found!');
                        }
                    }

                    function clickChangePictureLink() {
                        return new Promise((resolve) => {
                            const changePictureLink = document.getElementById('change-picture');
                            if (!changePictureLink) {
                                alert('Change picture link not found!');
                                return;
                            }
                            changePictureLink.click();
                            const observer = new MutationObserver((mutations, obs) => {
                                const avatarChangeLinks = document.querySelectorAll('.avatar-change');
                                if (avatarChangeLinks.length > 0) {
                                    obs.disconnect();
                                    resolve();
                                }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                        });
                    }

                    function selectGravatarIdenticon() {
                        return new Promise((resolve) => {
                            const avatarChangeLinks = document.querySelectorAll('.avatar-change');
                            const gravatarLink = Array.from(avatarChangeLinks).find(link => link.dataset.profileType === 'GravatarIdenticon');
                            if (!gravatarLink) {
                                alert('No GravatarIdenticon link to click');
                                return;
                            }
                            const observer = new MutationObserver((mutations, obs) => {
                                mutations.forEach((mutation) => {
                                    if (mutation.type === 'attributes' || mutation.type === 'childList') {
                                        const badgeCheck = gravatarLink.querySelector('.badge-earned-check');
                                        if (badgeCheck) {
                                            obs.disconnect();
                                            setTimeout(() => resolve(), 500);
                                        }
                                    }
                                });
                            });
                            observer.observe(gravatarLink, { attributes: true, childList: true, subtree: true });
                            gravatarLink.click();
                        });
                    }

                    function clearUserSessions() {
                        return new Promise((resolve) => {
                            var modButton = document.querySelector('.js-mod-menu-button');
                            if (!modButton) {
                                alert('SE Helper: Mod button not found!');
                                return;
                            }
                            modButton.click();
                            var observer = new MutationObserver((mutations, obs) => {
                                var clearSessionsRadioButton = document.getElementById('se-mod-menu-action-clear-sessions');
                                if (!clearSessionsRadioButton) {
                                    alert('No Clear Sessions radio button found!');
                                    obs.disconnect();
                                    return;
                                }
                                clearSessionsRadioButton.click();
                                var submitButton = document.querySelector('button[data-se-mod-menu-target="submitButton"]');
                                if (submitButton) {
                                    submitButton.click();
                                    resolve();
                                } else {
                                    alert('No Submit button found!');
                                }
                                obs.disconnect();
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                        });
                    }

                    function submitButtonClick() {
                        return new Promise((resolve, reject) => {
                            function isSubmissionComplete() {
                                const successIndicator = document.querySelector('.success-indicator');
                                return successIndicator !== null;
                            }
                            const submitButton = document.querySelector('button.js-save-button[data-push="true"]');
                            if (!submitButton) {
                                reject(new Error('SE Helper: Submit button not found!'));
                                return;
                            }
                            submitButton.click();
                            const observer = new MutationObserver((mutations, obs) => {
                                if (isSubmissionComplete()) {
                                    obs.disconnect();
                                    resolve();
                                }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                            setTimeout(() => {
                                observer.disconnect();
                                reject(new Error('SE Helper: Submission did not complete in a timely manner.'));
                            }, 10000);
                        });
                    }

                    updateInputElement('displayName', 'Spammer');
                    updateInputElement('location', 'Spam');
                    updateInputElement('wmd-input', 'Profile spam removed by moderator');
                    updateInputElement('WebsiteUrl', '');
                    updateInputElement('TwitterUrl', '');
                    updateInputElement('GitHubUrl', '');

                    await clickChangePictureLink();
                    await selectGravatarIdenticon();
                    await clearUserSessions();
                    await submitButtonClick();
                }
            }).catch(error => console.error('SE Helper: Failed to execute script:', error));
        });
    }
});
