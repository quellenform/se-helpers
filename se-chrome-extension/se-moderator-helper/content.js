(function () {
    function onButtonClickEditProfile() {
        const url = window.location.href;
        const segments = url.split('/');
        const userId = segments.find(segment => /^\d+$/.test(segment));

        if (!userId) {
            chrome.runtime.sendMessage({
                action: 'notify',
                title: 'Error',
                message: 'User ID not found in the URL.'
            });
            return;
        }

        const baseUrl = url.split('/users')[0];
        const editProfileUrl = `${baseUrl}/users/edit/${userId}`;

        chrome.runtime.sendMessage({
            action: 'navigate',
            url: editProfileUrl
        });
    }

    function onButtonClickEditProfileAsSpam() {
        chrome.runtime.sendMessage({
            action: 'executeScriptForSpam'
        });
    }

    function onButtonClickDestroyUser() {
        chrome.runtime.sendMessage({
            action: 'executeScriptDestroyUser'
        });
    }

    function createAndInsertButtons() {
        if (document.querySelectorAll('.my-custom-button').length > 0) {
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'row';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.marginLeft = '10px';

        const buttons = [
            { id: 'button_destroy_user', text: 'Destroy User', onClick: onButtonClickDestroyUser, color: '#dc3545' }
        ];

        const currentUrl = window.location.href;
        const editProfilePattern = /\/users\/edit\/\d+/;

        if (editProfilePattern.test(currentUrl)) {
            buttons.unshift({ id: 'button_profile_spam', text: 'Profile Spam', onClick: onButtonClickEditProfileAsSpam, color: '#fd7e14' });
        } else {
            buttons.unshift({ id: 'button_edit_profile', text: 'Edit Profile', onClick: onButtonClickEditProfile, color: '#007bff' });
        }

        buttons.forEach((buttonData) => {
            const button = document.createElement('button');
            button.id = buttonData.id;
            button.textContent = buttonData.text;
            button.className = 'my-custom-button';
            button.style.marginRight = '5px';
            button.style.padding = '5px 10px';
            button.style.backgroundColor = buttonData.color;
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '3px';
            button.style.cursor = 'pointer';
            button.addEventListener('click', buttonData.onClick);
            buttonContainer.appendChild(button);
        });

        const navContainer = document.querySelector('.d-flex.ai-center.jc-space-between.fw-wrap.mb16.js-user-header .flex--item.s-navigation');
        if (navContainer) {
            navContainer.insertAdjacentElement('afterend', buttonContainer);
            console.log('SE Helper: Buttons inserted successfully.');
        } else {
            console.log('SE Helper: Navigation container not found for adding additional buttons.');
        }
    }

    window.addEventListener('load', () => {
        createAndInsertButtons();
    });
})();
