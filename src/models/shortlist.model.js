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
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        favoriteLevel: {
          type: DataTypes.ENUM('Gold', 'Platinum', 'Diamond'),
          allowNull: false,
          defaultValue: 'Gold',
          field: 'favorite_level',
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: 'updated_at',
        },
        lastSavedAt: {
          type: DataTypes.DATE,
          field: 'last_saved_at',
          allowNull: true,
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

  static associate(models) {
    // Required for websiteShortlist.service.js include:
    // { model: User, as: 'shortlistedUser' }
    this.belongsTo(models.User, {
      foreignKey: 'shortlistedUserId',
      as: 'shortlistedUser',
    });
  }
}

