export const formatElapsedTime = (seconds: number): string => {
    if (seconds < 1) {
        return `${Math.round(seconds * 1000)} мс`
    } else if (seconds < 60) {
        return `${seconds.toFixed(1)} с`
    } else {
        const minutes = Math.floor(seconds / 60)
        const secs = (seconds % 60).toFixed(1)
        return `${minutes} мин ${secs} с`
    }
}

export const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

export const formatCalculationTime = (ms: number): string => {
    if (ms < 1000) {
        return `${ms} мс`
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(2)} с`
    } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = ((ms % 60000) / 1000).toFixed(2)
        return `${minutes} мин ${seconds} с`
    }
}
