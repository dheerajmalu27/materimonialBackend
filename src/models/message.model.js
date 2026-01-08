// message.model.js
import { DataTypes, Model } from 'sequelize';

export default class Message extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        conversationId: {
          type: DataTypes.BIGINT,
          field: 'conversation_id',
          allowNull: false
        },
        senderId: {
          type: DataTypes.BIGINT,
          field: 'sender_id',
          allowNull: false
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          field: 'is_read',
          defaultValue: false
        },
        sentAt: {
          type: DataTypes.DATE,
          field: 'sent_at'
        }
      },
      {
        sequelize,
        tableName: 'messages',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation'
    });
  }
}
