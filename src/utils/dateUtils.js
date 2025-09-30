const parseCompactDateTime = (compactString) => {
  if (!compactString || typeof compactString !== "string") return null;

  const match = compactString.match(
    /^(\d{8})-(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/
  );
  if (!match) return null;

  const [, dateStr, hours, minutes, seconds, milliseconds] = match;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds),
    parseInt(milliseconds)
  );
};

const formatToCompactDateTime = (date) => {
  if (!date || !(date instanceof Date)) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}${month}${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const formatDateTime = (isoString) => {
  if (!isoString) return null;
  try {
    const compactDate = parseCompactDateTime(isoString);
    if (compactDate) {
      return compactDate.toISOString();
    }
    return new Date(isoString).toISOString();
  } catch {
    return isoString;
  }
};

export const reformatDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;

  const compactDate = parseCompactDateTime(dateTimeString);
  if (compactDate) {
    const year = compactDate.getFullYear();
    const month = String(compactDate.getMonth() + 1).padStart(2, "0");
    const day = String(compactDate.getDate()).padStart(2, "0");
    const hours = String(compactDate.getHours()).padStart(2, "0");
    const minutes = String(compactDate.getMinutes()).padStart(2, "0");
    const seconds = String(compactDate.getSeconds()).padStart(2, "0");
    const milliseconds = String(compactDate.getMilliseconds()).padStart(3, "0");

    return `${year}${month}${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  return dateTimeString.replace(/T/g, " ");
};

export const roundUpDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;

  let date = parseCompactDateTime(dateTimeString);
  if (!date) {
    date = new Date(dateTimeString);
  }

  if (date.getMilliseconds() > 0) {
    date.setSeconds(date.getSeconds() + 1);
    date.setMilliseconds(0);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}${month}${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const isHaltedSameDay = (haltTime, resumptionTime) => {
  const currTime = new Date();
  let resumption = parseCompactDateTime(resumptionTime);
  if (!resumption) {
    resumption = new Date(resumptionTime);
  }

  return (
    currTime.getFullYear() === resumption.getFullYear() &&
    currTime.getMonth() === resumption.getMonth() &&
    currTime.getDate() === resumption.getDate()
  );
};

export const getCurrentDateTime = () => {
  const now = new Date();
  return formatToCompactDateTime(now);
};
