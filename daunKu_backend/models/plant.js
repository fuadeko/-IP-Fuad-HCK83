"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Plant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Plant.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
      Plant.hasMany(models.CareLog, {
        foreignKey: "plantId",
        as: "careLogs",
        onDelete: "CASCADE",
      });
    }
  }
  Plant.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // Ubah dari "users" ke "Users"
          key: "id",
        },
      },
      nickname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      speciesName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      commonName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      acquisitionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      needsLight: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      needsWater: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      needsHumidity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastWatered: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextWatering: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Plant",
      tableName: "Plants", // Tambahkan ini untuk memastikan nama tabel PascalCase
    }
  );
  return Plant;
};
