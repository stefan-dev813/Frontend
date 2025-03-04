const { default: axios } = require("axios");
const types = [
  "restaurant",
  "bowling_alley",
  "gym",
  "amusement_park",
  "aquarium",
  "casino",
  "movie_theater",
  "museum",
  "art_gallery",
  "shopping_mall",
  "tourist_attraction",
  "park",
  "cafe",
  "bakery",
  "bar",
  "night_club",
];
const blacklist = [
  "McDonald's",
  "Burger King",
  "Kiosks",
  "restaurant",
  "airport",
  "campground",
  "meal_delivery",
  "meal_takeaway",
  "liquor_store",
  "supermarket",
  "gas_station",
  "train_station",
];
const convertToEncodedString = (coordinates) => {
  return encodeURIComponent(coordinates.join(","));
};
const hasMatch = (types, yyyy) => {
  const intersection = types.find((type) => yyyy.includes(type));
  return intersection || null;
};
const generateGoogleApiUrls = (photos) => {
  const baseUrl = "https://maps.googleapis.com/maps/api/place/photo";
  const maxWidth = 800;

  const resultArray = [];

  for (const photo of photos) {
    const photoReference = photo.photo_reference;

    if (photoReference) {
      const apiUrl = `${baseUrl}?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.MAP_KEY}`;
      resultArray.push(apiUrl);
    }
  }

  return resultArray;
};
const convertArray = (inputArray) => {
  return inputArray.map((item) => {
    const htmlAttributions = item.photos || [];
    const hrefValues = generateGoogleApiUrls(htmlAttributions);
    const newItem = {
      _id: item.place_id,
      photos: hrefValues,
      rating: item.rating,
      scope: "GOOGLE",
      name: item.name || "N/A",
      category: hasMatch(types, item.types),
      googleCategory: item.types,
      location: {
        type: "Point",
        coordinates: [item.geometry.location.lat, item.geometry.location.lng],
      },
      address: item.vicinity || "N/A",
      buinessSchedule: [],
    };

    return newItem;
  });
};

module.exports.getGoogleNearByPlaces = async (location, radius) => {
  try {
    const promises = types.map(async (type) => {
      const typesParam = type;
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${convertToEncodedString(
          location
        )}&radius=${radius}&types=${typesParam}&key=${process.env.MAP_KEY}`,
      };
      const response = await axios.request(config);
      const results = convertArray(response.data.results);

      // Filter out blacklisted places
      const filteredResults = results.filter((result) => {
        const isBlacklisted = blacklist.some((item) => {
          return (
            result.name.toLowerCase().includes(item.toLowerCase()) ||
            result.googleCategory.includes(item)
          );
        });

        return !isBlacklisted;
      });

      return filteredResults;
    });

    const results = await Promise.all(promises);

    // Flatten the array of arrays into a single array
    return results.flat();
  } catch (error) {
    console.log(error);
  }
};
// module.exports.getGoogleNearByPlaces = async (location, radius) => {
//   try {
//     const typesParam = types.join("|");
//     let config = {
//       method: "get",
//       maxBodyLength: Infinity,
//       url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${convertToEncodedString(
//         location
//       )}&radius=${radius}&types=${typesParam}&key=${process.env.MAP_KEY}`,
//     };
//     const response = await axios.request(config);
//     return convertArray(response.data.results);
//   } catch (error) {
//     console.log(error);
//   }
// };
