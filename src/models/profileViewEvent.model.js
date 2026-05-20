import { DataTypes, Model } from 'sequelize';

export default class ProfileViewEvent extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        viewerId: {
          type: DataTypes.BIGINT,
          field: 'viewer_id',
          allowNull: false,
        },
        viewedUserId: {
          type: DataTypes.BIGINT,
          field: 'viewed_user_id',
          allowNull: false,
        },
        viewedAt: {
          type: DataTypes.DATE,
          field: 'viewed_at',
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: 'profile',
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'profile_view_events',
        timestamps: false,
        underscored: true,
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'viewer_id', as: 'viewer' });
    this.belongsTo(models.User, { foreignKey: 'viewed_user_id', as: 'viewedUser' });
  }
}

