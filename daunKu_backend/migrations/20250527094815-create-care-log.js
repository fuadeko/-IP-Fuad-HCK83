"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CareLogs", {
      // Ubah dari "CareLogs" ke "carelogs"
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      plantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Plants", // Ubah dari "plants" ke "Plants"
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      problemDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      problemImageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      solution: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("CareLogs");
  },
};
