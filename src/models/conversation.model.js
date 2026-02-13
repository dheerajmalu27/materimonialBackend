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
    this.belongsTo(models.User, {
      foreignKey: 'user1Id',
      as: 'user1'
    });
    this.belongsTo(models.User, {
      foreignKey: 'user2Id',
      as: 'user2'
    });
    this.hasMany(models.Message, {
      foreignKey: 'conversationId',
      as: 'messages'
    });
  }
}
