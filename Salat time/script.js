
// Simple browser script to get user's location and display prayer times using adhan.js
// Requirements: adhan CDN script must be loaded before this script (index.html updated below).

document.addEventListener('DOMContentLoaded', () => {
    // Ensure adhan is available
    if (typeof window.adhan === 'undefined') {
        console.error('adhan library not found. Make sure the adhan CDN script is included before this script.');
        document.getElementById('location').innerText = 'Error: prayer calculation library not loaded.';
        return;
    }

    const $location = document.getElementById('location');
    const $fajr = document.getElementById('fajr');
    const $dhuhr = document.getElementById('dhuhr');
    const $asr = document.getElementById('asr');
    const $maghrib = document.getElementById('maghrib');
    const $isha = document.getElementById('isha');

    if (!navigator.geolocation) {
        $location.innerText = 'Geolocation not supported by your browser.';
        return;
    }

    // Ask for high accuracy and reasonable timeout
    navigator.geolocation.getCurrentPosition(onPosition, onError, { enableHighAccuracy: true, timeout: 15000 });

    function onPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        $location.innerText = `Your Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        try {
            const coords = new adhan.Coordinates(lat, lon);
            const params = adhan.CalculationMethod.MuslimWorldLeague();
            const today = new Date();
            const prayerTimes = new adhan.PrayerTimes(coords, today, params);

            const fmtOpts = { hour: '2-digit', minute: '2-digit' };
            $fajr.innerText = prayerTimes.fajr ? prayerTimes.fajr.toLocaleTimeString([], fmtOpts) : '-';
            $dhuhr.innerText = prayerTimes.dhuhr ? prayerTimes.dhuhr.toLocaleTimeString([], fmtOpts) : '-';
            $asr.innerText = prayerTimes.asr ? prayerTimes.asr.toLocaleTimeString([], fmtOpts) : '-';
            $maghrib.innerText = prayerTimes.maghrib ? prayerTimes.maghrib.toLocaleTimeString([], fmtOpts) : '-';
            $isha.innerText = prayerTimes.isha ? prayerTimes.isha.toLocaleTimeString([], fmtOpts) : '-';
        } catch (err) {
            console.error(err);
            $location.innerText = 'Error calculating prayer times.';
        }
    }

    function onError(err) {
        console.error('Geolocation error', err);
        if (err.code === 1) {
            $location.innerText = 'Permission denied. Allow location access to see prayer times.';
        } else if (err.code === 2) {
            $location.innerText = 'Position unavailable.';
        } else if (err.code === 3) {
            $location.innerText = 'Location request timed out.';
        } else {
            $location.innerText = `Error: ${err.message}`;
        }
    }
});
