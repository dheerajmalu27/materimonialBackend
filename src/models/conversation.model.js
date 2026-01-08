// conversation.model.js
import { DataTypes, Model } from 'sequelize';

export default class Conversation extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user1Id: {
          type: DataTypes.BIGINT,
          field: 'user1_id',
          allowNull: false
        },
        user2Id: {
          type: DataTypes.BIGINT,
          field: 'user2_id',
          allowNull: false
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        }
      },
      {
        sequelize,
        tableName: 'conversations',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.hasMany(models.Message, {
      foreignKey: 'conversation_id',
      as: 'messages'
    });
  }
}
