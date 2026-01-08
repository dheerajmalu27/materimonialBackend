import { DataTypes, Model } from 'sequelize';

export default class UserAddress extends Model {
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
          field: 'user_id'
        },
        addressType: {
          type: DataTypes.ENUM('present', 'permanent', 'both'),
          field: 'address_type'
        },
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        pincode: DataTypes.STRING
      },
      {
        sequelize,
        tableName: 'user_addresses',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}
