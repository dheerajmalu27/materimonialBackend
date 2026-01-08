import { DataTypes, Model } from 'sequelize';

export default class UserKundli extends Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          unique: true,
          field: 'user_id'
        },
        dob: DataTypes.DATEONLY,
        birthTime: DataTypes.TIME,
        birthPlace: DataTypes.STRING,
        moonSign: DataTypes.STRING,
        nakshatra: DataTypes.STRING,
        manglik: DataTypes.BOOLEAN
      },
      {
        sequelize,
        tableName: 'user_kundlis',
        underscored: true,
        timestamps: false,
      }
    );
  }
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  }
}
