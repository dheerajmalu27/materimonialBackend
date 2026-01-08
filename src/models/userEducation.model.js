import { DataTypes, Model } from 'sequelize';

export default class UserEducation extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },

        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          field: 'user_id'
        },

        qualification: {
          type: DataTypes.STRING(100),
          allowNull: true
        },

        college: {
          type: DataTypes.STRING(150),
          allowNull: true
        },

        university: {
          type: DataTypes.STRING(150),
          allowNull: true
        },

        passingYear: {
          type: DataTypes.INTEGER,
          field: 'passing_year'
        },

        highest: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }
      },
      {
        sequelize,
        tableName: 'user_education',   // ✅ FIXED (was user_educations)
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  }
}
