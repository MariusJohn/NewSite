const [jobs] = await sequelize.query(`
    SELECT
        "Jobs".*,
        (6371000 * acos(
            cos(radians(:latitude)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:longitude)) +
            sin(radians(:latitude)) * sin(radians(latitude))
        )) AS distance
    FROM "Jobs"
    WHERE status = 'pending'
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    HAVING (6371000 * acos(
        cos(radians(:latitude)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(:longitude)) +
        sin(radians(:latitude)) * sin(radians(latitude))
    )) <= :maxDistance
    ORDER BY distance ASC
`, {
    replacements: {
        latitude: bodyshop.latitude,
        longitude: bodyshop.longitude,
        maxDistance: maxDistance // This 'maxDistance' variable is your dynamic radius in meters
    },
    type: sequelize.QueryTypes.SELECT
});