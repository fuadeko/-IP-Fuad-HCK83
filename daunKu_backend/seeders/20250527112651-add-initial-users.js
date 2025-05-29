"use strict";
const { hashPassword } = require("../helpers/bcrypt");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users", // Ubah dari "users" ke "Users"
      [
        {
          googleId: "dummy_google_id_12345",
          userName: "DaunKu Admin Test",
          email: "admin.test@daunku.com",
          password: await hashPassword("123456"),
          photo:
            "https://res.cloudinary.com/dfmterqyl/image/upload/v1/samples/avatar-admin.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          googleId: "dummy_googleid_67890",
          userName: "Test Planter",
          email: "planter.test@daunku.com",
          password: null,
          photo:
            "https://res.cloudinary.com/dfmterqyl/image/upload/v1/samples/avatar-planter.png",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Users", // Ubah dari "users" ke "Users"
      {
        email: ["admin.test@daunku.com", "planter.test@daunku.com"],
      },
      {}
    );
  },
};
