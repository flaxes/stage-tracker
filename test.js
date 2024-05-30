const moment = require("moment-timezone");
const week = "2024-W23";
const DATE_FORMAT = "DD-MM-yyyy";


const d = moment(week, 'YYYY-[W]WW');

console.log(d.format(DATE_FORMAT));