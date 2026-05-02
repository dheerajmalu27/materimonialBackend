import { DataTypes, Model } from 'sequelize';

export default class Interest extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        senderId: {
          type: DataTypes.BIGINT,
          field: 'sender_id'
        },
        receiverId: {
          type: DataTypes.BIGINT,
          field: 'receiver_id'
        },
        status: {
          type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'sent'),
          defaultValue: 'pending'
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: 'updated_at'
        }
      },
      {
        sequelize,
        tableName: 'interests',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    this.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver'
    });
  }
}
