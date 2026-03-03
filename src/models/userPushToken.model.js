import { DataTypes, Model } from 'sequelize';

export default class UserPushToken extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          unique: true,
          field: 'user_id',
        },
        expoPushToken: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'expo_push_token',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'user_push_tokens',
        timestamps: false,
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
}
