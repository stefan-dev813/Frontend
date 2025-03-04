module.exports.getDateRangesForMonth = (isCurrentMonth) => {
  const currentDate = new Date();
  const targetDate = new Date(currentDate);

  if (!isCurrentMonth) {
    // If last month, set the target date to the first day of the current month and subtract one day
    targetDate.setDate(0);
  }

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1; // Months are zero-based

  // Function to get the start and end dates for a specific week
  const getWeekDates = (weekNumber) => {
    const startDate = new Date(
      targetYear,
      targetMonth - 1,
      1 + (weekNumber - 1) * 7
    );
    const endDate = new Date(
      targetYear,
      targetMonth - 1,
      Math.min(weekNumber * 7, new Date(targetYear, targetMonth, 0).getDate())
    );
    return {
      startDate: `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`,
      endDate: `${endDate.getFullYear()}-${(endDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}`,
    };
  };

  // Create an array of date ranges for the current or last month
  const dateRanges = [
    getWeekDates(1),
    getWeekDates(2),
    getWeekDates(3),
    getWeekDates(4),
    getWeekDates(5),
  ];

  return dateRanges;
};
