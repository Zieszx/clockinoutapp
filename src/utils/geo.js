export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, err => {
      if (err.code === 1) {
        reject(new Error(
          'Location access was denied. On Android: open Chrome Settings → Site settings → Location → allow this site. On iPhone: Settings → Privacy → Location Services → Safari/Chrome → "While Using".'
        ))
      } else if (err.code === 2) {
        reject(new Error('Your location could not be determined. Make sure GPS is turned on and you have a signal, then try again.'))
      } else {
        reject(new Error('Location request timed out. Move to a spot with better GPS signal and try again.'))
      }
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    })
  })
}
