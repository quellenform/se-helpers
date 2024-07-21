chrome.action.onClicked.addListener((tab) => {
    if (tab.url && (tab.url.startsWith('http') || tab.url.startsWith('https'))) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                function updateInputElement(id, text) {
                    const elem = document.getElementById(id);
                    if (elem) {
                        elem.value = text;
                    } else {
                        alert('Input Element ' + id + ' not found! Make sure you are on the Edit Profile page!');
                        throw new Error('Input Element ' + id + ' not found!');
                    }
                }

                function clickChangePictureLink() {
                    return new Promise((resolve) => {
                        const changePictureLink = document.getElementById('change-picture');
                        if (changePictureLink) {
                            changePictureLink.click();
                            const observer = new MutationObserver((mutations, obs) => {
                                const avatarChangeLinks = document.querySelectorAll('.avatar-change');
                                if (avatarChangeLinks.length > 0) {
                                    obs.disconnect();
                                    resolve();
                                }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                        } else {
                            alert('Change picture link not found!');
                        }
                    });
                }

                function selectGravatarIdenticon() {
                    return new Promise((resolve) => {
                        const avatarChangeLinks = document.querySelectorAll('.avatar-change');
                        const gravatarLink = Array.from(avatarChangeLinks).find(link => link.dataset.profileType === 'GravatarIdenticon');
                        if (gravatarLink) {
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
                        } else {
                            alert('No GravatarIdenticon link to click');
                        }
                    });
                }

                function submitButtonClick() {
                    return new Promise((resolve, reject) => {
                        function isSubmissionComplete() {
                            const successIndicator = document.querySelector('.success-indicator');
                            return successIndicator !== null;
                        }
                        const submitButton = document.querySelector('button.js-save-button[data-push="true"]');
                        if (submitButton) {
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
                                reject(new Error('Submission did not complete in a timely manner.'));
                            }, 10000);
                        } else {
                            reject(new Error('Submit button not found!'));
                        }
                    });
                }

                updateInputElement('displayName', 'Spammer');
                updateInputElement('location', '');
                updateInputElement('wmd-input', 'Profile spam removed by moderator');
                updateInputElement('WebsiteUrl', '');
                updateInputElement('TwitterUrl', '');
                updateInputElement('GitHubUrl', '');

                await clickChangePictureLink();
                await selectGravatarIdenticon();
                await submitButtonClick();
            }
        });
    } else {
        console.error('The extension cannot run on this type of URL:', tab.url);
    }
});
