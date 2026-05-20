import { DataTypes, Model } from 'sequelize';

export default class MessageRead extends Model {
  static init(sequelize) {
    return super.init(
      {
        messageId: {
          type: DataTypes.BIGINT,
          field: 'message_id',
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.BIGINT,
          field: 'user_id',
          primaryKey: true,
          allowNull: false,
        },
        readAt: {
          type: DataTypes.DATE,
          field: 'read_at',
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'message_reads',
        timestamps: false,
        underscored: true,
        primaryKey: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

