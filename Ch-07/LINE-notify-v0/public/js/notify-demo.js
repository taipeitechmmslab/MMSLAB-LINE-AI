window.onload = () => {    
    window.setInterval(() => {
        document.getElementById('show-time-string').textContent = '現在時間：' + moment().format('LTS');
    }, 1000);
};

function NotifyMe() {
    const setTime = document.getElementById('schedule-timeset').value;
    const timeStr = moment().add(setTime, 's').format('LTS');
    fetch(`/auth/notify/me?n_s=${setTime}`).then(() => {
        document.getElementById('schedule-notify').textContent = `預定通知時間：${timeStr}`;
    });
}