import { DataTypes, Model } from 'sequelize';

export default class Shortlist extends Model {
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
          field: 'user_id'
        },
        shortlistedUserId: {
          type: DataTypes.BIGINT,
          field: 'shortlisted_user_id'
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        }
      },
      {
        sequelize,
        tableName: 'shortlists',
        timestamps: false,
        underscored: true
      }
    );
  }
}
