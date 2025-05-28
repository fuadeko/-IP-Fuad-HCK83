"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CareLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CareLog.belongsTo(models.Plant, {
        foreignKey: "plantId",
        as: "plant",
      });
    }
  }
  CareLog.init(
    {
      plantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "plants",
          key: "id",
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      problemDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      problemImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      solution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CareLog",
    }
  );
  return CareLog;
};

// npx sequelize-cli model:create --name User --attributes googleId:string,displayName:string,email:string,photo:string
// npx sequelize-cli model:create --name Plant --attributes userId:integer,nickname:string,speciesName:string,commonName:string,acquisitionDate:date,location:string,notes:text,imageUrl:string,needsLight:string,needsWater:string,needsHumidity:string,lastWatered:date,nextWatering:date
// npx sequelize-cli model:create --name CareLog --attributes plantId:integer,type:string,date:date,notes:text,problemDescription:text,problemImageUrl:string,solution:text
