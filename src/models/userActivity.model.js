import { Model, DataTypes } from 'sequelize';

export default class UserActivity extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          field: 'user_id'
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false
        },
        description: DataTypes.TEXT,
        ipAddress: {
          type: DataTypes.STRING,
          field: 'ip_address'
        },
        userAgent: {
          type: DataTypes.TEXT,
          field: 'user_agent'
        }
      },
      {
        sequelize,
        tableName: 'user_activities',
        timestamps: false
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
}
