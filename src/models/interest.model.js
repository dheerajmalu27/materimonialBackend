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
          type: DataTypes.STRING
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
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
}
