"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("plants", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      nickname: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      speciesName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      commonName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      acquisitionDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      needsLight: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      needsWater: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      needsHumidity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastWatered: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextWatering: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("plants");
  },
};
