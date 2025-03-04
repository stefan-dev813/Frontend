module.exports.calculateExpiryDate = async (monthCount) => {
    const currentDate = new Date();

    const expiryDate = new Date(currentDate);
    expiryDate.setMonth(currentDate.getMonth() + monthCount);
  
    const formattedExpiryDate = expiryDate.toISOString().split("T")[0];
  
    return new Date(formattedExpiryDate);
  };
  