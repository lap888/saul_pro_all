export function antdPaginationAdapter(apiPagination) {
    return {
        current: apiPagination.page,
        total: apiPagination.total,
        pageSize: apiPagination.pageSize,
        showTotal: () => {
            return `每页${apiPagination.pageSize}条数据，共${apiPagination.total}条`;
        }
    };
}
export function validIntOrUndefined(value) {
    const num = Number.parseInt(value, 10);
    return !Number.isNaN(num) ? num : undefined;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function DateFormat(time = '') {
    let myDate = ''
    if (time === '') {
        myDate = new Date();
    } else {
        myDate = new Date(time);
    }
    let year = myDate.getFullYear();
    let mon = myDate.getMonth() + 1;
    if (mon < 10) {
        mon = "0" + mon;
    }
    let date = myDate.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    let hours = myDate.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    }
    let minutes = myDate.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    let seconds = myDate.getSeconds();
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    let now = year + "-" + mon + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return now;
}