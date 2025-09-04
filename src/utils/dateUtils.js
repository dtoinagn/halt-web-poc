export const formatDateTime = (isoString) => {
  if (!isoString) return null;
  try {
    return new Date(isoString).toISOString();
  } catch {
    return isoString;
  }
};

export const reformatDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;
  return dateTimeString.replace(/T/g, ' ');
};

export const roundUpDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;
  
  const date = new Date(dateTimeString);
  if (date.getMilliseconds() > 0) {
    date.setSeconds(date.getSeconds() + 1);
    date.setMilliseconds(0);
  }
  return date.toISOString().replace('T', ' ').replace('Z', '');
};

export const isHaltedSameDay = (haltTime, resumptionTime) => {
  const currTime = new Date();
  const resumption = new Date(resumptionTime);
  
  return (
    currTime.getFullYear() === resumption.getFullYear() &&
    currTime.getMonth() === resumption.getMonth() &&
    currTime.getDate() === resumption.getDate()
  );
};

export const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); 
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};