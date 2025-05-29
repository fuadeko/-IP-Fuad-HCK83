"use strict";
const { Model } = require("sequelize");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Plant, {
        foreignKey: "userId",
        as: "plants",
        onDelete: "CASCADE",
      });
    }
    checkPassword(password) {
      return comparePassword(password, this.password);
    }
  }

  User.init(
    {
      googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [6, 255],
            msg: "Password minimal 6 karakter",
          },
          passwordRequired(value) {
            if (!this.googleId && !value) {
              throw new Error("Password wajib diisi untuk registrasi manual");
            }
          },
        },
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users", // Tambahkan ini untuk memastikan nama tabel PascalCase
      hooks: {
        beforeCreate: (user) => {
          if (user.password) {
            user.password = hashPassword(user.password);
          }
        },
        beforeUpdate: (user) => {
          if (user.changed("password") && user.password) {
            user.password = hashPassword(user.password);
          }
        },
      },
    }
  );

  return User;
};
