import { DataTypes, Model } from 'sequelize';

export default class ConversationUserState extends Model {
  static init(sequelize) {
    return super.init(
      {
        conversationId: {
          type: DataTypes.BIGINT,
          field: 'conversation_id',
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.BIGINT,
          field: 'user_id',
          primaryKey: true,
          allowNull: false,
        },
        unreadCount: {
          type: DataTypes.INTEGER,
          field: 'unread_count',
          allowNull: false,
          defaultValue: 0,
        },
        pinned: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        favorite: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        lastSeenAt: {
          type: DataTypes.DATE,
          field: 'last_seen_at',
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'conversation_user_state',
        timestamps: false,
        underscored: true,
        primaryKey: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Conversation, {
      foreignKey: 'conversation_id',
      as: 'conversation',
    });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

