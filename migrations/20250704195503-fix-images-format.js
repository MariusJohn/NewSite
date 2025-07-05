'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [results] = await queryInterface.sequelize.query(`
      SELECT id, images
      FROM "Jobs"
      WHERE "images"::text LIKE '{%' AND "images"::text NOT LIKE '[%]'
    `);

    for (const job of results) {
      try {
        const fixedImages = job.images
          .replace(/{/g, '[')
          .replace(/}/g, ']')
          .replace(/=>/g, ':'); // just in case any => snuck in

        const imageArray = JSON.parse(fixedImages);

        await queryInterface.sequelize.query(
          `UPDATE "Jobs" SET images = :imageArray WHERE id = :id`,
          {
            replacements: {
              imageArray: JSON.stringify(imageArray),
              id: job.id,
            },
          }
        );

        console.log(`✅ Fixed images for job #${job.id}`);
      } catch (err) {
        console.warn(`⚠️ Could not fix job #${job.id}: ${err.message}`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No rollback for this one-time fix
    return;
  }
};
