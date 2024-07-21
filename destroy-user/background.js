chrome.action.onClicked.addListener((tab) => {
    if (tab.url && (tab.url.startsWith('http') || tab.url.startsWith('https'))) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                var modButton = document.querySelector('.js-mod-menu-button');
                if (modButton) {
                    modButton.click();
                    var observer = new MutationObserver((mutations, obs) => {
                        var destroyRadioButton = document.getElementById('se-mod-menu-action-destroy');
                        if (destroyRadioButton) {
                            destroyRadioButton.click();
                            var reasonRadioButton = document.querySelector('input[name="destroyReason"][value="User primarily posts spam or nonsense"]');
                            if (reasonRadioButton) {
                                reasonRadioButton.click();
                            } else {
                                alert('Destroy reason radio button not found!');
                            }
                            var submitButton = document.querySelector('button[data-se-mod-menu-target="submitButton"]');
                            if (submitButton) {
                                submitButton.click();

                            } else {
                                alert('No Submit button found!');
                            }
                            obs.disconnect();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                } else {
                    alert('Mod button not found!');
                }
            }
        });
    } else {
        console.error('The extension cannot run on this type of URL:', tab.url);
    }
});
