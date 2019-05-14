window.onload = function () {
    liff.init(data => {
        liff.getProfile().then(profile => {
            document.getElementById('displaynamefield').textContent = profile.displayName;
            document.getElementById('displayprofileimgfield').src = profile.pictureUrl;
        });
    }, err => {
        document.getElementById('displaynamefield').textContent = 'Open this page by LIFF';
        document.getElementById('displayprofileimgfield').remove();
        document.getElementById('liff-logout').remove();
    });
};