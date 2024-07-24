function updatePopup() {
    chrome.storage.local.get('pageContent', data => {
        const pageContent = data.pageContent || '';
        const spamProfilesDiv = document.getElementById('spam-profiles');
        const lastUpdateDiv = document.getElementById('last-update');
        const parser = new DOMParser();
        const doc = parser.parseFromString(pageContent, 'text/html');
        const userDivs = doc.querySelectorAll('#user-browser .grid--item.user-info');
        const spamProfiles = [];
        const baseUrl = 'https://blender.stackexchange.com';

        spamProfilesDiv.innerHTML = '';

        userDivs.forEach(userDiv => {
            let profilePath = userDiv.querySelector('.user-gravatar48 a')?.getAttribute('href');
            let profileUrl = profilePath ? baseUrl + profilePath + '?tab=profile' : '';
            const avatarImg = userDiv.querySelector('.user-gravatar48 img')?.src;
            const userName = userDiv.querySelector('.user-details a')?.textContent;
            const userLocation = userDiv.querySelector('.user-location')?.textContent.trim();
            const isSpam = userLocation !== '' && (!avatarImg.includes('gravatar.com') && !avatarImg.includes('googleusercontent.com'));

            if (isSpam) {
                spamProfiles.push({
                    name: userName,
                    profileUrl: profileUrl,
                    avatarSrc: avatarImg,
                    location: userLocation
                });
            }
        });

        chrome.storage.local.set({ spamProfilesCount: spamProfiles.length });

        if (spamProfiles.length === 0) {
            const noSpamDiv = document.createElement('div');
            noSpamDiv.textContent = 'No potential profile spam detected.';
            noSpamDiv.className = 'no-spam';
            spamProfilesDiv.appendChild(noSpamDiv);
        } else {
            spamProfiles.forEach(profile => {
                const profileDiv = document.createElement('div');
                profileDiv.className = 'spam-profile';

                const profileLinkElement = document.createElement('a');
                profileLinkElement.href = profile.profileUrl;
                profileLinkElement.target = '_blank';
                profileLinkElement.style.display = 'flex';
                profileLinkElement.style.textDecoration = 'none';
                profileLinkElement.style.color = 'inherit';

                const avatarImg = document.createElement('img');
                avatarImg.src = profile.avatarSrc;
                avatarImg.className = 'profile-image';

                const profileInfo = document.createElement('div');
                profileInfo.className = 'profile-info';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.textContent = profile.name;

                const locationSpan = document.createElement('span');
                locationSpan.className = 'location';
                locationSpan.textContent = `${profile.location}`;
                profileInfo.appendChild(nameSpan);
                profileInfo.appendChild(locationSpan);
                profileLinkElement.appendChild(avatarImg);
                profileLinkElement.appendChild(profileInfo);
                profileDiv.appendChild(profileLinkElement);

                spamProfilesDiv.appendChild(profileDiv);
            });
        }
        lastUpdateDiv.textContent = `Last update: ${new Date().toLocaleString()}`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updatePopup();
    setInterval(updatePopup, 5000);
});
