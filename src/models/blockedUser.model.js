import { DataTypes, Model } from 'sequelize';

export default class BlockedUser extends Model {
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
        blockedUserId: {
          type: DataTypes.BIGINT,
          field: 'blocked_user_id'
        },
        blockedAt: {
          type: DataTypes.DATE,
          field: 'blocked_at',
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'blocked_users',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'blocked_user_id', as: 'blockedUser' });
  }
}
