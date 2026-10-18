export function getMonthBoundaries(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    return {
        monthStart: new Date(Date.UTC(year, month, 1)),
        nextMonthStart: new Date(Date.UTC(year, month + 1, 1)),
    };
}