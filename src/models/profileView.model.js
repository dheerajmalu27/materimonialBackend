import { DataTypes, Model } from 'sequelize';

export default class ProfileView extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        viewerId: {
          type: DataTypes.BIGINT,
          field: 'viewer_id'
        },
        viewedUserId: {
          type: DataTypes.BIGINT,
          field: 'viewed_user_id'
        },
        viewedAt: {
          type: DataTypes.DATE,
          field: 'viewed_at'
        }
      },
      {
        sequelize,
        tableName: 'profile_views',
        timestamps: false,
        underscored: true
      }
    );
  }
}
